import { Request, NextFunction, Response } from 'express';
import HttpStatus from 'http-status-codes';
import { X_LAMBDA_CUSTOM_HEADER } from '../config/constants';

export const checkCustomHeader = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const lambdaCustomHeader = req.header('x-tone-lambda');
  if (!lambdaCustomHeader || lambdaCustomHeader !== X_LAMBDA_CUSTOM_HEADER) {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Invalid custom header.' });
  }

  next();
};
