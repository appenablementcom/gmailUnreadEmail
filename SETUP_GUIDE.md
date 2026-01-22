# Getting Started with Gmail API

To allow this application to access your Gmail account, you need to create OAuth 2.0 credentials in the Google Cloud Console.

## Steps

1.  **Go to Google Cloud Console**:
    Visit [https://console.cloud.google.com/](https://console.cloud.google.com/).

2.  **Create a Project**:
    - Click on the project dropdown at the top left.
    - Click **"New Project"**.
    - Name it "Gmail Cleanup" and click **Create**.

3.  **Enable Gmail API**:
    - Select your new project.
    - Go to **"APIs & Services" > "Library"**.
    - Search for **"Gmail API"**.
    - Click **Enable**.

4.  **Configure OAuth Consent Screen**:
    - Go to **"APIs & Services" > "OAuth consent screen"**.
    - Choose **"External"** (since you might not have a Google Workspace organization) or **"Internal"** if you do.
    - Click **Create**.
    - **App Information**: Fill in App Name (e.g., "Gmail Cleanup") and User Support Email.
    - **Developer Contact Information**: Fill in your email.
    - Click **Save and Continue**.
    - **Scopes**: Click "Add or Remove Scopes". Select `https://mail.google.com/` (Read, compose, send, and permanently delete all your email from Gmail). This is distinct from just reading. Since we want to delete, we need full access or specifically `https://www.googleapis.com/auth/gmail.modify`.
        - *Recommendation*: Use `https://www.googleapis.com/auth/gmail.modify` for trash/spam, but `delete forever` might strictly need full mail access or specific implementation. Let's stick to `gmail.modify` for now which allows trash.
    - **Test Users**: Add your own email address here so you can log in while the app is in "Testing" mode.
    - Click **Save and Continue**.

5.  **Create Credentials**:
    - Go to **"APIs & Services" > "Credentials"**.
    - Click **"Create Credentials"** > **"OAuth client ID"**.
    - **Application type**: Select **"Desktop app"**.
    - **Name**: "Local Client".
    - Click **Create**.

6.  **Download JSON**:
    - Look for the "**Download JSON**" button in the modal or the download icon next to your new client ID.
    - Save the file as `credentials.json`.
    - Move this file to the `backend/` folder of this project: `c:/Development/DT/unreadGmail/backend/credentials.json`.
