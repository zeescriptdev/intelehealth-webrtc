export { SOCKET_EVENTS, type SocketEventName } from './socket/events.js';
export { CALL_STATUSES } from './socket/types.js';
export type {
  CallStatus,
  SocketUser,
  CallData,
  IncomingCallData,
  ByeData,
  CallConnectedData,
  ToastData,
} from './socket/types.js';
export {
  SignalingSocket,
  type SignalingSocketOptions,
  type SocketHandler,
  type Unsubscribe,
  type ConnectOptions,
  type RawSocket,
} from './socket/signaling-socket.js';

export {
  IncomingCallProvider,
  useIncomingCall,
  useIncomingCallContext,
  type CallProviderConfig,
  type WebRTCUser,
} from './react/IncomingCallProvider.js';

export { default as IncomingCallModal } from './react/components/IncomingCallModal.js';
export {
  default as CallRoom,
  type CallRoomProps,
} from './react/components/CallRoom.js';

export {
  AcceptCallIcon,
  DeclineCallIcon,
  EndCallIcon,
  MaximizeIcon,
} from './react/icons.js';

export type {
  IncomingCallPayload,
  IncomingCallContextType,
  IncomingCallModalProps,
} from './react/types.js';
