"use client";

import Link from 'next/link';
import { Brain, Sparkles, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

export function Navbar() {
    const { data: session, status } = useSession();
    const isAuthenticated = status === 'authenticated';

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-neo-bg"
            style={{ borderBottom: '3px solid #1a1a1a' }}
        >
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="w-8 h-8 bg-neo-yellow flex items-center justify-center"
                        style={{ border: '2px solid #1a1a1a', boxShadow: '2px 2px 0px #1a1a1a' }}
                    >
                        <Brain className="w-4 h-4 text-neo-black" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-neo-black"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                        SmartStudy<span className="text-neo-purple">AI</span>
                    </span>
                </Link>

                <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-neo-black/70">
                    <a href="#features" className="hover:text-neo-black transition-colors uppercase tracking-wider text-xs">Features</a>
                    <a href="#how-it-works" className="hover:text-neo-black transition-colors uppercase tracking-wider text-xs">How it works</a>
                </div>

                <div className="flex items-center gap-3">
                    {isAuthenticated ? (
                        <>
                            <Link href="/dashboard"
                                className="flex items-center gap-2 text-sm font-bold text-neo-black/70 hover:text-neo-black transition-colors"
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                <span className="hidden sm:block">Dashboard</span>
                            </Link>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-neo-purple/10"
                                style={{ border: '2px solid #1a1a1a' }}
                            >
                                <User className="w-4 h-4 text-neo-purple" />
                                <span className="text-sm font-bold text-neo-black hidden sm:block truncate max-w-[100px]">
                                    {session?.user?.name || session?.user?.email?.split('@')[0] || 'User'}
                                </span>
                            </div>
                            <button
                                onClick={() => signOut({ callbackUrl: '/' })}
                                className="w-8 h-8 flex items-center justify-center hover:bg-neo-coral transition-colors"
                                style={{ border: '2px solid #1a1a1a' }}
                                title="Sign out"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/auth/login"
                                className="text-sm font-bold text-neo-black/70 hover:text-neo-black transition-colors hidden sm:block uppercase tracking-wider"
                            >
                                Sign In
                            </Link>
                            <Link href="/auth/signup" className="neo-btn neo-btn-yellow text-xs">
                                <Sparkles className="w-4 h-4" />
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
