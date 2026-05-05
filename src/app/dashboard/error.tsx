'use client';

import { useEffect } from 'react';

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Dashboard error:', error);
    }, [error]);

    return (
        <div className="flex items-center justify-center h-full p-4">
            <div className="neo-card max-w-md w-full text-center">
                <div className="w-16 h-16 bg-[#ff6b6b] border-2 border-black rounded-full flex items-center justify-center mx-auto mb-4 shadow-neo">
                    <span className="text-2xl">📁</span>
                </div>
                <h2 className="text-xl font-black mb-2">Dashboard Error</h2>
                <p className="text-gray-600 mb-6">
                    {error.message || 'Failed to load dashboard. Please try again.'}
                </p>
                <div className="flex gap-3 justify-center">
                    <button 
                        onClick={reset}
                        className="neo-btn-primary px-4 py-2"
                    >
                        Retry
                    </button>
                    <button 
                        onClick={() => window.location.reload()}
                        className="neo-btn-secondary px-4 py-2"
                    >
                        Refresh Page
                    </button>
                </div>
            </div>
        </div>
    );
}
