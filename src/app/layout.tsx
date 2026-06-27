import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import AuthProvider from "@/components/auth/AuthProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NexTalk — Real-Time Communication Platform",
    template: "%s | NexTalk",
  },
  description:
    "NexTalk is a modern real-time communication platform for teams and communities. Chat, call, collaborate — all in one place.",
  keywords: ["chat", "messaging", "real-time", "communication", "groups", "calls"],
  authors: [{ name: "NexTalk Team" }],
  creator: "NexTalk",
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXTAUTH_URL,
    title: "NexTalk — Real-Time Communication Platform",
    description: "Modern real-time messaging for teams and communities",
    siteName: "NexTalk",
  },
  twitter: {
    card: "summary_large_image",
    title: "NexTalk",
    description: "Modern real-time messaging for teams and communities",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#090e1a" },
    { media: "(prefers-color-scheme: light)", color: "#f8f9fc" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="antialiased">
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#161b2e",
                  color: "#f8f9fc",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  fontSize: "14px",
                },
                success: { iconTheme: { primary: "#22c55e", secondary: "#161b2e" } },
                error: { iconTheme: { primary: "#ef4444", secondary: "#161b2e" } },
              }}
            />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
