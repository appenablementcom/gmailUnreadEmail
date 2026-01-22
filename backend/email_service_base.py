from abc import ABC, abstractmethod

class EmailService(ABC):
    @abstractmethod
    def authenticate(self, **kwargs):
        pass

    @abstractmethod
    def get_unread_count(self):
        """Returns {'messagesUnread': int, 'threadsUnread': int}"""
        pass

    @abstractmethod
    def list_unread_messages(self, max_results=100):
        """Returns list of dicts with id, threadId, snippet, subject, sender"""
        pass

    @abstractmethod
    def mark_as_read(self, message_ids):
        pass

    @abstractmethod
    def move_to_trash(self, message_ids):
        pass
        
    @abstractmethod
    def batch_delete_permanently(self, message_ids):
        pass

    @abstractmethod
    def mark_as_spam(self, message_ids):
        pass

    @abstractmethod
    def unsubscribe(self, message_ids):
        """Attempt to unsubscribe from the list."""
        pass

    @abstractmethod
    def get_sender_stats(self, limit: int = 500, page_token: str = None):
        """Returns (stats_list, next_page_token)"""
        pass

    @abstractmethod
    def get_messages_details(self, message_ids):
        """Returns list of dicts with id, sender, subject, date, snippet"""
        pass
