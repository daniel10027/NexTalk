"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useSocket } from "@/hooks/useSocket";

interface Props {
  roomId: string;
  callType: "audio" | "video";
  targetUser?: { _id: string; displayName: string; avatar?: string };
  onEnd: () => void;
}

export default function CallModal({
  roomId,
  callType,
  targetUser,
  onEnd,
}: Props) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const [status, setStatus] = useState<
    "loading" | "calling" | "ringing" | "active" | "error"
  >("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [callId, setCallId] = useState<string | null>(null);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const callIdRef = useRef<string | null>(null);
  const iceServersRef = useRef<RTCIceServer[]>([
    { urls: "stun:stun.l.google.com:19302" },
  ]);

  const {
    socket,
    initiateCall,
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
  } = useSocket();

  const fmt = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const stopMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerRef.current?.close();
    peerRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const handleEnd = useCallback(() => {
    stopMedia();
    if (callIdRef.current) endCall(callIdRef.current, roomId);
    onEnd();
  }, [stopMedia, endCall, roomId, onEnd]);

  // Timer quand appel actif
  useEffect(() => {
    if (status === "active") {
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Créer la connexion RTCPeerConnection
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: iceServersRef.current,
      iceCandidatePoolSize: 10,
    });

    // Quand on reçoit un track distant (audio/vidéo de l'autre)
    pc.ontrack = (event) => {
      console.log("🎥 Remote track received:", event.track.kind, event.streams);
      const [remoteStream] = event.streams;
      if (remoteStream) {
        remoteStreamRef.current = remoteStream;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current
            .play()
            .catch((e) => console.warn("Remote play error:", e));
        }
        if (event.track.kind === "video") setHasRemoteVideo(true);
        setStatus("active");
      }
    };

    // Envoyer les candidats ICE à l'autre
    pc.onicecandidate = (event) => {
      if (event.candidate && targetUser && callIdRef.current) {
        console.log("🧊 Sending ICE candidate");
        sendIceCandidate(targetUser._id, event.candidate, callIdRef.current);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE state:", pc.iceConnectionState);
      if (
        pc.iceConnectionState === "connected" ||
        pc.iceConnectionState === "completed"
      ) {
        setStatus("active");
      }
      if (pc.iceConnectionState === "failed") {
        pc.restartIce();
      }
      if (pc.iceConnectionState === "disconnected") {
        setTimeout(() => {
          if (pc.iceConnectionState === "disconnected") handleEnd();
        }, 5000);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
      if (pc.connectionState === "connected") setStatus("active");
      if (pc.connectionState === "failed") {
        setStatus("error");
        setErrorMsg("Connection failed. Check your network.");
      }
    };

    return pc;
  }, [targetUser, sendIceCandidate, handleEnd]);

  // Initialisation principale
  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      try {
        setStatus("loading");

        // 1. Récupérer les serveurs TURN depuis l'API
        try {
          const turnRes = await fetch("/api/turn");
          const turnData = await turnRes.json();
          if (turnData.success && turnData.data.iceServers) {
            iceServersRef.current = turnData.data.iceServers;
            console.log(
              "✅ TURN servers loaded:",
              iceServersRef.current.length,
              "servers",
            );
          }
        } catch (e) {
          console.warn("⚠️ Failed to load TURN servers, using STUN only");
        }

        if (cancelled) return;

        // 2. Obtenir le stream local (micro + caméra si vidéo)
        const constraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video:
            callType === "video"
              ? {
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                  facingMode: "user",
                }
              : false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;

        // Afficher la vidéo locale
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true; // éviter l'écho
          await localVideoRef.current
            .play()
            .catch((e) => console.warn("Local play error:", e));
        }

        setStatus("ringing");

        // 3. Créer la connexion peer
        const pc = createPeerConnection();
        peerRef.current = pc;

        // Ajouter tous nos tracks locaux au peer
        stream.getTracks().forEach((track) => {
          console.log("➕ Adding track:", track.kind);
          pc.addTrack(track, stream);
        });

        // 4. Écouter call:initiated pour avoir le callId, puis créer l'offer
        socket?.once("call:initiated", async ({ callId: id }: any) => {
          if (cancelled || !peerRef.current) return;
          callIdRef.current = id;
          setCallId(id);
          console.log("📞 Call initiated with ID:", id);

          try {
            // Créer l'offer SDP
            const offer = await peerRef.current.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: callType === "video",
            });
            await peerRef.current.setLocalDescription(offer);
            console.log("📤 Sending offer SDP");
            if (targetUser) sendOffer(targetUser._id, offer, id);
          } catch (err: any) {
            console.error("Error creating offer:", err);
          }
        });

        // 5. Initier l'appel
        initiateCall(roomId, callType, targetUser?._id);
      } catch (err: any) {
        if (cancelled) return;
        setStatus("error");
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          setErrorMsg(
            "Permission denied. Please allow microphone/camera access.",
          );
        } else if (err.name === "NotFoundError") {
          setErrorMsg("No microphone or camera found on this device.");
        } else if (err.name === "NotReadableError") {
          setErrorMsg("Microphone/camera is already in use by another app.");
        } else {
          setErrorMsg(`Error: ${err.message}`);
        }
        console.error("Call setup error:", err);
      }
    };

    start();

    // Écouter les events WebRTC
    const offAccepted = onCallAccepted(() => {
      console.log("📞 Call accepted by other party");
      setStatus("active");
    });

    const offDeclined = onCallDeclined(() => {
      console.log("📞 Call declined");
      setStatus("error");
      setErrorMsg("Call was declined.");
      stopMedia();
      setTimeout(() => onEnd(), 2000);
    });

    const offEnded = onCallEnded(() => {
      console.log("📞 Call ended by other party");
      stopMedia();
      onEnd();
    });

    // Recevoir l'answer de l'autre
    const offAnswer = onWebRTCAnswer(async ({ answer }: any) => {
      console.log("📥 Received answer SDP");
      const pc = peerRef.current;
      if (!pc) return;
      try {
        if (pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          console.log("✅ Remote description set from answer");
        }
      } catch (err) {
        console.error("Error setting remote answer:", err);
      }
    });

    // Recevoir les candidats ICE de l'autre
    const offIce = onWebRTCIceCandidate(async ({ candidate }: any) => {
      const pc = peerRef.current;
      if (!pc || !candidate) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("🧊 ICE candidate added");
      } catch (err) {
        console.warn("Error adding ICE candidate:", err);
      }
    });

    // Recevoir l'offer si on est le destinataire (cas answerer)
    const offOffer = onWebRTCOffer(async ({ offer, callId: id }: any) => {
      console.log("📥 Received offer SDP (we are answerer)");
      const pc = peerRef.current;
      if (!pc) return;
      callIdRef.current = id;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log("📤 Sending answer SDP");
        if (targetUser) sendAnswer(targetUser._id, answer, id);
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    });

    return () => {
      cancelled = true;
      offAccepted?.();
      offDeclined?.();
      offEnded?.();
      offAnswer?.();
      offIce?.();
      offOffer?.();
    };
  }, []);

  // Toggle micro
  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = isMuted; // si muted=true → on réactive
    });
    setIsMuted((m) => !m);
  };

  // Toggle caméra
  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = isVideoOff; // si videoOff=true → on réactive
    });
    setIsVideoOff((v) => !v);
  };

  // Toggle haut-parleur (remote audio)
  const toggleSpeaker = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !isSpeakerOff;
    }
    setIsSpeakerOff((s) => !s);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)" }}
    >
      <div
        className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: "#0f1523",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {/* Zone vidéo */}
        <div className="relative bg-black" style={{ aspectRatio: "16/9" }}>
          {/* Vidéo distante — grande (toujours présente, cachée si pas de vidéo) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${callType === "video" && hasRemoteVideo && status === "active" ? "block" : "hidden"}`}
          />

          {/* Placeholder quand pas de vidéo distante */}
          {!(callType === "video" && hasRemoteVideo && status === "active") && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #1a1f2e 0%, #0f1523 100%)",
              }}
            >
              {/* Avatar */}
              {targetUser?.avatar ? (
                <img
                  src={targetUser.avatar}
                  alt=""
                  className="w-24 h-24 rounded-full object-cover mb-5"
                  style={{
                    border: "3px solid rgba(99,102,241,0.5)",
                    boxShadow: "0 0 30px rgba(99,102,241,0.3)",
                  }}
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white mb-5"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.4))",
                    boxShadow: "0 0 30px rgba(99,102,241,0.3)",
                  }}
                >
                  {targetUser?.displayName?.[0]?.toUpperCase() || "?"}
                </div>
              )}

              <p className="text-white font-semibold text-2xl mb-2">
                {targetUser?.displayName || "Unknown"}
              </p>

              {/* Statut */}
              <p className="text-gray-400 text-sm">
                {status === "loading"
                  ? "Initializing..."
                  : status === "ringing"
                    ? "Calling..."
                    : status === "active"
                      ? fmt(duration)
                      : status === "error"
                        ? errorMsg
                        : ""}
              </p>

              {/* Animation points quand ça sonne */}
              {status === "ringing" && (
                <div className="flex gap-2 mt-4">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        background: "#6366f1",
                        animation: `callPulse 1.4s ease-in-out infinite ${i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Vidéo locale en bas à droite (PiP) */}
          {callType === "video" && (
            <div
              className={`absolute bottom-4 right-4 rounded-2xl overflow-hidden shadow-xl transition-all ${isVideoOff ? "opacity-50" : "opacity-100"}`}
              style={{
                width: "140px",
                aspectRatio: "4/3",
                border: "2px solid rgba(255,255,255,0.2)",
              }}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isVideoOff && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.7)" }}
                >
                  <VideoOff className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
          )}

          {/* Timer en haut à gauche quand actif */}
          {status === "active" && (
            <div
              className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(8px)",
              }}
            >
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white text-sm font-mono">
                {fmt(duration)}
              </span>
            </div>
          )}

          {/* Indicateur mute en haut à droite */}
          {isMuted && (
            <div
              className="absolute top-4 right-4 px-3 py-1.5 rounded-full flex items-center gap-1.5"
              style={{ background: "rgba(239,68,68,0.8)" }}
            >
              <MicOff className="w-3.5 h-3.5 text-white" />
              <span className="text-white text-xs">Muted</span>
            </div>
          )}

          {/* Video locale pour audio call (cachée) */}
          {callType === "audio" && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="hidden"
            />
          )}
        </div>

        {/* Contrôles */}
        <div
          className="flex items-center justify-center gap-4 p-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          {/* Micro */}
          <button
            onClick={toggleMute}
            title={isMuted ? "Unmute" : "Mute"}
            className="w-13 h-13 rounded-full flex items-center justify-center transition-all hover:scale-105"
            style={{
              width: "52px",
              height: "52px",
              background: isMuted
                ? "rgba(239,68,68,0.25)"
                : "rgba(255,255,255,0.1)",
              border: `1px solid ${isMuted ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.15)"}`,
            }}
          >
            {isMuted ? (
              <MicOff className="w-5 h-5" style={{ color: "#f87171" }} />
            ) : (
              <Mic className="w-5 h-5 text-white" />
            )}
          </button>

          {/* Caméra (uniquement si video call) */}
          {callType === "video" && (
            <button
              onClick={toggleVideo}
              title={isVideoOff ? "Turn on camera" : "Turn off camera"}
              className="rounded-full flex items-center justify-center transition-all hover:scale-105"
              style={{
                width: "52px",
                height: "52px",
                background: isVideoOff
                  ? "rgba(239,68,68,0.25)"
                  : "rgba(255,255,255,0.1)",
                border: `1px solid ${isVideoOff ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.15)"}`,
              }}
            >
              {isVideoOff ? (
                <VideoOff className="w-5 h-5" style={{ color: "#f87171" }} />
              ) : (
                <Video className="w-5 h-5 text-white" />
              )}
            </button>
          )}

          {/* Raccrocher */}
          <button
            onClick={handleEnd}
            title="End call"
            className="rounded-full flex items-center justify-center transition-all hover:scale-105"
            style={{
              width: "64px",
              height: "64px",
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              boxShadow: "0 4px 20px rgba(239,68,68,0.5)",
            }}
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </button>

          {/* Haut-parleur */}
          <button
            onClick={toggleSpeaker}
            title={isSpeakerOff ? "Unmute speaker" : "Mute speaker"}
            className="rounded-full flex items-center justify-center transition-all hover:scale-105"
            style={{
              width: "52px",
              height: "52px",
              background: isSpeakerOff
                ? "rgba(239,68,68,0.25)"
                : "rgba(255,255,255,0.1)",
              border: `1px solid ${isSpeakerOff ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.15)"}`,
            }}
          >
            {isSpeakerOff ? (
              <VolumeX className="w-5 h-5" style={{ color: "#f87171" }} />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        {/* Labels sous les boutons */}
        <div className="flex items-center justify-center gap-4 pb-4 px-6">
          <span
            className="text-xs text-gray-500"
            style={{ width: "52px", textAlign: "center" }}
          >
            {isMuted ? "Unmute" : "Mute"}
          </span>
          {callType === "video" && (
            <span
              className="text-xs text-gray-500"
              style={{ width: "52px", textAlign: "center" }}
            >
              {isVideoOff ? "Camera on" : "Camera off"}
            </span>
          )}
          <span
            className="text-xs text-red-400"
            style={{ width: "64px", textAlign: "center" }}
          >
            End call
          </span>
          <span
            className="text-xs text-gray-500"
            style={{ width: "52px", textAlign: "center" }}
          >
            {isSpeakerOff ? "Speaker on" : "Speaker off"}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes callPulse {
          0%, 100% { transform: scale(0.6); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
