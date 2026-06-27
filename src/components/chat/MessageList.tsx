"use client";

import { useEffect, useRef, useCallback } from "react";
import MessageItem from "./MessageItem";
import { useChatStore } from "@/store/chatStore";
import { useSession } from "next-auth/react";
import { Loader2, Hash, Users } from "lucide-react";

interface Message {
  _id: string;
  content: string;
  type: string;
  sender: { _id: string; username: string; displayName: string; avatar?: string; role?: string };
  createdAt: string;
  editHistory?: Array<{ content: string; editedAt: string }>;
  replyTo?: { _id: string; content: string; sender: { displayName: string } };
  reactions?: Array<{ emoji: string; users: string[]; count: number }>;
  attachments?: Array<{ url: string; name: string; size: number; type: string }>;
  mentions?: Array<{ _id: string; username: string }>;
  isPinned?: boolean;
  isDeleted?: boolean;
  readBy?: string[];
  deliveredTo?: string[];
}

interface MessageListProps {
  roomId: string;
  messages: Message[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
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
}: MessageListProps) {
  const { data: session } = useSession();
  const bottomRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeight = useRef(0);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messages.length > 0) {
      const container = containerRef.current;
      if (!container) return;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
      if (isNearBottom) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages.length]);

  // Maintain scroll position when loading more
  useEffect(() => {
    if (!isLoading && containerRef.current) {
      const newScrollHeight = containerRef.current.scrollHeight;
      const diff = newScrollHeight - prevScrollHeight.current;
      containerRef.current.scrollTop += diff;
    }
  }, [isLoading]);

  // Intersection observer for infinite scroll
  const handleTopIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && hasMore && !isLoading) {
      prevScrollHeight.current = containerRef.current?.scrollHeight || 0;
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleTopIntersect, { threshold: 0.1 });
    if (topRef.current) observer.observe(topRef.current);
    return () => observer.disconnect();
  }, [handleTopIntersect]);

  const shouldShowAvatar = (index: number): boolean => {
    if (index === 0) return true;
    const prev = messages[index - 1];
    const curr = messages[index];
    if (prev.sender._id !== curr.sender._id) return true;
    const timeDiff = new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime();
    return timeDiff > 5 * 60 * 1000; // 5 min gap
  };

  const shouldShowDateDivider = (index: number): boolean => {
    if (index === 0) return true;
    const prev = new Date(messages[index - 1].createdAt).toDateString();
    const curr = new Date(messages[index].createdAt).toDateString();
    return prev !== curr;
  };

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto py-2 scroll-smooth">
      {/* Top sentinel for infinite scroll */}
      <div ref={topRef} className="h-1" />

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
        </div>
      )}

      {/* Welcome message */}
      {!hasMore && messages.length > 0 && (
        <div className="px-6 py-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-600/20 flex items-center justify-center mx-auto mb-4">
            <Hash className="w-8 h-8 text-brand-400" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-1">Beginning of the conversation</h3>
          <p className="text-gray-400 text-sm">This is the start of this channel's history.</p>
        </div>
      )}

      {/* Messages */}
      {messages.map((message, index) => (
        <MessageItem
          key={message._id}
          message={message}
          isOwn={message.sender._id === session?.user?.id}
          showAvatar={shouldShowAvatar(index)}
          showDateDivider={shouldShowDateDivider(index)}
          onReply={onReply}
          onEdit={onEdit}
          roomId={roomId}
        />
      ))}

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2 flex items-center gap-3">
          <div className="w-10 flex-shrink-0" />
          <div className="flex items-center gap-2">
            <div className="flex gap-1 items-center bg-surface-700 rounded-full px-3 py-2">
              <span className="typing-dot" />
              <span className="typing-dot" style={{ animationDelay: "0.2s" }} />
              <span className="typing-dot" style={{ animationDelay: "0.4s" }} />
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
    </div>
  );
}
