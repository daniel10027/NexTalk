// @ts-nocheck
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import connectDB from "@/lib/db/mongoose";
import { Room } from "@/models";
import { apiResponse, apiError } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError("Unauthorized", 401);

    const { userId } = await req.json();
    if (!userId) return apiError("userId required", 400);
    if (userId === session.user.id) return apiError("Cannot DM yourself", 400);

    await connectDB();

    // Chercher DM existant
    const existing = await Room.findOne({
      type: "direct",
      "members.user": { $all: [session.user.id, userId] },
      $expr: { $eq: [{ $size: "$members" }, 2] },
    }).populate("members.user", "displayName username avatar status");

    if (existing) return apiResponse({ room: existing });

    // Créer nouveau DM
    const room = await Room.create({
      type: "direct",
      members: [
        { user: session.user.id, role: "member", joinedAt: new Date() },
        { user: userId, role: "member", joinedAt: new Date() },
      ],
      isPublic: false,
    });

    const populated = await Room.findById(room._id).populate(
      "members.user",
      "displayName username avatar status",
    );

    return apiResponse({ room: populated }, 201);
  } catch (err) {
    return apiError("Internal server error", 500);
  }
}
