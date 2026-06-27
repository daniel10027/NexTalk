// @ts-nocheck
import { NextRequest } from "next/server";
import connectDB from "@/lib/db/mongoose";
import { Room } from "@/models";
import { apiResponse, apiError } from "@/lib/utils";

// GET /api/admin/fix — Met à jour memberCount pour tous les rooms
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const rooms = await Room.find({});
    let updated = 0;
    for (const room of rooms) {
      room.memberCount = room.members.length;
      await room.save();
      updated++;
    }
    return apiResponse({ updated, message: `Updated ${updated} rooms` });
  } catch (err) {
    return apiError("Error: " + err, 500);
  }
}
