// @ts-nocheck
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import connectDB from "@/lib/db/mongoose";
import { Notification } from "@/models";
import { apiResponse, apiError } from "@/lib/utils";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError("Unauthorized", 401);
    await connectDB();
    await Notification.findOneAndUpdate({ _id: params.id, recipient: session.user.id }, { isRead: true });
    return apiResponse({ updated: true });
  } catch (err) {
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError("Unauthorized", 401);
    await connectDB();
    await Notification.findOneAndDelete({ _id: params.id, recipient: session.user.id });
    return apiResponse({ deleted: true });
  } catch (err) {
    return apiError("Internal server error", 500);
  }
}
