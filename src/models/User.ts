// @ts-nocheck
import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, select: false },
    displayName: { type: String, required: true, trim: true, maxlength: 50 },
    avatar: { type: String, default: null },
    bio: { type: String, maxlength: 200, default: "" },
    status: {
      type: String,
      enum: ["online", "offline", "away", "busy", "invisible"],
      default: "offline",
    },
    customStatus: { type: String, maxlength: 100 },
    lastSeen: { type: Date, default: Date.now },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    backupCodes: { type: [String], select: false },
    role: {
      type: String,
      enum: ["user", "moderator", "admin"],
      default: "user",
    },
    friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
    blockedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    friendRequests: [
      {
        from: { type: Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    notificationPreferences: {
      directMessages: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true },
      friendRequests: { type: Boolean, default: true },
      roomInvites: { type: Boolean, default: true },
      allMessages: { type: Boolean, default: false },
    },
    theme: { type: String, default: "dark" },
    badges: [{ type: String }],
    loginCount: { type: Number, default: 0 },
    messageCount: { type: Number, default: 0 },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String },
  },
  { timestamps: true },
);

UserSchema.index({ status: 1 });
UserSchema.index({ role: 1 });

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;
