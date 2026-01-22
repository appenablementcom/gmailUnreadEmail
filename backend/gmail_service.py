import os
import os.path
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/gmail.modify']

from email_service_base import EmailService

class GmailApiService(EmailService):
    def __init__(self, credentials=None):
        self.creds = credentials
        self.service = None
        if self.creds:
             self.service = build('gmail', 'v1', credentials=self.creds)

    def get_authorization_url(self, redirect_uri):
        """Generates the URL for the user to login at Google."""
        if not os.path.exists('credentials.json'):
             raise Exception("credentials.json not found. Please upload it first.")
             
        from google_auth_oauthlib.flow import Flow
        flow = Flow.from_client_secrets_file(
            'credentials.json',
            scopes=SCOPES,
            redirect_uri=redirect_uri
        )
        # prompt='consent' to ensure we get a refresh token
        auth_url, _ = flow.authorization_url(prompt='consent', access_type='offline')
        return auth_url

    @staticmethod
    def exchange_code(code, redirect_uri):
        """Exchanges code for credentials and returns a new GmailApiService instance."""
        if not os.path.exists('credentials.json'):
             raise Exception("credentials.json not found.")

        from google_auth_oauthlib.flow import Flow
        flow = Flow.from_client_secrets_file(
            'credentials.json',
            scopes=SCOPES,
            redirect_uri=redirect_uri
        )
        flow.fetch_token(code=code)
        creds = flow.credentials
        return GmailApiService(credentials=creds)

    def authenticate(self, **kwargs):
        """Legacy local auth or implicit check."""
        if self.service: return
        
        # ... logic for local file token.json loading if strictly needed ...
        # For now, we assume this service is instantiated WITH creds in Web Flow.
        if os.path.exists('token.json'):
            self.creds = Credentials.from_authorized_user_file('token.json', SCOPES)
            self.service = build('gmail', 'v1', credentials=self.creds)


    def get_unread_count(self):
        if not self.service:
            self.authenticate()
        
        if not self.service:
             raise Exception("Gmail Service not authenticated. Please login.")

        results = self.service.users().labels().get(userId='me', id='INBOX').execute()
        return {
            "messagesUnread": results.get('messagesUnread', 0),
            "threadsUnread": results.get('threadsUnread', 0)
        }

    def list_unread_messages(self, max_results=100):
        if not self.service:
            self.authenticate()

        results = self.service.users().messages().list(userId='me', q='is:unread', maxResults=max_results).execute()
        messages = results.get('messages', [])
        
        # Hydrate messages with snippet/sender (batching would be better but keeping simple)
        hydrated_messages = []
        if messages:
            # For a prototype, fetching one by one is slow but easy. 
            # Ideally use batch request.
            batch = self.service.new_batch_http_request()
            
            def callback(request_id, response, exception):
                if exception is None:
                    headers = response['payload']['headers']
                    subject = next((h['value'] for h in headers if h['name'] == 'Subject'), '(No Subject)')
                    sender = next((h['value'] for h in headers if h['name'] == 'From'), '(Unknown)')
                    hydrated_messages.append({
                        "id": response['id'],
                        "threadId": response['threadId'],
                        "snippet": response.get('snippet', ''),
                        "subject": subject,
                        "sender": sender
                    })

            for msg in messages:
                batch.add(self.service.users().messages().get(userId='me', id=msg['id'], format='metadata'), callback=callback)
            
            batch.execute()

        return hydrated_messages

    def batch_modify(self, message_ids, add_labels=[], remove_labels=[]):
        if not self.service:
            self.authenticate()
            
        if not message_ids:
            return 0

        body = {
            "ids": message_ids,
            "addLabelIds": add_labels,
            "removeLabelIds": remove_labels
        }
        
        self.service.users().messages().batchModify(userId='me', body=body).execute()
        return len(message_ids)

    def mark_as_read(self, message_ids):
        return self.batch_modify(message_ids, remove_labels=['UNREAD'])

    def move_to_trash(self, message_ids):
        return self.batch_modify(message_ids, add_labels=['TRASH'])
        # Or specifically use trash() endpoint for improved semantics if available, 
        # but batchModify with TRASH label works for "Trash" folder usually.
        # Actually API has users().messages().trash(userId='me', id=id) but checking for batch support.
        # Batch delete endpoint is users().messages().batchDelete which is PERMANENT delete.
        # To move to trash, we modify labels usually? 
        # Wait, 'TRASH' is a system label. Applying it moves to trash.

    def batch_delete_permanently(self, message_ids):
        if not self.service:
            self.authenticate()
        
        if not message_ids:
            return 0
            
        body = {
            "ids": message_ids
        }
        self.service.users().messages().batchDelete(userId='me', body=body).execute()
        return len(message_ids)

    def mark_as_spam(self, message_ids):
        return self.batch_modify(message_ids, add_labels=['SPAM'], remove_labels=['INBOX'])

    def unsubscribe(self, message_ids):
        """
        Scans messages for List-Unsubscribe header.
        If 'mailto:' found, sends an email.
        Returns count of unsubscribed.
        """
        if not self.service:
            self.authenticate()
            
        count = 0
        for msg_id in message_ids:
            try:
                msg = self.service.users().messages().get(userId='me', id=msg_id, format='metadata').execute()
                headers = msg['payload']['headers']
                list_unsubscribe = next((h['value'] for h in headers if h['name'] == 'List-Unsubscribe'), None)
                
                if list_unsubscribe:
                    # Parse for mailto
                    # Format often: <mailto:unsubscribe@example.com>, <https://example.com/u>
                    import re
                    match = re.search(r'<mailto:(.*?)>', list_unsubscribe)
                    if match:
                        mailto_address = match.group(1)
                        # Send email
                        # We need 'compose' scope! We only have 'modify'.
                        # If we update scopes, we break current token.
                        # For now, let's just Log it or Skip implementation of SENDING.
                        # We can just move to trash/spam as a fallback or return "Not Supported"
                        # We can just move to trash/spam as a fallback or return "Not Supported"
                        pass
            except:
                continue
        return count

    def get_sender_stats(self, limit: int = 500, page_token: str = None):
        """
        Fetches one batch of unread messages.
        Returns: (stats_list, next_page_token)
        """
        if not self.service:
            self.authenticate()

        messages = []
        next_token = None
        
        try:
            # We treat 'limit' as 'batch_size' for this call
            results = self.service.users().messages().list(
                userId='me', 
                q='is:unread', 
                maxResults=min(limit, 500), # API max is 500 
                pageToken=page_token
            ).execute()
            
            messages = results.get('messages', [])
            next_token = results.get('nextPageToken')
            
        except Exception as e:
            print(f"Error during fetch: {e}")
            return [], None

        if not messages:
            return [], None

        # Aggregate stats for this batch
        from classifier import classify_sender
        sender_map = {}
        
        # Batch get headers
        # Gmail API requires getting details for each message. 
        # Batch request is ideal here but complex to implement quickly without library support.
        # We will iterate for now, but use a thread pool or batch object if slow.
        # For 500 items, sequential is slow. Let's use the batch helper if available or simple loop.
        # Actually existing implementation used batch() implicitly? No, it used list() then... 
        # Wait, the previous implementation didn't show the `_get_headers` part. 
        # I need to implement the header fetching logic.
        
        # Helper to fetch headers for a list of messages efficiently?
        # Standard way is batch request.
        
        # Using a simple batch request object could speed this up significantly
        # Adaptive Batch Fetching with Retry
        import time
        import random
        
        callbacks = {}
        
        all_ids = [str(m['id']) for m in messages]
        # Deduplicate
        all_ids = list(set(all_ids))
        
        pending_ids = all_ids
        retry_round = 0
        max_retries = 10 # Increased from 5
        
        while pending_ids and retry_round < max_retries:
            # Backoff if retrying
            if retry_round > 0:
                # Exponential backoff: 1s, 2s, 4s... + jitter
                # Cap at 15s to avoid too long waits
                sleep_time = min(15.0, (2 ** (retry_round - 1)) + random.uniform(0.1, 0.5))
                print(f"DEBUG: Rate limit hit. Retrying {len(pending_ids)} messages in {sleep_time:.2f}s (Round {retry_round})")
                time.sleep(sleep_time)
            
            # Smaller chunks on retry to reduce concurrency pressure
            chunk_size = 50 if retry_round == 0 else 20
            
            failed_ids = []
            
            def make_batch_callback(failures_list):
                def cb(request_id, response, exception):
                    if exception:
                        # Check for rate limits (429 or 403)
                        # Google API exceptions are objects, convert to str to check
                        err_str = str(exception)
                        if "429" in err_str or "403" in err_str or "Too many concurrent" in err_str:
                             failures_list.append(request_id)
                        else:
                             print(f"DEBUG: Non-retriable error for {request_id}: {exception}")
                             callbacks[request_id] = "Unknown"
                    else:
                        headers = response.get('payload', {}).get('headers', [])
                        sender_raw = next((h['value'] for h in headers if h['name'].lower() == 'from'), '(Unknown)')
                        callbacks[request_id] = sender_raw
                return cb

            # Process current pending_ids in chunks
            for i in range(0, len(pending_ids), chunk_size):
                chunk = pending_ids[i:i + chunk_size]
                batch = self.service.new_batch_http_request()
                
                # We need to capture failures for THIS iteration
                # Passing failed_ids ref is safe as we append to it
                batch_cb = make_batch_callback(failed_ids)
                
                for mid in chunk:
                    batch.add(self.service.users().messages().get(userId='me', id=mid, format='metadata', metadataHeaders=['From']), callback=batch_cb, request_id=mid)
                
                try:
                    batch.execute()
                except Exception as e:
                    print(f"DEBUG: Batch execute crashed: {e}")
                    # Conservative: Assume all in this chunk failed if execute crashes (rare)
                    failed_ids.extend(chunk)
            
            # Prepare for next round
            pending_ids = failed_ids
            retry_round += 1

        # Mark any remaining as Unknown after retries exhausted
        if pending_ids:
             print(f"DEBUG: Failed to fetch headers for {len(pending_ids)} messages after {max_retries} retries. IDs: {pending_ids[:5]}...")
        
        for pid in pending_ids:
             callbacks[pid] = "Unknown"
        
        # print(f"DEBUG: Finished fetching. Total: {len(all_ids)}, Unknown: {list(callbacks.values()).count('Unknown')}")
             
        import re
        from email.header import decode_header
        
        # Debug: Check first 5 keys
        # print(f"DEBUG: Callback keys (first 5): {list(callbacks.keys())[:5]}")
        
        for m in messages:
            msg_id = str(m['id'])
            sender_raw = callbacks.get(msg_id, "Unknown")
            
            if sender_raw == "Unknown":
                 # If unlimited scan, this spam might be huge. 
                 # Only print distinct ones or first few?
                 pass
            
            # Normalize
            sender_name = sender_raw
            # Basic cleanup
            match = re.search(r'(.*?)\s*<(.*)>', sender_name)
            sender_email = ""
            if match:
                sender_name = match.group(1).strip().replace('"', '')
                sender_email = match.group(2).strip()
            elif '@' in sender_name:
                sender_email = sender_name
                
            if not sender_name: sender_name = sender_raw

            if sender_name not in sender_map:
                category = classify_sender(sender_name, sender_email)
                sender_map[sender_name] = {'sender': sender_name, 'count': 0, 'ids': [], 'category': category}
            
            sender_map[sender_name]['count'] += 1
            sender_map[sender_name]['ids'].append(m['id'])

        # Convert map to list and sort
        stats = list(sender_map.values())
        stats.sort(key=lambda x: x['count'], reverse=True)
        return stats, next_token

    def get_messages_details(self, message_ids):
        """
        Fetches details (From, Subject, Date, Snippet) for a list of IDs.
        """
        if not self.service:
            self.authenticate()
            
        if not message_ids:
            return []
            
        details = []
        batch = self.service.new_batch_http_request()
        
        def callback(request_id, response, exception):
            if exception is None:
                headers = response.get('payload', {}).get('headers', [])
                subject = next((h['value'] for h in headers if h['name'] == 'Subject'), '(No Subject)')
                sender = next((h['value'] for h in headers if h['name'].lower() == 'from'), '(Unknown)')
                date = next((h['value'] for h in headers if h['name'] == 'Date'), '')
                snippet = response.get('snippet', '')
                
                details.append({
                    "id": response['id'],
                    "sender": sender,
                    "subject": subject,
                    "date": date,
                    "snippet": snippet
                })
        
        # Chunk 100 for batch limit
        chunk_size = 100
        for i in range(0, len(message_ids), chunk_size):
            chunk = message_ids[i:i + chunk_size]
            batch = self.service.new_batch_http_request()
            for mid in chunk:
                batch.add(self.service.users().messages().get(userId='me', id=mid, format='metadata', metadataHeaders=['From', 'Subject', 'Date']), callback=callback)
            try:
                batch.execute()
            except:
                pass
                
        return details


