import { useEffect, useState, useRef } from 'react';
import { getStats, getSenderStats, deleteAll, markAsSpam, unsubscribe, Stats, SenderStat } from '../lib/api';
import StatsCard from './StatsCard';
import SenderTable from './SenderTable';
import CategoryTable from './CategoryTable';
import HistoryTab from './HistoryTab';
import { CURRENT_VERSION } from '../lib/changelog';
import { useToast } from './ToastProvider';
import ConfirmModal from './ConfirmModal';

// Helper to merge new stats into existing list
function mergeSenderStats(existing: SenderStat[], incoming: SenderStat[]): SenderStat[] {
    const map = new Map<string, SenderStat>();

    // Index existing
    existing.forEach(s => map.set(s.sender, { ...s }));

    // Merge incoming
    incoming.forEach(s => {
        if (map.has(s.sender)) {
            const current = map.get(s.sender)!;
            current.count += s.count;
            // Merge IDs unique
            const idSet = new Set([...current.ids, ...s.ids]);
            current.ids = Array.from(idSet);
        } else {
            map.set(s.sender, s);
        }
    });

    return Array.from(map.values());
}

export default function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
    const { showToast, success, error } = useToast();
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        action: () => Promise<void>;
        isDestructive: boolean;
    }>({
        isOpen: false,
        title: '',
        message: '',
        action: async () => { },
        isDestructive: false
    });

    const [stats, setStats] = useState<Stats | null>(null);
    const [lifetimeStats, setLifetimeStats] = useState<{ deleted: number } | null>(null);
    const [senders, setSenders] = useState<SenderStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [scannedCount, setScannedCount] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [stopScan, setStopScan] = useState(false); // This state is declared but the ref is used for actual stopping logic.

    // UI State
    const [activeTab, setActiveTab] = useState<'senders' | 'categories' | 'history'>('senders');

    // Filter & Sort State
    const [minCount, setMinCount] = useState(1);
    const [sortColumn, setSortColumn] = useState<'sender' | 'category' | 'count'>('count');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [scanLimit, setScanLimit] = useState(500);

    // Use a Ref for stop signal to work inside async loop
    const stopSignalRef = useRef(false);



    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Load from cache on mount
    useEffect(() => {
        const cached = localStorage.getItem('gmail-cleanup-cache');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                // Validate expiry (e.g. 24h) or just keep? User wants history. Let's keep until explicit refresh.
                if (parsed.senders && parsed.senders.length > 0) {
                    setSenders(parsed.senders);
                    setLastUpdated(new Date(parsed.timestamp));
                    // Adjust scanned count check to be approximate or just hide if cached
                    setScannedCount(parsed.scannedCount || 0);
                }
            } catch (e) {
                console.error("Failed to load cache", e);
            }
        }
        fetchLifetimeStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Save to cache when senders or isScanning changes
    useEffect(() => {
        if (!isScanning && senders.length > 0) {
            try {
                const cacheData = {
                    senders,
                    timestamp: new Date().getTime(),
                    scannedCount
                };
                localStorage.setItem('gmail-cleanup-cache', JSON.stringify(cacheData));
                setLastUpdated(new Date());
            } catch (e) {
                console.warn("Cache quota exceeded probably", e);
            }
        }
    }, [senders, isScanning, scannedCount]);

    const startScan = async () => {
        // If we have data and user clicks Scan, we treat it as a "Refresh" - clear cache
        localStorage.removeItem('gmail-cleanup-cache');
        setLastUpdated(null);

        stopSignalRef.current = false;
        setIsScanning(true);
        setLoading(true); // Keep loading true for initial spinner
        setScannedCount(0);
        setSenders([]);

        try {
            const globalStats = await getStats(token);
            setStats(globalStats);

            // ... rest of function ...

            let pageToken: string | undefined = undefined;
            // ... (rest is same, but I need to make sure I don't cut off)
            // Wait, I cannot use "rest of function" comment in replacement.
            // I need to provide the full content or carefully match blocks.
            // Since this is inserting logic at the top of startScan, I'll match the start.

            let totalFetched = 0;
            let currentSenders: SenderStat[] = [];

            const batchSize = 500;
            const target = scanLimit === -1 ? Number.MAX_SAFE_INTEGER : scanLimit;

            // Loop
            while (totalFetched < target) {
                if (stopSignalRef.current) break;

                const res = await getSenderStats(token, batchSize, pageToken);

                currentSenders = mergeSenderStats(currentSenders, res.stats);
                setSenders([...currentSenders]);

                // Count emails found in this batch (approx) or just add 500?
                // Better to add 500 to "scanned depth" indicator
                setScannedCount(c => c + batchSize);
                totalFetched += batchSize;

                pageToken = res.nextPageToken;
                await new Promise(r => setTimeout(r, 50)); // Breath

                if (!pageToken) break;
            }
        } catch (e) {
            console.error(e);
            if ((e as Error).message.includes('401')) onLogout();
        } finally {
            setIsScanning(false);
            setLoading(false); // Set loading false after scan completes
        }
    };

    const fetchLifetimeStats = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/history`);
            if (res.ok) {
                const data = await res.json();
                setLifetimeStats(data.stats);
            }
        } catch (e) {
            console.error("Failed to fetch lifetime stats", e);
        }
    };

    const handleStop = () => {
        stopSignalRef.current = true;
    };

    // Auto-start scan only if NO cache and NO data
    useEffect(() => {
        // Only auto-scan if we have absolutely nothing and it's the very first load check?
        // Actually, if we have cache, we loaded it in the first useEffect. 
        // So senders.length might be > 0 by the time this runs if localstorage is fast?
        // Safer: only check if we didn't load cache.
        // Let's rely on the user to click Scan if cache is empty to be safe? 
        // Or check if cache key exists before starting?
        const hasCache = !!localStorage.getItem('gmail-cleanup-cache');
        if (!hasCache && scanLimit === 500) {
            startScan();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]); // Only on mount/token change, removed scanLimit dependency to prevent loops

    // Handle Sort
    const handleSort = (column: 'sender' | 'category' | 'count') => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection(column === 'count' ? 'desc' : 'asc');
        }
    };

    // Process the senders: Filter -> Sort
    const filteredSenders = senders
        .filter(s => s.count >= minCount)
        .sort((a, b) => {
            let diff = 0;
            if (sortColumn === 'count') {
                diff = a.count - b.count;
            } else if (sortColumn === 'category') {
                diff = (a.category || '').localeCompare(b.category || '');
            } else {
                diff = a.sender.localeCompare(b.sender);
            }
            return sortDirection === 'asc' ? diff : -diff;
        });

    // Reset pagination when data changes
    useEffect(() => {
        // If there was page state it would be reset here.
        // setPage(1); 
    }, [senders, minCount, sortColumn, sortDirection]);

    const executeAction = async (actionFn: () => Promise<void>, successMsg: string) => {
        setProcessing(true);
        try {
            await actionFn();
            success(successMsg);
        } catch (e) {
            error(`Action failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
        } finally {
            setProcessing(false);
            setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
    };

    const handleAction = (action: 'delete' | 'spam' | 'unsubscribe', ids: string[]) => {
        const title = action === 'delete' ? 'Delete Emails' :
            action === 'spam' ? 'Mark as Spam' : 'Unsubscribe';

        const message = `Are you sure you want to ${action} ${ids.length} emails? This action cannot be undone.`;

        setConfirmState({
            isOpen: true,
            title,
            message,
            isDestructive: action === 'delete' || action === 'spam',
            action: async () => {
                if (action === 'delete') {
                    // Calculate breakdown
                    const affectedIds = new Set(ids);
                    const breakdown: Record<string, number> = {};
                    senders.forEach(s => {
                        const intersection = s.ids.filter(id => affectedIds.has(id)).length;
                        if (intersection > 0) breakdown[s.sender] = intersection;
                    });
                    await deleteAll(ids, token, breakdown);

                    // Client-side state update for speed
                    setSenders(prev => prev.map(s => ({
                        ...s,
                        ids: s.ids.filter(id => !affectedIds.has(id)),
                        count: s.ids.filter(id => !affectedIds.has(id)).length
                    })).filter(s => s.count > 0));
                }
                if (action === 'spam') await markAsSpam(ids, token);
                if (action === 'unsubscribe') await unsubscribe(ids, token);
            }
        });
    };

    const handleExport = () => {
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Sender,Category,Count\n"
            + filteredSenders.map(e => `"${e.sender}","${e.category || ''}",${e.count}`).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "email_stats.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading && !stats && !isScanning) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    // Stats Calculation
    const totalEmailsInList = senders.reduce((acc, curr) => acc + curr.count, 0);
    const totalInbox = stats?.messagesUnread || 0;
    const coveragePercent = totalInbox > 0 ? Math.min(100, Math.round((totalEmailsInList / totalInbox) * 100)) : 0;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold dark:text-white">Dashboard</h2>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Scan Depth:</label>
                        <select
                            value={scanLimit}
                            onChange={(e) => setScanLimit(Number(e.target.value))}
                            className="text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            disabled={isScanning}
                        >
                            <option value={500}>500 (Fast)</option>
                            <option value={1000}>1,000</option>
                            <option value={2000}>2,000</option>
                            <option value={5000}>5,000</option>
                            <option value={10000}>10,000</option>
                            <option value={-1}>Unlimited</option>
                        </select>
                    </div>
                    {isScanning ? (
                        <button
                            onClick={handleStop}
                            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            <span className="font-medium">Stop Scan</span>
                        </button>
                    ) : (
                        <div className="flex items-center space-x-3">
                            {lastUpdated && (
                                <span className="text-xs text-gray-400">
                                    Last Check: {lastUpdated.toLocaleTimeString()}
                                </span>
                            )}
                            <button
                                onClick={startScan}
                                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title={lastUpdated ? "Refresh Data" : "Start Scan"}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                <span className="text-sm font-medium">{lastUpdated ? 'Refresh' : 'Scan'}</span>
                            </button>
                        </div>
                    )}

                    <button onClick={onLogout} className="text-sm text-red-500 hover:underline">Logout</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard title="Unread Messages" value={totalInbox} />
                <StatsCard title="Unread Threads" value={stats?.threadsUnread || 0} />
                <StatsCard title="Lifetime Cleaned" value={lifetimeStats?.deleted || 0} />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-4">
                {/* Progress / Stats Bar */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 flex flex-wrap justify-between items-center text-sm gap-2">
                    <div className="flex items-center space-x-4">
                        <div className="text-blue-800 dark:text-blue-200">
                            {isScanning ? (
                                <span className="flex items-center space-x-2">
                                    <span className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></span>
                                    <span>Scanning... Checked {scannedCount} emails</span>
                                </span>
                            ) : (
                                <span>Found <strong>{senders.length}</strong> senders from <strong>{totalEmailsInList}</strong> emails.</span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-gray-500 dark:text-gray-400">
                            Coverage: {coveragePercent}%
                        </div>
                        <button
                            onClick={handleExport}
                            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            <span>Export CSV</span>
                        </button>
                    </div>
                </div>

                {/* Tables with Tabs */}
                <div>
                    <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('senders')}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'senders'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                By Sender
                            </button>
                            <button
                                onClick={() => setActiveTab('categories')}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'categories'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                By Category
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'history'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                History
                            </button>

                        </nav>
                    </div>

                    {activeTab !== 'history' && (
                        /* Controls Row (Min Count) */
                        <div className="flex justify-end mb-4">
                            <div className="flex items-center space-x-2 text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Min Count: {minCount}</span>
                                <input
                                    type="range"
                                    min="1"
                                    max="20"
                                    value={minCount}
                                    onChange={(e) => setMinCount(Number(e.target.value))}
                                    className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'senders' && (
                        <SenderTable
                            senders={filteredSenders}
                            onAction={handleAction}
                            processing={processing}
                            sortColumn={sortColumn}
                            sortDirection={sortDirection}
                            onSort={handleSort}
                        />
                    )}

                    {activeTab === 'categories' && (
                        <CategoryTable
                            senders={filteredSenders}
                            onAction={handleAction}
                            processing={processing}
                        />
                    )}

                    {activeTab === 'history' && <HistoryTab />}
                </div>
            </div>
            <div className="text-center text-xs text-gray-500 pb-4">
                Version {CURRENT_VERSION}
            </div>
            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                isDestructive={confirmState.isDestructive}
                onConfirm={() => executeAction(confirmState.action, 'Action completed successfully')}
                onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
