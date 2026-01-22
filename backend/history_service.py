import json
import os
import time
from typing import List, Dict

DATA_FILE = "data/history.json"

class HistoryService:
    def __init__(self):
        self.ensure_data_dir()
        
    def ensure_data_dir(self):
        if not os.path.exists("data"):
            os.makedirs("data")
        if not os.path.exists(DATA_FILE):
             self.save_history({"logs": [], "stats": {"deleted": 0, "spam": 0, "unsubscribed": 0}})

    def load_history(self) -> Dict:
        try:
            with open(DATA_FILE, "r") as f:
                return json.load(f)
        except:
            return {"logs": [], "stats": {"deleted": 0, "spam": 0, "unsubscribed": 0}}

    def save_history(self, data: Dict):
        with open(DATA_FILE, "w") as f:
            json.dump(data, f, indent=2)

    def log_action(self, action_type: str, count: int, details: str, break_down: Dict[str, int] = None):
        data = self.load_history()
        
        # Update Stats
        if action_type == "delete":
            data["stats"]["deleted"] += count
        elif action_type == "spam":
            data["stats"]["spam"] += count
        elif action_type == "unsubscribe":
            data["stats"]["unsubscribed"] += count
            
        # Update Top Senders (if breakdown provided)
        if break_down:
            top_senders = data["stats"].get("top_senders", {})
            for sender, cnt in break_down.items():
                top_senders[sender] = top_senders.get(sender, 0) + cnt
            
            # Sort and keep top 50
            sorted_senders = sorted(top_senders.items(), key=lambda x: x[1], reverse=True)[:50]
            data["stats"]["top_senders"] = dict(sorted_senders)

            # Append summary to details
            sorted_breakdown = sorted(break_down.items(), key=lambda x: x[1], reverse=True)
            summary_parts = [f"{cnt} from {sender}" for sender, cnt in sorted_breakdown[:3]]
            if len(break_down) > 3:
                summary_parts.append(f"and {len(break_down) - 3} others")
            
            if summary_parts:
                details += f" ({', '.join(summary_parts)})"

        # Add Log
        entry = {
            "timestamp": int(time.time()),
            "date": time.strftime("%Y-%m-%d %H:%M:%S"),
            "action": action_type,
            "count": count,
            "details": details
        }
        
        # Prepend to logs (newest first)
        data["logs"].insert(0, entry)
        
        # Limit log size (keep last 1000)
        data["logs"] = data["logs"][:1000]
        
        self.save_history(data)

    def get_history(self):
        return self.load_history()
