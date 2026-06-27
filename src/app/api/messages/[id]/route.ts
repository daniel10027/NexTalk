// @ts-nocheck
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db/mongoose";
import { Message } from "@/models";
import { authOptions } from "@/lib/auth/options";
import { apiResponse, apiError } from "@/lib/utils";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError("Unauthorized", 401);
    const { content } = await req.json();
    await connectDB();
    const message = await Message.findOne({
      _id: params.id,
      sender: session.user.id,
    });
    if (!message) return apiError("Message not found", 404);
    message.editHistory = message.editHistory || [];
    message.editHistory.push({
      content: message.content,
      editedAt: new Date(),
    });
    message.content = content;
    await message.save();
    const populated = await Message.findById(params.id).populate(
      "sender",
      "username displayName avatar status",
    );
    return apiResponse({ message: populated });
  } catch (err) {
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError("Unauthorized", 401);
    await connectDB();
    const message = await Message.findOne({
      _id: params.id,
      sender: session.user.id,
    });
    if (!message) return apiError("Message not found", 404);
    message.isDeleted = true;
    message.content = "";
    await message.save();
    return apiResponse({ deleted: true });
  } catch (err) {
    return apiError("Internal server error", 500);
  }
}
