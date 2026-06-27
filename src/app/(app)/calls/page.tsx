"use client";

import { useState, useEffect } from "react";
import { Phone, Video, PhoneMissed, PhoneIncoming, PhoneOutgoing, Clock, Loader2 } from "lucide-react";
import UserAvatar from "@/components/shared/UserAvatar";
import { formatRelativeTime, formatCallDuration } from "@/lib/utils";

interface Call {
  _id: string;
  type: "audio" | "video";
  status: "completed" | "missed" | "declined" | "ongoing";
  initiator: { _id: string; displayName: string; username: string; avatar?: string };
  participants: Array<{ user: { _id: string; displayName: string; avatar?: string }; duration?: number }>;
  startedAt: string;
  endedAt?: string;
  duration?: number;
  room?: { name: string };
}

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/calls")
      .then(r => r.json())
      .then(d => { if (d.success) setCalls(d.data.calls || []); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const getCallIcon = (call: Call) => {
    if (call.status === "missed") return <PhoneMissed className="w-4 h-4 text-red-400" />;
    if (call.type === "video") return <Video className="w-4 h-4 text-brand-400" />;
    return <Phone className="w-4 h-4 text-green-400" />;
  };

  const getStatusLabel = (call: Call) => {
    const map: Record<string, string> = { completed: "Completed", missed: "Missed", declined: "Declined", ongoing: "Ongoing" };
    return map[call.status] || call.status;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-white/5 bg-surface-800/50 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600/20 flex items-center justify-center">
            <Phone className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg">Call History</h1>
            <p className="text-gray-400 text-sm">{calls.length} calls recorded</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /></div>
        ) : calls.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-white font-medium mb-2">No call history</h3>
            <p className="text-gray-400 text-sm">Start a call from any chat conversation.</p>
          </div>
        ) : (
          <div className="max-w-2xl space-y-2">
            {calls.map(call => (
              <div key={call._id} className="glass-dark rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all flex items-center gap-4">
                <div className="relative">
                  <UserAvatar user={call.initiator} size="md" />
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-surface-800 ${
                    call.status === "missed" ? "bg-red-500/20" : "bg-surface-700"
                  }`}>
                    {getCallIcon(call)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white text-sm">{call.initiator.displayName}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      call.status === "completed" ? "bg-green-500/20 text-green-400"
                      : call.status === "missed" ? "bg-red-500/20 text-red-400"
                      : "bg-gray-500/20 text-gray-400"
                    }`}>{getStatusLabel(call)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      {call.type === "video" ? <Video className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                      {call.type === "video" ? "Video" : "Voice"} Call
                    </span>
                    {call.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatCallDuration(call.duration)}
                      </span>
                    )}
                    <span>{formatRelativeTime(call.startedAt)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors" title="Call back">
                    {call.type === "video" ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
