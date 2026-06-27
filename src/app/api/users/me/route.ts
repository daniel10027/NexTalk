// @ts-nocheck
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import connectDB from "@/lib/db/mongoose";
import { User } from "@/models";
import { apiResponse, apiError } from "@/lib/utils";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError("Unauthorized", 401);
    await connectDB();
    const user = await User.findById(session.user.id)
      .select("-password -twoFactorSecret -backupCodes")
      .populate("friends", "displayName username avatar status");
    if (!user) return apiError("User not found", 404);
    const pendingRequests = user.friendRequests.map((r: any) => ({
      _id: r._id,
      from: r.from,
      createdAt: r.createdAt,
    }));
    return apiResponse({ user, friends: user.friends, pendingRequests });
  } catch (err) {
    return apiError("Internal server error", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError("Unauthorized", 401);
    const body = await req.json();
    await connectDB();
    const allowed = ["displayName", "bio", "avatar", "notificationPreferences", "theme"];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key];
    }
    const user = await User.findByIdAndUpdate(session.user.id, update, { new: true })
      .select("-password -twoFactorSecret");
    return apiResponse({ user });
  } catch (err) {
    return apiError("Internal server error", 500);
  }
}
