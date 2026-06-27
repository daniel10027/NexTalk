"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import MemberList from "./MemberList";
import PinnedMessages from "./PinnedMessages";
import CallModal from "@/components/modals/CallModal";
import IncomingCallModal from "@/components/modals/IncomingCallModal";
import { useChatStore } from "@/store/chatStore";
import { useSocket } from "@/hooks/useSocket";

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

interface Room {
  _id: string;
  name: string;
  type: "direct" | "group" | "channel";
  members: Array<{
    user: {
      _id: string;
      username: string;
      displayName: string;
      avatar?: string;
      status: string;
      role?: string;
    };
    role: string;
    nickname?: string;
  }>;
  settings?: { readOnly?: boolean };
  description?: string;
  avatar?: string;
  isPublic?: boolean;
}

interface IncomingCall {
  callId: string;
  callType: "audio" | "video";
  roomId: string;
  caller: { _id: string; displayName: string; avatar?: string };
}

export default function ChatRoom({
  room,
  currentUserId,
}: {
  room: Room;
  currentUserId?: string;
}) {
  const { data: session } = useSession();
  const userId = currentUserId || session?.user?.id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [activeCall, setActiveCall] = useState<{
    type: "audio" | "video";
    targetUser?: any;
  } | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  const { showMemberList, typingUsers } = useChatStore();
  const { socket, startTyping, stopTyping, acceptCall, declineCall } =
    useSocket();

  const otherUser =
    room.type === "direct"
      ? room.members.find((m) => m.user._id !== userId)?.user
      : undefined;

  // Écouter les événements socket directement
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: any) => {
      const msgRoomId = message.room?._id || message.room;
      if (msgRoomId !== room._id) return;
      setMessages((prev) =>
        prev.some((m) => m._id === message._id) ? prev : [...prev, message],
      );
    };

    const handleEditedMessage = (message: any) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === message._id ? { ...m, ...message } : m)),
      );
    };

    const handleDeletedMessage = ({ messageId }: any) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, isDeleted: true, content: "" } : m,
        ),
      );
    };

    const handleReaction = ({ messageId, reactions }: any) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m)),
      );
    };

    const handleIncomingCall = (data: IncomingCall) => {
      console.log("📞 ChatRoom received incoming call:", data);
      setIncomingCall(data);
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:edited", handleEditedMessage);
    socket.on("message:deleted", handleDeletedMessage);
    socket.on("message:reaction", handleReaction);
    socket.on("call:incoming", handleIncomingCall);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:edited", handleEditedMessage);
      socket.off("message:deleted", handleDeletedMessage);
      socket.off("message:reaction", handleReaction);
      socket.off("call:incoming", handleIncomingCall);
    };
  }, [socket, room._id]);

  // Charger les messages initiaux
  const fetchMessages = useCallback(
    async (before?: string) => {
      setIsLoading(true);
      try {
        const url = `/api/messages?roomId=${room._id}${before ? `&before=${before}` : ""}&limit=50`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          const msgs = data.data?.messages || data.data || [];
          if (before) setMessages((prev) => [...msgs, ...prev]);
          else setMessages(msgs);
          setHasMore(data.data?.hasMore || false);
        }
      } catch {}
      setIsLoading(false);
    },
    [room._id],
  );

  useEffect(() => {
    setMessages([]);
    fetchMessages();
  }, [room._id]);

  const handleSend = async (
    content: string,
    attachments?: string[],
    replyToId?: string,
  ) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) return;
    if (isSending) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room._id,
          content: content.trim(),
          attachments,
          replyTo: replyToId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const newMsg = data.data?.message || data.data;
        setMessages((prev) =>
          prev.some((m) => m._id === newMsg._id) ? prev : [...prev, newMsg],
        );
        if (replyTo) setReplyTo(null);
      }
    } catch {}
    setIsSending(false);
  };

  const handleEdit = async (messageId: string, content: string) => {
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId
              ? {
                  ...m,
                  content,
                  editHistory: [
                    ...(m.editHistory || []),
                    { content: m.content, editedAt: new Date().toISOString() },
                  ],
                }
              : m,
          ),
        );
        setEditingMessage(null);
      }
    } catch {}
  };

  const currentMember = room.members.find((m) => m.user._id === userId);
  const currentRole = currentMember?.role || "member";
  const isReadOnly = room.settings?.readOnly && currentRole === "member";
  const pinnedMessages = messages.filter((m) => m.isPinned);

  const roomTypingUsers = (typingUsers[room._id] || [])
    .filter((u) => u._id !== userId)
    .map((u) => u.displayName || u.username);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ChatHeader
        room={room}
        onInitiateCall={(type) =>
          setActiveCall({ type, targetUser: otherUser })
        }
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden">
          {pinnedMessages.length > 0 && (
            <PinnedMessages
              messages={pinnedMessages.map((m) => ({ ...m, sender: m.sender }))}
              canManage={currentRole === "owner" || currentRole === "admin"}
            />
          )}
          <MessageList
            roomId={room._id}
            messages={messages}
            isLoading={isLoading}
            hasMore={hasMore}
            onLoadMore={() => {
              if (messages.length > 0) fetchMessages(messages[0].createdAt);
            }}
            onReply={setReplyTo}
            onEdit={setEditingMessage}
            typingUsers={roomTypingUsers}
          />
          <MessageInput
            roomId={room._id}
            replyTo={replyTo}
            editingMessage={editingMessage}
            onCancelReply={() => setReplyTo(null)}
            onCancelEdit={() => setEditingMessage(null)}
            onSend={handleSend}
            onEdit={handleEdit}
            onTypingStart={() => startTyping(room._id)}
            onTypingStop={() => stopTyping(room._id)}
            disabled={!!isReadOnly}
            placeholder={`Message ${room.type === "direct" && otherUser ? otherUser.displayName : `#${room.name}`}`}
          />
        </div>
        {showMemberList && room.type !== "direct" && (
          <MemberList members={room.members} currentUserRole={currentRole} />
        )}
      </div>

      {activeCall && (
        <CallModal
          roomId={room._id}
          callType={activeCall.type}
          targetUser={activeCall.targetUser}
          onEnd={() => setActiveCall(null)}
        />
      )}

      {incomingCall && !activeCall && (
        <IncomingCallModal
          callId={incomingCall.callId}
          callType={incomingCall.callType}
          caller={incomingCall.caller}
          roomId={incomingCall.roomId}
          onAccept={() => {
            acceptCall(incomingCall.callId, incomingCall.roomId);
            setActiveCall({
              type: incomingCall.callType,
              targetUser: incomingCall.caller,
            });
            setIncomingCall(null);
          }}
          onDecline={() => {
            declineCall(incomingCall.callId, incomingCall.roomId);
            setIncomingCall(null);
          }}
        />
      )}
    </div>
  );
}
