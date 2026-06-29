// @ts-nocheck
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db/mongoose";
import User from "@/models/User";
import { apiResponse, apiError } from "@/lib/utils";
import { AuditLog } from "@/models";

export async function POST(req: NextRequest) {
  try {
    const { email, password, totp } = await req.json();
    if (!email || !password) return apiError("Email and password required");

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() })
      .select("+password +twoFactorSecret");

    if (!user) return apiError("Invalid email or password", 401);
    if (!user.password) return apiError("This account uses OAuth. Use Google or GitHub.", 401);
    if (user.isBanned) return apiError(`Account banned: ${user.banReason || "Contact support"}`, 403);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return apiError("Invalid email or password", 401);

    if (!user.isEmailVerified) return apiError("Please verify your email first", 403);

    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!totp) return apiError("2FA_REQUIRED", 401);
      const { authenticator } = await import("otplib");
      const valid2FA = authenticator.verify({ token: totp, secret: user.twoFactorSecret });
      if (!valid2FA) return apiError("Invalid 2FA code", 401);
    }

    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET!;
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, username: user.username, role: user.role },
      secret,
      { expiresIn: "30d" }
    );

    await User.findByIdAndUpdate(user._id, { $inc: { loginCount: 1 }, lastSeen: new Date() });
    try { await AuditLog.create({ actor: user._id, action: "user_login", details: "mobile", severity: "low" }); } catch {}

    return apiResponse({
      token,
      user: {
        id: user._id.toString(),
        name: user.displayName,
        email: user.email,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
        image: user.avatar,
        bio: user.bio,
        status: user.status,
      }
    });
  } catch (err) {
    console.error("Mobile login error:", err);
    return apiError("Internal server error", 500);
  }
}
