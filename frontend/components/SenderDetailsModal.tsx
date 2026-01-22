import { useEffect, useState } from 'react';
import { getBatchEmailDetails, EmailDetail } from '../lib/api';

interface SenderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    sender: string;
    ids: string[];
    token: string;
}

export default function SenderDetailsModal({ isOpen, onClose, sender, ids, token }: SenderDetailsModalProps) {
    const [details, setDetails] = useState<EmailDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        const fetchDetails = async () => {
            setLoading(true);
            setError('');
            try {
                // Fetch only first 20 if too many, to avoid overwhelming UI/User
                // Or maybe the backend handles batching, but for a popup 20 is a good preview.
                const targetIds = ids.slice(0, 50);
                const data = await getBatchEmailDetails(targetIds, token);
                setDetails(data);
            } catch (err) {
                setError('Failed to load email details');
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [isOpen, ids, token]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold dark:text-white mb-1">Sender Details</h2>
                        <p className="text-sm text-gray-500 font-mono break-all">{sender}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                            <p className="text-sm text-gray-500">Loading emails...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-500">
                            {error}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-medium">
                                        <th className="pb-3 px-2 w-32">Date</th>
                                        <th className="pb-3 px-2 w-1/4">Subject</th>
                                        <th className="pb-3 px-2 w-1/4">Sender Details (From Header)</th>
                                        <th className="pb-3 px-2">Snippet</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {details.map((email) => (
                                        <tr key={email.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="py-3 px-2 text-gray-500 whitespace-nowrap text-xs">
                                                {email.date ? new Date(email.date).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="py-3 px-2 font-medium dark:text-gray-200">
                                                {email.subject}
                                            </td>
                                            <td className="py-3 px-2 text-gray-500 text-xs break-all font-mono">
                                                {email.sender}
                                            </td>
                                            <td className="py-3 px-2 text-gray-500 dark:text-gray-400 text-xs truncate max-w-xs">
                                                {email.snippet}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {ids.length > 50 && (
                                <p className="text-center text-xs text-gray-400 mt-4">
                                    Showing first 50 of {ids.length} emails.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
