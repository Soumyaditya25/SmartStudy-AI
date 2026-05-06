"use client";

import { useState } from "react";
import { Download, FileJson, FileText, FileCode } from "lucide-react";

interface ExportData {
    sessionId?: string;
    title?: string;
    turns?: any[];
    flashcards?: any[];
    quizResults?: any[];
    type: "session" | "flashcards" | "quiz" | "all";
}

interface ExportButtonProps {
    data: ExportData;
    className?: string;
}

export function ExportButton({ data, className = "" }: ExportButtonProps) {
    const [showMenu, setShowMenu] = useState(false);

    const downloadFile = (content: string, filename: string, type: string) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const exportAsJSON = () => {
        const content = JSON.stringify(data, null, 2);
        const filename = `smartstudy-${data.type}-${Date.now()}.json`;
        downloadFile(content, filename, "application/json");
        setShowMenu(false);
    };

    const exportAsMarkdown = () => {
        let content = `# SmartStudy Export\n\n`;
        content += `**Type:** ${data.type}\n`;
        content += `**Exported:** ${new Date().toLocaleString()}\n\n`;
        content += `---\n\n`;

        if (data.type === "session" && data.turns) {
            content += `# ${data.title || "Study Session"}\n\n`;
            data.turns.forEach((turn, idx) => {
                if (turn.role === "user") {
                    content += `## Question ${Math.floor(idx / 2) + 1}\n\n${turn.content}\n\n`;
                } else {
                    content += `### Answer\n\n${turn.content}\n\n`;
                }
            });
        }

        if (data.type === "flashcards" && data.flashcards) {
            content += `# Flashcards\n\n`;
            data.flashcards.forEach((card, idx) => {
                content += `## Card ${idx + 1}\n\n`;
                content += `**Question:** ${card.question}\n\n`;
                content += `**Answer:** ${card.answer}\n\n`;
                content += `**Difficulty:** ${card.difficulty}\n\n`;
                content += `---\n\n`;
            });
        }

        if (data.type === "quiz" && data.quizResults) {
            content += `# Quiz Results\n\n`;
            content += `**Score:** ${data.quizResults.filter((r: any) => r.isCorrect).length}/${data.quizResults.length}\n\n`;
            data.quizResults.forEach((result: any, idx: number) => {
                content += `## Question ${idx + 1}\n\n`;
                content += `**Your Answer:** ${result.userAnswer}\n\n`;
                content += `**Correct Answer:** ${result.correctAnswer}\n\n`;
                content += `**Result:** ${result.isCorrect ? "✅ Correct" : "❌ Incorrect"}\n\n`;
                content += `**Time:** ${result.timeSpent}s\n\n`;
                content += `---\n\n`;
            });
        }

        const filename = `smartstudy-${data.type}-${Date.now()}.md`;
        downloadFile(content, filename, "text/markdown");
        setShowMenu(false);
    };

    const exportAsText = () => {
        let content = `SmartStudy Export - ${data.type.toUpperCase()}\n`;
        content += `Exported: ${new Date().toLocaleString()}\n`;
        content += `${"=".repeat(50)}\n\n`;

        if (data.type === "session" && data.turns) {
            content += `${data.title || "Study Session"}\n\n`;
            data.turns.forEach((turn) => {
                const label = turn.role === "user" ? "Q:" : "A:";
                content += `${label} ${turn.content}\n\n`;
            });
        }

        if (data.type === "flashcards" && data.flashcards) {
            data.flashcards.forEach((card, idx) => {
                content += `Card ${idx + 1}\n`;
                content += `Q: ${card.question}\n`;
                content += `A: ${card.answer}\n`;
                content += `Difficulty: ${card.difficulty}\n\n`;
            });
        }

        const filename = `smartstudy-${data.type}-${Date.now()}.txt`;
        downloadFile(content, filename, "text/plain");
        setShowMenu(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className={`neo-btn neo-btn-white text-xs ${className}`}
                aria-label="Export data"
                aria-expanded={showMenu}
            >
                <Download className="w-4 h-4" />
                Export
            </button>

            {showMenu && (
                <>
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowMenu(false)}
                    />
                    <div 
                        className="absolute right-0 mt-2 w-48 neo-card z-50 p-2"
                        role="menu"
                    >
                        <button
                            onClick={exportAsJSON}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-neo-bg-dark transition-colors text-left"
                            role="menuitem"
                        >
                            <FileJson className="w-4 h-4 text-neo-blue" />
                            Export as JSON
                        </button>
                        <button
                            onClick={exportAsMarkdown}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-neo-bg-dark transition-colors text-left"
                            role="menuitem"
                        >
                            <FileCode className="w-4 h-4 text-neo-purple" />
                            Export as Markdown
                        </button>
                        <button
                            onClick={exportAsText}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-neo-bg-dark transition-colors text-left"
                            role="menuitem"
                        >
                            <FileText className="w-4 h-4 text-neo-black" />
                            Export as Text
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
