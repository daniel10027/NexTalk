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

interface Attachment {
  url: string;
  name?: string;
  size?: number;
  type?: string;
}

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
  attachments?: (Attachment | string)[];
  isPinned?: boolean;
  isDeleted?: boolean;
  readBy?: string[];
}

interface Props {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  showDateDivider?: boolean;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
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

  if (message.isDeleted) {
    return (
      <div className="px-4 py-1 flex gap-3">
        <div className="w-10 flex-shrink-0" />
        <p className="text-sm text-gray-500 italic">
          This message was deleted.
        </p>
      </div>
    );
  }

  const isEdited = message.editHistory && message.editHistory.length > 0;

  const handleReact = (emoji: string) => {
    reactToMessage(roomId, message._id, emoji);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this message?")) return;
    setShowDropdown(false);
    try {
      await fetch(`/api/messages/${message._id}`, { method: "DELETE" });
    } catch {}
    deleteMessage(roomId, message._id);
  };

  // Normalise une pièce jointe (peut être string ou objet)
  const normalizeAttachment = (att: Attachment | string): Attachment => {
    if (typeof att === "string") {
      const ext = att.split(".").pop()?.toLowerCase() || "";
      const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
      const videoExts = ["mp4", "webm", "ogg", "mov"];
      const audioExts = ["mp3", "wav", "ogg", "m4a"];
      let type = "application/octet-stream";
      if (imageExts.includes(ext))
        type = `image/${ext === "jpg" ? "jpeg" : ext}`;
      else if (videoExts.includes(ext)) type = `video/${ext}`;
      else if (audioExts.includes(ext)) type = `audio/${ext}`;
      return { url: att, name: att.split("/").pop() || "file", type };
    }
    return att;
  };

  const renderAttachment = (raw: Attachment | string, idx: number) => {
    const att = normalizeAttachment(raw);
    if (!att?.url) return null;
    const type = att.type || "";
    const isImage =
      type.startsWith("image/") ||
      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(att.url);
    const isVideo =
      type.startsWith("video/") || /\.(mp4|webm|ogg|mov)$/i.test(att.url);
    const isAudio =
      type.startsWith("audio/") || /\.(mp3|wav|m4a)$/i.test(att.url);

    if (isImage)
      return (
        <div
          key={idx}
          className="mt-2 rounded-xl overflow-hidden"
          style={{ maxWidth: "300px" }}
        >
          <img
            src={att.url}
            alt={att.name || "image"}
            className="w-full object-cover cursor-pointer hover:opacity-90 transition-opacity rounded-xl"
            onClick={() => window.open(att.url, "_blank")}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      );

    if (isVideo)
      return (
        <div
          key={idx}
          className="mt-2 rounded-xl overflow-hidden"
          style={{ maxWidth: "300px" }}
        >
          <video src={att.url} controls className="w-full rounded-xl" />
        </div>
      );

    if (isAudio)
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
        className="mt-2 flex items-center gap-3 rounded-xl p-3 hover:bg-white/10 transition-colors"
        style={{ background: "rgba(255,255,255,0.05)", maxWidth: "280px" }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(99,102,241,0.2)" }}
        >
          <File className="w-4 h-4" style={{ color: "#818cf8" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {att.name || "File"}
          </p>
          {att.size && (
            <p className="text-xs text-gray-400">{formatFileSize(att.size)}</p>
          )}
        </div>
        <Download className="w-4 h-4 text-gray-400" />
      </a>
    );
  };

  const renderContent = (content: string) => {
    if (!content) return null;
    const parts = content.split(
      /(@\w+|#\w+|https?:\/\/\S+|\*\*[^*]+\*\*|`[^`]+`)/g,
    );
    return parts.map((part, i) => {
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
            style={{ color: "#818cf8" }}
            className="hover:underline"
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
            className="px-1 rounded text-sm font-mono"
            style={{ background: "rgba(0,0,0,0.3)", color: "#a5b4fc" }}
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
        <div className="divider my-4">
          <span className="text-xs text-gray-500 px-3">
            {new Date(message.createdAt).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      )}

      <div
        className={`group relative flex gap-3 px-4 py-1 rounded-xl mx-2 transition-colors ${showActions ? "bg-white/[0.02]" : "hover:bg-white/[0.02]"}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => {
          if (!showDropdown) setShowActions(false);
        }}
      >
        {/* Avatar */}
        <div className="w-10 flex-shrink-0 pt-0.5">
          {showAvatar && <UserAvatar user={message.sender} size="sm" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {showAvatar && (
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="font-semibold text-white text-sm hover:underline cursor-pointer">
                {message.sender?.displayName}
              </span>
              {message.sender?.role === "admin" && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                  style={{
                    background: "rgba(99,102,241,0.2)",
                    color: "#818cf8",
                  }}
                >
                  ADMIN
                </span>
              )}
              <span className="text-xs text-gray-500">
                {formatMessageTime(message.createdAt)}
              </span>
            </div>
          )}

          {/* Reply preview */}
          {message.replyTo && (
            <div
              className="flex items-start gap-2 mb-1.5 pl-2"
              style={{ borderLeft: "2px solid rgba(99,102,241,0.5)" }}
            >
              <div>
                <span
                  className="text-xs font-medium"
                  style={{ color: "#818cf8" }}
                >
                  {message.replyTo.sender?.displayName}
                </span>
                <p className="text-xs text-gray-400 truncate max-w-xs">
                  {message.replyTo.content}
                </p>
              </div>
            </div>
          )}

          {/* Text content */}
          {message.content && (
            <p className="message-content text-sm text-gray-100 leading-relaxed">
              {renderContent(message.content)}
              {isEdited && (
                <span className="text-xs text-gray-500 ml-1">(edited)</span>
              )}
            </p>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-col gap-1">
              {message.attachments.map((att, idx) =>
                renderAttachment(att, idx),
              )}
            </div>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {message.reactions.map((r, i) => (
                <button
                  key={i}
                  onClick={() => handleReact(r.emoji)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors"
                  style={{
                    background: r.users.includes(session?.user?.id || "")
                      ? "rgba(99,102,241,0.2)"
                      : "rgba(255,255,255,0.05)",
                    borderColor: r.users.includes(session?.user?.id || "")
                      ? "rgba(99,102,241,0.5)"
                      : "rgba(255,255,255,0.1)",
                    color: r.users.includes(session?.user?.id || "")
                      ? "#a5b4fc"
                      : "#d1d5db",
                  }}
                >
                  <span>{r.emoji}</span>
                  <span>{r.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Read receipt */}
          {isOwn && (
            <div className="flex justify-end mt-0.5">
              {(message.readBy?.length ?? 0) > 0 ? (
                <CheckCheck
                  className="w-3.5 h-3.5"
                  style={{ color: "#818cf8" }}
                />
              ) : (
                <Check className="w-3.5 h-3.5 text-gray-500" />
              )}
            </div>
          )}
        </div>

        {/* Floating actions */}
        {showActions && (
          <div
            className="absolute -top-4 right-4 flex items-center gap-1 rounded-xl px-1 py-1 shadow-lg z-10"
            style={{
              background: "#1e2538",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {EMOJI_QUICK.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="w-7 h-7 flex items-center justify-center text-sm rounded-lg hover:bg-white/10 transition-colors"
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
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <Reply className="w-3.5 h-3.5" />
            </button>
            {isOwn && (
              <button
                onClick={() => onEdit(message)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
              {showDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div
                    className="absolute right-0 top-8 z-20 w-44 rounded-xl shadow-xl py-1"
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
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                    >
                      <Pin className="w-4 h-4" />{" "}
                      {message.isPinned ? "Unpin" : "Pin"}
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(message.content);
                        setShowDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                    >
                      Copy Text
                    </button>
                    {isOwn && (
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
