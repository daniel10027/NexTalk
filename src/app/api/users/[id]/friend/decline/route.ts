// @ts-nocheck
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import connectDB from "@/lib/db/mongoose";
import { User } from "@/models";
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
      $pull: { friendRequests: { from: params.id } },
    });
    return apiResponse({ declined: true });
  } catch (err) {
    return apiError("Internal server error", 500);
  }
}
