"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setMessage("Invalid verification link."); return; }
    fetch(`/api/auth/verify-email?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setStatus("success");
        else { setStatus("error"); setMessage(data.error || "Verification failed."); }
      })
      .catch(() => { setStatus("error"); setMessage("An error occurred."); });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-dark rounded-2xl p-10 border border-white/10 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-brand-400 animate-spin mx-auto mb-6" />
            <h1 className="text-xl font-bold text-white mb-2">Verifying your email...</h1>
            <p className="text-gray-400">Please wait a moment.</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Email verified!</h1>
            <p className="text-gray-400 mb-8">Your account is now active. Welcome to NexTalk!</p>
            <Link href="/login" className="btn-primary w-full block">Continue to Login</Link>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Verification failed</h1>
            <p className="text-gray-400 mb-8">{message}</p>
            <Link href="/register" className="btn-secondary w-full block">Back to Register</Link>
          </>
        )}
      </div>
    </div>
  );
}
