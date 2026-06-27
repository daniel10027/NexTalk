// @ts-nocheck
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import connectDB from "@/lib/db/mongoose";
import { Invitation, Room, User } from "@/models";
import { apiResponse, apiError } from "@/lib/utils";

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError("Unauthorized", 401);
    await connectDB();
    const invite = await Invitation.findOne({ code: params.code }).populate("room");
    if (!invite) return apiError("Invalid invite code", 404);
    if (invite.expiresAt && new Date() > invite.expiresAt) return apiError("Invite has expired", 410);
    if (invite.maxUses && invite.uses >= invite.maxUses) return apiError("Invite limit reached", 410);

    if (invite.type === "room" && invite.room) {
      const room = await Room.findById(invite.room._id);
      if (!room) return apiError("Room not found", 404);
      const already = room.members.some((m: any) => m.user.toString() === session.user.id);
      if (!already) {
        room.members.push({ user: session.user.id, role: "member", joinedAt: new Date() });
        await room.save();
      }
      invite.uses = (invite.uses || 0) + 1;
      invite.usedBy = invite.usedBy || [];
      invite.usedBy.push({ user: session.user.id, usedAt: new Date() });
      await invite.save();
      return apiResponse({ joined: true, roomId: room._id });
    }

    if (invite.type === "friend") {
      await User.findByIdAndUpdate(session.user.id, { $addToSet: { friends: invite.inviter } });
      await User.findByIdAndUpdate(invite.inviter, { $addToSet: { friends: session.user.id } });
      invite.uses = (invite.uses || 0) + 1;
      await invite.save();
      return apiResponse({ joined: true });
    }

    return apiError("Unknown invite type", 400);
  } catch (err) {
    return apiError("Internal server error", 500);
  }
}
