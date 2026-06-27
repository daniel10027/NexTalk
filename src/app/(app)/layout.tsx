import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import AppSidebar from "@/components/layout/AppSidebar";
import SocketInitializer from "@/components/layout/SocketInitializer";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#090e1a" }}
    >
      <SocketInitializer />
      <AppSidebar />
      {/* padding-top sur mobile pour le bouton hamburger */}
      <main className="flex-1 overflow-hidden pt-0 lg:pt-0">
        <div className="h-full flex flex-col">
          {/* Spacer mobile pour le bouton hamburger */}
          <div className="lg:hidden h-12 flex-shrink-0" />
          <div className="flex-1 overflow-hidden">{children}</div>
        </div>
      </main>
    </div>
  );
}
