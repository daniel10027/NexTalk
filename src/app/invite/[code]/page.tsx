"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Hash, Users, Loader2, CheckCircle, XCircle, Lock } from "lucide-react";
import Link from "next/link";

interface InviteInfo {
  type: "room" | "friend";
  room?: { _id: string; name: string; type: string; memberCount: number; description?: string };
  inviter: { displayName: string; username: string; avatar?: string };
  expiresAt?: string;
  maxUses?: number;
  uses?: number;
}

export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/invitations/${code}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setInvite(d.data);
        else setError(d.error || "Invalid or expired invite link");
      })
      .catch(() => setError("Failed to load invite"))
      .finally(() => setIsLoading(false));
  }, [code]);

  const handleJoin = async () => {
    if (!session) { router.push(`/login?redirect=/invite/${code}`); return; }
    setIsJoining(true);
    try {
      const res = await fetch(`/api/invitations/${code}/use`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          if (invite?.room) router.push(`/chat/${invite.room._id}`);
          else router.push("/friends");
        }, 1500);
      } else setError(data.error);
    } catch { setError("Failed to join"); }
    setIsJoining(false);
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-dark rounded-2xl p-10 max-w-md w-full border border-white/10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-white mb-3">Invalid Invite</h1>
        <p className="text-gray-400 mb-6">{error}</p>
        <Link href="/chat" className="btn-primary w-full block text-center">Go to NexTalk</Link>
      </div>
    </div>
  );

  if (success) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-dark rounded-2xl p-10 max-w-md w-full border border-white/10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="text-xl font-bold text-white mb-3">Joined successfully!</h1>
        <p className="text-gray-400">Redirecting you now...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "radial-gradient(ellipse at center, #1a0533 0%, #090e1a 70%)" }}>
      {/* Logo */}
      <div className="absolute top-6 left-6">
        <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl">
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
            <span className="text-sm font-black">N</span>
          </div>
          NexTalk
        </Link>
      </div>

      <div className="glass-dark rounded-3xl p-8 max-w-md w-full border border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          <p className="text-gray-400 text-sm mb-6">
            <span className="text-white font-medium">{invite?.inviter.displayName}</span> has invited you to join
          </p>

          {/* Room preview */}
          {invite?.room && (
            <div className="mb-6">
              <div className="w-20 h-20 rounded-3xl bg-brand-600/20 flex items-center justify-center mx-auto mb-4">
                {invite.room.type === "channel"
                  ? <Hash className="w-10 h-10 text-brand-400" />
                  : <Users className="w-10 h-10 text-brand-400" />}
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">{invite.room.name}</h1>
              {invite.room.description && (
                <p className="text-gray-400 text-sm mb-3">{invite.room.description}</p>
              )}
              <div className="flex items-center justify-center gap-1 text-sm text-gray-400">
                <Users className="w-4 h-4" />
                <span>{invite.room.memberCount} members</span>
              </div>
            </div>
          )}
        </div>

        {status === "unauthenticated" ? (
          <div className="space-y-3">
            <Link href={`/login?redirect=/invite/${code}`} className="btn-primary w-full block text-center">
              Log in to Join
            </Link>
            <Link href={`/register?redirect=/invite/${code}`} className="btn-secondary w-full block text-center">
              Create Account
            </Link>
          </div>
        ) : (
          <button
            onClick={handleJoin}
            disabled={isJoining}
            className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3"
          >
            {isJoining ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {isJoining ? "Joining..." : "Accept Invite"}
          </button>
        )}

        {invite?.expiresAt && (
          <p className="text-center text-xs text-gray-500 mt-4">
            Expires {new Date(invite.expiresAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
