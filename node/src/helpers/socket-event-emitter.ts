const socketIo = require('socket.io');
import { Server } from 'http';
import cookieParser from 'cookie-parser';
import { NextFunction } from 'express';
import {
  SocketEvent,
  LatestCustomerNoteEventPayload,
  UserStatusDisplayChangedEventPayload,
  UserBasicDataChangedEventPayload,
  EventEmitter,
  EmojiReactionEventPayload,
  ToneSocket,
  CallEventPayload
} from '../types';
import { authenticateSocketConnection } from '../middleware/auth';
import * as dpActivityService from '../services/dpactivity';
import * as ringDPUserService from '../services/ring';
import { productionCorsList } from '../config/cors';

const _room = (accountId: number): string => `ACCOUNT:${accountId}`;

const wrapExpressMiddleware = (middleware: Function) => (
  socket: ToneSocket,
  next: NextFunction
) => middleware(socket.request, {}, next);

const _getSocketEventByCustomerNoteEventType = (eventType: string) => {
  switch (eventType) {
    case 'insert':
      return SocketEvent.NOTE_CREATED;
    case 'update':
      return SocketEvent.NOTE_UPDATED;
    default:
      return 'unknown-event';
  }
};

class SocketEventEmitter implements EventEmitter {
  eventEmitter;

  constructor(server: Server) {
    this.eventEmitter = socketIo(server, {
      cors: {
        origin: productionCorsList,
        credentials: true
      }
    });
    this.eventEmitter.use(authenticateSocketConnection);
    this.eventEmitter.use(wrapExpressMiddleware(cookieParser()));
    this.listenSocketRoom();
  }

  emitLatestCustomerNoteEvent = (
    accountId: number,
    payload: LatestCustomerNoteEventPayload,
    eventType: string
  ) =>
    this.eventEmitter
      .to(_room(accountId))
      .emit(_getSocketEventByCustomerNoteEventType(eventType), payload);

  emitLatestDeletedCustomerNoteEvent = (
    accountId: number,
    noteId: number,
    lastUpdateAction: string
  ) =>
    this.eventEmitter.to(_room(accountId)).emit(SocketEvent.NOTE_DELETED, {
      id: noteId,
      last_update_action: lastUpdateAction
    });

  emitUserStatusDisplayChangedEvent = (
    accountId: number,
    payload: UserStatusDisplayChangedEventPayload
  ) =>
    this.eventEmitter
      .to(_room(accountId))
      .emit(SocketEvent.USER_STATUS_DISPLAY_CHANGED, payload);

  emitUserBasicDataChangedEvent = (
    accountId: number,
    payload: UserBasicDataChangedEventPayload
  ) =>
    this.eventEmitter
      .to(_room(accountId))
      .emit(SocketEvent.USER_BASIC_DATA_CHANGED, payload);

  emitEmojiReactionEvent = (
    accountId: number,
    payload: EmojiReactionEventPayload
  ) =>
    this.eventEmitter
      .to(_room(accountId))
      .emit(SocketEvent.EMOJI_REACTION, payload);

  emitCallEvent = (accountId: number, payload: CallEventPayload) =>
    this.eventEmitter
      .to(_room(accountId))
      .emit(SocketEvent.CALL_DETECTED, payload);

  listenSocketRoom = () => {
    this.eventEmitter.on('connection', async (client: ToneSocket) => {
      client.on(SocketEvent.DEVICE_ACTIVE, (req) => {
        const userId = req.userId;
        const identity = req.identity;
        dpActivityService.updateContinuedActivity(userId);
        ringDPUserService.setRingActive(userId, identity);
      });
    });
  };
}

export default SocketEventEmitter;
