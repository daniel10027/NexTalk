// @ts-nocheck
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db/mongoose";
import { Message, Room, User } from "@/models";
import { authOptions } from "@/lib/auth/options";
import { apiResponse, apiError, extractMentions } from "@/lib/utils";

// GET: Charger les messages d'un room
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const { searchParams } = req.nextUrl;
    const roomId = searchParams.get("roomId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const before = searchParams.get("before");

    if (!roomId) return apiError("roomId required");

    await connectDB();

    // Vérifier que l'utilisateur est membre
    const room = await Room.findOne({
      _id: roomId,
      "members.user": session.user.id,
    });
    if (!room) return apiError("Not a member of this room", 403);

    const query: any = { room: roomId };
    if (before) query.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(query)
      .populate("sender", "username displayName avatar status role")
      .populate({
        path: "replyTo",
        populate: { path: "sender", select: "username displayName avatar" },
      })
      .sort({ createdAt: 1 })
      .limit(limit);

    const total = await Message.countDocuments({ room: roomId });

    return apiResponse({
      messages,
      hasMore: before ? messages.length === limit : total > limit,
    });
  } catch (err) {
    console.error("GET /api/messages error:", err);
    return apiError("Internal server error", 500);
  }
}

// POST: Envoyer un message
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const body = await req.json();
    const { roomId, content, attachments, replyTo, type = "text" } = body;

    if (!roomId) return apiError("roomId required");
    if (!content?.trim() && (!attachments || attachments.length === 0)) {
      return apiError("Message cannot be empty");
    }

    await connectDB();

    // Vérifier membership
    const room = await Room.findOne({
      _id: roomId,
      "members.user": session.user.id,
    });
    if (!room) return apiError("Not a member of this room", 403);

    // Extraire mentions
    const mentionUsernames = content ? extractMentions(content) : [];
    let mentionIds: string[] = [];
    if (mentionUsernames.length > 0) {
      const mentionedUsers = await User.find({
        username: { $in: mentionUsernames },
      }).select("_id");
      mentionIds = mentionedUsers.map((u: any) => u._id);
    }

    const message = await Message.create({
      content: content?.trim() || "",
      type,
      sender: session.user.id,
      room: roomId,
      replyTo: replyTo || null,
      attachments: attachments || [],
      mentions: mentionIds,
    });

    // Populate pour la réponse
    const populated = await Message.findById(message._id)
      .populate("sender", "username displayName avatar status role")
      .populate({
        path: "replyTo",
        populate: { path: "sender", select: "username displayName avatar" },
      });

    // Update lastMessage du room
    await Room.findByIdAndUpdate(roomId, { updatedAt: new Date() });

    // Émettre via Socket.IO si disponible
    try {
      const io = (global as any).io;
      if (io) {
        io.to(roomId).emit("message:new", populated);
      }
    } catch {}

    return apiResponse({ message: populated }, 201);
  } catch (err) {
    console.error("POST /api/messages error:", err);
    return apiError("Internal server error", 500);
  }
}
