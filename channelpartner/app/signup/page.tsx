// app/signup/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface FormData {
  name: string;
  companyName: string;
  reraNo: string;
  phone: string;
  email: string;
  address: string;
  password: string;
  confirmPassword: string;
  captcha: boolean;
}

const INITIAL: FormData = {
  name: "",
  companyName: "",
  reraNo: "",
  phone: "",
  email: "",
  address: "",
  password: "",
  confirmPassword: "",
  captcha: false,
};

export default function SignupPage() {
  type FormErrors = Partial<Record<keyof FormData, string>>;
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");

  const set = (k: keyof FormData, v: string | boolean) =>
    setForm((p) => ({ ...p, [k]: v }));

  const validate = (): boolean => {
    const e: FormErrors = {};

    if (!form.name.trim()) e.name = "Name is required";
    if (!form.reraNo.trim()) e.reraNo = "RERA No is required";
    if (!form.phone.match(/^\d{10}$/)) e.phone = "Enter a valid 10-digit phone";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      e.email = "Enter a valid email";
    if (!form.address.trim()) e.address = "Address is required";
    if (form.password.length < 8)
      e.password = "Password must be at least 8 characters";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    if (!form.captcha) e.captcha = "Please verify you are human";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!validate()) return;

    setLoading(true);

    const result = await register({
      name: form.name,
      company_name: form.companyName,
      rera_no: form.reraNo,
      phone: form.phone,
      email: form.email,
      address: form.address,
      password: form.password,
      password_confirmation: form.confirmPassword,
    });

    setLoading(false);

    if (result.success) {
      setStep(2);
    } else {
      setSubmitError(result.error || "Registration failed. Please try again.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (step === 2) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: "var(--color-bg)" }}
      >
        <Header variant="auth" />

        <main className="flex-1 flex items-center justify-center p-4 pt-24">
          <div className="w-full max-w-md animate-fade-in-up">
            <div
              className="card p-8"
              style={{ borderRadius: "var(--radius-2xl)" }}
            >
              <div className="text-center mb-6">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "var(--gradient-btn-blue)" }}
                >
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2
                  className="text-xl font-bold mb-1"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--navy-900)",
                  }}
                >
                  Registration Successful!
                </h2>
                <p
                  className="text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Welcome, <b>{form.name}</b>! Your account has been created.
                </p>
              </div>

              <div className="alert alert-info mb-5">
                <svg
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  Please check your email to verify your account before logging
                  in.
                </span>
              </div>

              <button
                onClick={() => router.push("/login")}
                className="btn btn-primary w-full py-3 text-base"
                style={{ borderRadius: "var(--radius-lg)" }}
              >
                Go to Log In →
              </button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--color-bg)" }}
    >
      <Header variant="auth" />

      <main className="flex-1 flex items-center justify-center px-4 py-10 pt-24">
        <div className="w-full max-w-2xl animate-fade-in-up">
          <div
            className="card p-8"
            style={{ borderRadius: "var(--radius-2xl)" }}
          >
            {/* Icon + title */}
            <div className="text-center mb-7">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "var(--gradient-btn-blue)" }}
              >
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h1
                className="text-xl font-bold mb-1"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--navy-900)",
                }}
              >
                Create Your Account
              </h1>
              <p
                className="text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
                Join India's largest channel partner network
              </p>
            </div>

            {/* Error Alert */}
            {submitError && (
              <div className="alert alert-danger mb-5">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Name + Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    Full Name{" "}
                    <span style={{ color: "var(--color-secondary)" }}>*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg
                        className="w-4 h-4"
                        style={{ color: "var(--color-text-hint)" }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="Rahul Sharma"
                      className="input-field pl-9"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs mt-1" style={{ color: "#dc2626" }}>
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label">Company Name </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg
                        className="w-4 h-4"
                        style={{ color: "var(--color-text-hint)" }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={form.companyName}
                      onChange={(e) => set("companyName", e.target.value)}
                      placeholder="Sharma Realty Pvt Ltd"
                      className="input-field pl-9"
                    />
                  </div>
                  {errors.companyName && (
                    <p className="text-xs mt-1" style={{ color: "#dc2626" }}>
                      {errors.companyName}
                    </p>
                  )}
                </div>
              </div>

              {/* RERA + Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    RERA No{" "}
                    <span style={{ color: "var(--color-secondary)" }}>*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg
                        className="w-4 h-4"
                        style={{ color: "var(--color-text-hint)" }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={form.reraNo}
                      onChange={(e) => set("reraNo", e.target.value)}
                      placeholder="A51800001234"
                      className="input-field pl-9"
                    />
                  </div>
                  {errors.reraNo && (
                    <p className="text-xs mt-1" style={{ color: "#dc2626" }}>
                      {errors.reraNo}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label">
                    Phone Number{" "}
                    <span style={{ color: "var(--color-secondary)" }}>*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg
                        className="w-4 h-4"
                        style={{ color: "var(--color-text-hint)" }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </span>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) =>
                        set(
                          "phone",
                          e.target.value.replace(/\D/g, "").slice(0, 10),
                        )
                      }
                      placeholder="9876543210"
                      className="input-field pl-9"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs mt-1" style={{ color: "#dc2626" }}>
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Email + Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    Email ID{" "}
                    <span style={{ color: "var(--color-secondary)" }}>*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg
                        className="w-4 h-4"
                        style={{ color: "var(--color-text-hint)" }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="you@example.com"
                      className="input-field pl-9"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs mt-1" style={{ color: "#dc2626" }}>
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="label">
                    Address{" "}
                    <span style={{ color: "var(--color-secondary)" }}>*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-4 pointer-events-none">
                      <svg
                        className="w-4 h-4"
                        style={{ color: "var(--color-text-hint)" }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </span>
                    <textarea
                      value={form.address}
                      onChange={(e) => set("address", e.target.value)}
                      placeholder="Office / Home address"
                      rows={2}
                      className="input-field pl-9 resize-none"
                    />
                  </div>
                  {errors.address && (
                    <p className="text-xs mt-1" style={{ color: "#dc2626" }}>
                      {errors.address}
                    </p>
                  )}
                </div>
              </div>
              {/* Password + Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    Password{" "}
                    <span style={{ color: "var(--color-secondary)" }}>*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg
                        className="w-4 h-4"
                        style={{ color: "var(--color-text-hint)" }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </span>
                    <input
                      type={showPw ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      placeholder="Min 8 characters"
                      className="input-field pl-9 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                      style={{ color: "var(--color-text-hint)" }}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d={
                            showPw
                              ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                              : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          }
                        />
                      </svg>
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs mt-1" style={{ color: "#dc2626" }}>
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label">
                    Confirm Password{" "}
                    <span style={{ color: "var(--color-secondary)" }}>*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg
                        className="w-4 h-4"
                        style={{ color: "var(--color-text-hint)" }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </span>
                    <input
                      type={showCPw ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(e) => set("confirmPassword", e.target.value)}
                      placeholder="Repeat password"
                      className="input-field pl-9 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCPw(!showCPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                      style={{ color: "var(--color-text-hint)" }}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d={
                            showCPw
                              ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                              : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          }
                        />
                      </svg>
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs mt-1" style={{ color: "#dc2626" }}>
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* CAPTCHA */}
              <div>
                <label className="label">
                  Verification{" "}
                  <span style={{ color: "var(--color-secondary)" }}>*</span>
                </label>
                <div
                  className="flex items-center gap-3 p-3 rounded-lg border"
                  style={{
                    borderColor: errors.captcha
                      ? "#dc2626"
                      : "var(--border-light)",
                    background: "#fafafa",
                  }}
                >
                  <input
                    type="checkbox"
                    id="captcha"
                    checked={form.captcha}
                    onChange={(e) => set("captcha", e.target.checked)}
                    className="w-5 h-5"
                  />
                  <label
                    htmlFor="captcha"
                    className="text-sm text-gray-700 cursor-pointer select-none"
                  >
                    I am not a robot
                  </label>
                  <div className="ml-auto flex flex-col items-center">
                    <div className="w-8 h-8 opacity-60">
                      <svg
                        viewBox="0 0 64 64"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="#4285f4"
                          strokeWidth="4"
                          fill="none"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="12"
                          fill="#4285f4"
                          opacity="0.2"
                        />
                        <path
                          d="M20 32a12 12 0 0124 0"
                          stroke="#4285f4"
                          strokeWidth="3"
                          fill="none"
                        />
                      </svg>
                    </div>
                    <span className="text-gray-400" style={{ fontSize: "9px" }}>
                      reCAPTCHA
                    </span>
                  </div>
                </div>
                {errors.captcha && (
                  <p className="text-xs mt-1" style={{ color: "#dc2626" }}>
                    {errors.captcha}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3 text-base"
                style={{ borderRadius: "var(--radius-lg)" }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span
                      className="spinner"
                      style={{
                        width: "1rem",
                        height: "1rem",
                        borderWidth: "2px",
                      }}
                    />
                    Creating account…
                  </span>
                ) : (
                  "Create Account →"
                )}
              </button>

              <p
                className="text-center text-xs mt-4"
                style={{ color: "var(--color-text-muted)" }}
              >
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-bold hover:underline"
                  style={{ color: "var(--navy-600)" }}
                >
                  Log In
                </Link>
              </p>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
