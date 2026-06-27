// @ts-nocheck
import mongoose, { Schema } from "mongoose";

const RoomSchema = new Schema({
  name: { type: String, trim: true, maxlength: 100 },
  slug: { type: String, lowercase: true, trim: true },
  description: { type: String, maxlength: 500, default: "" },
  type: { type: String, enum: ["direct", "group", "channel"], required: true },
  avatar: { type: String, default: null },
  banner: { type: String, default: null },
  owner: { type: Schema.Types.ObjectId, ref: "User" },
  members: [{
    user: { type: Schema.Types.ObjectId, ref: "User" },
    role: { type: String, enum: ["owner", "admin", "moderator", "member"], default: "member" },
    nickname: { type: String },
    isMuted: { type: Boolean, default: false },
    mutedUntil: { type: Date },
    lastRead: { type: Date, default: Date.now },
    notificationLevel: { type: String, enum: ["all", "mentions", "none"], default: "all" },
    joinedAt: { type: Date, default: Date.now },
  }],
  settings: {
    slowMode: { type: Number, default: 0 },
    maxMembers: { type: Number, default: 500 },
    readOnly: { type: Boolean, default: false },
    requireApproval: { type: Boolean, default: false },
    allowInvites: { type: Boolean, default: true },
    allowReactions: { type: Boolean, default: true },
    allowFiles: { type: Boolean, default: true },
  },
  inviteCode: { type: String, unique: true, sparse: true },
  pinnedMessages: [{ type: Schema.Types.ObjectId, ref: "Message" }],
  bans: [{
    user: { type: Schema.Types.ObjectId, ref: "User" },
    reason: String,
    bannedAt: { type: Date, default: Date.now },
    bannedBy: { type: Schema.Types.ObjectId, ref: "User" },
  }],
  tags: [{ type: String }],
  isPublic: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  memberCount: { type: Number, default: 0 },
  messageCount: { type: Number, default: 0 },
  lastMessageAt: { type: Date },
}, { timestamps: true });

RoomSchema.index({ type: 1 });
RoomSchema.index({ "members.user": 1 });
RoomSchema.index({ isPublic: 1 });
RoomSchema.index({ name: "text", description: "text" });

export const Room = mongoose.models.Room || mongoose.model("Room", RoomSchema);
export default Room;
