import EmojiReaction from '../models/EmojiReaction';
import { EmojiReactionPayload } from '../types';

export const createEmojiReaction = (
  emojiReaction: EmojiReactionPayload
): Promise<any> => EmojiReaction.create(emojiReaction);

export const findEmojiReactionsByNoteId = (noteId: number) =>
  EmojiReaction.findAll({
    where: { frn_dpcustomer_noteid: noteId },
    attributes: [
      ['frn_emojiid', 'reaction_id'],
      ['frn_dpuserid', 'user_id']
    ]
  });

export const deleteEmojiReaction = (
  emojiId: number,
  noteId: number,
  userId: number
): Promise<any> =>
  EmojiReaction.destroy({
    where: {
      frn_emojiid: emojiId,
      frn_dpcustomer_noteid: noteId,
      frn_dpuserid: userId
    }
  });

export const updateEmojiReaction = (
  noteId: number,
  userId: number,
  currentEmojiReactionId: number,
  newEmojiReactionId: number
): Promise<any> =>
  EmojiReaction.update(
    { frn_emojiid: newEmojiReactionId },
    {
      where: {
        frn_dpcustomer_noteid: noteId,
        frn_dpuserid: userId,
        frn_emojiid: currentEmojiReactionId
      }
    }
  );

export const isReactionAlreadyGivenByUser = async (
  emojiId: number,
  noteId: number,
  userId: number
): Promise<boolean> => {
  const givenReaction = await EmojiReaction.findOne({
    where: {
      frn_emojiid: emojiId,
      frn_dpuserid: userId,
      frn_dpcustomer_noteid: noteId
    }
  });
  return !!givenReaction;
};
