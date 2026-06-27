// @ts-nocheck
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import connectDB from "@/lib/db/mongoose";
import { Call } from "@/models";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError("Unauthorized", 401);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "30");
    await connectDB();
    const calls = await Call.find({ "participants.user": session.user.id })
      .sort({ startedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("initiator", "displayName username avatar")
      .populate("participants.user", "displayName username avatar")
      .populate("room", "name");
    const total = await Call.countDocuments({ "participants.user": session.user.id });
    return apiResponse({ calls, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    return apiError("Internal server error", 500);
  }
}
