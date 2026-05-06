"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Keyboard } from "lucide-react";

interface Shortcut {
    key: string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    action: () => void;
    description: string;
}

export function KeyboardShortcuts() {
    const [showHelp, setShowHelp] = useState(false);
    const router = useRouter();

    const shortcuts: Shortcut[] = [
        {
            key: "?",
            action: () => setShowHelp(true),
            description: "Show keyboard shortcuts",
        },
        {
            key: "d",
            action: () => router.push("/dashboard"),
            description: "Go to Dashboard",
        },
        {
            key: "f",
            action: () => router.push("/flashcards"),
            description: "Go to Flashcards",
        },
        {
            key: "q",
            action: () => router.push("/quiz"),
            description: "Go to Quiz",
        },
        {
            key: "n",
            ctrl: true,
            action: () => {
                const event = new CustomEvent("new-chat");
                window.dispatchEvent(event);
            },
            description: "New chat",
        },
        {
            key: "u",
            action: () => {
                const uploadBtn = document.getElementById("file-upload");
                uploadBtn?.click();
            },
            description: "Upload file",
        },
        {
            key: "Escape",
            action: () => setShowHelp(false),
            description: "Close modal/dialog",
        },
    ];

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger shortcuts when typing in inputs
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                if (e.key !== "Escape") return;
            }

            const shortcut = shortcuts.find(s => {
                const keyMatch = s.key.toLowerCase() === e.key.toLowerCase();
                const ctrlMatch = !!s.ctrl === (e.ctrlKey || e.metaKey);
                const altMatch = !!s.alt === e.altKey;
                const shiftMatch = !!s.shift === e.shiftKey;
                return keyMatch && ctrlMatch && altMatch && shiftMatch;
            });

            if (shortcut) {
                e.preventDefault();
                shortcut.action();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [router, shortcuts]);

    if (!showHelp) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neo-black/50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
        >
            <div className="neo-card max-w-lg w-full max-h-[80vh] overflow-auto">
                <div className="flex items-center justify-between p-6 border-b-[3px] border-neo-black">
                    <h2 id="shortcuts-title" className="text-xl font-bold flex items-center gap-2">
                        <Keyboard className="w-5 h-5" />
                        Keyboard Shortcuts
                    </h2>
                    <button
                        onClick={() => setShowHelp(false)}
                        className="neo-btn neo-btn-white p-2"
                        aria-label="Close shortcuts"
                    >
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>

                <div className="p-6">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-[2px] border-neo-black">
                                <th className="text-left py-2 font-bold">Shortcut</th>
                                <th className="text-left py-2 font-bold">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shortcuts.filter(s => s.key !== "Escape").map((shortcut, idx) => (
                                <tr key={idx} className="border-b border-neo-black/20">
                                    <td className="py-3">
                                        <kbd className="inline-flex items-center gap-1 px-2 py-1 bg-neo-bg-dark border-[2px] border-neo-black font-mono text-sm">
                                            {shortcut.ctrl && <span>Ctrl</span>}
                                            {shortcut.alt && <span>Alt</span>}
                                            {shortcut.shift && <span>Shift</span>}
                                            <span>{shortcut.key}</span>
                                        </kbd>
                                    </td>
                                    <td className="py-3 text-neo-black/80">{shortcut.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-neo-bg-dark border-t-[3px] border-neo-black text-center text-sm text-neo-black/60">
                    Press <kbd className="px-1 border border-neo-black">?</kbd> anytime to show this dialog
                </div>
            </div>
        </div>
    );
}
