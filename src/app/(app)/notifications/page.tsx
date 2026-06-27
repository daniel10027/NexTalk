"use client";

import { useState, useEffect } from "react";
import { Bell, MessageSquare, UserPlus, Hash, AtSign, Check, CheckCheck, Loader2, Trash2 } from "lucide-react";
import UserAvatar from "@/components/shared/UserAvatar";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

interface Notification {
  _id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  sender?: { _id: string; displayName: string; username: string; avatar?: string };
  data?: { roomId?: string; messageId?: string; userId?: string };
}

const NOTIF_ICON: Record<string, React.ReactNode> = {
  message: <MessageSquare className="w-4 h-4" />,
  mention: <AtSign className="w-4 h-4" />,
  friend_request: <UserPlus className="w-4 h-4" />,
  room_invite: <Hash className="w-4 h-4" />,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    fetch("/api/notifications")
      .then(r => r.json())
      .then(d => { if (d.success) setNotifications(d.data.notifications || []); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
  };

  const deleteNotif = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    setNotifications(prev => prev.filter(n => n._id !== id));
  };

  const displayed = filter === "unread" ? notifications.filter(n => !n.isRead) : notifications;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-white/5 bg-surface-800/50 px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600/20 flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-brand-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] flex items-center justify-center">{unreadCount}</span>
              )}
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg">Notifications</h1>
              <p className="text-gray-400 text-sm">{unreadCount} unread</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1.5 transition-colors">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>
        <div className="flex gap-1">
          {(["all", "unread"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
                filter === f ? "bg-brand-600/20 text-brand-400" : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {f} {f === "unread" && unreadCount > 0 ? `(${unreadCount})` : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /></div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-white font-medium mb-2">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </h3>
            <p className="text-gray-400 text-sm">You're all caught up!</p>
          </div>
        ) : (
          <div className="max-w-2xl space-y-1">
            {displayed.map(notif => (
              <div
                key={notif._id}
                className={`group relative flex items-start gap-4 p-4 rounded-2xl transition-all cursor-pointer ${
                  !notif.isRead ? "bg-brand-600/5 border border-brand-500/10" : "hover:bg-white/[0.02]"
                }`}
                onClick={() => !notif.isRead && markRead(notif._id)}
              >
                {/* Icon + avatar */}
                <div className="relative flex-shrink-0">
                  {notif.sender ? (
                    <UserAvatar user={notif.sender} size="md" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-brand-400" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-surface-700 border border-surface-800 flex items-center justify-center text-brand-400">
                    {NOTIF_ICON[notif.type] || <Bell className="w-3 h-3" />}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{notif.title}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{notif.body}</p>
                  <p className="text-xs text-gray-600 mt-1">{formatRelativeTime(notif.createdAt)}</p>
                </div>

                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-full bg-brand-400 mt-2 flex-shrink-0" />
                )}

                <button
                  onClick={(e) => { e.stopPropagation(); deleteNotif(notif._id); }}
                  className="absolute right-3 top-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 text-gray-500 hover:text-white transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
