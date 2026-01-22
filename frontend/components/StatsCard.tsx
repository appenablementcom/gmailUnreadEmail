export default function StatsCard({ title, value, loading }: { title: string; value: number | string; loading?: boolean }) {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {title}
            </h3>
            <div className="mt-2 flex items-baseline">
                {loading ? (
                    <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                ) : (
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        {value}
                    </span>
                )}
            </div>
        </div>
    );
}
