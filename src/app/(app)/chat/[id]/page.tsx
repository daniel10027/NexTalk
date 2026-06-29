import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { notFound } from "next/navigation";
import connectDB from "@/lib/db/mongoose";
import { Room } from "@/models";
import ChatRoom from "@/components/chat/ChatRoom";

export default async function ChatRoomPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) notFound();

  await connectDB();

  const room = (await Room.findOne({
    _id: params.id,
    "members.user": session.user.id,
  })
    .populate("members.user", "username displayName avatar status")
    .populate("owner", "username displayName avatar")
    .lean()) as any;

  if (!room) notFound();

  // Filtrer les membres dont le user a été supprimé (populate retourne null)
  if (room.members) {
    room.members = room.members.filter((m: any) => m.user && m.user._id);
  }

  return <ChatRoom room={JSON.parse(JSON.stringify(room))} />;
}
