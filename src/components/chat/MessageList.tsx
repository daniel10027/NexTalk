"use client";

import { useEffect, useRef, useCallback } from "react";
import MessageItem from "./MessageItem";
import { useSession } from "next-auth/react";
import { Loader2, Hash } from "lucide-react";

interface Message {
  _id: string;
  content: string;
  type: string;
  sender: {
    _id: string;
    username: string;
    displayName: string;
    avatar?: string;
    role?: string;
  };
  createdAt: string;
  editHistory?: Array<{ content: string; editedAt: string }>;
  replyTo?: { _id: string; content: string; sender: { displayName: string } };
  reactions?: Array<{ emoji: string; users: string[]; count: number }>;
  attachments?: any[];
  isPinned?: boolean;
  isDeleted?: boolean;
  readBy?: string[];
}

interface Props {
  roomId: string;
  messages: Message[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onReply: (m: Message) => void;
  onEdit: (m: Message) => void;
  typingUsers: string[];
}

export default function MessageList({
  roomId,
  messages,
  isLoading,
  hasMore,
  onLoadMore,
  onReply,
  onEdit,
  typingUsers,
}: Props) {
  const { data: session } = useSession();
  const bottomRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeight = useRef(0);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (!messages.length) return;
    const container = containerRef.current;
    if (!container) return;
    const nearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      300;
    if (nearBottom) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Maintain scroll when loading older messages
  useEffect(() => {
    if (!isLoading && containerRef.current) {
      const diff = containerRef.current.scrollHeight - prevScrollHeight.current;
      containerRef.current.scrollTop += diff;
    }
  }, [isLoading]);

  const handleTopIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        prevScrollHeight.current = containerRef.current?.scrollHeight || 0;
        onLoadMore();
      }
    },
    [hasMore, isLoading, onLoadMore],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleTopIntersect, {
      threshold: 0.1,
    });
    if (topRef.current) observer.observe(topRef.current);
    return () => observer.disconnect();
  }, [handleTopIntersect]);

  const shouldShowAvatar = (idx: number) => {
    if (idx === 0) return true;
    const prev = messages[idx - 1];
    const curr = messages[idx];
    if (prev.sender._id !== curr.sender._id) return true;
    return (
      new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime() >
      5 * 60 * 1000
    );
  };

  const shouldShowDate = (idx: number) => {
    if (idx === 0) return true;
    return (
      new Date(messages[idx - 1].createdAt).toDateString() !==
      new Date(messages[idx].createdAt).toDateString()
    );
  };

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto py-2">
      <div ref={topRef} className="h-1" />

      {isLoading && (
        <div className="flex justify-center py-4">
          <Loader2
            className="w-5 h-5 animate-spin"
            style={{ color: "#818cf8" }}
          />
        </div>
      )}

      {!hasMore && messages.length > 0 && (
        <div className="px-6 py-6 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: "rgba(99,102,241,0.15)" }}
          >
            <Hash className="w-7 h-7" style={{ color: "#818cf8" }} />
          </div>
          <p className="text-white font-medium text-sm">
            Beginning of conversation
          </p>
        </div>
      )}

      {messages.map((message, idx) => {
        const isOwn = message.sender._id === session?.user?.id;
        return (
          <MessageItem
            key={message._id}
            message={message}
            isOwn={isOwn}
            showAvatar={shouldShowAvatar(idx)}
            showDateDivider={shouldShowDate(idx)}
            onReply={onReply}
            onEdit={onEdit}
            roomId={roomId}
          />
        );
      })}

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2 flex items-center gap-3">
          <div className="w-10 flex-shrink-0" />
          <div className="flex items-center gap-2">
            <div
              className="flex gap-1 px-3 py-2 rounded-full"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full inline-block"
                  style={{
                    background: "#9ca3af",
                    animation: `typing 1.4s infinite ${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400">
              {typingUsers.length === 1
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.join(", ")} are typing...`}
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} className="h-4" />

      <style>{`
        @keyframes typing {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
