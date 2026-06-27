import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { redirect } from "next/navigation";
import {
  MessageSquare, Users, Shield, Zap, Globe, Video,
  Bell, Lock, ArrowRight, Star, Check
} from "lucide-react";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/chat");

  return (
    <div className="min-h-screen bg-surface-950 text-surface-50 noise">
      {/* Grid background */}
      <div className="fixed inset-0 grid-pattern opacity-100 pointer-events-none" />

      {/* Hero glow */}
      <div className="fixed inset-0 hero-glow pointer-events-none" />

      {/* ── Navigation ────────────────────────────────────────────── */}
      <nav className="relative z-50 flex items-center justify-between px-6 lg:px-12 py-5 border-b border-white/[0.06] backdrop-blur-sm bg-surface-950/60 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Nex<span className="gradient-text">Talk</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-surface-400">
          <a href="#features" className="hover:text-surface-100 transition-colors">Features</a>
          <a href="#security" className="hover:text-surface-100 transition-colors">Security</a>
          <a href="#community" className="hover:text-surface-100 transition-colors">Community</a>
          <a href="#pricing" className="hover:text-surface-100 transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-surface-300 hover:text-white transition-colors font-medium">
            Sign in
          </Link>
          <Link href="/register" className="btn-primary text-sm py-2 px-5">
            Get started free
          </Link>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-600/10 border border-brand-500/20 rounded-full px-4 py-1.5 text-sm text-brand-300 mb-8">
          <Zap className="w-3.5 h-3.5" />
          <span>Real-time messaging, built for the future</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-none">
          Where conversations<br />
          <span className="gradient-text">come alive</span>
        </h1>

        <p className="text-xl text-surface-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          NexTalk brings your team and community together with blazing-fast messaging,
          HD video calls, smart channels, and an experience that feels effortlessly modern.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/register" className="btn-primary text-base py-3.5 px-8 flex items-center gap-2">
            Start for free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="btn-secondary text-base py-3.5 px-8">
            Sign into your account
          </Link>
        </div>

        {/* App preview */}
        <div className="relative mx-auto max-w-5xl">
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-600/30 via-brand-400/20 to-brand-600/30 rounded-2xl blur-xl opacity-60" />
          <div className="relative glass-dark rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            {/* Fake browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-surface-900/80">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <div className="flex-1 mx-4 bg-surface-800 rounded-lg px-3 py-1 text-xs text-surface-500 text-center">
                app.nextalk.io
              </div>
            </div>
            {/* App layout preview */}
            <div className="flex h-[480px]">
              {/* Sidebar */}
              <div className="w-64 border-r border-white/[0.06] bg-surface-900/50 p-3 space-y-1 hidden sm:block">
                <div className="flex items-center gap-2 p-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700" />
                  <span className="text-sm font-semibold">NexTalk</span>
                </div>
                {["general", "design", "engineering", "random", "announcements"].map((room, i) => (
                  <div key={room} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${i === 0 ? "bg-brand-600/15 text-brand-300" : "text-surface-500"}`}>
                    <span className="text-surface-600">#</span>
                    {room}
                    {i === 1 && <span className="ml-auto bg-brand-500 text-white text-[10px] rounded-full px-1.5">3</span>}
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-1">
                  {["Alice Chen", "Bob Smith", "Carol Wu"].map((name, i) => (
                    <div key={name} className="flex items-center gap-2 px-2 py-1.5 text-xs text-surface-500">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 relative">
                        <div className={`w-2 h-2 rounded-full absolute -bottom-0.5 -right-0.5 border border-surface-900 ${i === 0 ? "bg-green-500" : i === 1 ? "bg-yellow-500" : "bg-surface-600"}`} />
                      </div>
                      {name}
                    </div>
                  ))}
                </div>
              </div>
              {/* Chat area */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                  <span className="text-surface-600">#</span>
                  <span className="font-medium text-sm">general</span>
                  <span className="text-surface-600 text-xs ml-2">12 online</span>
                </div>
                <div className="flex-1 p-4 space-y-3 overflow-hidden">
                  {[
                    { name: "Alice", msg: "Hey everyone! Just shipped the new design 🚀", own: false },
                    { name: "Bob", msg: "Looks amazing! The new dark theme is 🔥", own: false },
                    { name: "You", msg: "@Alice great work! When does it go live?", own: true },
                    { name: "Alice", msg: "Going live tomorrow morning! CC @Carol for the deployment", own: false },
                  ].map((m, i) => (
                    <div key={i} className={`flex items-end gap-2 ${m.own ? "flex-row-reverse" : ""}`}>
                      {!m.own && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0" />
                      )}
                      <div className={`max-w-xs ${m.own ? "message-bubble-own" : "message-bubble-other"} px-3 py-2 text-xs`}>
                        {!m.own && <div className="text-brand-400 text-[10px] font-semibold mb-0.5">{m.name}</div>}
                        {m.msg}
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 text-surface-600 text-xs">
                    <div className="w-7 h-7 rounded-full bg-surface-700 flex-shrink-0" />
                    <div className="bg-surface-800 rounded-2xl rounded-bl-sm px-3 py-2 flex gap-1">
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  </div>
                </div>
                <div className="p-3 border-t border-white/[0.06]">
                  <div className="bg-surface-800/60 rounded-xl px-4 py-2.5 text-xs text-surface-500 border border-white/[0.06]">
                    Message #general...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <section className="relative z-10 border-y border-white/[0.06] bg-surface-900/30 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "10ms", label: "Message latency" },
            { value: "99.9%", label: "Uptime SLA" },
            { value: "256-bit", label: "AES encryption" },
            { value: "∞", label: "Message history" },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">{value}</div>
              <div className="text-surface-500 text-sm">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────── */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything you need to <span className="gradient-text">connect</span>
          </h2>
          <p className="text-surface-400 text-lg max-w-2xl mx-auto">
            From direct messages to massive community channels — NexTalk scales with you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: MessageSquare,
              title: "Real-Time Messaging",
              desc: "Instant delivery with typing indicators, read receipts, reactions, threads, and rich text formatting.",
              color: "from-brand-500 to-brand-700",
            },
            {
              icon: Video,
              title: "HD Video & Audio Calls",
              desc: "Crystal-clear peer-to-peer video and audio calls using WebRTC — no plugins, no downloads.",
              color: "from-purple-500 to-pink-600",
            },
            {
              icon: Users,
              title: "Groups & Channels",
              desc: "Create private groups or public channels. Manage roles, permissions, and invite codes.",
              color: "from-cyan-500 to-blue-600",
            },
            {
              icon: Bell,
              title: "Smart Notifications",
              desc: "@mentions, #tags, keyword alerts, and granular notification settings per channel.",
              color: "from-orange-500 to-red-600",
            },
            {
              icon: Lock,
              title: "End-to-End Security",
              desc: "JWT auth, 2FA with TOTP authenticator apps, OAuth, and bcrypt-hashed credentials.",
              color: "from-green-500 to-emerald-600",
            },
            {
              icon: Globe,
              title: "File Sharing",
              desc: "Share images, videos, documents and more via UploadThing CDN. Free and unlimited.",
              color: "from-yellow-500 to-orange-600",
            },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="card-base p-6 hover:border-brand-500/20 transition-all duration-300 group">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-surface-100 mb-2">{title}</h3>
              <p className="text-surface-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Security Section ──────────────────────────────────────── */}
      <section id="security" className="relative z-10 bg-surface-900/30 border-y border-white/[0.06] py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 text-sm text-green-400 mb-6">
                <Shield className="w-3.5 h-3.5" />
                Enterprise-grade security
              </div>
              <h2 className="text-4xl font-bold mb-6">
                Your conversations stay <span className="gradient-text">private</span>
              </h2>
              <div className="space-y-4">
                {[
                  "TOTP two-factor authentication (Google Authenticator compatible)",
                  "OAuth 2.0 via Google and GitHub",
                  "bcrypt password hashing with salt rounds",
                  "JWT session management with refresh rotation",
                  "Comprehensive audit logging for all admin actions",
                  "Rate limiting and abuse prevention",
                  "IP-based anomaly detection",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-surface-300 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card-base p-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-surface-800/60 rounded-xl border border-white/[0.06]">
                  <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-brand-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Two-Factor Auth</div>
                    <div className="text-xs text-surface-500">TOTP via Authenticator app</div>
                  </div>
                  <div className="ml-auto text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">Active</div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-surface-800/60 rounded-xl border border-white/[0.06]">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Session Security</div>
                    <div className="text-xs text-surface-500">JWT with 30-day expiry</div>
                  </div>
                  <div className="ml-auto text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">Secured</div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-surface-800/60 rounded-xl border border-white/[0.06]">
                  <div className="w-10 h-10 rounded-xl bg-orange-600/20 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Audit Logging</div>
                    <div className="text-xs text-surface-500">All events logged with severity</div>
                  </div>
                  <div className="ml-auto text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">Enabled</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────── */}
      <section id="pricing" className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Simple, transparent <span className="gradient-text">pricing</span></h2>
          <p className="text-surface-400">Start free, scale as you grow.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              name: "Free",
              price: "$0",
              desc: "Perfect for small teams",
              features: ["Up to 10 members", "10GB storage", "HD video calls", "Basic analytics"],
              cta: "Get started",
              highlight: false,
            },
            {
              name: "Pro",
              price: "$9",
              desc: "For growing communities",
              features: ["Unlimited members", "100GB storage", "Priority support", "Advanced analytics", "Custom roles", "API access"],
              cta: "Start free trial",
              highlight: true,
            },
            {
              name: "Enterprise",
              price: "Custom",
              desc: "For large organizations",
              features: ["Everything in Pro", "Unlimited storage", "SSO/SAML", "SLA guarantee", "Dedicated support", "Custom integrations"],
              cta: "Contact us",
              highlight: false,
            },
          ].map(({ name, price, desc, features, cta, highlight }) => (
            <div key={name} className={`card-base p-6 relative ${highlight ? "border-brand-500/40 bg-brand-950/20" : ""}`}>
              {highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-600 to-brand-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" /> Most popular
                </div>
              )}
              <div className="mb-4">
                <div className="text-surface-400 text-sm mb-1">{name}</div>
                <div className="text-3xl font-bold">{price}<span className="text-surface-500 text-sm font-normal">{price !== "Custom" ? "/mo" : ""}</span></div>
                <div className="text-surface-500 text-sm mt-1">{desc}</div>
              </div>
              <div className="space-y-2 mb-6">
                {features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-surface-300">
                    <Check className="w-4 h-4 text-brand-400 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <Link href="/register" className={`block text-center py-2.5 rounded-xl font-medium text-sm transition-all ${highlight ? "btn-primary" : "btn-secondary"}`}>
                {cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-16 pb-24">
        <div className="card-base p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900/30 to-purple-900/20 pointer-events-none" />
          <h2 className="relative text-4xl font-bold mb-4">Ready to <span className="gradient-text">get started?</span></h2>
          <p className="relative text-surface-400 mb-8 max-w-xl mx-auto">
            Join thousands of teams already using NexTalk. No credit card required.
          </p>
          <div className="relative flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary text-base py-3.5 px-8 flex items-center justify-center gap-2">
              Create free account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="btn-secondary text-base py-3.5 px-8">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-surface-900/30 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold">Nex<span className="gradient-text">Talk</span></span>
            </div>
            <div className="text-surface-500 text-sm">
              © {new Date().getFullYear()} NexTalk. Built with Next.js & MongoDB.
            </div>
            <div className="flex items-center gap-6 text-sm text-surface-500">
              <a href="#" className="hover:text-surface-300 transition-colors">Privacy</a>
              <a href="#" className="hover:text-surface-300 transition-colors">Terms</a>
              <a href="#" className="hover:text-surface-300 transition-colors">Docs</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
