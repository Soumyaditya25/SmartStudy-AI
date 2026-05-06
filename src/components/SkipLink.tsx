"use client";

import Link from "next/link";

export function SkipLink() {
    return (
        <Link
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[100] neo-btn neo-btn-purple"
        >
            Skip to main content
        </Link>
    );
}
