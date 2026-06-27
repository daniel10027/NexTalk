// @ts-nocheck
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db/mongoose";
import User from "@/models/User";
import { hashToken, apiResponse, apiError } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) return apiError("Token and password required");

    if (password.length < 8) return apiError("Password must be at least 8 characters");

    await connectDB();
    const hashedToken = hashToken(token);

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) return apiError("Invalid or expired reset token", 400);

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    });

    return apiResponse({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    console.error(err);
    return apiError("Internal server error", 500);
  }
}
