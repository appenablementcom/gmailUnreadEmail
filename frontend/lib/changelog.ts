export interface ChangeLogEntry {
    version: string;
    date: string;
    changes: string[];
}

export const changelog: ChangeLogEntry[] = [
    {
        version: "v1.3.2",
        date: "2026-01-21",
        changes: [
            "Backend: Increased retry attempts for 'Unknown' senders (up to 10x)",
            "Backend: Improved rate-limit handling for faster, more accurate scans"
        ]
    },
    {
        version: "v1.3.1",
        date: "2026-01-21",
        changes: [
            "UI: Added 'Lifetime Cleaned' stats to the main Dashboard"
        ]
    },
    {
        version: "v1.3.0",
        date: "2026-01-21",
        changes: [
            "Major Feature: Persistence! Application now remembers your scan results",
            "UX: Added 'Last Updated' timestamp and manual Refresh option",
            "Feature: Added 'Banking' and 'Travel' categories"
        ]
    },
    {
        version: "v1.2.4",
        date: "2026-01-21",
        changes: [
            "Feature: Added 'Banking' and 'Travel' categories",
            "Classification: Improved keyword classification for financial and travel emails"
        ]
    },
    {
        version: "v1.2.3",
        date: "2026-01-21",
        changes: [
            "Critical Fix: Resolved 500 Internal Server Error when deleting emails",
            "Backend: Added enhanced error logging for deletion actions"
        ]
    },
    {
        version: "v1.2.2",
        date: "2026-01-21",
        changes: [
            "UI Polish: Replaced browser alerts with ConfirmModal",
            "UI Polish: Added Toast notifications",
            "Enhancement: History Dashboard charts"
        ]
    },
    {
        version: "v1.2.1",
        date: "2026-01-20",
        changes: [
            "Backend: Upgraded to Python 3.11 (Resolved Google Auth warnings)",
            "Backend: Implemented Adaptive Retry to fix 'Unknown' senders (Rate Limit handling)"
        ]
    },
    {
        version: "v1.2.0",
        date: "2026-01-20",
        changes: [
            "New Feature: Sender Details Popup (View individual emails)",
            "Bug Fix: Fixed Session Expiry causing empty Dashboard",
            "Bug Fix: 'Unknown' Senders classification improvements",
            "Enhancement: Batch details fetching for better performance"
        ]
    },
    {
        version: "v1.1.0",
        date: "2026-01-19",
        changes: [
            "Unlimited Scan: Now fetches all unread emails (up to 50k)",
            "Improved Refresh: Added 'Scanning Inbox...' progress indicator",
            "UI Polish: Added icons for actions",
            "Enhanced sorting and filtering"
        ]
    },
    {
        version: "v1.0.0.8",
        date: "2026-01-19",
        changes: [
            "Added manual entry for Client ID & Secret",
            "Updated Tab Name to 'DT Inbox Cleaner'",
            "Improved credentials setup options"
        ]
    },
    {
        version: "v1.0.0.7",
        date: "2026-01-19",
        changes: [
            "Added version indicator in bottom left corner",
            "Added accessible changelog popup",
            "Incremented version number tracking"
        ]
    },
    {
        version: "v1.0.0.6",
        date: "2026-01-19",
        changes: [
            "Rebranded application to 'DeployTeam Cleanup Your Inbox'",
            "Added 'How to get credentials' help popup",
            "Updated UI styling for branding"
        ]
    },
    {
        version: "v1.0.0.5",
        date: "2026-01-19",
        changes: [
            "Implemented real 'Sign in with Google' (Web OAuth Flow)",
            "Added backend support for OAuth callbacks",
            "Fixed Docker container networking for auth redirects"
        ]
    },
    {
        version: "v1.0.0.4",
        date: "2026-01-19",
        changes: [
            "Added ability to upload credentials.json directly in UI",
            "Improved Login screen with 'Recommended' section"
        ]
    },
    {
        version: "v1.0.0.3",
        date: "2026-01-19",
        changes: [
            "Fixed Docker 'module not found' errors",
            "Switched frontend to 'npm start' for stability",
            "Resolved volume mounting issues"
        ]
    },
    {
        version: "v1.0.0.2",
        date: "2026-01-19",
        changes: [
            "Implemented Dual Authentication (OAuth vs IMAP)",
            "Created initial Dashboard UI",
            "Added Stats and Email List components"
        ]
    },
    {
        version: "v1.0.0.1",
        date: "2026-01-19",
        changes: [
            "Initial Project Setup",
            "Backend API scaffolding (FastAPI)",
            "Frontend scaffolding (Next.js)"
        ]
    }
];

export const CURRENT_VERSION = changelog[0].version;
