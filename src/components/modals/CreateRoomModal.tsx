"use client";

import { useState } from "react";
import { X, Hash, Users, Lock, Globe, Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

interface CreateRoomModalProps {
  onClose: () => void;
}

export default function CreateRoomModal({ onClose }: CreateRoomModalProps) {
  const router = useRouter();
  const [type, setType] = useState<"group" | "channel">("group");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description, type, isPublic }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/chat/${data.data.room._id}`);
        onClose();
      } else {
        setError(data.error || "Failed to create room");
      }
    } catch {
      setError("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface-800 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <h2 className="text-white font-semibold text-lg">Create a Room</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Room Type</label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: "group", icon: Users, label: "Group", desc: "Chat with a group of people" },
                { value: "channel", icon: Hash, label: "Channel", desc: "Broadcast to a community" },
              ] as const).map(({ value, icon: Icon, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={`flex flex-col items-start gap-2 p-4 rounded-xl border transition-all text-left ${
                    type === value
                      ? "border-brand-500 bg-brand-600/10 text-white"
                      : "border-white/10 hover:border-white/20 text-gray-400"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${type === value ? "text-brand-400" : ""}`} />
                  <div>
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {type === "channel" ? "Channel Name" : "Group Name"}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                {type === "channel" ? <Hash className="w-4 h-4" /> : <Users className="w-4 h-4" />}
              </span>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={type === "channel" ? "general" : "My Group"}
                maxLength={50}
                className="input-base w-full pl-9"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description <span className="text-gray-500">(optional)</span></label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What's this room about?"
              rows={2}
              maxLength={200}
              className="input-base w-full resize-none"
            />
          </div>

          {/* Visibility (channels only) */}
          {type === "channel" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Visibility</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: false, icon: Lock, label: "Private", desc: "Invite-only" },
                  { value: true, icon: Globe, label: "Public", desc: "Anyone can join" },
                ].map(({ value, icon: Icon, label, desc }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setIsPublic(value)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isPublic === value
                        ? "border-brand-500 bg-brand-600/10 text-white"
                        : "border-white/10 hover:border-white/20 text-gray-400"
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isPublic === value ? "text-brand-400" : ""}`} />
                    <div className="text-left">
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={isLoading || !name.trim()} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isLoading ? "Creating..." : "Create Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
