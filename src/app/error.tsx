'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#fffbf7] p-4">
            <div className="neo-card max-w-md w-full text-center">
                <div className="w-16 h-16 bg-[#ff6b6b] border-2 border-black rounded-full flex items-center justify-center mx-auto mb-4 shadow-neo">
                    <span className="text-2xl">💥</span>
                </div>
                <h2 className="text-2xl font-black mb-2">Something went wrong!</h2>
                <p className="text-gray-600 mb-6">
                    {error.message || 'An unexpected error occurred. Please try again.'}
                </p>
                <div className="flex gap-3 justify-center">
                    <button 
                        onClick={reset}
                        className="neo-btn-primary px-4 py-2"
                    >
                        Try Again
                    </button>
                    <button 
                        onClick={() => window.location.href = '/dashboard'}
                        className="neo-btn-secondary px-4 py-2"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
