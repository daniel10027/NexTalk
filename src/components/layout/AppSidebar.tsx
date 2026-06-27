"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  MessageSquare,
  Users,
  Hash,
  Bell,
  Settings,
  LogOut,
  Plus,
  Search,
  Shield,
  PhoneCall,
  Menu,
  X,
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = session?.user;

  const sidebarContent = (
    <aside
      className="w-64 flex flex-col h-full border-r"
      style={{
        background: "rgba(9,14,26,0.98)",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <div
        className="px-4 py-4 border-b flex items-center justify-between"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <Link
          href="/chat"
          className="flex items-center gap-2.5"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">
            Nex<span className="gradient-text">Talk</span>
          </span>
        </Link>
        {/* Bouton fermer sur mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-3">
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm cursor-pointer border"
          style={{
            background: "rgba(255,255,255,0.04)",
            borderColor: "rgba(255,255,255,0.06)",
            color: "#6b7280",
          }}
        >
          <Search className="w-4 h-4" />
          <span>Rechercher...</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "sidebar-item",
              pathname === href || pathname.startsWith(href + "/")
                ? "active"
                : "",
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">{label}</span>
          </Link>
        ))}

        {user?.role === "admin" && (
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "sidebar-item",
              pathname === "/admin" ? "active" : "",
            )}
            style={{ color: "#f87171" }}
          >
            <Shield
              className="w-4 h-4 flex-shrink-0"
              style={{ color: "#f87171" }}
            />
            <span className="text-sm font-medium">Administration</span>
            <span
              className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold"
              style={{ background: "rgba(239,68,68,0.2)", color: "#f87171" }}
            >
              ADMIN
            </span>
          </Link>
        )}
      </nav>

      {/* Rooms récentes */}
      <div className="flex-1 overflow-hidden flex flex-col mt-4">
        <div className="flex items-center justify-between px-4 mb-2">
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "#4b5563" }}
          >
            Récents
          </span>
          <Link
            href="/chat"
            onClick={() => setMobileOpen(false)}
            className="hover:text-white transition-colors"
            style={{ color: "#4b5563" }}
          >
            <Plus className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
          {rooms.length === 0 && (
            <p
              className="text-xs text-center py-4"
              style={{ color: "#4b5563" }}
            >
              Aucune conversation
            </p>
          )}
          {rooms.slice(0, 15).map((room) => {
            const isActive = pathname.includes(room._id);
            const hasUnread = (room.unreadCount || 0) > 0;
            return (
              <Link
                key={room._id}
                href={`/chat/${room._id}`}
                onClick={() => setMobileOpen(false)}
                className={cn("sidebar-item", isActive ? "active" : "")}
              >
                <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0">
                  {room.avatar ? (
                    <img
                      src={room.avatar}
                      alt={room.name || ""}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: generateAvatarColor(room._id) }}
                    >
                      {room.type === "direct"
                        ? "DM"
                        : room.type === "channel"
                          ? "#"
                          : getInitials(room.name || "G")}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-sm font-medium truncate"
                      style={{ color: hasUnread ? "#f0f4ff" : "#d1d5db" }}
                    >
                      {room.type === "channel"
                        ? `#${room.name}`
                        : room.name || "Direct Message"}
                    </span>
                    {hasUnread && (
                      <span
                        className="ml-1 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 flex-shrink-0"
                        style={{ background: "#6366f1" }}
                      >
                        {(room.unreadCount || 0) > 99
                          ? "99+"
                          : room.unreadCount}
                      </span>
                    )}
                  </div>
                  {room.lastMessage && (
                    <p
                      className="text-xs truncate"
                      style={{ color: "#6b7280" }}
                    >
                      {room.lastMessage.content?.slice(0, 30) || "Fichier"}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Profil */}
      <div
        className="border-t p-3"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        {showStatus && (
          <div className="mb-2">
            <StatusSelector onClose={() => setShowStatus(false)} />
          </div>
        )}
        <div
          className="flex items-center gap-2.5 p-2 rounded-xl transition-colors"
          style={{ cursor: "pointer" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <div onClick={() => setShowStatus(!showStatus)}>
            <UserAvatar
              user={{
                _id: user?.id || "",
                username: user?.username || "",
                displayName: user?.name || "",
                avatar: user?.image || undefined,
              }}
              size="sm"
              showStatus
            />
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="text-sm font-medium truncate"
              style={{ color: "#f0f4ff" }}
            >
              {user?.name}
            </div>
            <div className="text-xs truncate" style={{ color: "#6b7280" }}>
              @{user?.username}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/settings"
              title="Paramètres"
              className="p-1.5 rounded-lg transition-colors hover:text-white"
              style={{ color: "#6b7280" }}
            >
              <Settings className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Déconnexion"
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "#f87171" }}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Bouton hamburger — visible uniquement sur mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 p-2 rounded-xl text-white"
        style={{
          background: "rgba(99,102,241,0.9)",
          backdropFilter: "blur(8px)",
        }}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar desktop — toujours visible */}
      <div className="hidden lg:flex h-full">{sidebarContent}</div>

      {/* Sidebar mobile — slide depuis la gauche */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {sidebarContent}
      </div>
    </>
  );
}
