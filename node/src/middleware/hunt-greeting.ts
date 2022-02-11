import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { GLOBAL_ACCOUNT_ID } from '../config/constants';

export const isReadOnly = (
  { tokenPayload: { accountId } }: Request,
  res: Response,
  next: NextFunction
) => {
  if (accountId === GLOBAL_ACCOUNT_ID) {
    return res.status(HttpStatus.FORBIDDEN).end();
  }
  next();
};
