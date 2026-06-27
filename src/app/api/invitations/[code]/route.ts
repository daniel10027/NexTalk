// @ts-nocheck
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import connectDB from "@/lib/db/mongoose";
import { Invitation, Room } from "@/models";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    await connectDB();
    const invite = await Invitation.findOne({ code: params.code })
      .populate("inviter", "displayName username avatar")
      .populate("room", "name type description memberCount");
    if (!invite) return apiError("Invalid invite code", 404);
    if (invite.expiresAt && new Date() > invite.expiresAt) return apiError("Invite has expired", 410);
    if (invite.maxUses && invite.uses >= invite.maxUses) return apiError("Invite has reached its maximum uses", 410);
    return apiResponse({ type: invite.type, room: invite.room, inviter: invite.inviter, expiresAt: invite.expiresAt, maxUses: invite.maxUses, uses: invite.uses });
  } catch (err) {
    return apiError("Internal server error", 500);
  }
}
