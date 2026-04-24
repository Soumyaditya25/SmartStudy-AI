"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Plus, MessageSquare, BookOpen, Brain } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [creatingSession, setCreatingSession] = useState(false);

    const links = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ];

    const handleNewChat = async () => {
        setCreatingSession(true);
        try {
            const res = await fetch("/api/sessions", { method: "POST" });
            if (res.ok) {
                const data = await res.json();
                router.push(`/study/${data.session.id}`);
            }
        } catch (err) {
            console.error("Failed to create session:", err);
        } finally {
            setCreatingSession(false);
        }
    };

    const handleSignOut = () => {
        signOut({ callbackUrl: "/" });
    };

    return (
        <aside className="fixed top-0 left-0 h-screen w-64 bg-neo-bg flex flex-col z-40"
            style={{ borderRight: '3px solid #1a1a1a' }}
        >
            {/* Logo */}
            <div className="h-16 flex items-center px-5" style={{ borderBottom: '3px solid #1a1a1a' }}>
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
            </div>

            {/* New Chat Button */}
            <div className="px-4 pt-4 pb-2">
                <button
                    onClick={handleNewChat}
                    disabled={creatingSession}
                    className="neo-btn neo-btn-purple w-full text-xs disabled:opacity-50"
                >
                    <Plus className="w-4 h-4" />
                    {creatingSession ? "Creating..." : "New Chat"}
                </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-3 px-3 space-y-1">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-3 font-semibold text-sm transition-all ${isActive
                                ? "bg-neo-yellow text-neo-black"
                                : "text-neo-black/70 hover:bg-neo-bg-dark hover:text-neo-black"
                                }`}
                            style={{
                                border: isActive ? '2px solid #1a1a1a' : '2px solid transparent',
                                boxShadow: isActive ? '3px 3px 0px #1a1a1a' : 'none',
                            }}
                        >
                            <Icon className="w-5 h-5" />
                            {link.name}
                        </Link>
                    );
                })}
            </div>

            {/* Sign Out */}
            <div className="p-4" style={{ borderTop: '3px solid #1a1a1a' }}>
                <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 px-4 py-3 font-semibold text-sm text-neo-black/70 hover:bg-neo-coral hover:text-neo-black transition-all"
                    style={{ border: '2px solid transparent' }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.border = '2px solid #1a1a1a';
                        (e.currentTarget as HTMLElement).style.boxShadow = '3px 3px 0px #1a1a1a';
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.border = '2px solid transparent';
                        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    }}
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
