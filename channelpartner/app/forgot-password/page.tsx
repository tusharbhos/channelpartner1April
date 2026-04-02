"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthAPI } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    setLoading(true);
    try {
      const res = await AuthAPI.forgotPasswordSendCode({ email });
      setMessage(res.message || "Code sent to your email.");
      setStep(2);
    } catch (err: unknown) {
      const e2 = err as { message?: string };
      setError(e2.message || "Unable to send code.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!code || !password || !confirmPassword) {
      setError("Please fill all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and Confirm Password must match.");
      return;
    }

    setLoading(true);
    try {
      const res = await AuthAPI.forgotPasswordReset({
        email,
        code,
        password,
        password_confirmation: confirmPassword,
      });
      setMessage(res.message || "Password reset successful.");
      setTimeout(() => router.push("/login"), 1200);
    } catch (err: unknown) {
      const e2 = err as { message?: string };
      setError(e2.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-main min-h-screen flex items-center justify-center px-4 py-8">
      <div className="glass-card w-full max-w-sm px-7 py-8 animate-fade-in-up">
        <h1
          className="text-xl font-bold mb-2 text-center"
          style={{
            color: "var(--navy-900)",
            fontFamily: "var(--font-display)",
          }}
        >
          Forgot Password
        </h1>

        <p
          className="text-xs text-center mb-5"
          style={{ color: "var(--slate-500)" }}
        >
          {step === 1
            ? "Enter your email to receive CP-6 digit code"
            : "Enter CP-6 digit code and set new password"}
        </p>

        {error && (
          <div className="alert alert-danger mb-4 text-xs">{error}</div>
        )}
        {message && (
          <div className="alert alert-success mb-4 text-xs">{message}</div>
        )}

        {step === 1 ? (
          <form onSubmit={sendCode} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email ID"
              autoComplete="email"
              className="auth-form-input"
            />
            <button
              type="submit"
              disabled={loading}
              className="btn btn-gold w-full"
            >
              {loading ? "Sending..." : "Send Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email ID"
              autoComplete="email"
              className="auth-form-input"
            />
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="CP-123456"
              className="auth-form-input"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New Password"
              autoComplete="new-password"
              className="auth-form-input"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm New Password"
              autoComplete="new-password"
              className="auth-form-input"
            />
            <button
              type="submit"
              disabled={loading}
              className="btn btn-gold w-full"
            >
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </form>
        )}

        <p
          className="text-center text-sm mt-5"
          style={{ color: "var(--slate-600)" }}
        >
          <Link
            href="/login"
            className="font-bold hover:underline"
            style={{ color: "var(--orange-600)" }}
          >
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
