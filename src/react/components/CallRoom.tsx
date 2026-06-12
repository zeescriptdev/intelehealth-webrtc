import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Participant,
  RemoteTrack,
  RemoteTrackPublication,
  Room,
  RoomEvent,
  Track,
  TrackPublication,
} from 'livekit-client';
import {
  EndCallIcon,
  MaximizeIcon,
  MicIcon,
  MinimizeIcon,
  VideoIcon,
} from '../icons.js';

export interface CallRoomProps {
  serverUrl: string;
  token: string;
  callerName?: string;
  minimized?: boolean;
  onEnd?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
}

const getInitials = (name?: string) => {
  const parts = (name || '').trim().split(' ').filter(Boolean).slice(0, 2);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const formatDuration = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const CallRoom = ({
  serverUrl,
  token,
  callerName,
  minimized = false,
  onEnd,
  onMinimize,
  onMaximize,
}: CallRoomProps) => {
  const remoteRef = useRef<HTMLVideoElement>(null);
  const localRef = useRef<HTMLVideoElement>(null);
  const roomRef = useRef<Room | null>(null);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [remoteCamOn, setRemoteCamOn] = useState(false);
  const [connected, setConnected] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!serverUrl || !token) return undefined;
    const room = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = room;

    const isRemoteVideo = (pub: TrackPublication, p: Participant) =>
      !p.isLocal && pub.kind === Track.Kind.Video;

    room
      .on(RoomEvent.TrackSubscribed, (track: RemoteTrack, pub: RemoteTrackPublication) => {
        if (track.kind === Track.Kind.Video && remoteRef.current) {
          track.attach(remoteRef.current);
          setRemoteCamOn(!pub.isMuted);
        } else if (track.kind === Track.Kind.Audio) {
          track.attach();
        }
      })
      .on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
        track.detach();
        if (track.kind === Track.Kind.Video) setRemoteCamOn(false);
      })
      .on(RoomEvent.TrackMuted, (pub, p) => {
        if (isRemoteVideo(pub, p)) setRemoteCamOn(false);
      })
      .on(RoomEvent.TrackUnmuted, (pub, p) => {
        if (isRemoteVideo(pub, p)) setRemoteCamOn(true);
      })
      .on(RoomEvent.Disconnected, () => onEndRef.current?.());

    let cancelled = false;
    const stopLocalTracks = () =>
      room.localParticipant.trackPublications.forEach(pub => pub.track?.stop());

    (async () => {
      try {
        await room.connect(serverUrl, token);
        if (cancelled) return;
        setConnected(true);
        const micPub = await room.localParticipant.setMicrophoneEnabled(true);
        if (cancelled) return micPub?.track?.stop();
        const camPub = await room.localParticipant.setCameraEnabled(true);
        if (cancelled) {
          micPub?.track?.stop();
          camPub?.track?.stop();
          return;
        }
        if (camPub?.track && localRef.current) camPub.track.attach(localRef.current);
      } catch {
        onEndRef.current?.();
      }
    })();

    return () => {
      cancelled = true;
      stopLocalTracks();
      room.disconnect();
      roomRef.current = null;
    };
  }, [serverUrl, token]);

  useEffect(() => {
    if (!connected) return undefined;
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [connected]);

  const toggleMic = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    const next = !room.localParticipant.isMicrophoneEnabled;
    room.localParticipant.setMicrophoneEnabled(next);
    setMicOn(next);
  }, []);

  const toggleCam = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    const next = !room.localParticipant.isCameraEnabled;
    room.localParticipant.setCameraEnabled(next);
    setCamOn(next);
  }, []);

  if (!serverUrl || !token) return null;

  const name = callerName || 'Doctor';

  return (
    <div className={`ihrtc-room${minimized ? ' ihrtc-room--min' : ''}`}>
      <video
        ref={remoteRef}
        autoPlay
        playsInline
        className="ihrtc-room__remote"
        style={{ display: remoteCamOn ? 'block' : 'none' }}
      />
      {!remoteCamOn && (
        <div className="ihrtc-room__fallback">
          <div className="ihrtc-room__avatar">{getInitials(name)}</div>
          <p className="ihrtc-room__fallback-name">{name}</p>
          <p className="ihrtc-room__fallback-sub">
            {connected ? 'Camera is off' : 'Connecting…'}
          </p>
        </div>
      )}

      <div className="ihrtc-room__caller">
        <span className="ihrtc-room__caller-name">{name}</span>
        <span className="ihrtc-room__caller-role">General Physician</span>
      </div>

      {connected && <div className="ihrtc-room__timer">{formatDuration(seconds)}</div>}

      {!minimized && onMinimize && (
        <button
          type="button"
          onClick={onMinimize}
          aria-label="Minimize call"
          className="ihrtc-room__min-btn"
        >
          <MinimizeIcon />
        </button>
      )}

      <div className="ihrtc-room__pip">
        <video
          ref={localRef}
          autoPlay
          playsInline
          muted
          className="ihrtc-room__local"
          style={{ display: camOn ? 'block' : 'none' }}
        />
        {!camOn && <div className="ihrtc-room__pip-off">Camera off</div>}
        <span className="ihrtc-room__pip-label">You</span>
      </div>

      {minimized ? (
        <div className="ihrtc-room__bar ihrtc-room__bar--min">
          <button
            type="button"
            onClick={onMaximize}
            aria-label="Expand call"
            className="ihrtc-room__ctrl ihrtc-room__ctrl--sm"
          >
            <MaximizeIcon className="ihrtc-icon-sm" />
          </button>
          <button
            type="button"
            onClick={onEnd}
            aria-label="End call"
            className="ihrtc-room__ctrl ihrtc-room__ctrl--sm ihrtc-room__ctrl--end"
          >
            <EndCallIcon className="ihrtc-icon-sm" />
          </button>
        </div>
      ) : (
        <div className="ihrtc-room__bar">
          <button
            type="button"
            onClick={toggleMic}
            aria-label="Toggle microphone"
            className={`ihrtc-room__ctrl${micOn ? '' : ' ihrtc-room__ctrl--off'}`}
          >
            <MicIcon on={micOn} />
          </button>
          <button
            type="button"
            onClick={toggleCam}
            aria-label="Toggle camera"
            className={`ihrtc-room__ctrl${camOn ? '' : ' ihrtc-room__ctrl--off'}`}
          >
            <VideoIcon on={camOn} />
          </button>
          <button
            type="button"
            onClick={onEnd}
            aria-label="End call"
            className="ihrtc-room__ctrl ihrtc-room__ctrl--end"
          >
            <EndCallIcon className="ihrtc-icon" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CallRoom;
