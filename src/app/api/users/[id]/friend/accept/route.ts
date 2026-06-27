// @ts-nocheck
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import connectDB from "@/lib/db/mongoose";
import { User, Notification } from "@/models";
import { apiResponse, apiError } from "@/lib/utils";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError("Unauthorized", 401);
    await connectDB();
    await User.findByIdAndUpdate(session.user.id, {
      $addToSet: { friends: params.id },
      $pull: { friendRequests: { from: params.id } },
    });
    await User.findByIdAndUpdate(params.id, {
      $addToSet: { friends: session.user.id },
    });
    await Notification.create({
      recipient: params.id,
      sender: session.user.id,
      type: "friend_accept",
      title: "Friend request accepted",
      body: `${session.user.name} accepted your friend request`,
    });
    return apiResponse({ accepted: true });
  } catch (err) {
    return apiError("Internal server error", 500);
  }
}
