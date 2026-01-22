from fastapi import FastAPI, HTTPException, Header, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from email_service_base import EmailService
from gmail_service import GmailApiService
from imap_service import ImapService
from gmail_service import GmailApiService
from imap_service import ImapService
from history_service import HistoryService
import os
from pydantic import BaseModel
from typing import Optional, List, Dict

app = FastAPI(title="Gmail Cleanup API")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store (prototype only!)
# Map: token -> ServiceInstance
# In production, use Redis or a proper session manager.
sessions = {}

# Default service for local "single user" OAuth mode (legacy support)
default_oauth_service = GmailApiService()

# Initialize History Service
history_service = HistoryService()

class ImapLoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    token: str
    type: str

def get_service(x_auth_token: Optional[str] = Header(None)) -> EmailService:
    # 1. Check if we have an active session for this token
    if x_auth_token and x_auth_token in sessions:
        return sessions[x_auth_token]
    
    # 2. Fallback: If no token, or token invalid, check if we have a global OAuth creds file
    # and default to that (for backward compatibility / single user ease)
    if os.path.exists('token.json') or os.path.exists('credentials.json'):
         # Ensure we authenticate
         try:
             default_oauth_service.authenticate()
             # CRITICAL: Check if service is actually active. 
             # If token.json is missing, authenticate() might do nothing, leaving service as None.
             if default_oauth_service.service or hasattr(default_oauth_service, 'mail'): # Support Imap too if we switch default
                 return default_oauth_service
         except:
             pass

    raise HTTPException(status_code=401, detail="Not authenticated. Please login.")

@app.get("/")
def read_root():
    return {"message": "Gmail Cleanup API is running"}

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/auth/imap", response_model=AuthResponse)
def login_imap(credentials: ImapLoginRequest):
    try:
        service = ImapService()
        service.authenticate(credentials.email, credentials.password)
        
        # Create a simple token (in real app, use JWT)
        import uuid
        token = str(uuid.uuid4())
        sessions[token] = service
        
        return {"token": token, "type": "imap"}
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"IMAP Login failed: {str(e)}")

@app.get("/api/check-auth")
def check_auth(x_auth_token: Optional[str] = Header(None)):
    """Check if we have valid credentials/token"""
    if x_auth_token and x_auth_token in sessions:
        return {"authenticated": True, "type": "session"}
    
    if os.path.exists('token.json'):
         return {"authenticated": True, "type": "oauth_file"}
         
    return {"authenticated": False}

@app.get("/api/stats")
def get_stats(service: EmailService = Depends(get_service)):
    try:
        return service.get_unread_count()
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/emails")
def get_emails(x_auth_token: Optional[str] = Header(None)):
    try:
        service = get_service(x_auth_token)
        return service.list_unread_messages()
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/senders")
def get_senders(x_auth_token: Optional[str] = Header(None), limit: int = 500, pageToken: Optional[str] = None):
    """
    Get unread emails aggregated by sender (Paginated).
    Returns: { "stats": [...], "nextPageToken": "..." }
    """
    try:
        service = get_service(x_auth_token)
        # Limit acts as batch_size here
        stats, next_token = service.get_sender_stats(limit=limit, page_token=pageToken)
        return {
            "stats": stats,
            "nextPageToken": next_token
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class DeleteRequest(BaseModel):
    ids: List[str]
    senders: Optional[Dict[str, int]] = {}

@app.post("/api/emails/delete-all")
def delete_all(request: DeleteRequest, service: EmailService = Depends(get_service)):
    try:
        count = service.move_to_trash(request.ids)
        history_service.log_action("delete", count, f"Deleted {count} emails", request.senders)
        return {"count": count}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/emails/spam")
def mark_spam(ids: list[str] = Body(...), service: EmailService = Depends(get_service)):
    try:
        count = service.mark_as_spam(ids)
        history_service.log_action("spam", count, f"Marked {count} emails as spam")
        return {"count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
@app.post("/api/emails/unsubscribe")
def unsubscribe(ids: list[str] = Body(...), service: EmailService = Depends(get_service)):
    try:
        # Currently just marks as spam in IMAP, placeholder in Gmail
        count = service.unsubscribe(ids)
        history_service.log_action("unsubscribe", count, f"Unsubscribed from {count} senders")
        return {"count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/emails/batch")
def get_email_details(ids: list[str] = Body(...), service: EmailService = Depends(get_service)):
    """
    Fetch specific details for a list of email IDs.
    Returns: [{id, sender, subject, date, snippet}, ...]
    """
    try:
        details = service.get_messages_details(ids)
        return details
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
def get_history():
    """Get history logs and stats"""
    return history_service.get_history()

@app.post("/api/setup/credentials")
def setup_credentials(creds: dict = Body(...)):
    """Allow uploading credentials.json from UI"""
    import json
    try:
        print(f"DEBUG: Received credentials upload: {list(creds.keys())}", flush=True)
        # Validate minimal structure
        if "installed" not in creds and "web" not in creds:
             raise ValueError("Invalid credentials format. Look for 'installed' or 'web' key.")
        
        with open("credentials.json", "w") as f:
            json.dump(creds, f, indent=2)
            
        return {"status": "success", "message": "Credentials saved"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/auth/login")
def login_google():
    """Initiates the Web OAuth flow."""
    try:
        # We need a temporary service instance to generate the URL (or just call static if refactored, but instance works)
        temp_service = GmailApiService()
        # Ensure your Google Cloud Console has this redirect URI added!
        # For local Docker: http://localhost:8000/api/auth/callback
        auth_url = temp_service.get_authorization_url(redirect_uri="http://localhost:8000/api/auth/callback")
        
        from fastapi.responses import RedirectResponse
        return RedirectResponse(auth_url)
    except Exception as e:
        if "credentials.json not found" in str(e):
             from fastapi.responses import HTMLResponse
             return HTMLResponse(content="""
                <html>
                    <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                        <h1 style="color: #e53e3e;">Missing Credentials</h1>
                        <p>The backend cannot find <code>credentials.json</code>.</p>
                        <p>Please go back to the app, click "Upload credentials.json" in the Login screen, and follow the instructions.</p>
                        <a href="http://localhost:3000">Return to App</a>
                    </body>
                </html>
             """, status_code=200)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/auth/callback")
def auth_callback(code: str, error: Optional[str] = None):
    """Handles the callback from Google."""
    if error:
        raise HTTPException(status_code=400, detail=f"Auth error: {error}")
    
    try:
        # Exchange code for service
        new_service = GmailApiService.exchange_code(code=code, redirect_uri="http://localhost:8000/api/auth/callback")
        
        # Create session
        import uuid
        token = str(uuid.uuid4())
        sessions[token] = new_service
        
        # Redirect back to frontend with token
        # Frontend URL: http://localhost:3000
        # We append token as query param so frontend can grab it
        from fastapi.responses import RedirectResponse
        return RedirectResponse(f"http://localhost:3000?token={token}")
        
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Auth callback failed: {str(e)}")


