// @ts-nocheck
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import connectDB from "@/lib/db/mongoose";
import { Room } from "@/models";
import { apiResponse, apiError } from "@/lib/utils";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError("Unauthorized", 401);
    await connectDB();
    const room = await Room.findById(params.id);
    if (!room) return apiError("Room not found", 404);
    const already = room.members.some(
      (m: any) => m.user.toString() === session.user.id,
    );
    if (!already) {
      room.members.push({
        user: session.user.id,
        role: "member",
        joinedAt: new Date(),
      });
      room.memberCount = room.members.length;
      await room.save();
    }
    const populated = await Room.findById(params.id).populate(
      "members.user",
      "displayName username avatar status",
    );
    return apiResponse({ room: populated });
  } catch (err) {
    return apiError("Internal server error", 500);
  }
}
