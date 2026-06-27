// @ts-nocheck
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import connectDB from "@/lib/db/mongoose";
import { User } from "@/models";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError("Unauthorized", 401);
    await connectDB();
    const user = await User.findById(session.user.id)
      .populate("friends", "displayName username avatar status bio")
      .populate("friendRequests.from", "displayName username avatar status");
    if (!user) return apiError("User not found", 404);
    return apiResponse({
      friends: user.friends,
      pendingRequests: user.friendRequests,
    });
  } catch (err) {
    return apiError("Internal server error", 500);
  }
}
