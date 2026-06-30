export interface IncomingCallPayload {
  callerName: string;
  patientName: string;
  visitId: string;
  openMrsId?: string;
  token?: string;
  roomId?: string;
  doctorId?: string;
  nurseId?: string;
  raw?: unknown;
}

export interface IncomingCallContextType {
  isIncomingCallOpen: boolean;
  isActiveCallOpen: boolean;
  isCallMinimized: boolean;
  incomingCall?: IncomingCallPayload;
  activeCall?: IncomingCallPayload;
  showIncomingCall: (call: IncomingCallPayload) => void;
  acceptIncomingCall: () => void;
  declineIncomingCall: () => void;
  endActiveCall: () => void;
  minimizeCall: () => void;
  maximizeCall: () => void;
}

export interface IncomingCallModalProps {
  open: boolean;
  callerName: string;
  patientName: string;
  openMrsId?: string;
  onAccept: () => void;
  onDecline: () => void;
}
