"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  MessageSquare, Users, Hash, Bell, Settings,
  LogOut, Plus, Search, Shield, PhoneCall,
  ChevronDown, User
} from "lucide-react";
import { cn, getInitials, generateAvatarColor } from "@/lib/utils";
import { useChatStore } from "@/store/chatStore";
import UserAvatar from "@/components/shared/UserAvatar";
import StatusSelector from "@/components/chat/StatusSelector";

const NAV_ITEMS = [
  { href: "/chat", icon: MessageSquare, label: "Messages" },
  { href: "/friends", icon: Users, label: "Friends" },
  { href: "/channels", icon: Hash, label: "Channels" },
  { href: "/calls", icon: PhoneCall, label: "Calls" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { rooms } = useChatStore();
  const [showStatus, setShowStatus] = useState(false);

  const user = session?.user;

  return (
    <aside className="w-64 flex flex-col bg-surface-900/60 border-r border-white/[0.06] backdrop-blur-sm">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/[0.06]">
        <Link href="/chat" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold">Nex<span className="gradient-text">Talk</span></span>
        </Link>
      </div>

      {/* Search */}
      <div className="px-3 py-3">
        <div className="flex items-center gap-2 bg-surface-800/60 rounded-xl px-3 py-2.5 text-sm text-surface-500 cursor-pointer hover:bg-surface-800 transition-colors border border-white/[0.04]">
          <Search className="w-4 h-4" />
          <span>Search...</span>
          <kbd className="ml-auto text-xs bg-surface-700 px-1.5 py-0.5 rounded text-surface-400">⌘K</kbd>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "sidebar-item",
              pathname === href || pathname.startsWith(href + "/") ? "active" : ""
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">{label}</span>
          </Link>
        ))}
      </nav>

      {/* Recent rooms */}
      <div className="flex-1 overflow-hidden flex flex-col mt-4">
        <div className="flex items-center justify-between px-4 mb-2">
          <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Recent</span>
          <Link href="/chat" className="text-surface-500 hover:text-surface-300 transition-colors">
            <Plus className="w-4 h-4" />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
          {rooms.slice(0, 15).map((room) => {
            const isActive = pathname.includes(room._id);
            const hasUnread = (room.unreadCount || 0) > 0;

            return (
              <Link
                key={room._id}
                href={`/chat/${room._id}`}
                className={cn(
                  "sidebar-item",
                  isActive ? "active" : ""
                )}
              >
                <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 relative">
                  {room.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={room.avatar} alt={room.name || ""} className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: generateAvatarColor(room._id) }}
                    >
                      {room.type === "direct"
                        ? "#"
                        : room.type === "channel"
                        ? "⌗"
                        : getInitials(room.name || "G")}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={cn("text-sm font-medium truncate", hasUnread && "text-surface-100")}>
                      {room.type === "channel" ? `#${room.name}` : room.name || "Direct Message"}
                    </span>
                    {hasUnread && (
                      <span className="ml-1 bg-brand-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 flex-shrink-0">
                        {room.unreadCount! > 99 ? "99+" : room.unreadCount}
                      </span>
                    )}
                  </div>
                  {room.lastMessage && (
                    <p className="text-xs text-surface-500 truncate">
                      {room.lastMessage.content?.slice(0, 30) || "Attachment"}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* User profile */}
      <div className="border-t border-white/[0.06] p-3">
        {showStatus && (
          <div className="mb-2">
            <StatusSelector onClose={() => setShowStatus(false)} />
          </div>
        )}
        <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 transition-colors group">
          <div onClick={() => setShowStatus(!showStatus)} className="cursor-pointer">
            <UserAvatar
              src={user?.image}
              name={user?.name || ""}
              size="sm"
              showStatus
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-surface-100 truncate">{user?.name}</div>
            <div className="text-xs text-surface-500 truncate">@{user?.username}</div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {user?.role === "admin" && (
              <Link href="/admin" className="btn-ghost p-1.5">
                <Shield className="w-3.5 h-3.5 text-brand-400" />
              </Link>
            )}
            <Link href="/settings" className="btn-ghost p-1.5">
              <Settings className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="btn-ghost p-1.5 text-red-400 hover:text-red-300"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
