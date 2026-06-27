"use client";

import { useSocket } from "@/hooks/useSocket";
import { useEffect } from "react";
import axios from "axios";
import { useChatStore } from "@/store/chatStore";

export default function SocketInitializer() {
  // Initialize the socket
  useSocket();
  const { setRooms } = useChatStore();

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const { data } = await axios.get("/api/rooms");
        if (data.success) {
          setRooms(data.data.rooms);
        }
      } catch (err) {
        console.error("Failed to load rooms", err);
      }
    };
    loadRooms();
  }, [setRooms]);

  return null;
}
