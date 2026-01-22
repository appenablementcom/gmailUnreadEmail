import React, { useState } from 'react';
import { SenderStat } from '../lib/api';
import SenderDetailsModal from './SenderDetailsModal';

interface SenderTableProps {
    senders: SenderStat[];
    onAction: (action: 'delete' | 'spam' | 'unsubscribe', ids: string[]) => void;
    processing: boolean;
    sortColumn: 'sender' | 'category' | 'count';
    sortDirection: 'asc' | 'desc';
    onSort: (column: 'sender' | 'category' | 'count') => void;
}

export default function SenderTable({ senders, onAction, processing, sortColumn, sortDirection, onSort }: SenderTableProps) {
    const [selectedSender, setSelectedSender] = useState<{ name: string; ids: string[] } | null>(null);

    if (senders.length === 0) {
        return <div className="p-8 text-center text-gray-500 font-medium">No unread emails found!</div>;
    }

    const SortIcon = ({ column }: { column: 'sender' | 'category' | 'count' }) => {
        if (sortColumn !== column) return <span className="ml-1 text-gray-300">↕</span>;
        return <span className="ml-1 text-blue-500">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
    };

    // Get token for modal from local storage handy trick or pass it down?
    // Dashboard has it. Better to pass it down. 
    // Wait, I didn't update props to accept token. 
    // Let's just grab from localStorage for this quick feature or update props.
    // Dashboard passes token to Dashboard, but SenderTable is child. 
    // I'll grab from localStorage 'auth_token' for simplicity in this component.
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : '';

    return (
        <>
            <SenderDetailsModal
                isOpen={!!selectedSender}
                onClose={() => setSelectedSender(null)}
                sender={selectedSender?.name || ''}
                ids={selectedSender?.ids || []}
                token={token}
            />

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                                onClick={() => onSort('sender')}
                            >
                                Sender <SortIcon column="sender" />
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                                onClick={() => onSort('category')}
                            >
                                Category <SortIcon column="category" />
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                                onClick={() => onSort('count')}
                            >
                                Count <SortIcon column="count" />
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {senders.map((stat, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white group">
                                    <button
                                        onClick={() => setSelectedSender({ name: stat.sender, ids: stat.ids })}
                                        className="hover:text-blue-600 hover:underline flex items-center"
                                    >
                                        {stat.sender}
                                        <svg className="w-3 h-3 ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {stat.category && (
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                                            ${stat.category === 'Marketing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : ''}
                                            ${stat.category === 'Notifications' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : ''}
                                            ${stat.category === 'Newsletter' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                                            ${stat.category === 'Social' ? 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' : ''}
                                            ${['Personal', 'Unknown'].includes(stat.category || '') ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : ''}
                                        `}>
                                            {stat.category}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                                        {stat.count}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <div className="flex justify-end space-x-3">
                                        <button
                                            onClick={() => onAction('delete', stat.ids)}
                                            disabled={processing}
                                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 transition-colors"
                                            title="Delete All"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                        <button
                                            onClick={() => onAction('spam', stat.ids)}
                                            disabled={processing}
                                            className="text-orange-500 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 disabled:opacity-50 transition-colors"
                                            title="Mark as Spam"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                        </button>
                                        <button
                                            onClick={() => onAction('unsubscribe', stat.ids)}
                                            disabled={processing}
                                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 transition-colors"
                                            title="Unsubscribe (Attempt)"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" /></svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
