"use client";

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
  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl shadow-2xl overflow-hidden"
      style={{
        background: "#1a1f2e",
        border: "1px solid rgba(255,255,255,0.15)",
      }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">
          Incoming {callType === "video" ? "Video" : "Voice"} Call
        </p>
        <div className="flex items-center gap-3">
          {caller.avatar ? (
            <img
              src={caller.avatar}
              alt=""
              className="w-12 h-12 rounded-full object-cover"
              style={{ border: "2px solid rgba(99,102,241,0.5)" }}
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ background: "rgba(99,102,241,0.3)" }}
            >
              {caller.displayName[0]}
            </div>
          )}
          <div>
            <p className="text-white font-semibold">{caller.displayName}</p>
            <p className="text-gray-400 text-sm flex items-center gap-1">
              {callType === "video" ? (
                <Video className="w-3.5 h-3.5" />
              ) : (
                <Phone className="w-3.5 h-3.5" />
              )}
              {callType === "video" ? "Video call" : "Voice call"}
            </p>
          </div>
        </div>
      </div>

      {/* Animated bar */}
      <div
        className="h-0.5 mx-5 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.05)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
            animation: "incoming-call 2s linear infinite",
            width: "100%",
          }}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 p-5">
        <button
          onClick={onDecline}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm text-white transition-all"
          style={{
            background: "rgba(239,68,68,0.2)",
            border: "1px solid rgba(239,68,68,0.3)",
          }}
        >
          <PhoneOff className="w-4 h-4" style={{ color: "#f87171" }} />
          Decline
        </button>
        <button
          onClick={onAccept}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm text-white transition-all"
          style={{
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            boxShadow: "0 4px 15px rgba(34,197,94,0.3)",
          }}
        >
          <Phone className="w-4 h-4" />
          Accept
        </button>
      </div>

      <style>{`
        @keyframes incoming-call {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
