// @ts-nocheck
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return apiError("Unauthorized", 401);

  const username = process.env.TURN_USERNAME;
  const credential = process.env.TURN_CREDENTIAL;

  return apiResponse({
    iceServers: [
      // STUN Google (gratuit)
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      // TURN Metered (relai si P2P impossible)
      ...(username && credential
        ? [
            {
              urls: [
                "turn:relay.metered.ca:80",
                "turn:relay.metered.ca:80?transport=tcp",
                "turn:relay.metered.ca:443",
                "turn:relay.metered.ca:443?transport=tcp",
                "turns:relay.metered.ca:443",
                "turns:relay.metered.ca:443?transport=tcp",
              ],
              username,
              credential,
            },
          ]
        : []),
    ],
  });
}
