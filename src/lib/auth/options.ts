// @ts-nocheck
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db/mongoose";
import User from "@/models/User";
import { AuditLog } from "@/models/index";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totp: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        await connectDB();

        const user = await User.findOne({ email: credentials.email.toLowerCase() })
          .select("+password +twoFactorSecret +twoFactorEnabled");

        if (!user || !user.password) {
          throw new Error("No account found with this email");
        }

        if (!user.isActive || user.isBanned) {
          throw new Error(
            user.isBanned
              ? `Account banned: ${user.banReason || "Contact support"}`
              : "Account deactivated"
          );
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        if (!user.isEmailVerified) {
          throw new Error("Please verify your email before logging in");
        }

        // 2FA check
        if (user.twoFactorEnabled) {
          if (!credentials.totp) {
            throw new Error("2FA_REQUIRED");
          }
          const { authenticator } = await import("otplib");
          const isValid = authenticator.verify({
            token: credentials.totp,
            secret: user.twoFactorSecret!,
          });
          if (!isValid) {
            throw new Error("Invalid 2FA code");
          }
        }

        // Update login stats
        await User.findByIdAndUpdate(user._id, {
          $inc: { loginCount: 1 },
          lastLoginAt: new Date(),
        });

        await AuditLog.create({
          actor: user._id,
          action: "user.login",
          details: { method: "credentials" },
          severity: "low",
        });

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.displayName,
          image: user.avatar,
          username: user.username,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      await connectDB();

      if (account?.provider === "google" || account?.provider === "github") {
        const existing = await User.findOne({ email: user.email });

        if (!existing) {
          // Auto-create account for OAuth
          const username = await generateUniqueUsername(
            user.name?.toLowerCase().replace(/\s+/g, "_") || "user"
          );

          const newUser = await User.create({
            email: user.email,
            displayName: user.name || "User",
            username,
            avatar: user.image,
            provider: account.provider,
            providerId: account.providerAccountId,
            isEmailVerified: true,
            role: "user",
          });

          await AuditLog.create({
            actor: newUser._id,
            action: "user.register",
            details: { method: account.provider },
            severity: "low",
          });
        } else {
          await User.findByIdAndUpdate(existing._id, {
            $inc: { loginCount: 1 },
            lastLoginAt: new Date(),
            ...(user.image && !existing.avatar ? { avatar: user.image } : {}),
          });
        }
      }

      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.username = (user as { username?: string }).username;
        token.role = (user as { role?: string }).role;
      }

      if (account?.provider === "google" || account?.provider === "github") {
        await connectDB();
        const dbUser = await User.findOne({ email: token.email });
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.username = dbUser.username;
          token.role = dbUser.role;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
    verifyRequest: "/verify-email",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,

  events: {
    async signOut({ token }) {
      if (token?.id) {
        await connectDB();
        await User.findByIdAndUpdate(token.id, { status: "offline", lastSeen: new Date() });
      }
    },
  },
};

async function generateUniqueUsername(base: string): Promise<string> {
  const cleaned = base.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20) || "user";
  let username = cleaned;
  let counter = 1;

  while (await User.findOne({ username })) {
    username = `${cleaned}${counter}`;
    counter++;
  }

  return username;
}
