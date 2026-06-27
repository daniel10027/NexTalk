// @ts-nocheck
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import connectDB from "@/lib/db/mongoose";
import User from "@/models/User";
import { authOptions } from "@/lib/auth/options";
import { apiResponse, apiError, generateToken } from "@/lib/utils";
import { AuditLog } from "@/models/index";

// GET: Generate 2FA secret and QR code
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const secret = authenticator.generateSecret();
  const otpAuthUrl = authenticator.keyuri(
    session.user.email!,
    "NexTalk",
    secret
  );
  const qrCode = await QRCode.toDataURL(otpAuthUrl);

  return apiResponse({ secret, qrCode, otpAuthUrl });
}

// POST: Enable/disable 2FA
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { action, secret, token } = await req.json();

  await connectDB();

  if (action === "enable") {
    if (!secret || !token) return apiError("Secret and token required");

    const isValid = authenticator.verify({ token, secret });
    if (!isValid) return apiError("Invalid 2FA code", 400);

    const backupCodes = Array.from({ length: 8 }, () => generateToken(4).toUpperCase());

    await User.findByIdAndUpdate(session.user.id, {
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      twoFactorBackupCodes: backupCodes,
    });

    await AuditLog.create({
      actor: session.user.id,
      action: "user.2fa.enabled",
      severity: "medium",
    });

    return apiResponse({ message: "2FA enabled", backupCodes });
  }

  if (action === "disable") {
    if (!token) return apiError("Token required");

    const user = await User.findById(session.user.id).select("+twoFactorSecret");
    if (!user?.twoFactorSecret) return apiError("2FA not enabled");

    const isValid = authenticator.verify({ token, secret: user.twoFactorSecret });
    if (!isValid) return apiError("Invalid 2FA code", 400);

    await User.findByIdAndUpdate(session.user.id, {
      twoFactorEnabled: false,
      twoFactorSecret: undefined,
      twoFactorBackupCodes: [],
    });

    await AuditLog.create({
      actor: session.user.id,
      action: "user.2fa.disabled",
      severity: "high",
    });

    return apiResponse({ message: "2FA disabled" });
  }

  return apiError("Invalid action");
}
