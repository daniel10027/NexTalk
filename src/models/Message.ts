// @ts-nocheck
import mongoose, { Schema } from "mongoose";

const MessageSchema = new Schema({
  content: { type: String, default: "" },
  type: { type: String, enum: ["text","image","video","audio","file","system","call","gif","sticker"], default: "text" },
  sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
  room: { type: Schema.Types.ObjectId, ref: "Room", required: true },
  replyTo: { type: Schema.Types.ObjectId, ref: "Message", default: null },
  attachments: [{
    url: String,
    name: String,
    size: Number,
    type: String,
    thumbnail: String,
  }],
  reactions: [{
    emoji: String,
    users: [{ type: Schema.Types.ObjectId, ref: "User" }],
    count: { type: Number, default: 0 },
  }],
  mentions: [{ type: Schema.Types.ObjectId, ref: "User" }],
  tags: [String],
  editHistory: [{
    content: String,
    editedAt: { type: Date, default: Date.now },
  }],
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
  isPinned: { type: Boolean, default: false },
  pinnedAt: { type: Date },
  pinnedBy: { type: Schema.Types.ObjectId, ref: "User" },
  readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  deliveredTo: [{ type: Schema.Types.ObjectId, ref: "User" }],
  callData: {
    type: { type: String, enum: ["audio", "video"] },
    duration: Number,
    status: { type: String, enum: ["missed", "completed", "declined"] },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  systemData: {
    action: String,
    target: { type: Schema.Types.ObjectId, ref: "User" },
  },
}, { timestamps: true });

MessageSchema.index({ room: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ content: "text" });

export const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema);
export default Message;
