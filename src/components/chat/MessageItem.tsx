"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Reply,
  Edit3,
  Trash2,
  Pin,
  MoreHorizontal,
  Download,
  File,
  Check,
  CheckCheck,
} from "lucide-react";
import UserAvatar from "@/components/shared/UserAvatar";
import { formatMessageTime, formatFileSize } from "@/lib/utils";
import { useSocket } from "@/hooks/useSocket";

const EMOJI_QUICK = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

interface Message {
  _id: string;
  content: string;
  type: string;
  sender: {
    _id: string;
    username: string;
    displayName: string;
    avatar?: string;
    role?: string;
  };
  createdAt: string;
  editHistory?: Array<{ content: string; editedAt: string }>;
  replyTo?: { _id: string; content: string; sender: { displayName: string } };
  reactions?: Array<{ emoji: string; users: string[]; count: number }>;
  attachments?: any[];
  isPinned?: boolean;
  isDeleted?: boolean;
  readBy?: string[];
}

interface Props {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  showDateDivider?: boolean;
  onReply: (m: Message) => void;
  onEdit: (m: Message) => void;
  roomId: string;
}

export default function MessageItem({
  message,
  isOwn,
  showAvatar,
  showDateDivider,
  onReply,
  onEdit,
  roomId,
}: Props) {
  const { data: session } = useSession();
  const [showActions, setShowActions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { reactToMessage, deleteMessage, pinMessage } = useSocket();

  if (message.isDeleted)
    return (
      <div className="px-4 py-1 flex justify-center">
        <span
          className="text-xs text-gray-500 italic px-3 py-1 rounded-full"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          Message deleted
        </span>
      </div>
    );

  const isEdited = (message.editHistory?.length || 0) > 0;

  const handleDelete = async () => {
    if (!confirm("Delete this message?")) return;
    setShowDropdown(false);
    try {
      await fetch(`/api/messages/${message._id}`, { method: "DELETE" });
    } catch {}
    deleteMessage(roomId, message._id);
  };

  const normalizeAttachment = (att: any) => {
    if (typeof att === "string") {
      const ext = att.split(".").pop()?.toLowerCase() || "";
      const imgExts = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
      const vidExts = ["mp4", "webm", "ogg", "mov"];
      const audExts = ["mp3", "wav", "m4a", "ogg"];
      let type = "application/octet-stream";
      if (imgExts.includes(ext)) type = `image/${ext === "jpg" ? "jpeg" : ext}`;
      else if (vidExts.includes(ext)) type = `video/${ext}`;
      else if (audExts.includes(ext)) type = `audio/${ext}`;
      return { url: att, name: att.split("/").pop() || "file", type };
    }
    return att;
  };

  const renderAttachment = (raw: any, idx: number) => {
    const att = normalizeAttachment(raw);
    if (!att?.url) return null;
    const t = att.type || "";
    const isImg =
      t.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(att.url);
    const isVid = t.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(att.url);
    const isAud = t.startsWith("audio/") || /\.(mp3|wav|m4a)$/i.test(att.url);

    if (isImg)
      return (
        <div
          key={idx}
          className="mt-2 rounded-xl overflow-hidden cursor-pointer"
          style={{ maxWidth: "260px" }}
          onClick={() => window.open(att.url, "_blank")}
        >
          <img
            src={att.url}
            alt={att.name || "image"}
            className="w-full object-cover rounded-xl hover:opacity-90 transition-opacity"
            onError={(e) => {
              (e.target as any).style.display = "none";
            }}
          />
        </div>
      );
    if (isVid)
      return (
        <div key={idx} className="mt-2" style={{ maxWidth: "260px" }}>
          <video src={att.url} controls className="w-full rounded-xl" />
        </div>
      );
    if (isAud)
      return (
        <div key={idx} className="mt-2">
          <audio src={att.url} controls className="max-w-xs" />
        </div>
      );
    return (
      <a
        key={idx}
        href={att.url}
        download={att.name}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex items-center gap-3 rounded-xl p-3 hover:opacity-80 transition-opacity"
        style={{ background: "rgba(255,255,255,0.1)", maxWidth: "240px" }}
      >
        <File className="w-4 h-4 flex-shrink-0" style={{ color: "#818cf8" }} />
        <span className="text-sm text-white truncate flex-1">
          {att.name || "File"}
        </span>
        <Download className="w-4 h-4 text-gray-400" />
      </a>
    );
  };

  const renderContent = (content: string) => {
    if (!content) return null;
    return content
      .split(/(@\w+|#\w+|https?:\/\/\S+|\*\*[^*]+\*\*|`[^`]+`)/g)
      .map((part, i) => {
        if (part.startsWith("@"))
          return (
            <span key={i} className="mention">
              @{part.slice(1)}
            </span>
          );
        if (part.startsWith("#"))
          return (
            <span key={i} className="hashtag">
              #{part.slice(1)}
            </span>
          );
        if (part.startsWith("http"))
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#a5b4fc" }}
              className="hover:underline break-all"
            >
              {part}
            </a>
          );
        if (part.startsWith("**") && part.endsWith("**"))
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith("`") && part.endsWith("`"))
          return (
            <code
              key={i}
              className="px-1 rounded text-xs font-mono"
              style={{ background: "rgba(0,0,0,0.3)", color: "#c4b5fd" }}
            >
              {part.slice(1, -1)}
            </code>
          );
        return <span key={i}>{part}</span>;
      });
  };

  return (
    <>
      {showDateDivider && (
        <div className="flex items-center gap-3 px-4 my-4">
          <div
            className="flex-1 h-px"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
          <span className="text-xs text-gray-500 px-2">
            {new Date(message.createdAt).toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </span>
          <div
            className="flex-1 h-px"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
        </div>
      )}

      <div
        className={`flex gap-2 px-4 py-0.5 group ${isOwn ? "flex-row-reverse" : "flex-row"}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => {
          if (!showDropdown) setShowActions(false);
        }}
      >
        {/* Avatar — côté gauche pour les autres, caché pour soi */}
        <div className="w-8 flex-shrink-0 flex items-end">
          {!isOwn && showAvatar && (
            <UserAvatar user={message.sender} size="sm" />
          )}
        </div>

        {/* Bulle */}
        <div
          className={`flex flex-col max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}
        >
          {/* Nom expéditeur */}
          {!isOwn && showAvatar && (
            <span
              className="text-xs font-medium mb-1 ml-1"
              style={{ color: "#a5b4fc" }}
            >
              {message.sender?.displayName}
            </span>
          )}

          {/* Reply preview */}
          {message.replyTo && (
            <div
              className="mb-1 px-3 py-1.5 rounded-xl text-xs max-w-xs"
              style={{
                background: "rgba(255,255,255,0.06)",
                borderLeft: "2px solid #6366f1",
              }}
            >
              <span className="font-medium" style={{ color: "#818cf8" }}>
                {message.replyTo.sender?.displayName}
              </span>
              <p className="text-gray-400 truncate">
                {message.replyTo.content}
              </p>
            </div>
          )}

          {/* Message bubble */}
          <div className="relative">
            <div
              className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
              style={{
                background: isOwn
                  ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                  : "rgba(255,255,255,0.08)",
                color: isOwn ? "#ffffff" : "#e2e8f0",
                borderBottomRightRadius: isOwn ? "4px" : "16px",
                borderBottomLeftRadius: isOwn ? "16px" : "4px",
              }}
            >
              {message.content && (
                <p className="whitespace-pre-wrap break-words">
                  {renderContent(message.content)}
                  {isEdited && (
                    <span className="text-xs opacity-60 ml-1">(edited)</span>
                  )}
                </p>
              )}
              {message.attachments?.map((att, idx) =>
                renderAttachment(att, idx),
              )}
            </div>

            {/* Actions flottantes */}
            {showActions && (
              <div
                className={`absolute -top-8 ${isOwn ? "right-0" : "left-0"} flex items-center gap-1 rounded-xl px-1 py-1 shadow-lg z-10`}
                style={{
                  background: "#1e2538",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {EMOJI_QUICK.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => reactToMessage(roomId, message._id, emoji)}
                    className="w-6 h-6 flex items-center justify-center text-sm rounded-lg hover:bg-white/10"
                  >
                    {emoji}
                  </button>
                ))}
                <div
                  className="w-px h-4 mx-0.5"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                />
                <button
                  onClick={() => onReply(message)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <Reply className="w-3 h-3" />
                </button>
                {isOwn && (
                  <button
                    onClick={() => onEdit(message)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                )}
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
                  >
                    <MoreHorizontal className="w-3 h-3" />
                  </button>
                  {showDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowDropdown(false)}
                      />
                      <div
                        className={`absolute ${isOwn ? "right-0" : "left-0"} top-7 z-20 w-40 rounded-xl shadow-xl py-1`}
                        style={{
                          background: "#1e2538",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        <button
                          onClick={() => {
                            pinMessage(roomId, message._id);
                            setShowDropdown(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white"
                        >
                          <Pin className="w-3.5 h-3.5" />{" "}
                          {message.isPinned ? "Unpin" : "Pin"}
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(message.content);
                            setShowDropdown(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white"
                        >
                          Copy
                        </button>
                        {isOwn && (
                          <button
                            onClick={handleDelete}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {message.reactions.map((r, i) => (
                <button
                  key={i}
                  onClick={() => reactToMessage(roomId, message._id, r.emoji)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors"
                  style={{
                    background: r.users.includes(session?.user?.id || "")
                      ? "rgba(99,102,241,0.25)"
                      : "rgba(255,255,255,0.06)",
                    borderColor: r.users.includes(session?.user?.id || "")
                      ? "rgba(99,102,241,0.5)"
                      : "rgba(255,255,255,0.1)",
                    color: "#e2e8f0",
                  }}
                >
                  {r.emoji} {r.count}
                </button>
              ))}
            </div>
          )}

          {/* Heure + read receipt */}
          <div
            className={`flex items-center gap-1 mt-0.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
          >
            <span className="text-[10px] text-gray-500">
              {formatMessageTime(message.createdAt)}
            </span>
            {isOwn &&
              ((message.readBy?.length ?? 0) > 0 ? (
                <CheckCheck className="w-3 h-3" style={{ color: "#818cf8" }} />
              ) : (
                <Check className="w-3 h-3 text-gray-600" />
              ))}
          </div>
        </div>
      </div>
    </>
  );
}
