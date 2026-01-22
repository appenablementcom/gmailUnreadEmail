import imaplib
import email
from email.header import decode_header
from email_service_base import EmailService

class ImapService(EmailService):
    def __init__(self):
        self.mail = None
        self.email_address = None
        self.password = None

    def authenticate(self, email_address=None, password=None):
        if not email_address or not password:
            raise ValueError("Email and password required for IMAP")
        
        self.email_address = email_address
        self.password = password
        
        # Connect to Gmail IMAP
        self.mail = imaplib.IMAP4_SSL("imap.gmail.com")
        self.mail.login(email_address, password)
        self.mail.select("inbox")

    def _ensure_connected(self):
        if not self.mail:
            if self.email_address and self.password:
                self.authenticate(self.email_address, self.password)
            else:
                raise Exception("Not authenticated")

    def get_unread_count(self):
        self._ensure_connected()
        # STATUS command is faster than SEARCH for counts
        # But for unread specifically, we might need SEARCH or STATUS (UNSEEN)
        status, response = self.mail.status("inbox", "(UNSEEN)")
        # Response format: [b'"INBOX" (UNSEEN 123)']
        if status != "OK":
            return {"messagesUnread": 0, "threadsUnread": 0}
            
        try:
            unseen_count = int(response[0].decode().split("UNSEEN")[1].strip().replace(")", ""))
            return {
                "messagesUnread": unseen_count,
                "threadsUnread": 0 # IMAP doesn't give thread counts easily
            }
        except:
            return {"messagesUnread": 0, "threadsUnread": 0}

    def list_unread_messages(self, max_results=100):
        self._ensure_connected()
        
        status, messages = self.mail.search(None, 'UNSEEN')
        if status != "OK":
            return []
            
        email_ids = messages[0].split()
        # Get latest first
        email_ids = email_ids[::-1][:max_results]
        
        result = []
        for e_id in email_ids:
            # Fetch the email body (RFC822) for parsing
            # Using '(BODY.PEEK[HEADER.FIELDS (FROM SUBJECT)])' to avoid marking as read
            status, msg_data = self.mail.fetch(e_id, '(BODY.PEEK[HEADER.FIELDS (FROM SUBJECT)])')
            
            if status != "OK":
                continue

            for response_part in msg_data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])
                    subject, encoding = decode_header(msg["Subject"])[0]
                    if isinstance(subject, bytes):
                        subject = subject.decode(encoding if encoding else "utf-8")
                    
                    sender = msg.get("From")
                    
                    result.append({
                        "id": e_id.decode(), # IMAP ID
                        "threadId": None,
                        "snippet": "Loading...", # Full snippet requires body fetch, keeping light
                        "subject": subject,
                        "sender": sender
                    })
                    
        return result

    def batch_modify(self, message_ids, operation):
        self._ensure_connected()
        if not message_ids:
            return 0
            
        # IMAP requires comma separated list of IDs for newer versions or looping
        # Often easier to join them: "1,2,3"
        id_list = ",".join(message_ids)
        
        if operation == "READ":
             self.mail.store(id_list, '+FLAGS', '\\Seen')
        elif operation == "TRASH":
            # Gmail IMAP Specific: Move to [Gmail]/Trash
            # This usually requires COPY then STORE \Deleted on original
            # Or simplified: Apply \Deleted and then EXPUNGE if we just want to remove from Inbox?
            # Correct Gmail IMAP behavior for "Move to Trash":
            # self.mail.copy(id_list, '[Gmail]/Trash')
            # self.mail.store(id_list, '+FLAGS', '\\Deleted')
            # For simplicity let's just mark deleted and expunge, keeping it simple.
            # BUT Gmail treats \Deleted as "Archive" or "Trash" depending on settings.
            # Safest "Move to Trash" is COPY to [Gmail]/Trash
            
            self.mail.copy(id_list, '[Gmail]/Trash')
            self.mail.store(id_list, '+FLAGS', '\\Deleted')
            
        return len(message_ids)

    def mark_as_read(self, message_ids):
        return self.batch_modify(message_ids, "READ")

    def move_to_trash(self, message_ids):
        # This is strictly "Delete" from inbox
        return self.batch_modify(message_ids, "TRASH")

    def mark_as_spam(self, message_ids):
        # Move to [Gmail]/Spam
        self._ensure_connected()
        if not message_ids: return 0
        
        id_list = ",".join(message_ids)
        
        # Try to find the Spam mailbox name (it varies by locale sometimes, but [Gmail]/Spam is standard for English)
        # For robustness, we should LIST, but assuming [Gmail]/Spam for MVP
        try:
             self.mail.copy(id_list, '[Gmail]/Spam')
             self.mail.store(id_list, '+FLAGS', '\\Deleted')
        except:
             # Fallback if copy fails (e.g. folder doesn't exist), just mark deleted
             self.mail.store(id_list, '+FLAGS', '\\Deleted')
             
        return len(message_ids)

    def unsubscribe(self, message_ids):
        # Alias to spam for now
        return self.mark_as_spam(message_ids)

    def get_sender_stats(self, limit: int = 500, page_token: str = None):
        """
        Stateful pagination for IMAP.
        If page_token is None, we perform a new SEARCH and cache IDs.
        If page_token is set (it's an index), we slice from there.
        """
        if not self.mail:
            raise Exception("IMAP not authenticated")
            
        # Initialize cache if needed
        if not hasattr(self, 'cached_ids'):
            self.cached_ids = []
            
        # New Search if no token
        if not page_token:
            status, messages = self.mail.search(None, 'UNSEEN')
            if status != "OK":
                return [], None
            
            all_ids = messages[0].split()
            # Latest first
            self.cached_ids = all_ids[::-1]
            start_idx = 0
        else:
            try:
                start_idx = int(page_token)
            except:
                start_idx = 0
        
        # Slice batch
        end_idx = start_idx + limit
        batch_ids = self.cached_ids[start_idx:end_idx]
        
        # Determine next token
        next_token = str(end_idx) if end_idx < len(self.cached_ids) else None
        
        if not batch_ids:
            return [], None
            
        from classifier import classify_sender
        sender_map = {}
        
        # Helper to process a batch of IDs
        def process_batch(ids_batch):
             # Join IDs with comma
             id_str = b','.join(ids_batch).decode('utf-8')
             status, msg_data = self.mail.fetch(id_str, '(BODY.PEEK[HEADER.FIELDS (FROM)])')
             if status != "OK": return

             # Parse the bulk response
             for response_part in msg_data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])
                    sender_raw = msg.get("From", "(Unknown)")
                    
                    # Simplify name
                    import re
                    sender_name = sender_raw
                    # Decode if needed (e.g. =?UTF-8?B?...)
                    sender_name, encoding = decode_header(sender_name)[0]
                    if isinstance(sender_name, bytes):
                        sender_name = sender_name.decode(encoding if encoding else "utf-8")
                    
                    sender_email = ""
                    # Remove <email> part if present for display
                    match = re.search(r'(.*?)\s*<(.*)>', sender_name)
                    if match:
                        sender_name = match.group(1).strip().replace('"', '')
                        sender_email = match.group(2).strip()
                    elif '@' in sender_name:
                        sender_email = sender_name
                        
                    if not sender_name: sender_name = sender_raw

                    if sender_name not in sender_map:
                        category = classify_sender(sender_name, sender_email)
                        sender_map[sender_name] = {'sender': sender_name, 'count': 0, 'ids': [], 'category': category}
                    
                    # Parse ID from prefix
                    try:
                        import re
                        # Format: b'123 (BODY...'
                        prefix = response_part[0].decode('utf-8')
                        found_id = prefix.split(' ')[0]
                        sender_map[sender_name]['ids'].append(found_id)
                        sender_map[sender_name]['count'] += 1
                    except:
                        pass

        # Process the batch (sub-batching if necessary, but 500 limit is fine for fetch)
        # IMAP command line length limits exist, so sticking to 100 chunks is safer
        internal_batch = 100
        for i in range(0, len(batch_ids), internal_batch):
            chunk = batch_ids[i:i + internal_batch]
            process_batch(chunk)

        # Convert map to list (no need to sort globally yet, frontend will merge)
        stats = list(sender_map.values())
        return stats, next_token

    def get_messages_details(self, message_ids):
        self._ensure_connected()
        if not message_ids:
            return []
            
        # Join IDs 
        chunk_size = 100
        details = []
        
        import email
        from email.header import decode_header
        
        for i in range(0, len(message_ids), chunk_size):
            chunk = message_ids[i:i+chunk_size]
            id_str = ",".join(chunk)
            
            try:
                status, msg_data = self.mail.fetch(id_str, '(BODY.PEEK[HEADER.FIELDS (FROM SUBJECT DATE)])')
                if status != "OK": continue
                
                # We need to map responses back to IDs. 
                # IMAP fetch response format: [(b'123 (BODY...', b'Header content'), b')']
                
                current_id = None
                current_headers = {}
                
                for response_part in msg_data:
                    if isinstance(response_part, tuple):
                        # Extract ID
                        try:
                            prefix = response_part[0].decode('utf-8')
                            current_id = prefix.split(' ')[0]
                        except:
                            current_id = None
                            
                        msg = email.message_from_bytes(response_part[1])
                        
                        subject, encoding = decode_header(msg.get("Subject", "(No Subject)"))[0]
                        if isinstance(subject, bytes):
                            subject = subject.decode(encoding if encoding else "utf-8")
                            
                        sender = msg.get("From", "(Unknown)")
                        date = msg.get("Date", "")
                        
                        details.append({
                            "id": current_id,
                            "sender": sender,
                            "subject": subject,
                            "date": date,
                            "snippet": "(Loading snippet requires full fetch)" 
                        })
            except Exception as e:
                print(f"IMAP Fetch Error: {e}")
                
        return details
