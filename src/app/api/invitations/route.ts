// @ts-nocheck
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import connectDB from "@/lib/db/mongoose";
import { Invitation } from "@/models";
import { apiResponse, apiError, generateInviteCode } from "@/lib/utils";
import { sendInvitationEmail } from "@/lib/email/mailer";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError("Unauthorized", 401);
    const { roomId, type, email, maxUses, expiresInDays = 7 } = await req.json();
    await connectDB();
    const code = generateInviteCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    const invitation = await Invitation.create({
      code,
      type: type || "room",
      inviter: session.user.id,
      room: roomId,
      email,
      maxUses: maxUses || null,
      expiresAt,
    });
    if (email) {
      await sendInvitationEmail(email, session.user.name || "Someone", `${process.env.NEXTAUTH_URL}/invite/${code}`, "the room");
    }
    return apiResponse({ code, invitation }, 201);
  } catch (err) {
    return apiError("Internal server error", 500);
  }
}
