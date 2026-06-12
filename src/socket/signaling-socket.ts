import io from 'socket.io-client';
import { SOCKET_EVENTS } from './events.js';
import type {
  ByeData,
  CallConnectedData,
  CallData,
  IncomingCallData,
  SocketUser,
  ToastData,
} from './types.js';

export type SocketHandler<T = unknown> = (payload: T) => void;
export type Unsubscribe = () => void;

export type ConnectOptions = Record<string, unknown>;

export interface RawSocket {
  id?: string;
  connected?: boolean;
  on(event: string, handler: (...args: unknown[]) => void): unknown;
  once(event: string, handler: (...args: unknown[]) => void): unknown;
  off(event: string, handler?: (...args: unknown[]) => void): unknown;
  emit(event: string, ...args: unknown[]): unknown;
  disconnect(): unknown;
}

export interface SignalingSocketOptions {
  url: string;
  userId: string;
  name: string;
  autoConnect?: boolean;
  socketOptions?: ConnectOptions;
}

export class SignalingSocket {
  readonly url: string;
  private userId: string;
  private name: string;
  private readonly socketOptions?: ConnectOptions;

  socket: RawSocket | null = null;

  /* Replayed onto every fresh socket so reconnect() keeps its handlers. */
  private readonly listeners = new Set<{
    event: string;
    handler: (...args: unknown[]) => void;
  }>();

  constructor(options: SignalingSocketOptions) {
    this.url = options.url;
    this.userId = options.userId;
    this.name = options.name;
    this.socketOptions = options.socketOptions;
    if (options.autoConnect !== false) {
      this.connect();
    }
  }

  private buildQuery(): string {
    return `userId=${encodeURIComponent(this.userId)}&name=${encodeURIComponent(
      this.name
    )}`;
  }

  connect(): this {
    if (this.socket) return this;
    const opts = {
      ...this.socketOptions,
      query: this.buildQuery(),
    } as SocketIOClient.ConnectOpts;
    this.socket = io(this.url, opts) as unknown as RawSocket;
    this.listeners.forEach(l => this.socket?.on(l.event, l.handler));
    return this;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  reconnect(identity?: { userId?: string; name?: string }): this {
    if (identity?.userId !== undefined) this.userId = identity.userId;
    if (identity?.name !== undefined) this.name = identity.name;
    this.disconnect();
    return this.connect();
  }

  get id(): string | undefined {
    return this.socket?.id;
  }

  get connected(): boolean {
    return Boolean(this.socket?.connected);
  }

  on<T = unknown>(event: string, handler: SocketHandler<T>): Unsubscribe {
    const entry = { event, handler: handler as (...args: unknown[]) => void };
    this.listeners.add(entry);
    this.socket?.on(entry.event, entry.handler);
    return () => {
      this.listeners.delete(entry);
      this.socket?.off(entry.event, entry.handler);
    };
  }

  /* Not replayed on reconnect — single-emission semantics. */
  once<T = unknown>(event: string, handler: SocketHandler<T>): void {
    this.socket?.once(event, handler as (...args: unknown[]) => void);
  }

  off(event: string, handler?: SocketHandler): void {
    const target = handler as ((...args: unknown[]) => void) | undefined;
    for (const l of [...this.listeners]) {
      if (l.event === event && (!target || l.handler === target)) {
        this.listeners.delete(l);
        this.socket?.off(l.event, l.handler);
      }
    }
    if (!handler) this.socket?.off(event);
  }

  emit(event: string, ...args: unknown[]): this {
    this.socket?.emit(event, ...args);
    return this;
  }

  call(data: CallData): this {
    return this.emit(SOCKET_EVENTS.CALL, data);
  }

  createOrJoinHw(data: IncomingCallData): this {
    return this.emit(SOCKET_EVENTS.CREATE_OR_JOIN_HW, data);
  }

  bye(data: ByeData): this {
    return this.emit(SOCKET_EVENTS.BYE, data);
  }

  callConnected(data: CallConnectedData): this {
    return this.emit(SOCKET_EVENTS.CALL_CONNECTED, data);
  }

  cancelHw(data: { connectToDrId: string; [key: string]: unknown }): this {
    return this.emit(SOCKET_EVENTS.CANCEL_HW, data);
  }

  cancelDr(data: { nurseId: string; [key: string]: unknown }): this {
    return this.emit(SOCKET_EVENTS.CANCEL_DR, data);
  }

  hwCallReject(toUserUuid: string): this {
    return this.emit(SOCKET_EVENTS.HW_CALL_REJECT, toUserUuid);
  }

  drCallReject(toUserUuid: string): this {
    return this.emit(SOCKET_EVENTS.DR_CALL_REJECT, toUserUuid);
  }

  callTimeUp(toUserUuid: string): this {
    return this.emit(SOCKET_EVENTS.CALL_TIME_UP, toUserUuid);
  }

  ackMessageReceived(data: { messageId: string }): this {
    return this.emit(SOCKET_EVENTS.ACK_MSG_RECEIVED, data);
  }

  createOrJoin(room: string): this {
    return this.emit(SOCKET_EVENTS.CREATE_OR_JOIN, room);
  }

  sendMessage(message: unknown): this {
    return this.emit(SOCKET_EVENTS.MESSAGE, message);
  }

  onAllUsers(handler: SocketHandler<SocketUser[]>): Unsubscribe {
    return this.on(SOCKET_EVENTS.ALL_USERS, handler);
  }

  onIncomingCall(handler: SocketHandler<IncomingCallData>): Unsubscribe {
    return this.on(SOCKET_EVENTS.INCOMING_CALL, handler);
  }

  onCall(handler: SocketHandler<CallData>): Unsubscribe {
    return this.on(SOCKET_EVENTS.CALL, handler);
  }

  onCallConnected(handler: SocketHandler<void>): Unsubscribe {
    return this.on(SOCKET_EVENTS.CALL_CONNECTED, handler);
  }

  onCancelHw(handler: SocketHandler<string>): Unsubscribe {
    return this.on(SOCKET_EVENTS.CANCEL_HW, handler);
  }

  onCancelDr(handler: SocketHandler<string>): Unsubscribe {
    return this.on(SOCKET_EVENTS.CANCEL_DR, handler);
  }

  onHwCallReject(handler: SocketHandler<string>): Unsubscribe {
    return this.on(SOCKET_EVENTS.HW_CALL_REJECT, handler);
  }

  onDrCallReject(handler: SocketHandler<string>): Unsubscribe {
    return this.on(SOCKET_EVENTS.DR_CALL_REJECT, handler);
  }

  onCallTimeUp(handler: SocketHandler<string>): Unsubscribe {
    return this.on(SOCKET_EVENTS.CALL_TIME_UP, handler);
  }

  onToast(handler: SocketHandler<ToastData>): Unsubscribe {
    return this.on(SOCKET_EVENTS.TOAST, handler);
  }
}
