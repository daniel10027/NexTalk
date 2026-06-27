"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MessageSquare, UserPlus, UserCheck, UserX, Shield,
  Calendar, Hash, MessageCircle, Loader2, Ban
} from "lucide-react";
import { useSession } from "next-auth/react";
import UserAvatar from "@/components/shared/UserAvatar";
import { formatRelativeTime } from "@/lib/utils";

interface Profile {
  _id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  status: string;
  role: string;
  badges?: string[];
  messageCount: number;
  createdAt: string;
  isFriend?: boolean;
  isBlocked?: boolean;
  friendRequestSent?: boolean;
  mutualFriendsCount?: number;
}

const STATUS_COLOR: Record<string, string> = {
  online: "bg-green-400", away: "bg-yellow-400",
  busy: "bg-red-400", offline: "bg-gray-500", invisible: "bg-gray-500",
};
const STATUS_LABEL: Record<string, string> = {
  online: "Online", away: "Away", busy: "Do Not Disturb",
  offline: "Offline", invisible: "Offline",
};

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const isOwnProfile = session?.user?.username === username;

  useEffect(() => {
    fetch(`/api/users/profile/${username}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setProfile(d.data.user);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [username]);

  const sendFriendRequest = async () => {
    if (!profile) return;
    setActionLoading(true);
    await fetch(`/api/users/${profile._id}/friend`, { method: "POST" });
    setProfile(p => p ? { ...p, friendRequestSent: true } : p);
    setActionLoading(false);
  };

  const removeFriend = async () => {
    if (!profile || !confirm("Remove this friend?")) return;
    setActionLoading(true);
    await fetch(`/api/users/${profile._id}/friend`, { method: "DELETE" });
    setProfile(p => p ? { ...p, isFriend: false } : p);
    setActionLoading(false);
  };

  const startDM = () => {
    if (profile) router.push(`/chat?dm=${profile._id}`);
  };

  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
    </div>
  );

  if (notFound || !profile) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
        <UserX className="w-8 h-8 text-gray-500" />
      </div>
      <h2 className="text-white font-semibold text-lg">User not found</h2>
      <p className="text-gray-400">@{username} doesn't exist or may have been deleted.</p>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Banner */}
      <div className="h-32 bg-gradient-to-r from-brand-900 via-purple-900 to-brand-900 relative">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url('/grid-pattern.svg')", backgroundSize: "30px" }} />
      </div>

      <div className="px-8 pb-8">
        {/* Avatar + actions */}
        <div className="flex items-end justify-between -mt-12 mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl border-4 border-surface-800 overflow-hidden">
              <UserAvatar user={profile} size="xl" />
            </div>
            <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-surface-800 ${STATUS_COLOR[profile.status]}`} />
          </div>

          {!isOwnProfile && (
            <div className="flex gap-3 mt-14">
              <button onClick={startDM} className="btn-secondary flex items-center gap-2 text-sm">
                <MessageSquare className="w-4 h-4" /> Message
              </button>
              {profile.isFriend ? (
                <button onClick={removeFriend} disabled={actionLoading} className="btn-secondary flex items-center gap-2 text-sm text-red-400 border-red-500/30 hover:bg-red-500/10">
                  <UserX className="w-4 h-4" /> Remove Friend
                </button>
              ) : profile.friendRequestSent ? (
                <button disabled className="btn-secondary flex items-center gap-2 text-sm opacity-60">
                  <UserCheck className="w-4 h-4" /> Request Sent
                </button>
              ) : (
                <button onClick={sendFriendRequest} disabled={actionLoading} className="btn-primary flex items-center gap-2 text-sm">
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Add Friend
                </button>
              )}
            </div>
          )}

          {isOwnProfile && (
            <button onClick={() => router.push("/settings")} className="btn-secondary text-sm mt-14">
              Edit Profile
            </button>
          )}
        </div>

        {/* Info */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">{profile.displayName}</h1>
            {profile.role === "admin" && (
              <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                <Shield className="w-3 h-3" /> Admin
              </span>
            )}
            {profile.role === "moderator" && (
              <span className="flex items-center gap-1 text-xs bg-brand-600/20 text-brand-400 px-2 py-0.5 rounded-full">
                <Shield className="w-3 h-3" /> Moderator
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm mb-1">@{profile.username}</p>
          <div className="flex items-center gap-1 text-sm">
            <span className={`w-2 h-2 rounded-full ${STATUS_COLOR[profile.status]}`} />
            <span className="text-gray-400">{STATUS_LABEL[profile.status]}</span>
          </div>
          {profile.bio && (
            <p className="text-gray-300 mt-4 max-w-lg leading-relaxed">{profile.bio}</p>
          )}
          {profile.mutualFriendsCount && profile.mutualFriendsCount > 0 && !isOwnProfile && (
            <p className="text-sm text-gray-500 mt-2">{profile.mutualFriendsCount} mutual friend{profile.mutualFriendsCount !== 1 ? "s" : ""}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Messages Sent", value: profile.messageCount.toLocaleString(), icon: MessageCircle },
            { label: "Member Since", value: new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }), icon: Calendar },
          ].map(stat => (
            <div key={stat.label} className="glass-dark rounded-2xl p-5 border border-white/5">
              <div className="w-8 h-8 rounded-xl bg-brand-600/20 flex items-center justify-center mb-3">
                <stat.icon className="w-4 h-4 text-brand-400" />
              </div>
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
