// @ts-nocheck
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import connectDB from "@/lib/db/mongoose";
import { User, Notification } from "@/models";
import { apiResponse, apiError } from "@/lib/utils";

// POST /api/users/[id]/friend - send friend request
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError("Unauthorized", 401);
    if (session.user.id === params.id) return apiError("Cannot add yourself", 400);
    await connectDB();
    const target = await User.findById(params.id);
    if (!target) return apiError("User not found", 404);
    if (target.friends.includes(session.user.id)) return apiError("Already friends", 400);
    const alreadySent = target.friendRequests.some((r: any) => r.from.toString() === session.user.id);
    if (alreadySent) return apiError("Request already sent", 400);
    target.friendRequests.push({ from: session.user.id, createdAt: new Date() });
    await target.save();
    await Notification.create({
      recipient: params.id, sender: session.user.id,
      type: "friend_request", title: "New friend request",
      body: `${session.user.name} sent you a friend request`,
    });
    return apiResponse({ sent: true });
  } catch (err) {
    return apiError("Internal server error", 500);
  }
}

// DELETE /api/users/[id]/friend - remove friend
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError("Unauthorized", 401);
    await connectDB();
    await User.findByIdAndUpdate(session.user.id, { $pull: { friends: params.id } });
    await User.findByIdAndUpdate(params.id, { $pull: { friends: session.user.id } });
    return apiResponse({ removed: true });
  } catch (err) {
    return apiError("Internal server error", 500);
  }
}
