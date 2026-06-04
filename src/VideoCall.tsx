import { useEffect, useRef } from "react";
import { useWebRTC } from "./useWebRTC";

/**
 * Props for VideoCall component
 * TODO: Add additional props as needed for your implementation
 */
export type VideoCallProps = {
  /** Callback when offer is created */
  onCreateOffer: (offer: RTCSessionDescriptionInit) => Promise<void>;
  /** Callback when answer is created */
  onCreateAnswer: (answer: RTCSessionDescriptionInit) => Promise<void>;
  /** Callback to send ICE candidates to remote peer */
  onSendIceCandidate: (candidate: RTCIceCandidateInit) => void;
  /** Remote SDP to set */
  remoteSdp?: RTCSessionDescriptionInit;
  /** Remote ICE candidate to add */
  remoteIceCandidate?: RTCIceCandidateInit;
  /** Error handler callback */
  onError?: (error: Error) => void;
  /** Whether to show control buttons */
  showControls?: boolean;
  /** CSS class name for styling */
  className?: string;
  // TODO: Add more props as needed
};

/**
 * VideoCall Component
 * 
 * This is a boilerplate component for WebRTC video calls.
 * 
 * TODO: Implementation checklist:
 * - [ ] Add video/audio ref elements
 * - [ ] Implement local stream display
 * - [ ] Implement remote stream display
 * - [ ] Add proper error handling UI
 * - [ ] Style the component appropriately
 * - [ ] Add loading states
 * - [ ] Implement connection status display
 */
export function VideoCall({
  onCreateOffer,
  onCreateAnswer,
  onSendIceCandidate,
  remoteSdp,
  remoteIceCandidate,
  onError,
  showControls = true,
  className,
}: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { isConnected, localStream, remoteStream, createOffer, createAnswer, stop } = useWebRTC({
    onIceCandidate: onSendIceCandidate,
    onError,
  });

  // TODO: Connect local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      // Implement local stream connection
    }
  }, [localStream]);

  // TODO: Connect remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      // Implement remote stream connection
    }
  }, [remoteStream]);

  // TODO: Handle remote SDP changes
  useEffect(() => {
    // Implement remote SDP handling
  }, [remoteSdp]);

  // TODO: Handle remote ICE candidates
  useEffect(() => {
    // Implement remote ICE candidate handling
  }, [remoteIceCandidate]);

  return (
    <div className={className ?? "intelehealth-webrtc-container"}>
      {/* TODO: Replace with your styling framework */}
      <div style={{ padding: 18, background: "#fff", borderRadius: 14, border: "1px solid #ddd" }}>
        <h2>VideoCall Boilerplate</h2>
        <p>
          This is a template. Implement the WebRTC logic in <code>useWebRTC.ts</code> and UI in <code>VideoCall.tsx</code>.
        </p>
      </div>

      {/* Video containers */}
      <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {/* TODO: Add local video element */}
        <div style={{ background: "#000", borderRadius: 8, minHeight: 300 }}>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            style={{ width: "100%", height: "100%", borderRadius: 8 }}
          />
          <div style={{ textAlign: "center", color: "#999", padding: 10 }}>Local Stream</div>
        </div>

        {/* TODO: Add remote video element */}
        <div style={{ background: "#000", borderRadius: 8, minHeight: 300 }}>
          <video
            ref={remoteVideoRef}
            autoPlay
            style={{ width: "100%", height: "100%", borderRadius: 8 }}
          />
          <div style={{ textAlign: "center", color: "#999", padding: 10 }}>Remote Stream</div>
        </div>
      </div>

      {/* Control buttons */}
      {showControls ? (
        <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {/* TODO: Implement actual button handlers */}
          <button type="button" onClick={async () => onCreateOffer({ type: "offer", sdp: "" })}>
            Create Offer
          </button>
          <button type="button" onClick={async () => onCreateAnswer({ type: "answer", sdp: "" })}>
            Create Answer
          </button>
          <button type="button" onClick={stop}>
            Hang Up
          </button>
          <span style={{ alignSelf: "center" }}>Status: {isConnected ? "Connected" : "Idle"}</span>
        </div>
      ) : null}

      {/* Debug info - remove in production */}
      <div style={{ marginTop: 18, color: "#555", fontSize: "0.9em" }}>
        <strong>Debug Info:</strong>
        <div>remoteSdp: {remoteSdp ? "provided" : "none"}</div>
        <div>remoteIceCandidate: {remoteIceCandidate ? "provided" : "none"}</div>
      </div>
    </div>
  );
}
