"use client";

import { useState, useEffect } from "react";
import { Hash, Globe, Users, Search, Compass, TrendingUp, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Channel {
  _id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  memberCount: number;
  messageCount: number;
  tags?: string[];
  banner?: string;
  isMember?: boolean;
}

export default function ChannelsPage() {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(fetchChannels, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchChannels = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/rooms?type=channel&public=true${search ? `&q=${encodeURIComponent(search)}` : ""}`);
      const data = await res.json();
      if (data.success) setChannels(data.data.rooms || []);
    } catch {}
    setIsLoading(false);
  };

  const joinChannel = async (channelId: string) => {
    setJoining(channelId);
    try {
      const res = await fetch(`/api/rooms/${channelId}/join`, { method: "POST" });
      const data = await res.json();
      if (data.success) router.push(`/chat/${channelId}`);
    } catch {}
    setJoining(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-white/5 bg-surface-800/50 px-6 py-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-brand-600/20 flex items-center justify-center">
            <Compass className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg">Discover Channels</h1>
            <p className="text-gray-400 text-sm">Find communities to join</p>
          </div>
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search channels..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-base w-full pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /></div>
        ) : channels.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Hash className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-white font-medium mb-2">No channels found</h3>
            <p className="text-gray-400 text-sm mb-4">Be the first to create a public channel!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map(ch => (
              <div key={ch._id} className="glass-dark rounded-2xl border border-white/5 hover:border-white/10 transition-all overflow-hidden group">
                {ch.banner ? (
                  <div className="h-20 overflow-hidden">
                    <img src={ch.banner} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="h-20 bg-gradient-to-br from-brand-900/50 to-purple-900/50 flex items-center justify-center">
                    <Hash className="w-8 h-8 text-brand-400/50" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-4 h-4 text-brand-400 flex-shrink-0" />
                      <h3 className="font-semibold text-white text-sm">{ch.name}</h3>
                      {!ch.isPublic && <Lock className="w-3 h-3 text-gray-500" />}
                    </div>
                  </div>
                  {ch.description && (
                    <p className="text-xs text-gray-400 mb-3 line-clamp-2">{ch.description}</p>
                  )}
                  {ch.tags && ch.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {ch.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="hashtag text-xs py-0.5 px-2">#{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Users className="w-3.5 h-3.5" />
                      <span>{ch.memberCount} members</span>
                    </div>
                    {ch.isMember ? (
                      <Link href={`/chat/${ch._id}`} className="text-xs btn-secondary py-1.5 px-3">Open</Link>
                    ) : (
                      <button
                        onClick={() => joinChannel(ch._id)}
                        disabled={joining === ch._id}
                        className="text-xs btn-primary py-1.5 px-3 flex items-center gap-1"
                      >
                        {joining === ch._id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        Join
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
