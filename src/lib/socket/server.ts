// @ts-nocheck
import { Server as SocketIOServer } from "socket.io";
import connectDB from "@/lib/db/mongoose";
import { User, Room, Message, Notification, Call } from "@/models";

export function initSocketServer(io: SocketIOServer) {
  // Pas d'auth strict — on identifie via userId envoyé à la connexion
  io.on("connection", async (socket) => {
    const userId = socket.handshake.auth.userId;
    if (!userId) {
      console.log("Socket sans userId, connexion refusée");
      socket.disconnect();
      return;
    }

    console.log(`🔌 Socket connected: ${userId}`);

    try {
      await connectDB();
      await User.findByIdAndUpdate(userId, {
        status: "online",
        lastSeen: new Date(),
      });
      socket.broadcast.emit("user:status", { userId, status: "online" });

      // Rejoindre les rooms de l'utilisateur
      const rooms = await Room.find({ "members.user": userId }).select("_id");
      rooms.forEach((room) => socket.join(room._id.toString()));
      socket.join(`user:${userId}`);
    } catch (err) {
      console.error("Socket connection error:", err);
    }

    // ─── Messages ────────────────────────────────────────────
    socket.on(
      "message:send",
      async ({ roomId, content, attachments, replyTo }) => {
        try {
          await connectDB();
          const room = await Room.findOne({
            _id: roomId,
            "members.user": userId,
          });
          if (!room) return;

          const message = await Message.create({
            content: content || "",
            type: "text",
            sender: userId,
            room: roomId,
            replyTo: replyTo || null,
            attachments: attachments || [],
          });

          const populated = await Message.findById(message._id)
            .populate("sender", "username displayName avatar status")
            .populate({
              path: "replyTo",
              populate: { path: "sender", select: "username displayName" },
            });

          io.to(roomId).emit("message:new", populated);
          await Room.findByIdAndUpdate(roomId, { updatedAt: new Date() });
        } catch (err) {
          console.error("message:send error:", err);
        }
      },
    );

    socket.on("message:edit", async ({ roomId, messageId, content }) => {
      try {
        await connectDB();
        const msg = await Message.findOneAndUpdate(
          { _id: messageId, sender: userId },
          {
            content,
            $push: { editHistory: { content, editedAt: new Date() } },
          },
          { new: true },
        ).populate("sender", "username displayName avatar");
        if (msg) io.to(roomId).emit("message:edited", msg);
      } catch {}
    });

    socket.on("message:delete", async ({ roomId, messageId }) => {
      try {
        await connectDB();
        await Message.findOneAndUpdate(
          { _id: messageId, sender: userId },
          { isDeleted: true, content: "" },
        );
        io.to(roomId).emit("message:deleted", { messageId, roomId });
      } catch {}
    });

    socket.on("message:react", async ({ roomId, messageId, emoji }) => {
      try {
        await connectDB();
        const msg = await Message.findById(messageId);
        if (!msg) return;
        const reactionIdx = msg.reactions.findIndex(
          (r: any) => r.emoji === emoji,
        );
        if (reactionIdx === -1) {
          msg.reactions.push({ emoji, users: [userId], count: 1 });
        } else {
          const reaction = msg.reactions[reactionIdx];
          const userIdx = reaction.users.indexOf(userId);
          if (userIdx === -1) {
            reaction.users.push(userId);
            reaction.count++;
          } else {
            reaction.users.splice(userIdx, 1);
            reaction.count--;
            if (reaction.count === 0) msg.reactions.splice(reactionIdx, 1);
          }
        }
        await msg.save();
        io.to(roomId).emit("message:reaction", {
          messageId,
          reactions: msg.reactions,
        });
      } catch {}
    });

    // ─── Typing ──────────────────────────────────────────────
    socket.on("typing:start", ({ roomId }) => {
      socket.to(roomId).emit("typing:start", { userId, roomId });
    });

    socket.on("typing:stop", ({ roomId }) => {
      socket.to(roomId).emit("typing:stop", { userId, roomId });
    });

    // ─── Status ──────────────────────────────────────────────
    socket.on("status:update", async ({ status }) => {
      try {
        await connectDB();
        await User.findByIdAndUpdate(userId, { status });
        socket.broadcast.emit("user:status", { userId, status });
      } catch {}
    });

    // ─── Read receipts ───────────────────────────────────────
    socket.on("message:read", async ({ roomId }) => {
      try {
        await connectDB();
        await Room.findByIdAndUpdate(
          { _id: roomId, "members.user": userId },
          { "members.$.lastRead": new Date() },
        );
        socket.to(roomId).emit("message:read", { userId, roomId });
      } catch {}
    });

    // ─── WebRTC Signaling ────────────────────────────────────

    // Initier un appel
    socket.on("call:initiate", async ({ roomId, callType, targetUserId }) => {
      try {
        await connectDB();
        const caller = await User.findById(userId).select(
          "displayName username avatar",
        );

        // Créer le call dans la DB
        const call = await Call.create({
          room: roomId,
          type: callType,
          initiator: userId,
          participants: [{ user: userId, joinedAt: new Date() }],
          status: "ringing",
          startedAt: new Date(),
        });

        // Notifier le destinataire
        const targetRoom = targetUserId ? `user:${targetUserId}` : roomId;
        io.to(targetRoom).emit("call:incoming", {
          callId: call._id,
          callType,
          roomId,
          caller: {
            _id: userId,
            displayName: caller?.displayName,
            avatar: caller?.avatar,
          },
        });

        // Confirmer à l'appelant
        socket.emit("call:initiated", { callId: call._id });
      } catch (err) {
        console.error("call:initiate error:", err);
      }
    });

    // Accepter un appel
    socket.on("call:accept", async ({ callId, roomId }) => {
      try {
        await connectDB();
        await Call.findByIdAndUpdate(callId, {
          status: "active",
          $push: { participants: { user: userId, joinedAt: new Date() } },
        });
        // Notifier tous dans la room que l'appel est accepté
        io.to(roomId).emit("call:accepted", { callId, userId });
      } catch {}
    });

    // Refuser un appel
    socket.on("call:decline", async ({ callId, roomId }) => {
      try {
        await connectDB();
        await Call.findByIdAndUpdate(callId, {
          status: "declined",
          endedAt: new Date(),
        });
        io.to(roomId).emit("call:declined", { callId, userId });
      } catch {}
    });

    // Terminer un appel
    socket.on("call:end", async ({ callId, roomId }) => {
      try {
        await connectDB();
        const call = await Call.findById(callId);
        if (call) {
          const duration = Math.floor(
            (Date.now() - new Date(call.startedAt).getTime()) / 1000,
          );
          await Call.findByIdAndUpdate(callId, {
            status: "completed",
            endedAt: new Date(),
            duration,
          });
        }
        io.to(roomId).emit("call:ended", { callId, userId });
      } catch {}
    });

    // ─── WebRTC SDP Exchange ─────────────────────────────────
    socket.on("webrtc:offer", ({ targetUserId, offer, callId }) => {
      io.to(`user:${targetUserId}`).emit("webrtc:offer", {
        offer,
        callId,
        fromUserId: userId,
      });
    });

    socket.on("webrtc:answer", ({ targetUserId, answer, callId }) => {
      io.to(`user:${targetUserId}`).emit("webrtc:answer", {
        answer,
        callId,
        fromUserId: userId,
      });
    });

    socket.on("webrtc:ice-candidate", ({ targetUserId, candidate, callId }) => {
      io.to(`user:${targetUserId}`).emit("webrtc:ice-candidate", {
        candidate,
        callId,
        fromUserId: userId,
      });
    });

    // ─── Disconnect ──────────────────────────────────────────
    socket.on("disconnect", async () => {
      console.log(`🔌 Socket disconnected: ${userId}`);
      try {
        await connectDB();
        await User.findByIdAndUpdate(userId, {
          status: "offline",
          lastSeen: new Date(),
        });
        socket.broadcast.emit("user:status", { userId, status: "offline" });
      } catch {}
    });
  });
}
