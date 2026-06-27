// @ts-nocheck
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import connectDB from "@/lib/db/mongoose";
import { Notification } from "@/models";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError("Unauthorized", 401);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "30");
    await connectDB();
    const notifications = await Notification.find({ recipient: session.user.id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("sender", "displayName username avatar");
    const unreadCount = await Notification.countDocuments({ recipient: session.user.id, isRead: false });
    return apiResponse({ notifications, unreadCount });
  } catch (err) {
    return apiError("Internal server error", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError("Unauthorized", 401);
    const { all, ids } = await req.json();
    await connectDB();
    if (all) {
      await Notification.updateMany({ recipient: session.user.id }, { isRead: true });
    } else if (ids?.length) {
      await Notification.updateMany({ _id: { $in: ids }, recipient: session.user.id }, { isRead: true });
    }
    return apiResponse({ updated: true });
  } catch (err) {
    return apiError("Internal server error", 500);
  }
}
