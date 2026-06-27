"use client";

import {
  cn,
  getInitials,
  generateAvatarColor,
  STATUS_COLORS,
} from "@/lib/utils";
import { useChatStore } from "@/store/chatStore";

interface UserObject {
  _id?: string;
  username?: string;
  displayName?: string;
  name?: string;
  avatar?: string;
  image?: string;
  status?: string;
}

interface UserAvatarProps {
  // Accepte soit un objet user, soit src+name séparément
  user?: UserObject;
  src?: string | null;
  name?: string;
  userId?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showStatus?: boolean;
  status?: string;
  className?: string;
}

const SIZE_MAP = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-xl",
};

const DOT_SIZE: Record<string, string> = {
  xs: "w-1.5 h-1.5",
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
  xl: "w-4 h-4",
};

export default function UserAvatar({
  user,
  src,
  name,
  userId,
  size = "md",
  showStatus = false,
  status,
  className,
}: UserAvatarProps) {
  const { onlineUsers } = useChatStore();

  // Résoudre les valeurs depuis user ou props directes
  const resolvedSrc = src || user?.avatar || user?.image || null;
  const resolvedName =
    name || user?.displayName || user?.name || user?.username || "?";
  const resolvedUserId = userId || user?._id || "";
  const resolvedStatus =
    status ||
    user?.status ||
    (resolvedUserId ? onlineUsers[resolvedUserId] : undefined) ||
    "offline";

  const initials = getInitials(resolvedName);
  const bgColor = generateAvatarColor(resolvedName + resolvedUserId);

  return (
    <div className={cn("relative flex-shrink-0", SIZE_MAP[size], className)}>
      {resolvedSrc ? (
        <img
          src={resolvedSrc}
          alt={resolvedName}
          className="rounded-full w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div
          className="rounded-full w-full h-full flex items-center justify-center font-semibold text-white"
          style={{ background: bgColor }}
        >
          {initials}
        </div>
      )}
      {showStatus && resolvedStatus !== "invisible" && (
        <div
          className={cn(
            DOT_SIZE[size],
            "rounded-full absolute bottom-0 right-0 border-2",
          )}
          style={{
            background: STATUS_COLORS[resolvedStatus] || STATUS_COLORS.offline,
            borderColor: "#090e1a",
          }}
        />
      )}
    </div>
  );
}
