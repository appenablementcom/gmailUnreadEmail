'use client';

import { useState } from 'react';
import { loginImap } from '../lib/api';
import InstructionsModal from './InstructionsModal';
import { useToast } from './ToastProvider';

export default function Login({ onLogin }: { onLogin: (token: string) => void }) {
    const { error: showError, success: showSuccess } = useToast();
    const [method, setMethod] = useState<'oauth' | 'imap'>('oauth');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showInstructions, setShowInstructions] = useState(false);

    const handleImapLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const data = await loginImap(email, password);
            onLogin(data.token);
        } catch (err) {
            setError('Login failed. Check your credentials.');
            showError('Login failed. Check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
            <InstructionsModal isOpen={showInstructions} onClose={() => setShowInstructions(false)} />

            <div className="text-center space-y-2">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg flex items-center justify-center text-white text-2xl font-bold">
                        DT
                    </div>
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                    DeployTeam Cleanup Your Inbox
                </h1>
                <p className="text-lg text-gray-500 dark:text-gray-400">
                    The fastest way to reach Inbox Zero.
                </p>
            </div>

            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                <div className="flex space-x-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <button
                        onClick={() => setMethod('oauth')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${method === 'oauth'
                            ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        Google OAuth
                    </button>
                    <button
                        onClick={() => setMethod('imap')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${method === 'imap'
                            ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        IMAP (App Password)
                    </button>
                </div>

                {method === 'oauth' ? (
                    <div className="space-y-6">
                        {/* Primary Sign In Button for Returning Users */}
                        <div className="text-center space-y-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Already configured?
                            </p>
                            <button
                                onClick={() => {
                                    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                                    window.location.href = `${API_URL}/api/auth/login`;
                                }}
                                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                            >
                                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.536-6.033-5.663s2.701-5.663,6.033-5.663c1.43,0,2.783,0.485,3.877,1.29l2.871-2.909C17.485,3.578,15.196,2.396,12.545,2.396C7.264,2.396,2.983,6.505,2.983,11.571s4.281,9.175,9.562,9.175c5.518,0,9.167-3.879,9.167-9.066c0-0.655-0.071-1.229-0.198-1.776L12.545,10.239z" />
                                </svg>
                                Sign in with Google
                            </button>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">or First Time Setup</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                                <svg className="w-4 h-4 mr-1 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                Configure Credentials
                            </h3>

                            <p className="text-xs text-gray-500 mb-4">
                                Upload <code>credentials.json</code> from <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="underline text-blue-500">Google Cloud Console</a>.
                            </p>

                            <div className="space-y-4">
                                {/* File Upload */}
                                <div>
                                    <label className="block text-xs font-medium mb-1.5 text-gray-600 dark:text-gray-300">Option A: Upload File</label>
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = async (event) => {
                                                    const text = event.target?.result as string;
                                                    try {
                                                        const { uploadCredentials } = await import('../lib/api');
                                                        await uploadCredentials(text);
                                                        showSuccess('Credentials uploaded. Redirecting to login...');
                                                        // Auto Login
                                                        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                                                        window.location.href = `${API_URL}/api/auth/login`;
                                                    } catch (err) {
                                                        showError(err instanceof Error ? err.message : 'Invalid JSON file.');
                                                    }
                                                };
                                                reader.readAsText(file);
                                            }
                                        }}
                                        className="block w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-100 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-200 hover:file:bg-blue-200 cursor-pointer"
                                    />
                                </div>

                                <div className="text-center text-xs text-gray-300 font-medium">- OR -</div>

                                {/* Paste JSON */}
                                <div>
                                    <label className="block text-xs font-medium mb-1.5 text-gray-600 dark:text-gray-300">Option B: Paste JSON</label>
                                    <textarea
                                        className="w-full text-xs font-mono p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg h-20 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder='{"web": { "client_id": "...", ... }}'
                                        id="paste-creds"
                                    ></textarea>
                                    <button
                                        onClick={async () => {
                                            const content = (document.getElementById('paste-creds') as HTMLTextAreaElement).value;
                                            if (!content) return showError('Please paste the JSON content first');
                                            try {
                                                const { uploadCredentials } = await import('../lib/api');
                                                await uploadCredentials(content);
                                                showSuccess('Credentials uploaded. Redirecting to login...');
                                                // Auto Login
                                                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                                                window.location.href = `${API_URL}/api/auth/login`;
                                            } catch (err) {
                                                showError(err instanceof Error ? err.message : 'Failed to save. Check JSON format.');
                                            }
                                        }}
                                        className="mt-2 w-full py-2 bg-gray-900 dark:bg-gray-600 hover:bg-black dark:hover:bg-gray-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center"
                                    >
                                        Save & Sign In
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleImapLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="you@gmail.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                App Password
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="xxxx xxxx xxxx xxxx"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Generate this in your Google Account Security settings.
                            </p>
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center px-4 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Connecting...' : 'Connect'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
