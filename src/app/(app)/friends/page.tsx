"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Check,
  X,
  MessageSquare,
  Search,
  Users,
  Clock,
  UserCheck,
  Loader2,
} from "lucide-react";
import UserAvatar from "@/components/shared/UserAvatar";

type Tab = "all" | "pending" | "add";

interface FriendUser {
  _id: string;
  username: string;
  displayName: string;
  avatar?: string;
  status: string;
  bio?: string;
}

interface FriendRequest {
  _id: string;
  from: FriendUser;
  createdAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  online: "bg-green-400",
  away: "bg-yellow-400",
  busy: "bg-red-400",
  offline: "bg-gray-500",
  invisible: "bg-gray-500",
};

export default function FriendsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [pending, setPending] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [dmLoading, setDmLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const res = await fetch("/api/users/me/friends");
      const data = await res.json();
      if (data.success) {
        setFriends(data.data.friends || []);
        setPending(data.data.pendingRequests || []);
      }
    } catch {}
    setIsLoading(false);
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(searchQuery)}`,
        );
        const data = await res.json();
        if (data.success) setSearchResults(data.data.users || []);
      } catch {}
      setIsSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Ouvrir ou créer un DM puis rediriger
  const startDM = async (userId: string) => {
    setDmLoading(userId);
    try {
      const res = await fetch("/api/rooms/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) router.push(`/chat/${data.data.room._id}`);
    } catch {}
    setDmLoading(null);
  };

  const sendFriendRequest = async (userId: string) => {
    try {
      await fetch(`/api/users/${userId}/friend`, { method: "POST" });
      setSentRequests((prev) => new Set([...prev, userId]));
    } catch {}
  };

  const acceptRequest = async (userId: string) => {
    try {
      await fetch(`/api/users/${userId}/friend/accept`, { method: "POST" });
      fetchFriends();
    } catch {}
  };

  const declineRequest = async (userId: string) => {
    try {
      await fetch(`/api/users/${userId}/friend/decline`, { method: "POST" });
      fetchFriends();
    } catch {}
  };

  const TABS = [
    {
      id: "all" as Tab,
      label: "All Friends",
      icon: Users,
      count: friends.length,
    },
    {
      id: "pending" as Tab,
      label: "Pending",
      icon: Clock,
      count: pending.length,
    },
    { id: "add" as Tab, label: "Add Friend", icon: UserPlus, count: 0 },
  ];

  const filteredFriends = friends.filter(
    (f) =>
      f.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="border-b border-white/5 bg-surface-800/50 px-6 py-4"
        style={{
          borderColor: "rgba(255,255,255,0.05)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(99,102,241,0.2)" }}
          >
            <Users className="w-5 h-5" style={{ color: "#818cf8" }} />
          </div>
          <h1 className="text-white font-semibold text-lg">Friends</h1>
        </div>
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t.id ? "text-indigo-400" : "text-gray-400 hover:text-white"}`}
              style={{
                background:
                  tab === t.id ? "rgba(99,102,241,0.15)" : "transparent",
              }}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.count > 0 && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* All Friends */}
        {tab === "all" && (
          <>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-base w-full pl-10 max-w-md"
              />
            </div>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2
                  className="w-8 h-8 animate-spin"
                  style={{ color: "#818cf8" }}
                />
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="text-center py-12">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <UserCheck className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-white font-medium mb-2">No friends yet</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Start by adding someone!
                </p>
                <button onClick={() => setTab("add")} className="btn-primary">
                  Add Friend
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredFriends.map((friend) => (
                  <div
                    key={friend._id}
                    className="rounded-2xl p-4 border transition-all"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      borderColor: "rgba(255,255,255,0.06)",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <UserAvatar user={friend} size="md" />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${STATUS_COLOR[friend.status]}`}
                          style={{ borderColor: "#090e1a" }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm">
                          {friend.displayName}
                        </p>
                        <p className="text-xs text-gray-500">
                          @{friend.username}
                        </p>
                        {friend.bio && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                            {friend.bio}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => startDM(friend._id)}
                        disabled={dmLoading === friend._id}
                        className="btn-primary flex-1 text-xs py-1.5 flex items-center justify-center gap-1"
                      >
                        {dmLoading === friend._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <MessageSquare className="w-3.5 h-3.5" />
                        )}
                        Message
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Pending */}
        {tab === "pending" && (
          <div className="max-w-xl space-y-3">
            {pending.length === 0 ? (
              <div className="text-center py-12">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <Clock className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-white font-medium mb-2">
                  No pending requests
                </h3>
                <p className="text-gray-400 text-sm">You're all caught up!</p>
              </div>
            ) : (
              pending.map((req: any) => (
                <div
                  key={req._id}
                  className="rounded-2xl p-4 border flex items-center gap-4"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    borderColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  <UserAvatar user={req.from} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">
                      {req.from?.displayName}
                    </p>
                    <p className="text-xs text-gray-500">
                      @{req.from?.username}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptRequest(req.from?._id)}
                      className="p-2 rounded-xl transition-colors"
                      style={{
                        background: "rgba(34,197,94,0.2)",
                        color: "#4ade80",
                      }}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => declineRequest(req.from?._id)}
                      className="p-2 rounded-xl transition-colors"
                      style={{
                        background: "rgba(239,68,68,0.2)",
                        color: "#f87171",
                      }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Add Friend */}
        {tab === "add" && (
          <div className="max-w-xl">
            <div className="mb-6">
              <h2 className="text-white font-semibold mb-1">Add a Friend</h2>
              <p className="text-gray-400 text-sm">
                Search by username or display name.
              </p>
            </div>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search for users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-base w-full pl-10"
                autoFocus
              />
            </div>
            <div className="space-y-3">
              {isSearching && (
                <div className="flex justify-center py-4">
                  <Loader2
                    className="w-5 h-5 animate-spin"
                    style={{ color: "#818cf8" }}
                  />
                </div>
              )}
              {!isSearching &&
                searchResults.map((user) => (
                  <div
                    key={user._id}
                    className="rounded-2xl p-4 border flex items-center gap-4"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      borderColor: "rgba(255,255,255,0.06)",
                    }}
                  >
                    <UserAvatar user={user} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm">
                        {user.displayName}
                      </p>
                      <p className="text-xs text-gray-500">@{user.username}</p>
                    </div>
                    <button
                      onClick={() => sendFriendRequest(user._id)}
                      disabled={
                        sentRequests.has(user._id) ||
                        friends.some((f) => f._id === user._id)
                      }
                      className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
                        sentRequests.has(user._id) ||
                        friends.some((f) => f._id === user._id)
                          ? "text-gray-500 cursor-default"
                          : "btn-primary"
                      }`}
                      style={
                        sentRequests.has(user._id) ||
                        friends.some((f) => f._id === user._id)
                          ? { background: "rgba(255,255,255,0.05)" }
                          : {}
                      }
                    >
                      {friends.some((f) => f._id === user._id) ? (
                        <>
                          <UserCheck className="w-4 h-4" /> Friends
                        </>
                      ) : sentRequests.has(user._id) ? (
                        <>
                          <Check className="w-4 h-4" /> Sent
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" /> Add
                        </>
                      )}
                    </button>
                  </div>
                ))}
              {!isSearching && searchQuery && searchResults.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No users found for "{searchQuery}"
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
