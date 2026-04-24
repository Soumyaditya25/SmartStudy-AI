"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Brain, Eye, EyeOff, ArrowRight, Loader2, CheckCircle } from "lucide-react";

export default function SignupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                setIsSuccess(true);
                setTimeout(() => {
                    router.push("/auth/login");
                }, 2000);
            } else {
                setError(data.error || "Failed to create account");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-neo-bg flex items-center justify-center p-4"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
                <div className="absolute inset-0 neo-grid pointer-events-none" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 text-center"
                >
                    <div className="w-20 h-20 bg-neo-green flex items-center justify-center mx-auto mb-6"
                        style={{ border: '3px solid #1a1a1a', boxShadow: '6px 6px 0px #1a1a1a' }}
                    >
                        <CheckCircle className="w-10 h-10 text-neo-black" />
                    </div>
                    <h1 className="text-3xl font-extrabold mb-2">Account Created!</h1>
                    <p className="text-neo-black/60 font-medium mb-6">
                        Redirecting you to login...
                    </p>
                    <Link href="/auth/login" className="neo-btn neo-btn-purple text-sm">
                        Go to Login
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
                        <div className="w-12 h-12 bg-neo-yellow flex items-center justify-center"
                            style={{ border: '3px solid #1a1a1a', boxShadow: '4px 4px 0px #1a1a1a' }}
                        >
                            <Brain className="w-6 h-6 text-neo-black" />
                        </div>
                    </Link>
                    <h1 className="text-3xl font-extrabold tracking-tight mb-1">
                        Create Account
                    </h1>
                    <p className="text-neo-black/50 font-medium">
                        Start your smart study journey today
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-neo-bg p-8"
                    style={{ border: '3px solid #1a1a1a', boxShadow: '8px 8px 0px #1a1a1a' }}
                >
                    {error && (
                        <div className="mb-6 p-3 bg-neo-coral text-neo-black text-sm font-bold"
                            style={{ border: '2px solid #1a1a1a', boxShadow: '3px 3px 0px #1a1a1a' }}
                        >
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-2"
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                placeholder="John Doe"
                                className="neo-input"
                                style={{ boxShadow: '3px 3px 0px #1a1a1a' }}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-2"
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@example.com"
                                className="neo-input"
                                style={{ boxShadow: '3px 3px 0px #1a1a1a' }}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-2"
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    placeholder="Min 8 characters"
                                    className="neo-input pr-12"
                                    style={{ boxShadow: '3px 3px 0px #1a1a1a' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neo-black/40 hover:text-neo-black"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-2"
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="Re-enter your password"
                                className="neo-input"
                                style={{ boxShadow: '3px 3px 0px #1a1a1a' }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="neo-btn neo-btn-yellow w-full text-sm mt-2 disabled:opacity-50"
                            style={{ boxShadow: '4px 4px 0px #1a1a1a' }}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    Sign Up Free
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 text-center"
                        style={{ borderTop: '2px solid #1a1a1a' }}
                    >
                        <p className="text-sm text-neo-black/60 font-medium">
                            Already have an account?{" "}
                            <Link href="/auth/login" className="font-bold text-neo-purple underline decoration-2 underline-offset-2 hover:text-neo-black">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Back to home */}
                <div className="text-center mt-6">
                    <Link href="/" className="text-xs font-bold text-neo-black/40 uppercase tracking-wider hover:text-neo-black">
                        ← Back to home
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
