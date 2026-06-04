import { useCallback, useState, useEffect, useRef } from "react";

/**
 * Configuration options for WebRTC setup
 * TODO: Customize with your specific WebRTC requirements
 */
export type WebRTCOptions = {
  onIceCandidate?: (candidate: RTCIceCandidateInit) => void;
  onLocalStream?: (stream: MediaStream) => void;
  onError?: (error: Error) => void;
};

/**
 * Current state of the WebRTC connection
 * TODO: Extend with additional state properties as needed
 */
export type WebRTCState = {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
};

const notImplemented = async () => {
  throw new Error("WebRTC logic is not implemented in this template.");
};

/**
 * Hook for managing WebRTC peer connection and media streams
 * TODO: Replace notImplemented() calls with actual WebRTC logic
 *
 * Implementation checklist:
 * - [ ] Initialize RTCPeerConnection
 * - [ ] Request user media (audio/video)
 * - [ ] Handle ICE candidates
 * - [ ] Manage connection state
 * - [ ] Handle errors appropriately
 */
export function useWebRTC(options: WebRTCOptions) {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // TODO: Cleanup function to stop streams and close connections
  useEffect(() => {
    return () => {
      // Implement cleanup logic
    };
  }, []);

  const createOffer = useCallback(async () => {
    // TODO: Implement offer creation
    // 1. Check if peer connection exists
    // 2. Create and set local description
    // 3. Return RTCSessionDescriptionInit
    await notImplemented();
    return {} as RTCSessionDescriptionInit;
  }, []);

  const createAnswer = useCallback(async () => {
    // TODO: Implement answer creation
    // 1. Check if peer connection exists
    // 2. Create and set local description
    // 3. Return RTCSessionDescriptionInit
    await notImplemented();
    return {} as RTCSessionDescriptionInit;
  }, []);

  const setRemoteDescription = useCallback(async (description: RTCSessionDescriptionInit) => {
    // TODO: Implement setting remote description
    // 1. Validate description
    // 2. Set remote description on peer connection
    await notImplemented();
  }, []);

  const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    // TODO: Implement ICE candidate addition
    // 1. Validate candidate
    // 2. Add candidate to peer connection
    await notImplemented();
  }, []);

  const stop = useCallback(() => {
    // TODO: Implement connection termination
    // 1. Stop media streams
    // 2. Close peer connection
    // 3. Update state
    console.warn("Stop is not implemented in this template.");
  }, []);

  return {
    localStream,
    remoteStream,
    isConnected,
    createOffer,
    createAnswer,
    setRemoteDescription,
    addIceCandidate,
    stop,
  } as const;
}
