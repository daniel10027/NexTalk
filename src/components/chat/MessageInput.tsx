"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  Smile,
  X,
  Bold,
  Italic,
  Code,
  Edit3,
  Loader2,
  Image,
  File,
  Mic,
} from "lucide-react";
import { formatFileSize } from "@/lib/utils";

const EMOJIS = [
  "😀",
  "😂",
  "😍",
  "🥰",
  "😎",
  "🤔",
  "😢",
  "😡",
  "👍",
  "👎",
  "❤️",
  "🔥",
  "✨",
  "🎉",
  "💯",
  "🚀",
  "👀",
  "💪",
  "🙏",
  "😴",
  "🤝",
  "💬",
  "🎯",
  "💡",
  "⭐",
];

interface Message {
  _id: string;
  content: string;
  sender: { displayName: string };
}

interface PendingFile {
  file: File;
  preview?: string;
  uploading: boolean;
  url?: string;
  error?: string;
}

interface Props {
  roomId: string;
  replyTo: Message | null;
  editingMessage: Message | null;
  onCancelReply: () => void;
  onCancelEdit: () => void;
  onSend: (content: string, attachments?: string[], replyToId?: string) => void;
  onEdit: (messageId: string, content: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function MessageInput({
  roomId,
  replyTo,
  editingMessage,
  onCancelReply,
  onCancelEdit,
  onSend,
  onEdit,
  onTypingStart,
  onTypingStop,
  disabled,
  placeholder = "Message...",
}: Props) {
  const [content, setContent] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);
  const isTyping = useRef(false);

  // Pré-remplir lors de l'édition
  useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content);
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  // Auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [content]);

  const handleTyping = (val: string) => {
    setContent(val);
    if (!isTyping.current) {
      isTyping.current = true;
      onTypingStart();
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      isTyping.current = false;
      onTypingStop();
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      onCancelReply();
      onCancelEdit();
    }
  };

  const handleSubmit = async () => {
    const trimmed = content.trim();
    const uploadedUrls = pendingFiles.filter((f) => f.url).map((f) => f.url!);
    if (!trimmed && uploadedUrls.length === 0) return;
    if (disabled) return;

    if (editingMessage) {
      onEdit(editingMessage._id, trimmed);
      onCancelEdit();
    } else {
      onSend(trimmed, uploadedUrls, replyTo?._id);
      if (replyTo) onCancelReply();
    }

    setContent("");
    setPendingFiles([]);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    isTyping.current = false;
    onTypingStop();
    textareaRef.current?.focus();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newPending: PendingFile[] = files.map((f) => ({
      file: f,
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
      uploading: true,
    }));
    setPendingFiles((prev) => [...prev, ...newPending]);

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          setPendingFiles((prev) =>
            prev.map((pf) =>
              pf.file === file
                ? { ...pf, uploading: false, url: data.data.url }
                : pf,
            ),
          );
        } else {
          setPendingFiles((prev) =>
            prev.map((pf) =>
              pf.file === file
                ? { ...pf, uploading: false, error: "Failed" }
                : pf,
            ),
          );
        }
      } catch {
        setPendingFiles((prev) =>
          prev.map((pf) =>
            pf.file === file
              ? { ...pf, uploading: false, error: "Failed" }
              : pf,
          ),
        );
      }
    }
    e.target.value = "";
  };

  const removeFile = (idx: number) => {
    setPendingFiles((prev) => {
      if (prev[idx].preview) URL.revokeObjectURL(prev[idx].preview!);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const insertEmoji = (emoji: string) => {
    const pos = textareaRef.current?.selectionStart ?? content.length;
    setContent((prev) => prev.slice(0, pos) + emoji + prev.slice(pos));
    setShowEmoji(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const canSend =
    (content.trim().length > 0 || pendingFiles.some((f) => f.url)) && !disabled;
  const isUploading = pendingFiles.some((f) => f.uploading);

  return (
    <div className="px-4 pb-4 flex-shrink-0">
      {/* Reply / Edit preview */}
      {(replyTo || editingMessage) && (
        <div
          className="mb-2 px-3 py-2 rounded-t-xl flex items-start justify-between gap-2"
          style={{
            background: editingMessage
              ? "rgba(234,179,8,0.1)"
              : "rgba(99,102,241,0.1)",
            borderLeft: `2px solid ${editingMessage ? "#eab308" : "#6366f1"}`,
          }}
        >
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-medium mb-0.5"
              style={{ color: editingMessage ? "#facc15" : "#818cf8" }}
            >
              {editingMessage
                ? "✏️ Editing message"
                : `↩ Replying to ${replyTo?.sender.displayName}`}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {editingMessage?.content ?? replyTo?.content}
            </p>
          </div>
          <button
            onClick={editingMessage ? onCancelEdit : onCancelReply}
            className="p-1 rounded hover:bg-white/10 text-gray-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* File previews */}
      {pendingFiles.length > 0 && (
        <div
          className="flex flex-wrap gap-2 mb-2 p-2 rounded-xl"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          {pendingFiles.map((pf, idx) => (
            <div key={idx} className="relative group">
              {pf.preview ? (
                <div className="w-16 h-16 rounded-lg overflow-hidden">
                  <img
                    src={pf.preview}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className="w-16 h-16 rounded-lg flex flex-col items-center justify-center gap-1 p-1"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <File className="w-5 h-5 text-gray-400" />
                  <span className="text-[9px] text-gray-500 text-center truncate w-full">
                    {pf.file.name}
                  </span>
                </div>
              )}
              {pf.uploading && (
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-lg"
                  style={{ background: "rgba(0,0,0,0.5)" }}
                >
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
              )}
              {pf.url && (
                <div
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: "#22c55e" }}
                >
                  <span className="text-white text-[8px]">✓</span>
                </div>
              )}
              <button
                onClick={() => removeFile(idx)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white items-center justify-center hidden group-hover:flex"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div
        className="flex flex-col rounded-2xl border transition-colors"
        style={{
          background: "rgba(255,255,255,0.04)",
          borderColor: disabled
            ? "rgba(255,255,255,0.05)"
            : "rgba(255,255,255,0.1)",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {/* Formatting toolbar */}
        <div
          className="flex items-center gap-1 px-3 pt-2 pb-1"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          {[
            {
              icon: Bold,
              action: () => {
                const ta = textareaRef.current;
                if (!ta) return;
                const s = ta.selectionStart,
                  e = ta.selectionEnd;
                setContent(
                  (c) =>
                    c.slice(0, s) + "**" + c.slice(s, e) + "**" + c.slice(e),
                );
              },
            },
            {
              icon: Italic,
              action: () => {
                const ta = textareaRef.current;
                if (!ta) return;
                const s = ta.selectionStart,
                  e = ta.selectionEnd;
                setContent(
                  (c) => c.slice(0, s) + "_" + c.slice(s, e) + "_" + c.slice(e),
                );
              },
            },
            {
              icon: Code,
              action: () => {
                const ta = textareaRef.current;
                if (!ta) return;
                const s = ta.selectionStart,
                  e = ta.selectionEnd;
                setContent(
                  (c) => c.slice(0, s) + "`" + c.slice(s, e) + "`" + c.slice(e),
                );
              },
            },
          ].map(({ icon: Icon, action }, i) => (
            <button
              key={i}
              onClick={action}
              className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2 px-3 pb-2 pt-1">
          {/* File attach */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors flex-shrink-0"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.zip,.txt,.doc,.docx"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "This channel is read-only" : placeholder}
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent text-gray-100 placeholder-gray-500 text-sm resize-none outline-none py-1.5 leading-relaxed"
            style={{ maxHeight: "160px", minHeight: "36px" }}
          />

          {/* Emoji picker */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowEmoji(!showEmoji)}
              className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <Smile className="w-5 h-5" />
            </button>
            {showEmoji && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowEmoji(false)}
                />
                <div
                  className="absolute bottom-12 right-0 z-20 rounded-2xl p-3 shadow-xl w-60"
                  style={{
                    background: "#1a1f2e",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <div className="grid grid-cols-8 gap-1">
                    {EMOJIS.map((e) => (
                      <button
                        key={e}
                        onClick={() => insertEmoji(e)}
                        className="w-7 h-7 flex items-center justify-center text-base rounded-lg hover:bg-white/10 transition-colors"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Send */}
          <button
            onClick={handleSubmit}
            disabled={!canSend || isUploading}
            className="p-2 rounded-xl flex-shrink-0 transition-all"
            style={{
              background:
                canSend && !isUploading
                  ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                  : "rgba(255,255,255,0.05)",
              color: canSend && !isUploading ? "#fff" : "#6b7280",
            }}
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <p className="text-center text-[10px] text-gray-600 mt-1">
        Enter to send · Shift+Enter for new line · Esc to cancel
      </p>
    </div>
  );
}
