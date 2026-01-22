import React from 'react';

interface InstructionsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function InstructionsModal({ isOpen, onClose }: InstructionsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-100 dark:border-gray-700">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        How to get credentials.json
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto text-sm text-gray-600 dark:text-gray-300 space-y-4">
                    <p>To use this app with your Gmail account, you need to create OAuth 2.0 credentials.</p>

                    <ol className="list-decimal pl-5 space-y-3">
                        <li>
                            <strong>Go to Google Cloud Console</strong>:
                            Visit <a href="https://console.cloud.google.com/" target="_blank" className="text-blue-600 hover:underline">console.cloud.google.com</a>.
                        </li>
                        <li>
                            <strong>Create a Project</strong>:
                            Click the project dropdown (top left), select <strong>"New Project"</strong>, name it "DeployTeam Inbox" and click Create.
                        </li>
                        <li>
                            <strong>Enable Gmail API</strong>:
                            Go to <strong>"APIs & Services" &gt; "Library"</strong>, search for "Gmail API" and click <strong>Enable</strong>.
                        </li>
                        <li>
                            <strong>Configure Consent Screen</strong>:
                            Go to <strong>"APIs & Services" &gt; "OAuth consent screen"</strong>.
                            <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                                <li>Select <strong>External</strong> and click Create.</li>
                                <li>Fill in App Name ("DeployTeam Inbox") and your email.</li>
                                <li><strong>Scopes</strong>: Add user/password/email scopes if needed, or specifically <code>https://mail.google.com/</code> for full access.</li>
                                <li><strong>Test Users</strong>: Add your own email address.</li>
                            </ul>
                        </li>
                        <li>
                            <strong>Create Credentials</strong>:
                            Go to <strong>"APIs & Services" &gt; "Credentials"</strong>.
                            <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                                <li>Click <strong>"Create Credentials" &gt; "OAuth client ID"</strong>.</li>
                                <li>Application type: <strong>"Web application"</strong>.</li>
                                <li>Name: "DeployTeam Web Client".</li>
                                <li><strong>Authorized redirect URIs</strong>: Add <code>http://localhost:8000/api/auth/callback</code></li>
                            </ul>
                        </li>
                        <li>
                            <strong>Download & Upload</strong>:
                            Click the download icon (JSON) for the new client ID. Open the file, copy the content, and paste it into the "Upload credentials.json" box on the login screen.
                        </li>
                    </ol>

                    <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg">
                        <h3 className="text-yellow-800 dark:text-yellow-200 font-bold mb-2 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            Getting "Error 403: access_denied"?
                        </h3>
                        <p className="text-yellow-700 dark:text-yellow-300 text-xs leading-relaxed">
                            This means your app is in "Testing" mode and you haven't added yourself as a tester.
                            <br /><br />
                            <strong>Fix:</strong> Go to <strong>OAuth consent screen &gt; Test users</strong> in Google Cloud Console and add your email address (the one you are trying to log in with).
                        </p>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-right">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
}
