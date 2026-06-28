"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  User, Lock, Shield, Bell, Palette, Save,
  Eye, EyeOff, Camera, Loader2, CheckCircle, Copy, Check, QrCode
} from "lucide-react";
import UserAvatar from "@/components/shared/UserAvatar";

type Tab = "profile" | "security" | "2fa" | "notifications" | "appearance";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [tab, setTab] = useState<Tab>("profile");
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Profile state
  const [displayName, setDisplayName] = useState(session?.user?.name || "");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState(session?.user?.image || "");

  // Security state
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [totpToken, setTotpToken] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const handleSaveProfile = async () => {
    setIsLoading(true); setError("");
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio }),
      });
      const data = await res.json();
      if (data.success) {
        await update({ name: displayName });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else setError(data.error);
    } catch { setError("Failed to save"); }
    setIsLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) { setError("Passwords don't match"); return; }
    setIsLoading(true); setError("");
    try {
      const res = await fetch("/api/users/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
        setSaved(true); setTimeout(() => setSaved(false), 2500);
      } else setError(data.error);
    } catch { setError("Failed to change password"); }
    setIsLoading(false);
  };

  const loadQRCode = async () => {
    const res = await fetch("/api/auth/two-factor");
    const data = await res.json();
    if (data.success) {
      setQrCode(data.data.qrCode);
      setTotpSecret(data.data.secret);
    }
  };

  const enableTwoFA = async () => {
    setIsLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/two-factor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enable", secret: totpSecret, token: totpToken }),
      });
      const data = await res.json();
      if (data.success) {
        setTwoFAEnabled(true);
        setBackupCodes(data.data.backupCodes || []);
        setQrCode("");
        setTotpSecret("");
        setTotpToken("");
      } else setError(data.error);
    } catch { setError("Failed to enable 2FA"); }
    setIsLoading(false);
  };

  const disableTwoFA = async () => {
    if (!confirm("Are you sure you want to disable 2FA?")) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/two-factor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable", token: totpToken }),
      });
      const data = await res.json();
      if (data.success) { setTwoFAEnabled(false); setBackupCodes([]); setTotpToken(""); }
    } catch {}
    setIsLoading(false);
  };

  const TABS = [
    { id: "profile" as Tab, label: "Profile", icon: User },
    { id: "security" as Tab, label: "Security", icon: Lock },
    { id: "2fa" as Tab, label: "Two-Factor Auth", icon: Shield },
    { id: "notifications" as Tab, label: "Notifications", icon: Bell },
    { id: "appearance" as Tab, label: "Appearance", icon: Palette },
  ];

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-56 border-r border-white/5 p-3 flex-shrink-0"
        style={{ background: "rgba(255,255,255,0.02)" }}>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-3">Settings</h2>
        {TABS.map(t => (
          <button key={t.id}
            onClick={() => { setTab(t.id); setError(""); setSaved(false); }}
            className={`sidebar-item w-full mb-1 ${tab === t.id ? "active" : ""}`}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-xl">

          {/* ── PROFILE ── */}
          {tab === "profile" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Profile</h2>
                <p className="text-gray-400 text-sm">Manage your public profile information.</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <UserAvatar user={{ _id: "", username: "", displayName, avatar }} size="xl" />
                  <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center text-white shadow-lg"
                    style={{ background: "#6366f1" }}>
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <p className="text-white font-medium">Profile Photo</p>
                  <p className="text-gray-400 text-sm">PNG, JPG up to 4MB</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                  <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                    className="input-base w-full" maxLength={50} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                  <input value={`@${session?.user?.username || ""}`} disabled
                    className="input-base w-full opacity-50 cursor-not-allowed" />
                  <p className="text-xs text-gray-500 mt-1">Username cannot be changed.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)}
                    rows={3} maxLength={200} placeholder="Tell people about yourself..."
                    className="input-base w-full resize-none" />
                  <p className="text-xs text-gray-500 mt-1">{bio.length}/200</p>
                </div>
              </div>

              {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3">{error}</p>}

              <button onClick={handleSaveProfile} disabled={isLoading} className="btn-primary flex items-center gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" />
                  : saved ? <CheckCircle className="w-4 h-4" />
                  : <Save className="w-4 h-4" />}
                {saved ? "Saved!" : "Save Changes"}
              </button>
            </div>
          )}

          {/* ── SECURITY ── */}
          {tab === "security" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Security</h2>
                <p className="text-gray-400 text-sm">Manage your password and account security.</p>
              </div>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                  <div className="relative">
                    <input type={showPwd ? "text" : "password"} value={currentPwd}
                      onChange={e => setCurrentPwd(e.target.value)}
                      className="input-base w-full pr-10" required />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                  <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)}
                    className="input-base w-full" required minLength={8} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                  <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                    className={`input-base w-full ${confirmPwd && confirmPwd !== newPwd ? "border-red-500" : ""}`}
                    required />
                  {confirmPwd && confirmPwd !== newPwd && (
                    <p className="text-xs text-red-400 mt-1">Passwords don't match</p>
                  )}
                </div>
                {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3">{error}</p>}
                {saved && <p className="text-sm text-green-400 bg-green-500/10 rounded-xl px-4 py-3">Password updated!</p>}
                <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2">
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Update Password
                </button>
              </form>
            </div>
          )}

          {/* ── 2FA ── */}
          {tab === "2fa" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Two-Factor Authentication</h2>
                <p className="text-gray-400 text-sm">Add an extra layer of security with Google Authenticator.</p>
              </div>

              {/* Status card */}
              <div className={`flex items-center gap-4 p-5 rounded-2xl border ${
                twoFAEnabled ? "bg-green-500/10 border-green-500/20" : "bg-white/5 border-white/10"
              }`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  twoFAEnabled ? "bg-green-500/20" : "bg-white/10"
                }`}>
                  <Shield className={`w-6 h-6 ${twoFAEnabled ? "text-green-400" : "text-gray-400"}`} />
                </div>
                <div>
                  <p className="font-semibold text-white">Two-Factor Auth</p>
                  <p className={`text-sm ${twoFAEnabled ? "text-green-400" : "text-gray-400"}`}>
                    {twoFAEnabled ? "✓ Enabled and active" : "Not enabled"}
                  </p>
                </div>
              </div>

              {!twoFAEnabled ? (
                <div className="space-y-5">
                  {/* Step 1 */}
                  <div className="glass-dark rounded-2xl p-5 border border-white/10">
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold"
                        style={{ background: "#6366f1" }}>1</span>
                      Install Google Authenticator
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Download <span className="text-indigo-400 font-medium">Google Authenticator</span> or
                      any TOTP app (Authy, 1Password) on your phone.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="glass-dark rounded-2xl p-5 border border-white/10">
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold"
                        style={{ background: "#6366f1" }}>2</span>
                      Scan the QR Code
                    </h3>
                    {qrCode ? (
                      <div className="flex justify-center p-4 bg-white rounded-xl mb-2">
                        <img src={qrCode} alt="2FA QR Code" className="w-40 h-40" />
                      </div>
                    ) : (
                      <button onClick={loadQRCode}
                        className="btn-secondary w-full flex items-center justify-center gap-2">
                        <QrCode className="w-4 h-4" /> Generate QR Code
                      </button>
                    )}
                  </div>

                  {/* Step 3 — only shown after QR */}
                  {qrCode && (
                    <div className="glass-dark rounded-2xl p-5 border border-white/10">
                      <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold"
                          style={{ background: "#6366f1" }}>3</span>
                        Enter Verification Code
                      </h3>
                      <p className="text-gray-400 text-sm mb-4">
                        Enter the 6-digit code shown in your authenticator app.
                      </p>
                      <input
                        type="text"
                        value={totpToken}
                        onChange={e => setTotpToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        className="input-base w-full text-center text-2xl font-mono tracking-[0.5em] mb-4"
                        maxLength={6}
                        autoComplete="one-time-code"
                      />
                      {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3 mb-3">{error}</p>}
                      <button onClick={enableTwoFA}
                        disabled={totpToken.length !== 6 || isLoading}
                        className="btn-primary w-full flex items-center justify-center gap-2">
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Enable 2FA
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Backup codes */}
                  {backupCodes.length > 0 && (
                    <div className="rounded-2xl p-5 border"
                      style={{ background: "rgba(234,179,8,0.05)", borderColor: "rgba(234,179,8,0.2)" }}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-medium">Backup Codes</h3>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(backupCodes.join("\n"));
                            setCopiedCodes(true);
                            setTimeout(() => setCopiedCodes(false), 2000);
                          }}
                          className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
                          {copiedCodes
                            ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copied!</>
                            : <><Copy className="w-3.5 h-3.5" /> Copy all</>}
                        </button>
                      </div>
                      <p className="text-sm text-yellow-400 mb-4">
                        ⚠ Save these codes in a safe place. Each can only be used once.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {backupCodes.map((code, i) => (
                          <div key={i} className="font-mono text-sm text-white rounded-lg px-3 py-2 text-center"
                            style={{ background: "rgba(0,0,0,0.3)" }}>
                            {code}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Disable 2FA */}
                  <div className="rounded-2xl p-5 border border-white/10"
                    style={{ background: "rgba(255,255,255,0.02)" }}>
                    <h3 className="text-white font-medium mb-2">Disable 2FA</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Enter your authenticator code to confirm.
                    </p>
                    <input
                      type="text"
                      value={totpToken}
                      onChange={e => setTotpToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      className="input-base w-full mb-3 font-mono text-center text-xl tracking-[0.5em]"
                      maxLength={6}
                    />
                    <button onClick={disableTwoFA} disabled={totpToken.length !== 6 || isLoading}
                      className="btn-danger flex items-center gap-2">
                      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Disable 2FA
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {tab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Notifications</h2>
                <p className="text-gray-400 text-sm">Configure how and when you get notified.</p>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Direct Messages", desc: "Notify when you receive a DM", key: "directMessages" },
                  { label: "Mentions", desc: "Notify when @mentioned", key: "mentions" },
                  { label: "Friend Requests", desc: "Notify for new friend requests", key: "friendRequests" },
                  { label: "Room Invites", desc: "Notify for room invitations", key: "roomInvites" },
                  { label: "All Messages", desc: "Notify for all messages (not recommended)", key: "allMessages" },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-2xl border border-white/5"
                    style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div>
                      <p className="text-white font-medium text-sm">{item.label}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={item.key !== "allMessages"} className="sr-only peer" />
                      <div className="w-10 h-5 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"
                        style={{ background: "rgba(255,255,255,0.1)" }} />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── APPEARANCE ── */}
          {tab === "appearance" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Appearance</h2>
                <p className="text-gray-400 text-sm">Customize how NexTalk looks for you.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "dark", label: "Dark", bg: "#0f1523" },
                    { id: "darker", label: "Darker", bg: "#000000" },
                    { id: "system", label: "System", bg: "linear-gradient(to right, #1f2937, #f9fafb)" },
                  ].map(t => (
                    <button key={t.id} className="flex flex-col items-center gap-2 p-3 rounded-xl border border-white/10 hover:border-indigo-500/50 transition-all">
                      <div className="w-full h-16 rounded-lg border border-white/5"
                        style={{ background: t.bg }} />
                      <span className="text-sm text-gray-300">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Message Display</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "comfortable", label: "Comfortable", desc: "More spacing between messages" },
                    { id: "compact", label: "Compact", desc: "Fits more content on screen" },
                  ].map(m => (
                    <button key={m.id} className="p-4 rounded-xl border border-white/10 hover:border-indigo-500/50 transition-all text-left">
                      <p className="text-sm text-gray-300 font-medium">{m.label}</p>
                      <p className="text-xs text-gray-500 mt-1">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
