"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Users,
  MessageSquare,
  Hash,
  Phone,
  Shield,
  AlertTriangle,
  Ban,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
  TrendingUp,
  Activity,
  Circle,
  UserCheck,
  Clock,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

type Tab = "overview" | "users" | "logs";

const SEVERITY_STYLE: Record<string, any> = {
  low: { bg: "rgba(107,114,128,0.2)", color: "#9ca3af" },
  medium: { bg: "rgba(234,179,8,0.2)", color: "#facc15" },
  high: { bg: "rgba(249,115,22,0.2)", color: "#fb923c" },
  critical: { bg: "rgba(239,68,68,0.2)", color: "#f87171" },
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Rediriger si pas admin
  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "admin") {
      router.push("/chat");
    }
  }, [session, status]);

  useEffect(() => {
    if (session?.user?.role === "admin") fetchData();
  }, [tab, page, session]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (tab === "overview") {
        const res = await fetch("/api/admin?view=overview");
        const data = await res.json();
        if (data.success) setStats(data.data);
        else console.error("Admin overview error:", data.error);
      } else if (tab === "users") {
        const res = await fetch(
          `/api/admin?view=users&page=${page}&limit=20${search ? `&q=${encodeURIComponent(search)}` : ""}`,
        );
        const data = await res.json();
        if (data.success) {
          setUsers(data.data.users || []);
          setTotalPages(data.data.totalPages || 1);
        }
      } else if (tab === "logs") {
        const res = await fetch(`/api/admin?view=logs&page=${page}&limit=20`);
        const data = await res.json();
        if (data.success) {
          setLogs(data.data.logs || []);
          setTotalPages(data.data.totalPages || 1);
        }
      }
    } catch (err) {
      console.error("fetchData error:", err);
    }
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

  const TABS = [
    { id: "overview" as Tab, label: "Vue d'ensemble", icon: Activity },
    { id: "users" as Tab, label: "Utilisateurs", icon: Users },
    { id: "logs" as Tab, label: "Audit Logs", icon: Shield },
  ];

  const CHART_STYLE = {
    background: "transparent",
    border: "none",
    borderRadius: 12,
    color: "#fff",
    fontSize: 12,
  };

  if (status === "loading")
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: "#818cf8" }}
        />
      </div>
    );

  if (session?.user?.role !== "admin") return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="border-b px-6 py-4 flex-shrink-0"
        style={{
          borderColor: "rgba(255,255,255,0.05)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(239,68,68,0.2)" }}
            >
              <Shield className="w-5 h-5" style={{ color: "#f87171" }} />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Admin Dashboard</h1>
              <p className="text-gray-400 text-xs">
                Connecté en tant que {session.user.name}
              </p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setPage(1);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{
                background:
                  tab === t.id ? "rgba(99,102,241,0.2)" : "transparent",
                color: tab === t.id ? "#818cf8" : "#9ca3af",
              }}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* ── OVERVIEW ── */}
        {tab === "overview" &&
          (isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2
                className="w-8 h-8 animate-spin"
                style={{ color: "#818cf8" }}
              />
            </div>
          ) : !stats ? (
            <div className="text-center py-20">
              <p className="text-red-400 mb-4">
                Erreur de chargement des stats
              </p>
              <button onClick={fetchData} className="btn-primary">
                Réessayer
              </button>
            </div>
          ) : (
            <div className="space-y-6 max-w-6xl">
              {/* Stats cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "Utilisateurs",
                    value: stats.totalUsers,
                    sub: `+${stats.newUsersToday} aujourd'hui`,
                    icon: Users,
                    color: "#818cf8",
                    bg: "rgba(99,102,241,0.15)",
                  },
                  {
                    label: "Messages",
                    value: stats.totalMessages,
                    sub: "Total envoyés",
                    icon: MessageSquare,
                    color: "#c084fc",
                    bg: "rgba(192,132,252,0.15)",
                  },
                  {
                    label: "Rooms",
                    value: stats.totalRooms,
                    sub: "Groupes & channels",
                    icon: Hash,
                    color: "#22d3ee",
                    bg: "rgba(34,211,238,0.15)",
                  },
                  {
                    label: "Appels",
                    value: stats.totalCalls,
                    sub: "Audio & vidéo",
                    icon: Phone,
                    color: "#4ade80",
                    bg: "rgba(74,222,128,0.15)",
                  },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="rounded-2xl p-5 border"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      borderColor: "rgba(255,255,255,0.06)",
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: card.bg }}
                    >
                      <card.icon
                        className="w-5 h-5"
                        style={{ color: card.color }}
                      />
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {(card.value || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-400 mt-0.5">{card.label}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{card.sub}</p>
                  </div>
                ))}
              </div>

              {/* Online / actifs */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    label: "En ligne maintenant",
                    value: stats.onlineUsers || 0,
                    icon: Circle,
                    color: "#4ade80",
                  },
                  {
                    label: "Actifs (7 jours)",
                    value: stats.activeUsers || 0,
                    icon: UserCheck,
                    color: "#818cf8",
                  },
                  {
                    label: "Nouveaux aujourd'hui",
                    value: stats.newUsersToday || 0,
                    icon: TrendingUp,
                    color: "#22d3ee",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl p-4 border flex items-center gap-4"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      borderColor: "rgba(255,255,255,0.06)",
                    }}
                  >
                    <s.icon className="w-8 h-8" style={{ color: s.color }} />
                    <div>
                      <p className="text-xl font-bold text-white">{s.value}</p>
                      <p className="text-xs text-gray-400">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Graphiques */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div
                  className="rounded-2xl p-5 border"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    borderColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  <h3 className="text-white font-semibold mb-4">
                    Messages (30 jours)
                  </h3>
                  {stats.messagesPerDay?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={stats.messagesPerDay}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.05)"
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: "#6b7280" }}
                          tickFormatter={(d) => d.slice(5)}
                        />
                        <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
                        <Tooltip contentStyle={CHART_STYLE} />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#6366f1"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-gray-500 text-sm">
                      Pas encore de données
                    </div>
                  )}
                </div>

                <div
                  className="rounded-2xl p-5 border"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    borderColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  <h3 className="text-white font-semibold mb-4">
                    Nouveaux utilisateurs (30 jours)
                  </h3>
                  {stats.usersPerDay?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={stats.usersPerDay}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.05)"
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: "#6b7280" }}
                          tickFormatter={(d) => d.slice(5)}
                        />
                        <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
                        <Tooltip contentStyle={CHART_STYLE} />
                        <Bar
                          dataKey="count"
                          fill="#8b5cf6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-gray-500 text-sm">
                      Pas encore de données
                    </div>
                  )}
                </div>
              </div>

              {/* Top rooms + Top users */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div
                  className="rounded-2xl p-5 border"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    borderColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  <h3 className="text-white font-semibold mb-4">
                    Rooms les plus actives
                  </h3>
                  {(stats.topRooms || []).length === 0 ? (
                    <p className="text-gray-500 text-sm">Aucune room</p>
                  ) : (
                    (stats.topRooms || []).map((room: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 mb-3">
                        <span className="text-xs text-gray-500 w-4">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-white">
                              {room.name}
                            </span>
                            <span className="text-xs text-gray-400">
                              {room.memberCount} membres
                            </span>
                          </div>
                          <div
                            className="h-1.5 rounded-full"
                            style={{ background: "rgba(255,255,255,0.05)" }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.max(5, (room.memberCount / Math.max(...(stats.topRooms || []).map((r: any) => r.memberCount), 1)) * 100)}%`,
                                background: [
                                  "#6366f1",
                                  "#8b5cf6",
                                  "#06b6d4",
                                  "#10b981",
                                  "#f59e0b",
                                ][i],
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div
                  className="rounded-2xl p-5 border"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    borderColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  <h3 className="text-white font-semibold mb-4">
                    Utilisateurs les plus actifs
                  </h3>
                  {(stats.topUsers || []).length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      Aucun message encore
                    </p>
                  ) : (
                    (stats.topUsers || []).map((user: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 mb-3">
                        <span className="text-xs text-gray-500 w-4">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-white">
                              {user.displayName}
                            </span>
                            <span className="text-xs text-gray-400">
                              {user.messageCount} msgs
                            </span>
                          </div>
                          <div
                            className="h-1.5 rounded-full"
                            style={{ background: "rgba(255,255,255,0.05)" }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.max(5, (user.messageCount / Math.max(...(stats.topUsers || []).map((u: any) => u.messageCount), 1)) * 100)}%`,
                                background: [
                                  "#6366f1",
                                  "#8b5cf6",
                                  "#06b6d4",
                                  "#10b981",
                                  "#f59e0b",
                                ][i],
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Logs récents */}
              {(stats.recentLogs || []).length > 0 && (
                <div
                  className="rounded-2xl p-5 border"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    borderColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  <h3 className="text-white font-semibold mb-4">
                    Activité récente
                  </h3>
                  <div className="space-y-2">
                    {(stats.recentLogs || [])
                      .slice(0, 5)
                      .map((log: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 py-2 border-b"
                          style={{ borderColor: "rgba(255,255,255,0.04)" }}
                        >
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={
                              SEVERITY_STYLE[log.severity] || SEVERITY_STYLE.low
                            }
                          >
                            {log.severity}
                          </span>
                          <span className="text-sm text-gray-300 flex-1">
                            {typeof log.action === "string"
                              ? log.action.replace(/_/g, " ")
                              : JSON.stringify(log.action)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(log.createdAt).toLocaleString("fr-FR")}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}

        {/* ── USERS ── */}
        {tab === "users" && (
          <div className="space-y-4 max-w-6xl">
            <div className="flex gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchData()}
                  className="input-base w-full pl-10 text-sm"
                />
              </div>
              <button onClick={fetchData} className="btn-secondary text-sm">
                Rechercher
              </button>
            </div>

            <div
              className="rounded-2xl border overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.02)",
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr
                      className="border-b text-xs text-gray-500 uppercase tracking-wider"
                      style={{ borderColor: "rgba(255,255,255,0.05)" }}
                    >
                      <th className="px-4 py-3 text-left">Utilisateur</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Rôle</th>
                      <th className="px-4 py-3 text-left">Statut</th>
                      <th className="px-4 py-3 text-right">Messages</th>
                      <th className="px-4 py-3 text-right">Connexions</th>
                      <th className="px-4 py-3 text-left">Inscrit le</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-10">
                          <Loader2
                            className="w-6 h-6 animate-spin mx-auto"
                            style={{ color: "#818cf8" }}
                          />
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="text-center py-10 text-gray-500 text-sm"
                        >
                          Aucun utilisateur trouvé
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr
                          key={user._id}
                          className="border-b hover:bg-white/[0.02] transition-colors"
                          style={{ borderColor: "rgba(255,255,255,0.03)" }}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {user.avatar ? (
                                <img
                                  src={user.avatar}
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                                  style={{ background: "rgba(99,102,241,0.3)" }}
                                >
                                  {user.displayName?.[0] || "?"}
                                </div>
                              )}
                              <div>
                                <p className="text-white text-sm font-medium">
                                  {user.displayName}
                                </p>
                                <p className="text-gray-500 text-xs">
                                  @{user.username}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-sm">
                            {user.email}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={user.role}
                              onChange={(e) =>
                                changeRole(user._id, e.target.value)
                              }
                              className="text-xs rounded-lg px-2 py-1 text-gray-300 cursor-pointer"
                              style={{
                                background: "rgba(255,255,255,0.08)",
                                border: "1px solid rgba(255,255,255,0.1)",
                              }}
                            >
                              <option value="user">User</option>
                              <option value="moderator">Moderator</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background: user.isBanned
                                  ? "rgba(239,68,68,0.2)"
                                  : "rgba(34,197,94,0.2)",
                                color: user.isBanned ? "#f87171" : "#4ade80",
                              }}
                            >
                              {user.isBanned
                                ? "Banni"
                                : user.status || "offline"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-300">
                            {user.messageCount || 0}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-300">
                            {user.loginCount || 0}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-400">
                            {new Date(user.createdAt).toLocaleDateString(
                              "fr-FR",
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {user._id !== session.user.id && (
                              <button
                                onClick={() =>
                                  banUser(user._id, !!user.isBanned)
                                }
                                className="p-1.5 rounded-lg transition-colors"
                                style={{
                                  color: user.isBanned ? "#4ade80" : "#f87171",
                                }}
                                title={user.isBanned ? "Débannir" : "Bannir"}
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Page {page} / {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary p-2 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary p-2 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── LOGS ── */}
        {tab === "logs" && (
          <div className="space-y-2 max-w-4xl">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2
                  className="w-8 h-8 animate-spin"
                  style={{ color: "#818cf8" }}
                />
              </div>
            ) : logs.length === 0 ? (
              <p className="text-center text-gray-500 py-16">
                Aucun log disponible
              </p>
            ) : (
              logs.map((log, i) => (
                <div
                  key={log._id || i}
                  className="flex items-start gap-4 p-4 rounded-xl border"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    borderColor: "rgba(255,255,255,0.05)",
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={SEVERITY_STYLE[log.severity] || SEVERITY_STYLE.low}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-white">
                        {log.actor?.displayName || "System"}
                      </span>
                      <span className="text-sm text-gray-400">—</span>
                      <span className="text-sm text-gray-300">
                        {typeof log.action === "string"
                          ? log.action.replace(/_/g, " ")
                          : String(log.action)}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={
                          SEVERITY_STYLE[log.severity] || SEVERITY_STYLE.low
                        }
                      >
                        {log.severity}
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-xs text-gray-500">
                        {typeof log.details === "object"
                          ? JSON.stringify(log.details)
                          : log.details}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {new Date(log.createdAt).toLocaleString("fr-FR")}
                  </span>
                </div>
              ))
            )}

            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-400">
                Page {page} / {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary p-2 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary p-2 disabled:opacity-30"
                >
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
