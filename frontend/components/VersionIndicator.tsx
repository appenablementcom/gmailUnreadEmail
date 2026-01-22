'use client';

import { useState } from 'react';
import { changelog, CURRENT_VERSION } from '../lib/changelog';

export default function VersionIndicator() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Hovering Indicator */}
            <div
                className="fixed bottom-4 left-4 z-40 bg-gray-900/80 dark:bg-gray-800/80 backdrop-blur text-white px-3 py-1.5 rounded-full text-xs font-mono cursor-pointer hover:bg-blue-600 transition-colors shadow-lg border border-white/10"
                onClick={() => setIsOpen(true)}
                title="Click to view release notes"
            >
                {CURRENT_VERSION}
            </div>

            {/* Changelog Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
                    <div
                        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                Changelog
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="overflow-y-auto p-0">
                            {changelog.map((release, index) => (
                                <div key={release.version} className={`p-5 ${index !== changelog.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}>
                                    <div className="flex justify-between items-baseline mb-3">
                                        <span className={`font-mono text-sm font-bold px-2 py-0.5 rounded ${index === 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                                            {release.version}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {release.date}
                                        </span>
                                    </div>
                                    <ul className="space-y-2">
                                        {release.changes.map((change, i) => (
                                            <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                                                <span className="mr-2 text-blue-500 mt-1.5">•</span>
                                                <span className="leading-relaxed">{change}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 text-xs text-center text-gray-500">
                            DeployTeam Cleanup Your Inbox &copy; 2026
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
