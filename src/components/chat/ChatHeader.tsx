"use client";

import { useState } from "react";
import {
  Phone,
  Video,
  Search,
  Settings,
  Users,
  Pin,
  Hash,
  Lock,
  Globe,
  MoreVertical,
  Bell,
  BellOff,
  LogOut,
  Trash2,
  Star,
  X,
} from "lucide-react";
import UserAvatar from "@/components/shared/UserAvatar";
import { useChatStore } from "@/store/chatStore";
import { useSession } from "next-auth/react";
import { useSocket } from "@/hooks/useSocket";
import { formatRelativeTime } from "@/lib/utils";

interface ChatHeaderProps {
  room: {
    _id: string;
    name: string;
    type: "direct" | "group" | "channel";
    description?: string;
    avatar?: string;
    banner?: string;
    isPublic?: boolean;
    members: Array<{
      user: {
        _id: string;
        username: string;
        displayName: string;
        avatar?: string;
        status: string;
      };
      role: string;
    }>;
    settings?: { readOnly?: boolean };
  };
  onInitiateCall: (type: "audio" | "video") => void;
}

export default function ChatHeader({ room, onInitiateCall }: ChatHeaderProps) {
  const { data: session } = useSession();
  const { showMemberList, setShowMemberList, setShowSearch, showSearch } =
    useChatStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const { updateStatus } = useSocket();

  const toggleMemberList = () => {
    setShowMemberList(!showMemberList);
  };

  const onlineCount = room.members.filter(
    (m) => m.user.status === "online" || m.user.status === "away",
  ).length;

  const isDirect = room.type === "direct";
  const otherUser = isDirect
    ? room.members.find((m) => m.user._id !== session?.user?.id)?.user
    : null;

  const statusColor = otherUser
    ? ({
        online: "bg-green-400",
        away: "bg-yellow-400",
        busy: "bg-red-400",
        offline: "bg-gray-500",
        invisible: "bg-gray-500",
      }[otherUser.status] ?? "bg-gray-500")
    : "";

  return (
    <div className="h-16 border-b border-white/5 flex items-center px-4 gap-3 bg-surface-800/50 backdrop-blur-sm flex-shrink-0">
      {/* Avatar / Icon */}
      <div className="relative flex-shrink-0">
        {isDirect && otherUser ? (
          <UserAvatar user={otherUser} size="md" showStatus />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center">
            {room.type === "channel" ? (
              <Hash className="w-5 h-5 text-brand-400" />
            ) : (
              <Users className="w-5 h-5 text-brand-400" />
            )}
          </div>
        )}
      </div>

      {/* Room Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-white truncate">
            {isDirect && otherUser ? otherUser.displayName : room.name}
          </h2>
          {room.type === "channel" &&
            (room.isPublic ? (
              <Globe className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            ))}
          {room.settings?.readOnly && (
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
              Read-only
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate">
          {isDirect && otherUser ? (
            <span className={`inline-flex items-center gap-1`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
              {otherUser.status === "offline" ||
              otherUser.status === "invisible"
                ? "Offline"
                : otherUser.status}
            </span>
          ) : (
            room.description ||
            `${room.members.length} members · ${onlineCount} online`
          )}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Call buttons for DMs */}
        {isDirect && (
          <>
            <button
              onClick={() => onInitiateCall("audio")}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              title="Voice call"
            >
              <Phone className="w-5 h-5" />
            </button>
            <button
              onClick={() => onInitiateCall("video")}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              title="Video call"
            >
              <Video className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Search */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className={`p-2 rounded-lg transition-colors ${showSearch ? "bg-brand-600/20 text-brand-400" : "hover:bg-white/5 text-gray-400 hover:text-white"}`}
          title="Search messages"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Members toggle (groups/channels) */}
        {!isDirect && (
          <button
            onClick={toggleMemberList}
            className={`p-2 rounded-lg transition-colors ${showMemberList ? "bg-brand-600/20 text-brand-400" : "hover:bg-white/5 text-gray-400 hover:text-white"}`}
            title="Members"
          >
            <Users className="w-5 h-5" />
          </button>
        )}

        {/* More */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 top-10 z-20 w-48 bg-surface-700 border border-white/10 rounded-xl shadow-xl py-1 overflow-hidden">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                  <Pin className="w-4 h-4" /> Pinned Messages
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                  <Bell className="w-4 h-4" /> Notifications
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                  <Star className="w-4 h-4" /> Mark as Favorite
                </button>
                {!isDirect && (
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                    <Settings className="w-4 h-4" /> Room Settings
                  </button>
                )}
                <div className="border-t border-white/5 my-1" />
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                  <LogOut className="w-4 h-4" /> Leave Room
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
