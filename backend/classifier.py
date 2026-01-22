import re

class Category:
    MARKETING = "Marketing"
    NOTIFICATIONS = "Notifications"
    NEWSLETTER = "Newsletter"
    SOCIAL = "Social"
    BANKING = "Banking"
    TRAVEL = "Travel"
    PERSONAL = "Personal"
    UNKNOWN = "Unknown"

MARKETING_KEYWORDS = [
    'offer', 'promo', 'deal', 'sale', 'discount', 'marketing', 'store', 'shop', 'brand'
]
NOTIFICATION_KEYWORDS = [
    'notification', 'alert', 'confirm', 'receipt', 'order', 'invoice', 'update', 'no-reply', 'noreply', 'auth', 'verify', 'security'
]
NEWSLETTER_KEYWORDS = [
    'newsletter', 'digest', 'weekly', 'daily', 'monthly', 'bulletin', 'brief', 'report'
]
BANKING_KEYWORDS = [
    'bank', 'statement', 'credit', 'debit', 'card', 'payment', 'transfer', 'acct', 'account', 'balance', 'withdrawal', 'deposit', 'chase', 'citi', 'amex', 'paypal', 'wallet', 'bill'
]
TRAVEL_KEYWORDS = [
    'flight', 'airline', 'booking', 'reservation', 'hotel', 'airbnb', 'expedia', 'trip', 'travel', 'ticket', 'boarding', 'itinerary', 'gate'
]
SOCIAL_DOMAINS = [
    'facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com', 'pinterest.com', 'tiktok.com', 'reddit.com'
]

def classify_sender(sender_name: str, sender_email: str = "") -> str:
    """
    Classifies a sender based on name and email (if available).
    """
    text = (sender_name + " " + sender_email).lower()

    # Check for social domains in email
    if sender_email:
        domain = sender_email.split('@')[-1].lower() if '@' in sender_email else ''
        if any(d in domain for d in SOCIAL_DOMAINS):
            return Category.SOCIAL

    # Keyword matching
    if any(k in text for k in BANKING_KEYWORDS):
        return Category.BANKING

    if any(k in text for k in TRAVEL_KEYWORDS):
        return Category.TRAVEL

    if any(k in text for k in NEWSLETTER_KEYWORDS):
        return Category.NEWSLETTER
    
    if any(k in text for k in NOTIFICATION_KEYWORDS):
        return Category.NOTIFICATIONS
        
    if any(k in text for k in MARKETING_KEYWORDS):
        return Category.MARKETING

    # Default logic: if it looks like a person's name (no numbers, just letters/spaces), assume Personal
    # This is a weak heuristic but better than nothing.
    # Alternatively, if we have "no-reply" or "bounce" it's definitely not personal.
    if 'no-reply' in text or 'noreply' in text:
        return Category.NOTIFICATIONS
        
    return Category.PERSONAL
