// @ts-nocheck
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db/mongoose";
import User from "@/models/User";
import Message from "@/models/Message";
import Room from "@/models/Room";
import { Notification, AuditLog, Call } from "@/models/index";
import { authOptions } from "@/lib/auth/options";
import { apiResponse, apiError } from "@/lib/utils";
import { startOfDay, subDays } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return apiError("Forbidden", 403);
  }

  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type") || "overview";

  await connectDB();

  if (type === "overview") {
    const now = new Date();
    const today = startOfDay(now);
    const last7 = subDays(now, 7);
    const last30 = subDays(now, 30);

    const [
      totalUsers,
      newUsersToday,
      newUsersWeek,
      activeUsers,
      onlineUsers,
      totalMessages,
      messagestoday,
      totalRooms,
      publicRooms,
      totalCalls,
      bannedUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: last7 } }),
      User.countDocuments({ lastSeen: { $gte: last7 } }),
      User.countDocuments({ status: "online" }),
      Message.countDocuments({ isDeleted: false }),
      Message.countDocuments({ createdAt: { $gte: today }, isDeleted: false }),
      Room.countDocuments(),
      Room.countDocuments({ isPublic: true }),
      Call.countDocuments(),
      User.countDocuments({ isBanned: true }),
    ]);

    // Growth over 30 days
    const dailyStats = await User.aggregate([
      { $match: { createdAt: { $gte: last30 } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dailyMessages = await Message.aggregate([
      { $match: { createdAt: { $gte: last30 }, isDeleted: false } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top rooms by activity
    const topRooms = await Room.find()
      .select("name type messageCount members lastActivity avatar")
      .sort({ messageCount: -1 })
      .limit(10)
      .populate("owner", "username displayName");

    // Top users by messages
    const topUsers = await User.find()
      .select("username displayName avatar messageCount joinedAt role")
      .sort({ messageCount: -1 })
      .limit(10);

    // Recent audit logs
    const recentLogs = await AuditLog.find()
      .populate("actor", "username displayName avatar")
      .sort({ createdAt: -1 })
      .limit(20);

    return apiResponse({
      stats: {
        users: { total: totalUsers, today: newUsersToday, week: newUsersWeek, active: activeUsers, online: onlineUsers, banned: bannedUsers },
        messages: { total: totalMessages, today: messagestoday },
        rooms: { total: totalRooms, public: publicRooms },
        calls: { total: totalCalls },
      },
      charts: {
        dailyUsers: dailyStats,
        dailyMessages,
      },
      topRooms,
      topUsers,
      recentLogs,
    });
  }

  if (type === "users") {
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const search = searchParams.get("search");
    const role = searchParams.get("role");
    const status = searchParams.get("status");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};
    if (search) query.$or = [
      { username: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { displayName: { $regex: search, $options: "i" } },
    ];
    if (role) query.role = role;
    if (status === "banned") query.isBanned = true;
    if (status === "inactive") query.isActive = false;

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password -twoFactorSecret")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(query),
    ]);

    return apiResponse({ users, total, page, limit });
  }

  if (type === "logs") {
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 50;
    const severity = searchParams.get("severity");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};
    if (severity) query.severity = severity;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate("actor", "username displayName avatar")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      AuditLog.countDocuments(query),
    ]);

    return apiResponse({ logs, total });
  }

  return apiError("Invalid type");
}

// POST: Admin actions
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return apiError("Forbidden", 403);
  }

  const { action, userId, reason, role, duration } = await req.json();
  await connectDB();

  if (action === "ban") {
    const banExpires = duration ? new Date(Date.now() + duration * 1000) : undefined;
    await User.findByIdAndUpdate(userId, {
      isBanned: true,
      banReason: reason,
      bannedAt: new Date(),
      bannedBy: session.user.id,
      status: "offline",
      ...(banExpires && { banExpires }),
    });
    await AuditLog.create({
      actor: session.user.id,
      action: "admin.user.ban",
      target: userId,
      targetModel: "User",
      details: { reason, duration },
      severity: "high",
    });
    return apiResponse({ message: "User banned" });
  }

  if (action === "unban") {
    await User.findByIdAndUpdate(userId, {
      isBanned: false,
      banReason: undefined,
      bannedAt: undefined,
      bannedBy: undefined,
    });
    await AuditLog.create({
      actor: session.user.id,
      action: "admin.user.unban",
      target: userId,
      targetModel: "User",
      severity: "medium",
    });
    return apiResponse({ message: "User unbanned" });
  }

  if (action === "role") {
    await User.findByIdAndUpdate(userId, { role });
    await AuditLog.create({
      actor: session.user.id,
      action: "admin.user.role",
      target: userId,
      targetModel: "User",
      details: { role },
      severity: "high",
    });
    return apiResponse({ message: "Role updated" });
  }

  if (action === "delete") {
    await User.findByIdAndDelete(userId);
    await AuditLog.create({
      actor: session.user.id,
      action: "admin.user.delete",
      target: userId,
      targetModel: "User",
      severity: "critical",
    });
    return apiResponse({ message: "User deleted" });
  }

  return apiError("Invalid action");
}
