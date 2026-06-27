"use client";

import { useSocket } from "@/hooks/useSocket";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";

interface StatusSelectorProps {
  onClose: () => void;
}

const STATUSES = ["online", "away", "busy", "invisible"] as const;

export default function StatusSelector({ onClose }: StatusSelectorProps) {
  const { updateStatus } = useSocket();

  const handleSelect = (status: string) => {
    updateStatus(status);
    onClose();
  };

  return (
    <div className="bg-surface-800 border border-white/10 rounded-xl p-2 shadow-xl animate-fade-in">
      {STATUSES.map((status) => (
        <button
          key={status}
          onClick={() => handleSelect(status)}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-white/5 transition-colors text-left"
        >
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: STATUS_COLORS[status] }}
          />
          <span className="text-surface-300">{STATUS_LABELS[status]}</span>
        </button>
      ))}
    </div>
  );
}
