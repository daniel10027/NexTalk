// @ts-nocheck
import mongoose, { Schema } from "mongoose";

// ─── Notification ───────────────────────────────────────────────────────────
const NotificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: [
        "message",
        "mention",
        "friend_request",
        "friend_accept",
        "room_invite",
        "room_join",
        "call",
        "system",
        "reaction",
        "badge",
      ],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    data: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });

// ─── Invitation ──────────────────────────────────────────────────────────────
const InvitationSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    type: { type: String, enum: ["room", "friend", "email"], required: true },
    inviter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    room: { type: Schema.Types.ObjectId, ref: "Room" },
    email: { type: String },
    maxUses: { type: Number, default: null },
    uses: { type: Number, default: 0 },
    usedBy: [
      { user: { type: Schema.Types.ObjectId, ref: "User" }, usedAt: Date },
    ],
    expiresAt: { type: Date },
    isRevoked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// ─── AuditLog ────────────────────────────────────────────────────────────────
const AuditLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    targetModel: { type: String },
    targetId: { type: Schema.Types.ObjectId },
    details: { type: Schema.Types.Mixed },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true },
);

AuditLogSchema.index({ actor: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ severity: 1 });
AuditLogSchema.index({ createdAt: -1 });

// ─── Call ────────────────────────────────────────────────────────────────────
const CallSchema = new Schema(
  {
    room: { type: Schema.Types.ObjectId, ref: "Room" },
    type: { type: String, enum: ["audio", "video"], required: true },
    initiator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    participants: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        joinedAt: Date,
        leftAt: Date,
        duration: Number,
      },
    ],
    status: {
      type: String,
      enum: ["ringing", "active", "completed", "missed", "declined"],
      default: "ringing",
    },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    duration: { type: Number },
  },
  { timestamps: true },
);

export const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);
export const Invitation =
  mongoose.models.Invitation || mongoose.model("Invitation", InvitationSchema);
export const AuditLog =
  mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
export const Call = mongoose.models.Call || mongoose.model("Call", CallSchema);

export { User } from "./User";
export { Message } from "./Message";
export { Room } from "./Room";
