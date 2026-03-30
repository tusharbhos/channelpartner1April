// app/login/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) router.push("/home");
    else setError(result.error || "Login failed. Please try again.");
  };

  return (
    <div className="min-h-screen flex flex-col auth-bg">
      <Header variant="auth" />
      <main className="flex-1 flex items-center justify-center px-4" style={{ paddingTop: "calc(var(--header-height) + 1.5rem)", paddingBottom: "2rem" }}>
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="text-center mb-4">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--orange-600)" }}>ChannelPartner.Network</p>
          </div>
          <div className="card px-5 py-7 sm:p-8" style={{ borderRadius: "var(--radius-2xl)" }}>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "var(--gradient-btn-blue)" }}>
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="text-lg sm:text-xl font-bold mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--navy-900)" }}>Welcome Back</h1>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Sign in to your account</p>
            </div>

            {error && (
              <div className="alert alert-danger mb-4">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email ID</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4" style={{ color: "var(--color-text-hint)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input-field pl-9" autoComplete="email" />
                </div>
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4" style={{ color: "var(--color-text-hint)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="input-field pl-9 pr-10" autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70" style={{ color: "var(--color-text-hint)" }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={showPw ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="button" className="text-xs font-semibold hover:underline" style={{ color: "var(--orange-600)" }}>Forgot Password?</button>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 text-sm sm:text-base" style={{ borderRadius: "var(--radius-lg)" }}>
                {loading ? <span className="flex items-center gap-2"><span className="spinner" style={{ width: "1rem", height: "1rem", borderWidth: "2px" }} />Signing in…</span> : "Login →"}
              </button>
            </form>

            <p className="text-center text-xs mt-5" style={{ color: "var(--color-text-muted)" }}>
              {"Don't have an account? "}
              <Link href="/signup" className="font-bold hover:underline" style={{ color: "var(--orange-600)" }}>Sign Up Free</Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
