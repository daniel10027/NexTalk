// @ts-nocheck
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db/mongoose";
import { Room, User, Notification } from "@/models";
import { authOptions } from "@/lib/auth/options";
import {
  apiResponse,
  apiError,
  generateInviteCode,
  slugify,
} from "@/lib/utils";

// GET: User's rooms
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const { searchParams } = req.nextUrl;
    const type = searchParams.get("type");
    const isPublic = searchParams.get("public");
    const q = searchParams.get("q");

    await connectDB();

    // Discover public channels
    if (isPublic === "true") {
      const query: any = {
        isPublic: true,
        type: { $in: ["group", "channel"] },
      };
      if (type) query.type = type;
      if (q)
        query.$or = [
          { name: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } },
        ];
      const rooms = await Room.find(query)
        .populate("owner", "username displayName avatar")
        .sort({ memberCount: -1, createdAt: -1 })
        .limit(50);
      return apiResponse({ rooms });
    }

    // User's rooms
    const query: any = { "members.user": session.user.id };
    if (type) query.type = type;

    const rooms = await Room.find(query)
      .populate("members.user", "displayName username avatar status")
      .populate("owner", "username displayName avatar")
      .sort({ updatedAt: -1 });

    return apiResponse({ rooms });
  } catch (err) {
    console.error("GET /api/rooms error:", err);
    return apiError("Internal server error", 500);
  }
}

// POST: Create room
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const body = await req.json();
    const {
      name,
      description,
      type,
      isPublic = false,
      members = [],
      tags = [],
    } = body;

    if (!name || !type) return apiError("Name and type are required");
    if (!["group", "channel"].includes(type)) return apiError("Invalid type");

    await connectDB();

    const slug = slugify(name) + "-" + generateInviteCode(4).toLowerCase();

    const room = await Room.create({
      name,
      description,
      type,
      slug,
      isPublic,
      owner: session.user.id,
      members: [
        { user: session.user.id, role: "owner", joinedAt: new Date() },
        ...members.map((id: string) => ({
          user: id,
          role: "member",
          joinedAt: new Date(),
        })),
      ],
      inviteCode: generateInviteCode(),
      tags,
    });

    // Notifier les membres ajoutés
    for (const memberId of members) {
      if (memberId !== session.user.id) {
        await Notification.create({
          recipient: memberId,
          sender: session.user.id,
          type: "room_invite",
          title: `Added to ${name}`,
          body: `${session.user.name} added you to ${name}`,
        });
      }
    }

    const populated = await Room.findById(room._id)
      .populate("owner", "username displayName avatar")
      .populate("members.user", "displayName username avatar status");

    return apiResponse({ room: populated }, 201);
  } catch (err) {
    console.error("POST /api/rooms error:", err);
    return apiError("Internal server error", 500);
  }
}
