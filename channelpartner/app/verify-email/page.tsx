// app/verify-email/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verify = async () => {
      const id = searchParams.get("id");
      const hash = searchParams.get("hash");
      const expires = searchParams.get("expires");
      const signature = searchParams.get("signature");

      if (!id || !hash) {
        setStatus("error");
        setMessage("Invalid verification link.");
        return;
      }

      try {
        // Call your Laravel API directly
        const apiBase =
          process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(
          `${apiBase}/email/verify/${id}/${hash}?expires=${expires}&signature=${signature}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          },
        );

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
          setTimeout(() => router.push("/login"), 3000);
        } else {
          setStatus("error");
          setMessage(data.message || "Invalid or expired verification link.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Failed to verify email. Please try again.");
      }
    };

    verify();
  }, [searchParams, router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
        {status === "loading" && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Verifying your email...</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mt-4 text-gray-800">
              Email Verified!
            </h2>
            <p className="mt-2 text-gray-600">{message}</p>
            <Link
              href="/login"
              className="mt-6 inline-block px-6 py-2 bg-blue-600 text-black rounded-lg hover:bg-blue-700"
            >
              Go to Login
            </Link>
          </div>
        )}

        {status === "error" && (
          <div>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mt-4 text-gray-800">
              Verification Failed
            </h2>
            <p className="mt-2 text-gray-600">{message}</p>
            <Link
              href="/login"
              className="mt-6 inline-block px-6 py-2 bg-blue-600 text-black rounded-lg hover:bg-blue-700"
            >
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
