// @ts-nocheck
"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import { useChatStore } from "@/store/chatStore";

let socket: Socket | null = null;
let socketUserId: string | null = null;

export function useSocket() {
  const { data: session } = useSession();
  const initialized = useRef(false);
  const {
    addMessage,
    updateMessage,
    deleteMessage: storeDeleteMessage,
    setTypingUser,
    removeTypingUser,
    setUserStatus,
  } = useChatStore();

  useEffect(() => {
    if (!session?.user?.id) return;
    // Si déjà connecté avec le même user, ne pas reconnecter
    if (socket?.connected && socketUserId === session.user.id) return;
    if (initialized.current) return;
    initialized.current = true;
    socketUserId = session.user.id;

    console.log("🔄 Connecting socket for user:", session.user.id);

    socket = io(window.location.origin, {
      auth: { userId: session.user.id },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log(
        "✅ Socket connected! ID:",
        socket?.id,
        "User:",
        session.user.id,
      );
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connect_error:", err.message, err);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected. Reason:", reason);
    });

    socket.on("message:new", (message: any) => {
      console.log("📨 New message via socket:", message._id);
      addMessage(message.room?._id || message.room, message);
    });

    socket.on("message:edited", (message: any) => {
      updateMessage(message.room?._id || message.room, message._id, message);
    });

    socket.on("message:deleted", ({ messageId, roomId }: any) => {
      storeDeleteMessage(roomId, messageId);
    });

    socket.on("message:reaction", ({ messageId, reactions }: any) => {
      console.log("👍 Reaction update:", messageId);
    });

    socket.on("typing:start", ({ userId, roomId }: any) => {
      setTypingUser(roomId, userId);
    });

    socket.on("typing:stop", ({ userId, roomId }: any) => {
      removeTypingUser(roomId, userId);
    });

    socket.on("user:status", ({ userId, status }: any) => {
      setUserStatus(userId, status);
    });

    // Logs appels
    socket.on("call:incoming", (data: any) => {
      console.log("📞 Incoming call:", data);
    });

    socket.on("call:initiated", (data: any) => {
      console.log("📞 Call initiated:", data);
    });

    socket.on("call:accepted", (data: any) => {
      console.log("📞 Call accepted:", data);
    });

    socket.on("call:declined", (data: any) => {
      console.log("📞 Call declined:", data);
    });

    socket.on("webrtc:offer", (data: any) => {
      console.log("🔗 WebRTC offer received");
    });

    socket.on("webrtc:answer", (data: any) => {
      console.log("🔗 WebRTC answer received");
    });

    socket.on("webrtc:ice-candidate", (data: any) => {
      console.log("🧊 ICE candidate received");
    });

    return () => {
      initialized.current = false;
      socketUserId = null;
      socket?.disconnect();
      socket = null;
    };
  }, [session?.user?.id]);

  // ─── Méthodes ────────────────────────────────────────────────

  const sendMessage = useCallback(
    (
      roomId: string,
      content: string,
      attachments?: string[],
      replyTo?: string,
    ) => {
      socket?.emit("message:send", { roomId, content, attachments, replyTo });
    },
    [],
  );

  const editMessage = useCallback(
    (roomId: string, messageId: string, content: string) => {
      socket?.emit("message:edit", { roomId, messageId, content });
    },
    [],
  );

  const reactToMessage = useCallback(
    (roomId: string, messageId: string, emoji: string) => {
      socket?.emit("message:react", { roomId, messageId, emoji });
    },
    [],
  );

  const deleteMessage = useCallback((roomId: string, messageId: string) => {
    socket?.emit("message:delete", { roomId, messageId });
  }, []);

  const pinMessage = useCallback((roomId: string, messageId: string) => {
    socket?.emit("message:pin", { roomId, messageId });
  }, []);

  const startTyping = useCallback((roomId: string) => {
    socket?.emit("typing:start", { roomId });
  }, []);

  const stopTyping = useCallback((roomId: string) => {
    socket?.emit("typing:stop", { roomId });
  }, []);

  const updateStatus = useCallback((status: string) => {
    socket?.emit("status:update", { status });
  }, []);

  const markRead = useCallback((roomId: string) => {
    socket?.emit("message:read", { roomId });
  }, []);

  // ─── Appels ──────────────────────────────────────────────────

  const initiateCall = useCallback(
    (roomId: string, callType: "audio" | "video", targetUserId?: string) => {
      console.log("📞 Emitting call:initiate to", targetUserId);
      socket?.emit("call:initiate", { roomId, callType, targetUserId });
    },
    [],
  );

  const acceptCall = useCallback((callId: string, roomId: string) => {
    console.log("📞 Emitting call:accept", callId);
    socket?.emit("call:accept", { callId, roomId });
  }, []);

  const declineCall = useCallback((callId: string, roomId: string) => {
    socket?.emit("call:decline", { callId, roomId });
  }, []);

  const endCall = useCallback((callId: string, roomId: string) => {
    socket?.emit("call:end", { callId, roomId });
  }, []);

  const sendOffer = useCallback(
    (
      targetUserId: string,
      offer: RTCSessionDescriptionInit,
      callId: string,
    ) => {
      console.log("🔗 Sending WebRTC offer to", targetUserId);
      socket?.emit("webrtc:offer", { targetUserId, offer, callId });
    },
    [],
  );

  const sendAnswer = useCallback(
    (
      targetUserId: string,
      answer: RTCSessionDescriptionInit,
      callId: string,
    ) => {
      console.log("🔗 Sending WebRTC answer to", targetUserId);
      socket?.emit("webrtc:answer", { targetUserId, answer, callId });
    },
    [],
  );

  const sendIceCandidate = useCallback(
    (targetUserId: string, candidate: RTCIceCandidate, callId: string) => {
      socket?.emit("webrtc:ice-candidate", { targetUserId, candidate, callId });
    },
    [],
  );

  // ─── Listeners (retournent une fonction de cleanup) ──────────

  const onCallIncoming = useCallback((cb: (data: any) => void) => {
    socket?.on("call:incoming", cb);
    return () => socket?.off("call:incoming", cb);
  }, []);

  const onCallAccepted = useCallback((cb: (data: any) => void) => {
    socket?.on("call:accepted", cb);
    return () => socket?.off("call:accepted", cb);
  }, []);

  const onCallDeclined = useCallback((cb: (data: any) => void) => {
    socket?.on("call:declined", cb);
    return () => socket?.off("call:declined", cb);
  }, []);

  const onCallEnded = useCallback((cb: (data: any) => void) => {
    socket?.on("call:ended", cb);
    return () => socket?.off("call:ended", cb);
  }, []);

  const onWebRTCOffer = useCallback((cb: (data: any) => void) => {
    socket?.on("webrtc:offer", cb);
    return () => socket?.off("webrtc:offer", cb);
  }, []);

  const onWebRTCAnswer = useCallback((cb: (data: any) => void) => {
    socket?.on("webrtc:answer", cb);
    return () => socket?.off("webrtc:answer", cb);
  }, []);

  const onWebRTCIceCandidate = useCallback((cb: (data: any) => void) => {
    socket?.on("webrtc:ice-candidate", cb);
    return () => socket?.off("webrtc:ice-candidate", cb);
  }, []);

  return {
    socket,
    sendMessage,
    editMessage,
    startTyping,
    stopTyping,
    updateStatus,
    markRead,
    reactToMessage,
    deleteMessage,
    pinMessage,
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    onCallIncoming,
    onCallAccepted,
    onCallDeclined,
    onCallEnded,
    onWebRTCOffer,
    onWebRTCAnswer,
    onWebRTCIceCandidate,
  };
}
