// @ts-nocheck
import { NextRequest } from "next/server";
import connectDB from "@/lib/db/mongoose";
import User from "@/models/User";
import { generateToken, hashToken, apiResponse, apiError } from "@/lib/utils";
import { sendPasswordResetEmail } from "@/lib/email/mailer";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return apiError("Email required");

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) return apiResponse({ message: "If that email exists, a reset link has been sent." });

    const token = generateToken();
    const hashedToken = hashToken(token);

    await User.findByIdAndUpdate(user._id, {
      passwordResetToken: hashedToken,
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    await sendPasswordResetEmail(user.email, token, user.displayName);

    return apiResponse({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    console.error(err);
    return apiError("Internal server error", 500);
  }
}
