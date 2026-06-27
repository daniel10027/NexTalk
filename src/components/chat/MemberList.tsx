"use client";

import { useState } from "react";
import { Crown, Shield, UserX, MoreVertical, MessageSquare } from "lucide-react";
import UserAvatar from "@/components/shared/UserAvatar";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Member {
  user: {
    _id: string;
    username: string;
    displayName: string;
    avatar?: string;
    status: string;
    role?: string;
  };
  role: "owner" | "admin" | "moderator" | "member";
  nickname?: string;
}

interface MemberListProps {
  members: Member[];
  currentUserRole: string;
}

const ROLE_ICON: Record<string, React.ReactNode> = {
  owner: <Crown className="w-3.5 h-3.5 text-yellow-400" />,
  admin: <Shield className="w-3.5 h-3.5 text-brand-400" />,
  moderator: <Shield className="w-3.5 h-3.5 text-green-400" />,
};

const STATUS_COLOR: Record<string, string> = {
  online: "bg-green-400",
  away: "bg-yellow-400",
  busy: "bg-red-400",
  offline: "bg-gray-500",
  invisible: "bg-gray-500",
};

export default function MemberList({ members, currentUserRole }: MemberListProps) {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = members.filter(m =>
    m.user.displayName.toLowerCase().includes(search.toLowerCase()) ||
    m.user.username.toLowerCase().includes(search.toLowerCase())
  );

  const groups = {
    Online: filtered.filter(m => m.user.status === "online" || m.user.status === "away" || m.user.status === "busy"),
    Offline: filtered.filter(m => m.user.status === "offline" || m.user.status === "invisible"),
  };

  const canManage = currentUserRole === "owner" || currentUserRole === "admin" || currentUserRole === "moderator";

  return (
    <div className="w-60 border-l border-white/5 bg-surface-900/50 flex flex-col">
      <div className="p-4 border-b border-white/5">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Members — {members.length}</h3>
        <input
          type="text"
          placeholder="Search members..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full input-base text-sm py-1.5 px-3"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {Object.entries(groups).map(([label, groupMembers]) => {
          if (groupMembers.length === 0) return null;
          return (
            <div key={label} className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
                {label} — {groupMembers.length}
              </p>
              {groupMembers.map(member => (
                <div
                  key={member.user._id}
                  className="relative flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
                  onMouseEnter={() => setHoveredId(member.user._id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className="relative flex-shrink-0">
                    <UserAvatar user={member.user} size="sm" />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-900 ${STATUS_COLOR[member.user.status]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-gray-200 truncate">
                        {member.nickname || member.user.displayName}
                        {member.user._id === session?.user?.id && <span className="text-gray-500 text-xs"> (you)</span>}
                      </span>
                      {ROLE_ICON[member.role]}
                    </div>
                    <p className="text-xs text-gray-500 truncate">@{member.user.username}</p>
                  </div>

                  {/* Hover actions */}
                  {hoveredId === member.user._id && member.user._id !== session?.user?.id && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/chat?dm=${member.user._id}`}
                        className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title="Send DM"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </Link>
                      {canManage && (
                        <button className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors" title="Kick">
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
