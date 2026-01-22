import React, { useState } from 'react';
import { SenderStat } from '../lib/api';
import SenderTable from './SenderTable';

interface CategoryTableProps {
    senders: SenderStat[];
    onAction: (action: 'delete' | 'spam' | 'unsubscribe', ids: string[]) => void;
    processing: boolean;
}

export default function CategoryTable({ senders, onAction, processing }: CategoryTableProps) {
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    // Group by category
    const grouped = senders.reduce((acc, curr) => {
        const cat = curr.category || 'Unknown';
        if (!acc[cat]) {
            acc[cat] = {
                category: cat,
                count: 0,
                senders: []
            };
        }
        acc[cat].count += curr.count;
        acc[cat].senders.push(curr);
        return acc;
    }, {} as Record<string, { category: string, count: number, senders: SenderStat[] }>);

    const categories = Object.values(grouped).sort((a, b) => b.count - a.count);

    return (
        <div className="space-y-4">
            {categories.map((group) => (
                <div key={group.category} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <button
                        onClick={() => setExpandedCategory(expandedCategory === group.category ? null : group.category)}
                        className={`w-full flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${expandedCategory === group.category ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}
                    >
                        <div className="flex items-center space-x-3">
                            <span className={`transform transition-transform ${expandedCategory === group.category ? 'rotate-90' : ''}`}>
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </span>
                            <span className="font-semibold text-lg text-gray-800 dark:text-white">{group.category}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">({group.senders.length} senders)</span>
                        </div>
                        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-blue-900 dark:text-blue-200">
                            {group.count} emails
                        </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const ids = group.senders.flatMap(s => s.ids);
                                onAction('delete', ids);
                            }}
                            className="ml-4 px-3 py-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 text-sm font-medium transition-colors"
                        >
                            Delete All
                        </button>
                    </button>

                    {expandedCategory === group.category && (
                        <div className="p-4 bg-white dark:bg-gray-800">
                            <SenderTable
                                senders={group.senders.sort((a, b) => b.count - a.count)}
                                onAction={onAction}
                                processing={processing}
                                sortColumn="count"
                                sortDirection="desc"
                                onSort={() => { }} // No sorting inside category for now
                            />
                        </div>
                    )}
                </div>
            ))}

            {categories.length === 0 && (
                <div className="text-center py-8 text-gray-500">No categories found.</div>
            )}
        </div>
    );
}
