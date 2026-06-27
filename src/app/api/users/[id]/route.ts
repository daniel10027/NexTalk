// @ts-nocheck
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import connectDB from "@/lib/db/mongoose";
import { User, AuditLog } from "@/models";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError("Unauthorized", 401);
    await connectDB();
    const user = await User.findById(params.id).select("-password -twoFactorSecret -backupCodes -emailVerificationToken -passwordResetToken");
    if (!user) return apiError("User not found", 404);
    const isFriend = user.friends.includes(session.user.id);
    const isBlocked = user.blockedUsers.includes(session.user.id);
    return apiResponse({ user: { ...user.toObject(), isFriend, isBlocked } });
  } catch (err) {
    return apiError("Internal server error", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError("Unauthorized", 401);
    if (session.user.id !== params.id && session.user.role !== "admin") return apiError("Forbidden", 403);
    const body = await req.json();
    await connectDB();
    const allowed = ["displayName", "bio", "avatar", "notificationPreferences", "theme"];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key];
    }
    const user = await User.findByIdAndUpdate(params.id, update, { new: true }).select("-password -twoFactorSecret");
    if (!user) return apiError("User not found", 404);
    return apiResponse({ user });
  } catch (err) {
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError("Unauthorized", 401);
    if (session.user.role !== "admin") return apiError("Forbidden", 403);
    await connectDB();
    await User.findByIdAndDelete(params.id);
    await AuditLog.create({ actor: session.user.id, action: "user_deleted", targetModel: "User", targetId: params.id, severity: "high" });
    return apiResponse({ deleted: true });
  } catch (err) {
    return apiError("Internal server error", 500);
  }
}
