// @ts-nocheck
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db/mongoose";
import { User } from "@/models";
import { authOptions } from "@/lib/auth/options";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { searchParams } = req.nextUrl;
  // Accepte "q" ou "search"
  const q = searchParams.get("q") || searchParams.get("search") || "";

  if (!q || q.length < 1) return apiResponse({ users: [] });

  await connectDB();

  const users = await User.find({
    _id: { $ne: session.user.id },
    isBanned: { $ne: true },
    $or: [
      { username: { $regex: q, $options: "i" } },
      { displayName: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ],
  })
    .select("username displayName avatar status bio lastSeen")
    .limit(20);

  return apiResponse({ users });
}
