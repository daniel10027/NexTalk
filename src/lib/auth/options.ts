// @ts-nocheck
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db/mongoose";
import { User, AuditLog } from "@/models";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
          throw new Error("Email et mot de passe requis");
        }

        await connectDB();

        const user = await User.findOne({
          email: credentials.email.toLowerCase(),
        }).select("+password +twoFactorSecret");

        if (!user) {
          throw new Error("Aucun compte trouvé avec cet email");
        }

        if (!user.password) {
          throw new Error(
            "Ce compte utilise Google ou GitHub. Connecte-toi avec ces méthodes.",
          );
        }

        // Vérifier si banni (pas isActive qui n'existe pas)
        if (user.isBanned) {
          throw new Error(
            `Compte banni : ${user.banReason || "Contacte le support"}`,
          );
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );
        if (!isPasswordValid) {
          throw new Error("Mot de passe incorrect");
        }

        if (!user.isEmailVerified) {
          throw new Error("Vérifie ton email avant de te connecter");
        }

        // 2FA
        if (user.twoFactorEnabled && user.twoFactorSecret) {
          if (!credentials.totp) {
            throw new Error("2FA_REQUIRED");
          }
          const { authenticator } = await import("otplib");
          const isValid = authenticator.verify({
            token: credentials.totp,
            secret: user.twoFactorSecret,
          });
          if (!isValid) {
            throw new Error("Code 2FA invalide");
          }
        }

        // Mettre à jour les stats
        await User.findByIdAndUpdate(user._id, {
          $inc: { loginCount: 1 },
          lastSeen: new Date(),
        });

        try {
          await AuditLog.create({
            actor: user._id,
            action: "user_login",
            details: "credentials",
            severity: "low",
          });
        } catch {}

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
      try {
        await connectDB();

        if (account?.provider === "google" || account?.provider === "github") {
          const existing = await User.findOne({ email: user.email });

          if (!existing) {
            const username = await generateUniqueUsername(
              user.name?.toLowerCase().replace(/\s+/g, "_") || "user",
            );

            // Vérifier si admin
            const adminEmails = (process.env.ADMIN_EMAILS || "")
              .split(",")
              .map((e) => e.trim());
            const role = adminEmails.includes(user.email!) ? "admin" : "user";

            await User.create({
              email: user.email,
              displayName: user.name || "User",
              username,
              avatar: user.image,
              isEmailVerified: true,
              role,
            });
          } else {
            // Mettre à jour avatar si pas encore défini
            const updates: any = {
              $inc: { loginCount: 1 },
              lastSeen: new Date(),
            };
            if (user.image && !existing.avatar) updates.avatar = user.image;
            await User.findByIdAndUpdate(existing._id, updates);
          }
        }
      } catch (err) {
        console.error("signIn callback error:", err);
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.role = (user as any).role;
      }

      // Pour OAuth, récupérer les infos depuis la DB
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: token.email }).select(
            "_id username role",
          );
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.username = dbUser.username;
            token.role = dbUser.role;
          }
        } catch {}
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = (token.role as string) || "user";
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,

  events: {
    async signOut({ token }) {
      if (token?.id) {
        try {
          await connectDB();
          await User.findByIdAndUpdate(token.id, {
            status: "offline",
            lastSeen: new Date(),
          });
        } catch {}
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
