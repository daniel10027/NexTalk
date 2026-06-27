"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Search,
  Plus,
  Hash,
  Users,
  Lock,
  Globe,
  Loader2,
  MessageCircle,
} from "lucide-react";
import UserAvatar from "@/components/shared/UserAvatar";
import CreateRoomModal from "@/components/modals/CreateRoomModal";
import { formatRelativeTime } from "@/lib/utils";

interface Member {
  user: {
    _id: string;
    displayName: string;
    username: string;
    avatar?: string;
    status: string;
  };
  role: string;
}

interface Room {
  _id: string;
  name?: string;
  type: "direct" | "group" | "channel";
  members: Member[];
  memberCount?: number;
  isPublic?: boolean;
  updatedAt: string;
  description?: string;
}

type Filter = "all" | "dms" | "groups" | "channels";

export default function ChatPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await fetch("/api/rooms");
      const data = await res.json();
      if (data.success) setRooms(data.data.rooms || data.data || []);
    } catch {}
    setIsLoading(false);
  };

  const filtered = rooms.filter((r) => {
    if (filter === "dms" && r.type !== "direct") return false;
    if (filter === "groups" && r.type !== "group") return false;
    if (filter === "channels" && r.type !== "channel") return false;
    if (search) {
      const name = getRoomName(r).toLowerCase();
      return name.includes(search.toLowerCase());
    }
    return true;
  });

  const getRoomName = (room: Room): string => {
    if (room.type === "direct") {
      const other = room.members?.find(
        (m) => m.user?._id !== session?.user?.id,
      );
      return other?.user?.displayName || "Direct Message";
    }
    return room.name || "Unnamed";
  };

  const getRoomAvatar = (room: Room) => {
    if (room.type === "direct") {
      const other = room.members?.find(
        (m) => m.user?._id !== session?.user?.id,
      );
      return other?.user;
    }
    return null;
  };

  const getMemberCount = (room: Room): number => {
    if (room.members?.length) return room.members.length;
    return room.memberCount || 0;
  };

  const FILTERS = [
    { id: "all" as Filter, label: "All" },
    { id: "dms" as Filter, label: "DMs" },
    { id: "groups" as Filter, label: "Groups" },
    { id: "channels" as Filter, label: "Channels" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="px-4 py-4 border-b"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-white font-semibold text-lg">Messages</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors"
            style={{ color: "#818cf8" }}
            title="New room"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base w-full pl-9 py-2 text-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background:
                  filter === f.id ? "rgba(99,102,241,0.2)" : "transparent",
                color: filter === f.id ? "#818cf8" : "#9ca3af",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto py-2">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2
              className="w-6 h-6 animate-spin"
              style={{ color: "#818cf8" }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <MessageCircle className="w-7 h-7 text-gray-500" />
            </div>
            <p className="text-white font-medium mb-1">No conversations yet</p>
            <p className="text-gray-500 text-sm mb-4">
              {filter !== "all"
                ? `No ${filter} found`
                : "Start by messaging a friend!"}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary text-sm"
            >
              Create Room
            </button>
          </div>
        ) : (
          filtered.map((room) => {
            const otherUser = getRoomAvatar(room);
            const name = getRoomName(room);
            const memberCount = getMemberCount(room);

            return (
              <Link
                key={room._id}
                href={`/chat/${room._id}`}
                className="flex items-center gap-3 px-4 py-3 mx-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {otherUser ? (
                    <UserAvatar user={otherUser} size="md" showStatus />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(99,102,241,0.2)" }}
                    >
                      {room.type === "channel" ? (
                        <Hash
                          className="w-5 h-5"
                          style={{ color: "#818cf8" }}
                        />
                      ) : (
                        <Users
                          className="w-5 h-5"
                          style={{ color: "#818cf8" }}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-white text-sm truncate">
                        {name}
                      </span>
                      {room.type === "channel" &&
                        (room.isPublic ? (
                          <Globe className="w-3 h-3 text-gray-500" />
                        ) : (
                          <Lock className="w-3 h-3 text-gray-500" />
                        ))}
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {formatRelativeTime(room.updatedAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {room.type === "direct"
                      ? "Direct message"
                      : `${memberCount} member${memberCount !== 1 ? "s" : ""}`}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {showCreateModal && (
        <CreateRoomModal
          onClose={() => {
            setShowCreateModal(false);
            fetchRooms();
          }}
        />
      )}
    </div>
  );
}
