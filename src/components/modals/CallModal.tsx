"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  AlertCircle,
  PhoneIncoming,
} from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { useSession } from "next-auth/react";
import UserAvatar from "@/components/shared/UserAvatar";

interface Props {
  roomId: string;
  callType: "audio" | "video";
  targetUser?: { _id: string; displayName: string; avatar?: string };
  onEnd: () => void;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export default function CallModal({
  roomId,
  callType,
  targetUser,
  onEnd,
}: Props) {
  const { data: session } = useSession();
  const {
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    onCallAccepted,
    onCallDeclined,
    onCallEnded,
    onWebRTCOffer,
    onWebRTCAnswer,
    onWebRTCIceCandidate,
    onCallIncoming,
  } = useSocket();

  const [status, setStatus] = useState<
    "calling" | "ringing" | "active" | "error" | "declined"
  >("calling");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [callId, setCallId] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fmt = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // Démarrer le timer quand l'appel est actif
  useEffect(() => {
    if (status === "active") {
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Obtenir le stream local
  const getLocalStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === "video",
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  }, [callType]);

  // Créer la connexion peer
  const createPeer = useCallback(
    (stream: MediaStream) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (e) => {
        if (remoteVideoRef.current && e.streams[0]) {
          remoteVideoRef.current.srcObject = e.streams[0];
          setStatus("active");
        }
      };

      pc.onicecandidate = (e) => {
        if (e.candidate && targetUser && callId) {
          sendIceCandidate(targetUser._id, e.candidate, callId);
        }
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed"
        ) {
          setStatus("error");
          setErrorMsg("Connection lost");
        }
      };

      return pc;
    },
    [targetUser, callId, sendIceCandidate],
  );

  // Initier l'appel
  useEffect(() => {
    let cId: string;

    const start = async () => {
      try {
        const stream = await getLocalStream();
        setStatus("ringing");

        // Écouter la confirmation d'initiation
        const { socket } = useSocket();
        socket?.once("call:initiated", async ({ callId: id }: any) => {
          cId = id;
          setCallId(id);
          const pc = createPeer(stream);

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          if (targetUser) sendOffer(targetUser._id, offer, id);
        });

        initiateCall(roomId, callType, targetUser?._id);
      } catch (err: any) {
        setStatus("error");
        setErrorMsg(
          err.name === "NotAllowedError"
            ? "Permission refusée. Autorise le micro/caméra dans ton navigateur."
            : err.name === "NotFoundError"
              ? "Aucun micro ou caméra trouvé."
              : "Erreur : " + err.message,
        );
      }
    };

    start();

    // Écouter les événements WebRTC
    const offAccepted = onCallAccepted(async ({ callId: id }: any) => {
      setStatus("active");
    });

    const offDeclined = onCallDeclined(() => {
      setStatus("declined");
      setTimeout(() => handleEnd(), 2000);
    });

    const offEnded = onCallEnded(() => {
      handleEnd();
    });

    const offAnswer = onWebRTCAnswer(async ({ answer }: any) => {
      if (peerRef.current && peerRef.current.signalingState !== "stable") {
        await peerRef.current.setRemoteDescription(
          new RTCSessionDescription(answer),
        );
        setStatus("active");
      }
    });

    const offIce = onWebRTCIceCandidate(async ({ candidate }: any) => {
      try {
        if (peerRef.current && candidate) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch {}
    });

    return () => {
      offAccepted?.();
      offDeclined?.();
      offEnded?.();
      offAnswer?.();
      offIce?.();
    };
  }, []);

  const handleEnd = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerRef.current?.close();
    if (timerRef.current) clearInterval(timerRef.current);
    if (callId) endCall(callId, roomId);
    onEnd();
  };

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = isMuted;
    });
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = isVideoOff;
    });
    setIsVideoOff(!isVideoOff);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(10px)" }}
    >
      <div
        className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: "#0f1523",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {/* Vidéo distante (grande) */}
        <div className="relative bg-black" style={{ aspectRatio: "16/9" }}>
          {callType === "video" && status === "active" ? (
            <>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Vidéo locale (petite, en bas à droite) */}
              <div
                className="absolute bottom-4 right-4 w-32 rounded-xl overflow-hidden shadow-lg"
                style={{
                  border: "2px solid rgba(255,255,255,0.2)",
                  aspectRatio: "4/3",
                }}
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            </>
          ) : (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #1a1f2e, #0f1523)",
              }}
            >
              {/* Avatar */}
              <div className="mb-6">
                {targetUser?.avatar ? (
                  <img
                    src={targetUser.avatar}
                    alt=""
                    className="w-24 h-24 rounded-full object-cover"
                    style={{ border: "3px solid rgba(99,102,241,0.5)" }}
                  />
                ) : (
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white"
                    style={{ background: "rgba(99,102,241,0.3)" }}
                  >
                    {targetUser?.displayName?.[0] || "?"}
                  </div>
                )}
              </div>
              <p className="text-white font-semibold text-2xl mb-3">
                {targetUser?.displayName || "Unknown"}
              </p>
              <p className="text-gray-400 text-sm">
                {status === "calling"
                  ? "Initializing..."
                  : status === "ringing"
                    ? "Calling..."
                    : status === "declined"
                      ? "Call declined"
                      : status === "error"
                        ? errorMsg
                        : fmt(duration)}
              </p>
              {status === "ringing" && (
                <div className="mt-4 flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: "#6366f1",
                        animation: `bounce 1.2s infinite ${i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              )}
              {/* Vidéo locale en audio-only */}
              {callType === "video" && (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="hidden"
                />
              )}
            </div>
          )}

          {/* Timer en haut */}
          {status === "active" && (
            <div
              className="absolute top-4 left-4 px-3 py-1 rounded-full text-white text-sm font-mono"
              style={{ background: "rgba(0,0,0,0.5)" }}
            >
              {fmt(duration)}
            </div>
          )}
        </div>

        {/* Contrôles */}
        <div
          className="flex items-center justify-center gap-5 p-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <button
            onClick={toggleMute}
            className="w-13 h-13 w-12 h-12 rounded-full flex items-center justify-center transition-all"
            style={{
              background: isMuted
                ? "rgba(239,68,68,0.3)"
                : "rgba(255,255,255,0.1)",
              color: isMuted ? "#f87171" : "white",
            }}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          {callType === "video" && (
            <button
              onClick={toggleVideo}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
              style={{
                background: isVideoOff
                  ? "rgba(239,68,68,0.3)"
                  : "rgba(255,255,255,0.1)",
                color: isVideoOff ? "#f87171" : "white",
              }}
              title={isVideoOff ? "Camera on" : "Camera off"}
            >
              {isVideoOff ? (
                <VideoOff className="w-5 h-5" />
              ) : (
                <Video className="w-5 h-5" />
              )}
            </button>
          )}

          {/* Bouton raccrocher */}
          <button
            onClick={handleEnd}
            className="w-16 h-16 rounded-full flex items-center justify-center text-white transition-all"
            style={{
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              boxShadow: "0 4px 20px rgba(239,68,68,0.5)",
            }}
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>

        <style jsx>{`
          @keyframes bounce {
            0%,
            80%,
            100% {
              transform: scale(0.6);
              opacity: 0.4;
            }
            40% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
