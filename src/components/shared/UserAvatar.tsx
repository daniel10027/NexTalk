"use client";

import Image from "next/image";
import { cn, getInitials, generateAvatarColor, STATUS_COLORS } from "@/lib/utils";
import { useChatStore } from "@/store/chatStore";
import { useSession } from "next-auth/react";

interface UserAvatarProps {
  src?: string | null;
  name: string;
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
  src,
  name,
  userId,
  size = "md",
  showStatus = false,
  status,
  className,
}: UserAvatarProps) {
  const { onlineUsers } = useChatStore();
  const resolvedStatus = status || (userId ? onlineUsers[userId] : undefined) || "offline";

  return (
    <div className={cn("relative flex-shrink-0", SIZE_MAP[size], className)}>
      {src ? (
        <div className={cn("rounded-full overflow-hidden w-full h-full")}>
          <Image src={src} alt={name} fill className="object-cover" sizes="64px" />
        </div>
      ) : (
        <div
          className={cn("rounded-full w-full h-full flex items-center justify-center font-semibold text-white")}
          style={{ background: generateAvatarColor(name + (userId || "")) }}
        >
          {getInitials(name)}
        </div>
      )}
      {showStatus && resolvedStatus !== "invisible" && (
        <div
          className={cn(
            DOT_SIZE[size],
            "rounded-full absolute bottom-0 right-0 border-2 border-surface-900"
          )}
          style={{ background: STATUS_COLORS[resolvedStatus] || STATUS_COLORS.offline }}
        />
      )}
    </div>
  );
}
