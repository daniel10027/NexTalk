// @ts-nocheck
import { NextRequest } from "next/server";
import connectDB from "@/lib/db/mongoose";
import User from "@/models/User";
import { hashToken, apiResponse, apiError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return apiError("Token required");

  await connectDB();
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: new Date() },
  });

  if (!user) return apiError("Invalid or expired verification token", 400);

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  // Import here to avoid circular deps
  const { sendWelcomeEmail } = await import("@/lib/email/mailer");
  await sendWelcomeEmail(user.email, user.displayName, user.username);

  return apiResponse({ message: "Email verified successfully" });
}
