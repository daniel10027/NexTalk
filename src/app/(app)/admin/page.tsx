"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Users, MessageSquare, Hash, Phone, TrendingUp, Activity,
  Shield, AlertTriangle, Ban, UserX, Loader2, ChevronLeft, ChevronRight,
  Search, RefreshCw, Eye, Download
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalMessages: number;
  totalRooms: number;
  totalCalls: number;
  newUsersToday: number;
  messagesPerDay: Array<{ date: string; count: number }>;
  usersPerDay: Array<{ date: string; count: number }>;
  topRooms: Array<{ name: string; messageCount: number; memberCount: number }>;
  topUsers: Array<{ displayName: string; messageCount: number }>;
}

interface UserRow {
  _id: string;
  username: string;
  displayName: string;
  email: string;
  role: string;
  status: string;
  messageCount: number;
  loginCount: number;
  createdAt: string;
  isBanned?: boolean;
}

interface LogEntry {
  _id: string;
  actor: { displayName: string };
  action: string;
  severity: "low" | "medium" | "high" | "critical";
  createdAt: string;
  details?: string;
}

type AdminTab = "overview" | "users" | "logs";

const COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"];

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PER_PAGE = 20;

  useEffect(() => {
    if (session?.user?.role !== "admin") {
      router.push("/chat");
    }
  }, [session]);

  useEffect(() => {
    fetchData();
  }, [tab, page]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (tab === "overview") {
        const res = await fetch("/api/admin?view=overview");
        const data = await res.json();
        if (data.success) setStats(data.data);
      } else if (tab === "users") {
        const res = await fetch(`/api/admin?view=users&page=${page}&limit=${PER_PAGE}${search ? `&q=${search}` : ""}`);
        const data = await res.json();
        if (data.success) { setUsers(data.data.users); setTotalPages(data.data.totalPages || 1); }
      } else if (tab === "logs") {
        const res = await fetch(`/api/admin?view=logs&page=${page}&limit=${PER_PAGE}`);
        const data = await res.json();
        if (data.success) { setLogs(data.data.logs); setTotalPages(data.data.totalPages || 1); }
      }
    } catch {}
    setIsLoading(false);
  };

  const banUser = async (userId: string, isBanned: boolean) => {
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: isBanned ? "unban" : "ban", userId }),
    });
    fetchData();
  };

  const changeRole = async (userId: string, role: string) => {
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "role", userId, role }),
    });
    fetchData();
  };

  const SEVERITY_COLOR: Record<string, string> = {
    low: "text-gray-400 bg-gray-500/20",
    medium: "text-yellow-400 bg-yellow-500/20",
    high: "text-orange-400 bg-orange-500/20",
    critical: "text-red-400 bg-red-500/20",
  };

  const TABS = [
    { id: "overview" as AdminTab, label: "Overview", icon: Activity },
    { id: "users" as AdminTab, label: "Users", icon: Users },
    { id: "logs" as AdminTab, label: "Audit Logs", icon: Shield },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-white/5 bg-surface-800/50 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg">Admin Dashboard</h1>
              <p className="text-gray-400 text-sm">Manage and monitor NexTalk</p>
            </div>
          </div>
          <button onClick={fetchData} className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === t.id ? "bg-brand-600/20 text-brand-400" : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading && tab === "overview" ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /></div>
        ) : null}

        {/* Overview */}
        {tab === "overview" && stats && (
          <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Users", value: stats.totalUsers.toLocaleString(), sub: `+${stats.newUsersToday} today`, icon: Users, color: "text-brand-400", bg: "bg-brand-600/10" },
                { label: "Total Messages", value: stats.totalMessages.toLocaleString(), sub: "All time", icon: MessageSquare, color: "text-purple-400", bg: "bg-purple-600/10" },
                { label: "Active Rooms", value: stats.totalRooms.toLocaleString(), sub: "Groups & channels", icon: Hash, color: "text-cyan-400", bg: "bg-cyan-600/10" },
                { label: "Total Calls", value: stats.totalCalls.toLocaleString(), sub: "Voice & video", icon: Phone, color: "text-green-400", bg: "bg-green-600/10" },
              ].map(card => (
                <div key={card.label} className="glass-dark rounded-2xl p-5 border border-white/5">
                  <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-white">{card.value}</p>
                  <p className="text-sm text-gray-400 mt-1">{card.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="glass-dark rounded-2xl p-5 border border-white/5">
                <h3 className="text-white font-medium mb-4">Messages (30 days)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={stats.messagesPerDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
                    <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #ffffff15", borderRadius: 12, color: "#fff" }} />
                    <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-dark rounded-2xl p-5 border border-white/5">
                <h3 className="text-white font-medium mb-4">New Users (30 days)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.usersPerDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
                    <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #ffffff15", borderRadius: 12, color: "#fff" }} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top rooms + users */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="glass-dark rounded-2xl p-5 border border-white/5">
                <h3 className="text-white font-medium mb-4">Most Active Rooms</h3>
                <div className="space-y-3">
                  {stats.topRooms.slice(0, 5).map((room, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-4">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-white">{room.name}</span>
                          <span className="text-xs text-gray-400">{room.messageCount} msgs</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(room.messageCount / (stats.topRooms[0]?.messageCount || 1)) * 100}%`, background: COLORS[i] }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-dark rounded-2xl p-5 border border-white/5">
                <h3 className="text-white font-medium mb-4">Most Active Users</h3>
                <div className="space-y-3">
                  {stats.topUsers.slice(0, 5).map((user, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-4">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-white">{user.displayName}</span>
                          <span className="text-xs text-gray-400">{user.messageCount} msgs</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(user.messageCount / (stats.topUsers[0]?.messageCount || 1)) * 100}%`, background: COLORS[i] }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users table */}
        {tab === "users" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  onKeyDown={e => e.key === "Enter" && fetchData()}
                  className="input-base w-full pl-10 text-sm"
                />
              </div>
              <button onClick={fetchData} className="btn-secondary text-sm">Search</button>
            </div>

            <div className="glass-dark rounded-2xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 text-xs text-gray-400 uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">User</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Role</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-right">Messages</th>
                      <th className="px-4 py-3 text-right">Logins</th>
                      <th className="px-4 py-3 text-left">Joined</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={8} className="text-center py-8"><Loader2 className="w-6 h-6 text-brand-400 animate-spin mx-auto" /></td></tr>
                    ) : users.map(user => (
                      <tr key={user._id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-white text-sm font-medium">{user.displayName}</p>
                            <p className="text-gray-500 text-xs">@{user.username}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm">{user.email}</td>
                        <td className="px-4 py-3">
                          <select
                            value={user.role}
                            onChange={e => changeRole(user._id, e.target.value)}
                            className="bg-transparent text-xs border border-white/10 rounded-lg px-2 py-1 text-gray-300"
                          >
                            <option value="user">User</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${user.isBanned ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                            {user.isBanned ? "Banned" : user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-300">{user.messageCount}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-300">{user.loginCount}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => banUser(user._id, !!user.isBanned)}
                            className={`p-1.5 rounded-lg transition-colors text-xs ${user.isBanned ? "hover:bg-green-500/20 text-green-400" : "hover:bg-red-500/20 text-red-400"}`}
                            title={user.isBanned ? "Unban" : "Ban"}
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary p-2 disabled:opacity-50">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary p-2 disabled:opacity-50">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Audit logs */}
        {tab === "logs" && (
          <div className="space-y-2">
            {isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /></div>
            ) : logs.map(log => (
              <div key={log._id} className="glass-dark rounded-xl p-4 border border-white/5 flex items-start gap-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${SEVERITY_COLOR[log.severity]}`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-white">{log.actor?.displayName}</span>
                    <span className="text-sm text-gray-400">{log.action.replace(/_/g, " ")}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${SEVERITY_COLOR[log.severity]}`}>{log.severity}</span>
                  </div>
                  {log.details && <p className="text-xs text-gray-500">{log.details}</p>}
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-400">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary p-2 disabled:opacity-50">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary p-2 disabled:opacity-50">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
