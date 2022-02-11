import { Request, Response } from 'express';
import HttpStatus from 'http-status-codes';
import { getLogger } from '../helpers/logger';
import * as emojiReactionService from '../services/emoji-reaction';
import { EmojiReactionActionType, EventEmitter } from '../types';

const LOG = getLogger('emoji-reaction-controller');

export const getEmojiReactionsForNote = async (req: Request, res: Response) => {
  const { noteId } = req.params;
  try {
    const emojiReactions = await emojiReactionService.findEmojiReactionsByNoteId(
      +noteId
    );
    res.json(emojiReactions);
  } catch (error) {
    LOG.error(
      'Could not get emoji reactions for note %d : %s',
      +noteId,
      error.message
    );
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Could not get the emoji reactions.' });
  }
};

export const createEmojiReaction = async (
  { tokenPayload, body, params, app }: Request,
  res: Response
) => {
  const { frn_emojiid } = body;
  const { noteId, customerId } = params;
  try {
    await emojiReactionService.createEmojiReaction({
      frn_emojiid,
      frn_dpcustomer_noteid: +noteId,
      frn_dpuserid: tokenPayload.id
    });
    const socketEventEmitter: EventEmitter = app.get('socketEventEmitter');
    socketEventEmitter.emitEmojiReactionEvent(tokenPayload.accountId, {
      thread_id: +customerId,
      note_id: +noteId,
      user_id: tokenPayload.id,
      reaction_id: frn_emojiid,
      type: EmojiReactionActionType.CREATE
    });
    res.status(HttpStatus.CREATED).json({ message: 'Emoji reaction created' });
  } catch (error) {
    LOG.error(
      'Could not create emoji reaction by user %d with emoji %d on note %d: %s',
      tokenPayload.id,
      frn_emojiid,
      +noteId,
      error.message
    );
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Could not create the emoji reaction.' });
  }
};

export const changeEmojiReaction = async (
  { tokenPayload, body, params, app }: Request,
  res: Response
) => {
  const { emojiId, noteId, userId, customerId } = params;
  const { frn_emojiid: newEmojiReactionId } = body;
  try {
    await emojiReactionService.updateEmojiReaction(
      +noteId,
      +userId,
      +emojiId,
      newEmojiReactionId
    );
    const socketEventEmitter: EventEmitter = app.get('socketEventEmitter');
    socketEventEmitter.emitEmojiReactionEvent(tokenPayload.accountId, {
      thread_id: +customerId,
      note_id: +noteId,
      user_id: tokenPayload.id,
      reaction_id: newEmojiReactionId,
      type: EmojiReactionActionType.UPDATE
    });
    res.json({ message: 'Reaction changed.' });
  } catch (error) {
    LOG.error(
      'Could not update emoji reaction by user %d: %s',
      userId,
      error.message
    );
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Could not update the emoji reaction.' });
  }
};

export const deleteEmojiReaction = async (
  { tokenPayload, params, app }: Request,
  res: Response
) => {
  const { emojiId, noteId, userId, customerId } = params;
  try {
    await emojiReactionService.deleteEmojiReaction(+emojiId, +noteId, +userId);
    const socketEventEmitter: EventEmitter = app.get('socketEventEmitter');
    socketEventEmitter.emitEmojiReactionEvent(tokenPayload.accountId, {
      thread_id: +customerId,
      note_id: +noteId,
      user_id: +userId,
      reaction_id: +emojiId,
      type: EmojiReactionActionType.DELETE
    });
    res.json({ message: 'Reaction deleted' });
  } catch (error) {
    LOG.error(
      'Could not delete emoji reaction by user %d: %s',
      userId,
      error.message
    );
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Could not delete the emoji reaction.' });
  }
};
