// @ts-nocheck
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db/mongoose";
import User from "@/models/User";
import { AuditLog } from "@/models/index";
import { sendVerificationEmail } from "@/lib/email/mailer";
import { generateToken, hashToken, apiResponse, apiError } from "@/lib/utils";
import { z } from "zod";

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Min 3 characters")
    .max(32, "Max 32 characters")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Only letters, numbers, underscores, dots, hyphens"),
  email: z.string().email("Invalid email"),
  password: z
    .string()
    .min(8, "Min 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[0-9]/, "Must contain number"),
  displayName: z.string().min(1).max(64),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return apiError(validation.error.errors[0].message);
    }

    const { username, email, password, displayName } = validation.data;

    await connectDB();

    const [existingEmail, existingUsername] = await Promise.all([
      User.findOne({ email: email.toLowerCase() }),
      User.findOne({ username: username.toLowerCase() }),
    ]);

    if (existingEmail) return apiError("Email already in use", 409);
    if (existingUsername) return apiError("Username already taken", 409);

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = generateToken();
    const hashedToken = hashToken(verificationToken);

    const user = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      displayName,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isEmailVerified: false,
    });

    await AuditLog.create({
      actor: user._id,
      action: "user.register",
      details: { method: "credentials" },
      ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      severity: "low",
    });

    await sendVerificationEmail(email, verificationToken, displayName);

    return apiResponse(
      { message: "Account created. Please check your email to verify your account." },
      201
    );
  } catch (err) {
    console.error("register error", err);
    return apiError("Internal server error", 500);
  }
}
