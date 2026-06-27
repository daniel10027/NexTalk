// @ts-nocheck
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import connectDB from "@/lib/db/mongoose";
import { User, Room, Message } from "@/models";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError("Unauthorized", 401);
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const type = searchParams.get("type") || "all";
    if (!q || q.length < 2) return apiError("Query too short", 400);
    await connectDB();
    const results: Record<string, unknown[]> = {};
    const searchRegex = { $regex: q, $options: "i" };

    if (type === "all" || type === "users") {
      results.users = await User.find({
        $or: [{ username: searchRegex }, { displayName: searchRegex }],
        _id: { $ne: session.user.id },
      }).select("username displayName avatar status").limit(5);
    }

    if (type === "all" || type === "rooms") {
      results.rooms = await Room.find({
        $or: [{ name: searchRegex }, { description: searchRegex }],
        $or: [{ isPublic: true }, { "members.user": session.user.id }],
      }).select("name type description isPublic memberCount").limit(5);
    }

    if (type === "all" || type === "messages") {
      results.messages = await Message.find({
        $text: { $search: q },
        room: { $in: (await Room.find({ "members.user": session.user.id }).select("_id")).map(r => r._id) },
        isDeleted: { $ne: true },
      }).select("content sender room createdAt")
        .populate("sender", "displayName username avatar")
        .populate("room", "name type")
        .limit(10);
    }

    return apiResponse({ results, query: q });
  } catch (err) {
    return apiError("Internal server error", 500);
  }
}
