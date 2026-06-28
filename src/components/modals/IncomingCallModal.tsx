"use client";

import { useEffect, useRef } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";

interface Props {
  callId: string;
  callType: "audio" | "video";
  caller: { _id: string; displayName: string; avatar?: string };
  roomId: string;
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCallModal({
  callType,
  caller,
  onAccept,
  onDecline,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Jouer une sonnerie
  useEffect(() => {
    const audio = new Audio("/ringtone.mp3");
    audio.loop = true;
    audio.volume = 0.5;
    audio.play().catch(() => {}); // ignore si pas de permission
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  const handleAccept = () => {
    audioRef.current?.pause();
    onAccept();
  };

  const handleDecline = () => {
    audioRef.current?.pause();
    onDecline();
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-80 rounded-3xl shadow-2xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #1a1f2e, #0f1523)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow:
          "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.2)",
      }}
    >
      {/* Barre animée en haut */}
      <div className="h-1 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4, #6366f1)",
            backgroundSize: "200% 100%",
            animation: "slideGradient 2s linear infinite",
          }}
        />
      </div>

      <div className="p-5">
        {/* Header */}
        <p
          className="text-xs font-medium uppercase tracking-wider mb-4"
          style={{ color: "#818cf8" }}
        >
          Incoming {callType === "video" ? "Video" : "Voice"} Call
        </p>

        {/* Caller info */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            {caller.avatar ? (
              <img
                src={caller.avatar}
                alt=""
                className="w-14 h-14 rounded-full object-cover"
                style={{ border: "2px solid rgba(99,102,241,0.5)" }}
              />
            ) : (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.4))",
                }}
              >
                {caller.displayName?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            {/* Pulse ring */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                animation: "pulseRing 1.5s ease-out infinite",
                border: "2px solid rgba(99,102,241,0.6)",
              }}
            />
          </div>

          <div>
            <p className="text-white font-semibold text-lg leading-tight">
              {caller.displayName}
            </p>
            <p className="text-gray-400 text-sm flex items-center gap-1.5 mt-0.5">
              {callType === "video" ? (
                <>
                  <Video className="w-3.5 h-3.5" /> Video call
                </>
              ) : (
                <>
                  <Phone className="w-3.5 h-3.5" /> Voice call
                </>
              )}
            </p>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all hover:scale-105"
            style={{
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#f87171",
            }}
          >
            <PhoneOff className="w-4 h-4" />
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              boxShadow: "0 4px 20px rgba(34,197,94,0.4)",
              color: "white",
            }}
          >
            <Phone className="w-4 h-4" />
            Accept
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideGradient {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
