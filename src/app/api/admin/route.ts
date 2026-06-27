// @ts-nocheck
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db/mongoose";
import { User, Message, Room, AuditLog, Call } from "@/models";
import { authOptions } from "@/lib/auth/options";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return apiError("Forbidden - Admin only", 403);
  }

  const { searchParams } = req.nextUrl;
  // Accepte "view" ou "type"
  const view =
    searchParams.get("view") || searchParams.get("type") || "overview";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const q = searchParams.get("q") || "";

  await connectDB();

  // ─── OVERVIEW ────────────────────────────────────────────────
  if (view === "overview") {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersToday,
      activeUsers,
      totalMessages,
      totalRooms,
      totalCalls,
      onlineUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({
        lastSeen: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      }),
      Message.countDocuments(),
      Room.countDocuments(),
      Call.countDocuments(),
      User.countDocuments({ status: "online" }),
    ]);

    // Messages par jour (30 derniers jours)
    const msgAgg = await Message.aggregate([
      { $match: { createdAt: { $gte: last30 } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Nouveaux users par jour
    const userAgg = await User.aggregate([
      { $match: { createdAt: { $gte: last30 } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top rooms par messages
    const topRooms = await Room.find({ name: { $exists: true } })
      .select("name type memberCount messageCount members")
      .sort({ messageCount: -1 })
      .limit(5);

    // Top users par messages
    const topUsers = await User.find()
      .select("displayName messageCount")
      .sort({ messageCount: -1 })
      .limit(5);

    // Logs récents
    const recentLogs = await AuditLog.find()
      .populate("actor", "displayName username")
      .sort({ createdAt: -1 })
      .limit(10);

    return apiResponse({
      totalUsers,
      newUsersToday,
      activeUsers,
      onlineUsers,
      totalMessages,
      totalRooms,
      totalCalls,
      messagesPerDay: msgAgg.map((d) => ({ date: d._id, count: d.count })),
      usersPerDay: userAgg.map((d) => ({ date: d._id, count: d.count })),
      topRooms: topRooms.map((r) => ({
        name: r.name,
        type: r.type,
        memberCount: r.members?.length || r.memberCount || 0,
        messageCount: r.messageCount || 0,
      })),
      topUsers: topUsers.map((u) => ({
        displayName: u.displayName,
        messageCount: u.messageCount || 0,
      })),
      recentLogs,
    });
  }

  // ─── USERS ───────────────────────────────────────────────────
  if (view === "users") {
    const filter: any = {};
    if (q)
      filter.$or = [
        { username: { $regex: q, $options: "i" } },
        { displayName: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select(
        "username displayName email role status messageCount loginCount createdAt isBanned avatar",
      )
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return apiResponse({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  }

  // ─── LOGS ────────────────────────────────────────────────────
  if (view === "logs") {
    const total = await AuditLog.countDocuments();
    const logs = await AuditLog.find()
      .populate("actor", "displayName username avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return apiResponse({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  }

  return apiError("Invalid view parameter");
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return apiError("Forbidden", 403);
  }

  const { action, userId, role } = await req.json();
  await connectDB();

  switch (action) {
    case "ban":
      await User.findByIdAndUpdate(userId, { isBanned: true });
      await AuditLog.create({
        actor: session.user.id,
        action: "user_banned",
        targetId: userId,
        severity: "high",
        details: `Banned by ${session.user.name}`,
      });
      return apiResponse({ success: true });

    case "unban":
      await User.findByIdAndUpdate(userId, { isBanned: false });
      await AuditLog.create({
        actor: session.user.id,
        action: "user_unbanned",
        targetId: userId,
        severity: "medium",
        details: `Unbanned by ${session.user.name}`,
      });
      return apiResponse({ success: true });

    case "role":
      await User.findByIdAndUpdate(userId, { role });
      await AuditLog.create({
        actor: session.user.id,
        action: "role_changed",
        targetId: userId,
        severity: "medium",
        details: `Role set to ${role} by ${session.user.name}`,
      });
      return apiResponse({ success: true });

    case "delete":
      await User.findByIdAndDelete(userId);
      await AuditLog.create({
        actor: session.user.id,
        action: "user_deleted",
        targetId: userId,
        severity: "critical",
        details: `Deleted by ${session.user.name}`,
      });
      return apiResponse({ success: true });

    default:
      return apiError("Unknown action");
  }
}
