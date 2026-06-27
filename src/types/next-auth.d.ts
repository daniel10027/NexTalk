import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
      username: string;
      role: "user" | "moderator" | "admin";
      twoFactorEnabled?: boolean;
    };
  }

  interface User {
    id: string;
    username: string;
    role: "user" | "moderator" | "admin";
    twoFactorEnabled?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: "user" | "moderator" | "admin";
    twoFactorEnabled?: boolean;
  }
}
