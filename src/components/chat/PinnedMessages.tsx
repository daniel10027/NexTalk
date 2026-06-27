"use client";

import { useState } from "react";
import { Pin, ChevronDown, ChevronUp, X } from "lucide-react";

interface PinnedMessage {
  _id: string;
  content: string;
  sender: { displayName: string };
  createdAt: string;
}

interface PinnedMessagesProps {
  messages: PinnedMessage[];
  onUnpin?: (id: string) => void;
  canManage?: boolean;
}

export default function PinnedMessages({ messages, onUnpin, canManage }: PinnedMessagesProps) {
  const [expanded, setExpanded] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  if (messages.length === 0) return null;

  const current = messages[currentIdx];

  return (
    <div className="border-b border-white/5 bg-surface-800/50 px-4 py-2 flex-shrink-0">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Pin className="w-4 h-4 text-brand-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-semibold text-brand-400">
              Pinned Message {messages.length > 1 ? `(${currentIdx + 1}/${messages.length})` : ""}
            </span>
            {messages.length > 1 && (
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                  disabled={currentIdx === 0}
                  className="p-0.5 rounded hover:bg-white/10 text-gray-400 disabled:opacity-30 transition-colors"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setCurrentIdx(i => Math.min(messages.length - 1, i + 1))}
                  disabled={currentIdx === messages.length - 1}
                  className="p-0.5 rounded hover:bg-white/10 text-gray-400 disabled:opacity-30 transition-colors"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-300 truncate">
            <span className="text-gray-400">{current.sender.displayName}: </span>
            {current.content}
          </p>
        </div>
        {canManage && onUnpin && (
          <button
            onClick={() => onUnpin(current._id)}
            className="flex-shrink-0 p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Unpin"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
