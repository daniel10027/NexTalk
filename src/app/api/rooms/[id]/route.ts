// @ts-nocheck
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import connectDB from "@/lib/db/mongoose";
import { Room, AuditLog } from "@/models";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError("Unauthorized", 401);
    await connectDB();

    const room = await Room.findById(params.id)
      .populate("members.user", "displayName username avatar status role")
      .populate("owner", "displayName username avatar");

    if (!room) return apiError("Room not found", 404);

    // Filtrer les membres dont le user a été supprimé
    room.members = room.members.filter((m: any) => m.user && m.user._id);

    const isMember = room.members.some(
      (m: any) => m.user._id.toString() === session.user.id,
    );
    if (!isMember && !room.isPublic) return apiError("Not a member", 403);

    return apiResponse({ room });
  } catch (err) {
    console.error("GET /api/rooms/[id] error:", err);
    return apiError("Internal server error", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError("Unauthorized", 401);
    await connectDB();
    const room = await Room.findById(params.id);
    if (!room) return apiError("Room not found", 404);
    const member = room.members.find(
      (m: any) => m.user?.toString() === session.user.id,
    );
    if (!member || !["owner", "admin"].includes(member.role))
      return apiError("Forbidden", 403);
    const body = await req.json();
    const allowed = [
      "name",
      "description",
      "avatar",
      "banner",
      "isPublic",
      "settings",
      "tags",
    ];
    for (const key of allowed) {
      if (body[key] !== undefined) (room as any)[key] = body[key];
    }
    await room.save();
    return apiResponse({ room });
  } catch (err) {
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError("Unauthorized", 401);
    await connectDB();
    const room = await Room.findById(params.id);
    if (!room) return apiError("Room not found", 404);
    const isOwner = room.owner.toString() === session.user.id;
    if (!isOwner && session.user.role !== "admin")
      return apiError("Forbidden", 403);
    await Room.findByIdAndDelete(params.id);
    await AuditLog.create({
      actor: session.user.id,
      action: "room_deleted",
      targetModel: "Room",
      targetId: params.id,
      severity: "medium",
    });
    return apiResponse({ deleted: true });
  } catch (err) {
    return apiError("Internal server error", 500);
  }
}
