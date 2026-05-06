"use client";

import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, Search, Plus, Trash2, MessageSquare, Clock, CheckCircle, AlertTriangle, Loader2, X, Layers, Trophy } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Document {
    id: string;
    name: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    chunkCount: number;
}

export default function DashboardPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // Fetch documents
    const fetchDocuments = useCallback(async () => {
        try {
            const res = await fetch("/api/files");
            if (res.ok) {
                const data = await res.json();
                setDocuments(data.documents);
            }
        } catch (err) {
            console.error("Failed to fetch documents:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    // Upload file
    const handleUpload = async (file: File) => {
        setIsUploading(true);
        setUploadProgress(`Uploading "${file.name}"...`);

        const formData = new FormData();
        formData.append("file", file);

        try {
            setUploadProgress("Processing and generating embeddings...");
            const res = await fetch("/api/files/upload", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setUploadProgress(`"${file.name}" processed successfully!`);
                await fetchDocuments();
                router.refresh(); // Invalidate server component cache
                setTimeout(() => setUploadProgress(""), 3000);
            } else {
                const err = await res.json();
                setUploadProgress(`Error: ${err.error}`);
                setTimeout(() => setUploadProgress(""), 5000);
            }
        } catch (err) {
            setUploadProgress("Upload failed. Please try again.");
            setTimeout(() => setUploadProgress(""), 5000);
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleUpload(file);
    };

    // Delete document
    const handleDelete = async (docId: string, docName: string) => {
        if (!confirm(`Delete "${docName}"? This will remove the document and all associated data.`)) return;

        setDeletingId(docId);
        try {
            const res = await fetch(`/api/files/${docId}`, { method: "DELETE" });
            if (res.ok) {
                setDocuments(docs => docs.filter(d => d.id !== docId));
            }
        } catch (err) {
            console.error("Failed to delete document:", err);
        } finally {
            setDeletingId(null);
        }
    };

    // Create new study session
    const handleNewChat = async () => {
        try {
            const res = await fetch("/api/sessions", { method: "POST" });
            if (res.ok) {
                const data = await res.json();
                router.push(`/study/${data.session.id}`);
            }
        } catch (err) {
            console.error("Failed to create session:", err);
        }
    };

    // Open document in study mode
    const handleStudyDoc = async (docId: string) => {
        try {
            const res = await fetch("/api/sessions", { method: "POST" });
            if (res.ok) {
                const data = await res.json();
                router.push(`/study/${data.session.id}?doc=${docId}`);
            }
        } catch (err) {
            console.error("Failed:", err);
        }
    };

    // Filter documents
    const filtered = documents.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHrs = Math.floor(diffMins / 60);
        if (diffHrs < 24) return `${diffHrs}h ago`;
        const diffDays = Math.floor(diffHrs / 24);
        return `${diffDays}d ago`;
    };

    const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
        ready: { icon: <CheckCircle className="w-3.5 h-3.5" />, color: "bg-neo-green", label: "Ready" },
        processing: { icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, color: "bg-neo-yellow", label: "Processing" },
        failed: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "bg-neo-coral", label: "Failed" },
    };

    return (
        <div className="pt-24 p-6 md:p-8 max-w-6xl mx-auto min-h-screen flex flex-col"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
            {/* Header */}
            <header className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold mb-1 tracking-tight">Dashboard</h1>
                    <p className="text-neo-black/50 font-medium">Upload documents and start studying.</p>
                </div>
                <div className="flex gap-3 flex-wrap sm:flex-nowrap">
                    <Link 
                        href="/quiz" 
                        className="inline-flex items-center gap-2 px-4 py-2 bg-neo-coral text-neo-black font-bold text-xs uppercase tracking-wider border-[3px] border-neo-black shadow-[3px_3px_0px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_#1a1a1a] transition-all whitespace-nowrap"
                    >
                        <Trophy className="w-4 h-4" />
                        Quiz
                    </Link>
                    <Link 
                        href="/flashcards" 
                        className="inline-flex items-center gap-2 px-4 py-2 bg-neo-yellow text-neo-black font-bold text-xs uppercase tracking-wider border-[3px] border-neo-black shadow-[3px_3px_0px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_#1a1a1a] transition-all whitespace-nowrap"
                    >
                        <Layers className="w-4 h-4" />
                        Flashcards
                    </Link>
                    <button 
                        onClick={handleNewChat} 
                        className="inline-flex items-center gap-2 px-4 py-2 bg-neo-purple text-white font-bold text-xs uppercase tracking-wider border-[3px] border-neo-black shadow-[3px_3px_0px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_#1a1a1a] transition-all whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        New Chat
                    </button>
                </div>
            </header>

            {/* Upload Zone */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative mb-10"
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                />
                <div
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`cursor-pointer p-8 md:p-12 text-center transition-all ${isDragging ? 'bg-neo-yellow' : 'bg-neo-bg-dark hover:bg-neo-yellow/30'}`}
                    style={{
                        border: isDragging ? '4px dashed #1a1a1a' : '3px dashed #1a1a1a',
                        boxShadow: isDragging ? '6px 6px 0px #1a1a1a' : '4px 4px 0px #1a1a1a',
                    }}
                >
                    {isUploading ? (
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-10 h-10 animate-spin text-neo-purple" />
                            <p className="font-bold text-sm">{uploadProgress}</p>
                        </div>
                    ) : uploadProgress ? (
                        <div className="flex flex-col items-center gap-3">
                            <CheckCircle className="w-10 h-10 text-neo-green" />
                            <p className="font-bold text-sm">{uploadProgress}</p>
                        </div>
                    ) : (
                        <>
                            <div className="w-16 h-16 bg-neo-purple flex items-center justify-center mx-auto mb-4"
                                style={{ border: '3px solid #1a1a1a', boxShadow: '3px 3px 0px #1a1a1a' }}
                            >
                                <UploadCloud className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-extrabold mb-2">Upload your notes</h3>
                            <p className="text-neo-black/50 mb-4 font-medium text-sm">
                                Drag &amp; drop your PDFs or text files here, or click to browse.
                            </p>
                            <span className="neo-badge neo-badge-blue text-[10px]">
                                PDF &bull; TXT &bull; Max 20MB
                            </span>
                        </>
                    )}
                </div>
            </motion.div>

            {/* Documents Section */}
            <div className="flex-1">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <h2 className="text-xl font-extrabold">
                        My Documents
                        {documents.length > 0 && (
                            <span className="ml-2 neo-badge neo-badge-yellow text-[10px]">{documents.length}</span>
                        )}
                    </h2>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neo-black/40" />
                        <input
                            type="text"
                            placeholder="Search documents..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="neo-input pl-10 py-2 text-sm"
                            style={{ boxShadow: '2px 2px 0px #1a1a1a' }}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-neo-purple" />
                        <p className="font-bold text-neo-black/50">Loading documents...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 bg-neo-bg-dark" style={{ border: '3px solid #1a1a1a', boxShadow: '4px 4px 0px #1a1a1a' }}>
                        <FileText className="w-12 h-12 mx-auto mb-3 text-neo-black/20" />
                        <p className="font-bold text-neo-black/40 text-lg">
                            {searchQuery ? "No documents match your search" : "No documents yet"}
                        </p>
                        <p className="text-neo-black/30 text-sm mt-1 font-medium">
                            {searchQuery ? "Try a different search term" : "Upload your first PDF to get started!"}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <AnimatePresence>
                            {filtered.map((doc, i) => {
                                const status = statusConfig[doc.status] || statusConfig.processing;
                                return (
                                    <motion.div
                                        key={doc.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="neo-card p-5 flex flex-col group"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-10 h-10 bg-neo-blue flex items-center justify-center"
                                                style={{ border: '2px solid #1a1a1a', boxShadow: '2px 2px 0px #1a1a1a' }}
                                            >
                                                <FileText className="w-5 h-5 text-neo-black" />
                                            </div>
                                            <div className={`neo-badge ${status.color} text-[10px]`}>
                                                {status.icon}
                                                {status.label}
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-sm truncate mb-1" title={doc.name}>
                                            {doc.name}
                                        </h3>
                                        <div className="text-xs text-neo-black/40 font-mono mb-4">
                                            {doc.chunkCount} chunks &bull; {formatDate(doc.createdAt)}
                                        </div>
                                        <div className="mt-auto flex items-center gap-2 pt-3" style={{ borderTop: '2px solid #1a1a1a' }}>
                                            {doc.status === 'ready' && (
                                                <button
                                                    onClick={() => handleStudyDoc(doc.id)}
                                                    className="neo-btn neo-btn-yellow text-[10px] py-1.5 px-3 flex-1"
                                                    style={{ boxShadow: '2px 2px 0px #1a1a1a' }}
                                                >
                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                    Study
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(doc.id, doc.name)}
                                                disabled={deletingId === doc.id}
                                                className="neo-btn neo-btn-coral text-[10px] py-1.5 px-3 disabled:opacity-50"
                                                style={{ boxShadow: '2px 2px 0px #1a1a1a' }}
                                            >
                                                {deletingId === doc.id ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
