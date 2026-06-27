"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check, RefreshCw, Link, Mail, Loader2 } from "lucide-react";

interface InviteModalProps {
  roomId: string;
  roomName: string;
  inviteCode?: string;
  onClose: () => void;
}

export default function InviteModal({ roomId, roomName, inviteCode: initialCode, onClose }: InviteModalProps) {
  const [inviteCode, setInviteCode] = useState(initialCode || "");
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${inviteCode}`;

  const generateNewCode = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, type: "room" }),
      });
      const data = await res.json();
      if (data.success) setInviteCode(data.data.code);
    } catch {}
    setIsLoading(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendEmailInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, type: "email", email }),
      });
      setEmailSent(true);
      setEmail("");
    } catch {}
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface-800 rounded-2xl border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <h2 className="text-white font-semibold text-lg">Invite to #{roomName}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Link invite */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Share an invite link</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-surface-700 border border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-2 overflow-hidden">
                <Link className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm text-gray-300 truncate">{inviteUrl}</span>
              </div>
              <button
                onClick={copyLink}
                className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
                  copied ? "bg-green-500 text-white" : "btn-primary"
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="flex justify-end mt-2">
              <button
                onClick={generateNewCode}
                disabled={isLoading}
                className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                Generate new link
              </button>
            </div>
          </div>

          <div className="divider" />

          {/* Email invite */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Invite by email</label>
            {emailSent ? (
              <div className="flex items-center gap-2 text-green-400 bg-green-500/10 rounded-xl px-4 py-3">
                <Check className="w-4 h-4" />
                <span className="text-sm">Invitation sent!</span>
              </div>
            ) : (
              <form onSubmit={sendEmailInvite} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="input-base flex-1 text-sm"
                  required
                />
                <button type="submit" disabled={isLoading || !email} className="btn-primary px-4 flex items-center gap-2">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Send
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
