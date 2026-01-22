# DeployTeam Inbox Cleaner

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Version](https://img.shields.io/badge/version-1.3.2-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

**Take control of your Gmail.**
DeployTeam Inbox Cleaner is a self-hosted, privacy-first application that helps you declare bankruptcy on your unread emails. It scans your inbox, groups emails by sender, categorizes them (Banking, Travel, Social, etc.), and allows you to bulk-delete or spam thousands of emails in seconds.

## 🚀 Features

*   **Deep Scanning**: Fetches up to 50,000 unread emails to give you a complete picture of your inbox.
*   **Smart Categorization**: Automatically detects Banking, Travel, Social, Newsletter, and Notification emails.
*   **Persistence**: Saves scan results locally so you don't have to re-scan every time you refresh.
*   **Sender Grouping**: See who is spamming you the most. One click to remove ALL emails from a specific sender.
*   **Bulk Actions**:
    *   🗑️ **Delete All**: Move all emails from a sender to Trash.
    *   ⛔ **Spam**: Mark as Spam and remove from Inbox.
    *   🔕 **Unsubscribe**: Attempt to auto-unsubscribe (via headers).
*   **Lifetime Stats**: Track how many thousands of emails you've cleaned over time.
*   **Privacy First**: OAuth 2.0 based. Your tokens live on *your* machine. No data is sent to third-party servers.

## 🛠️ Tech Stack

*   **Frontend**: Next.js 14, TypeScript, TailwindCSS
*   **Backend**: Python 3.11, FastAPI, Gmail API
*   **Infrastructure**: Docker & Docker Compose

## 📦 Installation

### Prerequisites
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/)
*   Git

### 1. Clone the Repository
```bash
git clone https://github.com/appenablementcom/gmailUnreadEmail.git
cd gmailUnreadEmail
```

### 2. Google Cloud Setup (One Time)
To allow the app to scan your email, you need your own `credentials.json`.
*   Go to [Google Cloud Console](https://console.cloud.google.com/).
*   Create a Project (e.g., "Inbox Cleaner").
*   Enable **Gmail API**.
*   Configure **OAuth Consent Screen** (User Type: External -> Add yourself as Test User).
*   Create **Credentials** -> **OAuth Client ID** -> **Web Application**.
    *   **Authorized Redirect URIs**: `http://localhost:8000/api/auth/callback`
*   Download the JSON file, rename it to `credentials.json`.

### 3. Run with Docker
1.  Place `credentials.json` in the `backend/` folder (or upload it via the UI later).
2.  Start the app:
    ```bash
    docker-compose up -d --build
    ```
3.  Open your browser to [http://localhost:3000](http://localhost:3000).

## 🖥️ Usage

1.  **Login**: Click "Sign in with Google" to authorize the app.
2.  **Scan**: The dashboard will automatically start scanning your unread messages.
3.  **Review**: Sort by "Count" to see your top offenders.
4.  **Clean**:
    *   Click the **Trash Icon** just one sender to wipe 1000+ emails instantly.
    *   Click **"Delete All"** on a Category (e.g., "Marketing") to bulk purge.
5.  **Enjoy**: Watch your "Lifetime Cleaned" stat grow!

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

[MIT](https://choosealicense.com/licenses/mit/)
