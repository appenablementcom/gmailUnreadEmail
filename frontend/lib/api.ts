const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function loginImap(email: string, password: string) {
    const res = await fetch(`${API_URL}/api/auth/imap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(`Login failed: ${res.status}`);
    return res.json();
}

export async function checkAuth(token?: string) {
    const headers: any = {};
    if (token) headers['x-auth-token'] = token;

    const res = await fetch(`${API_URL}/api/check-auth`, { headers });
    return res.json();
}

export async function getStats(token?: string) {
    const headers: any = {};
    if (token) headers['x-auth-token'] = token;

    const res = await fetch(`${API_URL}/api/stats`, { headers });
    if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
    return res.json();
}

export async function getEmails(token?: string) {
    const headers: any = {};
    if (token) headers['x-auth-token'] = token;

    const res = await fetch(`${API_URL}/api/emails`, { headers });
    if (!res.ok) throw new Error(`Failed to fetch emails: ${res.status}`);
    return res.json();
}

export async function deleteAll(ids: string[], token?: string, senderCounts?: Record<string, number>) {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['x-auth-token'] = token;

    const body = {
        ids,
        senders: senderCounts || {}
    };

    const res = await fetch(`${API_URL}/api/emails/delete-all`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Failed to delete emails: ${res.status}`);
    return res.json();
}

export async function markAsSpam(ids: string[], token?: string) {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['x-auth-token'] = token;

    const res = await fetch(`${API_URL}/api/emails/spam`, {
        method: 'POST',
        headers,
        body: JSON.stringify(ids),
    });
    if (!res.ok) throw new Error(`Failed to mark as spam: ${res.status}`);
    return res.json();
}

export interface PaginatedSenderStats {
    stats: SenderStat[];
    nextPageToken?: string;
}

export async function getSenderStats(token: string, limit: number = 500, pageToken?: string): Promise<PaginatedSenderStats> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (pageToken) params.append('pageToken', pageToken);

    const res = await fetch(`${API_URL}/api/senders?${params.toString()}`, {
        headers: { 'x-auth-token': token },
    });
    if (!res.ok) throw new Error(`Failed to fetch sender stats: ${res.status}`);
    return res.json();
}

// Basic types
export interface Email {
    id: string;
    threadId: string;
    snippet: string;
    subject: string;
    sender: string;
}

export interface SenderStat {
    sender: string;
    count: number;
    ids: string[];
    category?: string;
}

export interface Stats {
    messagesUnread: number;
    threadsUnread: number;
}

export async function unsubscribe(ids: string[], token?: string) {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['x-auth-token'] = token;

    const res = await fetch(`${API_URL}/api/emails/unsubscribe`, {
        method: 'POST',
        headers,
        body: JSON.stringify(ids),
    });
    if (!res.ok) throw new Error(`Failed to unsubscribe: ${res.status}`);
    return res.json();
}
export async function uploadCredentials(jsonContent: string) {
    const res = await fetch(`${API_URL}/api/setup/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonContent,
    });
    if (!res.ok) throw new Error(`Failed to upload credentials: ${res.status}`);
    return res.json();
}

export interface EmailDetail {
    id: string;
    sender: string;
    subject: string;
    date: string;
    snippet: string;
}

export async function getBatchEmailDetails(ids: string[], token?: string): Promise<EmailDetail[]> {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['x-auth-token'] = token;

    const res = await fetch(`${API_URL}/api/emails/batch`, {
        method: 'POST',
        headers,
        body: JSON.stringify(ids),
    });
    if (!res.ok) throw new Error(`Failed to fetch email details: ${res.status}`);
    return res.json();
}

export interface HistoryLog {
    timestamp: number;
    date: string;
    action: string;
    count: number;
    details: string;
}

export interface HistoryStats {
    deleted: number;
    spam: number;
    unsubscribed: number;
    top_senders?: Record<string, number>;
}

export interface HistoryResponse {
    logs: HistoryLog[];
    stats: HistoryStats;
}

export async function getHistory(): Promise<HistoryResponse> {
    const res = await fetch(`${API_URL}/api/history`);
    if (!res.ok) throw new Error(`Failed to fetch history: ${res.status}`);
    return res.json();
}
