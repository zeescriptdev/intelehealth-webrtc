import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { SignalingSocket } from '../socket/signaling-socket.js';
import type { ConnectOptions } from '../socket/signaling-socket.js';
import { CALL_STATUSES } from '../socket/types.js';
import type { CallData, IncomingCallData, SocketUser } from '../socket/types.js';
import CallRoom from './components/CallRoom.js';
import IncomingCallModal from './components/IncomingCallModal.js';
import { useRingtone } from './useRingtone.js';
import type {
  IncomingCallContextType,
  IncomingCallPayload,
} from './types.js';

export interface WebRTCUser {
  uuid: string;
  name: string;
}

export interface CallProviderConfig {
  socketUrl?: string;
  liveKitUrl?: string;
  user?: WebRTCUser | null;
  autoConnect?: boolean;
  socketOptions?: ConnectOptions;
  mapIncomingCall?: (raw: IncomingCallData | CallData) => IncomingCallPayload;
  enableTestTrigger?: boolean;
  ringtone?: boolean;
  ringtoneUrl?: string;
  onAccept?: (call: IncomingCallPayload, socket: SignalingSocket | null) => void;
  onDecline?: (
    call: IncomingCallPayload | undefined,
    socket: SignalingSocket | null
  ) => void;
  onEnd?: (
    call: IncomingCallPayload | undefined,
    socket: SignalingSocket | null
  ) => void;
}

const toStr = (v: unknown): string | undefined =>
  v == null ? undefined : String(v);

const defaultMapIncomingCall = (
  raw: IncomingCallData | CallData
): IncomingCallPayload => {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    callerName: String(r.doctorName ?? r.callerName ?? 'Unknown'),
    patientName: String(r.patientName ?? 'Unknown'),
    visitId: String(r.visitId ?? r.roomId ?? ''),
    openMrsId: toStr(r.patientOpenMrsId ?? r.openMrsId),
    token: toStr(r.appToken),
    roomId: toStr(r.roomId),
    doctorId: toStr(r.doctorId ?? r.connectToDrId),
    nurseId: toStr(r.nurseId),
    raw,
  };
};

const IncomingCallContext = createContext<IncomingCallContextType | null>(null);

export const IncomingCallProvider = ({
  config,
  children,
}: {
  config?: CallProviderConfig;
  children: ReactNode;
}) => {
  const {
    socketUrl,
    liveKitUrl,
    user,
    autoConnect = true,
    socketOptions,
    mapIncomingCall = defaultMapIncomingCall,
    enableTestTrigger = true,
    ringtone = true,
    ringtoneUrl,
    onAccept,
    onDecline,
    onEnd,
  } = config ?? {};

  const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(
    null
  );
  const [isIncomingCallOpen, setIsIncomingCallOpen] = useState(false);
  const [activeCall, setActiveCall] = useState<IncomingCallPayload | null>(null);
  const [isActiveCallOpen, setIsActiveCallOpen] = useState(false);
  const [isCallMinimized, setIsCallMinimized] = useState(false);

  const socketRef = useRef<SignalingSocket | null>(null);
  const isActiveCallOpenRef = useRef(false);
  isActiveCallOpenRef.current = isActiveCallOpen;
  const isIncomingOpenRef = useRef(false);
  isIncomingOpenRef.current = isIncomingCallOpen;
  const incomingCallRef = useRef<IncomingCallPayload | null>(null);
  incomingCallRef.current = incomingCall;
  const lastRingRef = useRef<{ key: string; at: number }>({ key: '', at: 0 });
  const DEDUPE_MS = 4000;

  useRingtone(isIncomingCallOpen, { enabled: ringtone, url: ringtoneUrl });

  const closeIncomingCall = useCallback(() => {
    setIsIncomingCallOpen(false);
  }, []);

  const showIncomingCall = useCallback((call: IncomingCallPayload) => {
    if (isActiveCallOpenRef.current) return;
    const key = call.roomId || call.visitId || '';
    const now = Date.now();
    if (
      key &&
      key === lastRingRef.current.key &&
      now - lastRingRef.current.at < DEDUPE_MS
    ) {
      return;
    }
    lastRingRef.current = { key, at: now };
    setIncomingCall(call);
    setActiveCall(call);
    setIsIncomingCallOpen(true);
  }, []);

  const acceptIncomingCall = useCallback(() => {
    closeIncomingCall();
    setIsCallMinimized(false);
    setIsActiveCallOpen(true);
    if (incomingCall) onAccept?.(incomingCall, socketRef.current);
  }, [closeIncomingCall, incomingCall, onAccept]);

  const declineIncomingCall = useCallback(() => {
    const call = incomingCall;
    const socket = socketRef.current;
    const doctorId = call?.doctorId;
    if (socket && doctorId) socket.hwCallReject(doctorId);
    closeIncomingCall();
    onDecline?.(call ?? undefined, socket);
    setActiveCall(null);
  }, [closeIncomingCall, incomingCall, onDecline]);

  const endActiveCall = useCallback(() => {
    const call = activeCall;
    const socket = socketRef.current;
    setIsActiveCallOpen(false);
    setIsCallMinimized(false);
    if (socket && call) {
      socket.bye({
        doctorId: call.doctorId,
        nurseId: call.nurseId,
        roomId: call.roomId,
        socketId: socket.id,
      });
    }
    onEnd?.(call ?? undefined, socket);
    setActiveCall(null);
  }, [activeCall, onEnd]);

  const minimizeCall = useCallback(() => setIsCallMinimized(true), []);

  const maximizeCall = useCallback(() => setIsCallMinimized(false), []);

  const [pipPos, setPipPos] = useState<{ x: number; y: number } | null>(null);
  const pipDragRef = useRef<{
    dx: number;
    dy: number;
    w: number;
    h: number;
  } | null>(null);

  const onPipPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const shell = e.currentTarget;
    const rect = shell.getBoundingClientRect();
    pipDragRef.current = {
      dx: e.clientX - rect.left,
      dy: e.clientY - rect.top,
      w: rect.width,
      h: rect.height,
    };
    shell.setPointerCapture(e.pointerId);
  }, []);

  const onPipPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const d = pipDragRef.current;
    if (!d) return;
    const maxX = Math.max(0, globalThis.innerWidth - d.w);
    const maxY = Math.max(0, globalThis.innerHeight - d.h);
    const x = Math.min(Math.max(0, e.clientX - d.dx), maxX);
    const y = Math.min(Math.max(0, e.clientY - d.dy), maxY);
    setPipPos({ x, y });
  }, []);

  const onPipPointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    pipDragRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }, []);

  useEffect(() => {
    if (!socketUrl || !user?.uuid) return undefined;

    const socket = new SignalingSocket({
      url: socketUrl,
      userId: user.uuid,
      name: user.name,
      autoConnect,
      socketOptions,
    });
    socketRef.current = socket;

    const handleIncoming = (raw: IncomingCallData | CallData) => {
      showIncomingCall(mapIncomingCall(raw));
    };
    /* Portal emits `call` to a health worker and `incoming_call` to a doctor;
       listen to both so the provider works for either consumer. */
    const dismiss = () => {
      closeIncomingCall();
    };
    const handleAllUsers = (list: SocketUser[]) => {
      if (!isIncomingOpenRef.current) return;
      const doctorId = incomingCallRef.current?.doctorId;
      if (!doctorId) return;
      const doc = (Array.isArray(list) ? list : []).find(
        u => u.uuid === doctorId
      );
      if (doc && doc.callStatus !== CALL_STATUSES.CALLING) dismiss();
    };
    const unsubs = [
      socket.onCall(handleIncoming),
      socket.onIncomingCall(handleIncoming),
      socket.onCancelHw(dismiss),
      socket.onCancelDr(dismiss),
      socket.onDrCallReject(dismiss),
      socket.onCallTimeUp(dismiss),
      socket.onAllUsers(handleAllUsers),
    ];

    return () => {
      unsubs.forEach(u => u());
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    socketUrl,
    user?.uuid,
    user?.name,
    autoConnect,
    socketOptions,
    mapIncomingCall,
    showIncomingCall,
    closeIncomingCall,
  ]);

  useEffect(() => {
    if (!enableTestTrigger) return undefined;
    const w = window as unknown as {
      triggerIncomingCall?: (call?: Partial<IncomingCallPayload>) => void;
    };
    w.triggerIncomingCall = call =>
      showIncomingCall({
        callerName: call?.callerName ?? 'Dr. Test Doctor',
        patientName: call?.patientName ?? 'Test Patient',
        visitId: call?.visitId ?? '1234',
        openMrsId: call?.openMrsId,
        token: call?.token,
        roomId: call?.roomId,
        doctorId: call?.doctorId,
        nurseId: call?.nurseId,
      });
    return () => {
      delete w.triggerIncomingCall;
    };
  }, [enableTestTrigger, showIncomingCall]);

  const contextValue = useMemo<IncomingCallContextType>(
    () => ({
      isIncomingCallOpen,
      isActiveCallOpen,
      isCallMinimized,
      incomingCall: incomingCall ?? undefined,
      activeCall: activeCall ?? undefined,
      showIncomingCall,
      acceptIncomingCall,
      declineIncomingCall,
      endActiveCall,
      minimizeCall,
      maximizeCall,
    }),
    [
      isIncomingCallOpen,
      isActiveCallOpen,
      isCallMinimized,
      incomingCall,
      activeCall,
      showIncomingCall,
      acceptIncomingCall,
      declineIncomingCall,
      endActiveCall,
      minimizeCall,
      maximizeCall,
    ]
  );

  return (
    <IncomingCallContext.Provider value={contextValue}>
      {children}

      <IncomingCallModal
        open={isIncomingCallOpen}
        callerName={incomingCall?.callerName || 'Unknown'}
        patientName={incomingCall?.patientName || 'Unknown'}
        openMrsId={incomingCall?.openMrsId}
        onAccept={acceptIncomingCall}
        onDecline={declineIncomingCall}
      />

      {isActiveCallOpen && activeCall && (
        <div
          className={`ihrtc-call-shell ${
            isCallMinimized ? 'ihrtc-call-shell--pip' : 'ihrtc-call-shell--full'
          }`}
          style={
            isCallMinimized && pipPos
              ? { left: pipPos.x, top: pipPos.y, right: 'auto', bottom: 'auto' }
              : undefined
          }
          onPointerDown={isCallMinimized ? onPipPointerDown : undefined}
          onPointerMove={isCallMinimized ? onPipPointerMove : undefined}
          onPointerUp={isCallMinimized ? onPipPointerUp : undefined}
        >
          <CallRoom
            serverUrl={liveKitUrl || ''}
            token={activeCall.token || ''}
            callerName={activeCall.callerName}
            minimized={isCallMinimized}
            onEnd={endActiveCall}
            onMinimize={minimizeCall}
            onMaximize={maximizeCall}
          />
        </div>
      )}
    </IncomingCallContext.Provider>
  );
};

export const useIncomingCallContext = (): IncomingCallContextType => {
  const context = useContext(IncomingCallContext);
  if (!context) {
    throw new Error(
      'useIncomingCallContext must be used inside IncomingCallProvider'
    );
  }
  return context;
};

export const useIncomingCall = useIncomingCallContext;
