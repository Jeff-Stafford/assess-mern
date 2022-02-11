import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { isReactionAlreadyGivenByUser } from '../services/emoji-reaction';

export const checkForGivenReaction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId, noteId } = req.params;
  const { frn_emojiid: emojiId } = req.body;

  const isReactionAlreadyGiven = await isReactionAlreadyGivenByUser(
    emojiId,
    +noteId,
    +userId
  );

  if (isReactionAlreadyGiven) {
    return res
      .status(HttpStatus.CONFLICT)
      .json({ message: 'Reaction already given by user.' });
  }
  next();
};
