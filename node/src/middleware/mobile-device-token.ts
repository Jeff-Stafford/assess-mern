import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

const validProviderIds = [1, 2, 3];

export const bodyHasDeviceToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.body.device_token) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: 'Please provide a device token.' });
  }
  next();
};

export const bodyHasValidProviderId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (
    !req.body.provider_id ||
    !validProviderIds.includes(+req.body.provider_id)
  ) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: 'Please provide a valid provider ID' });
  }
  next();
};

export const queryStringHasDeviceToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.query.device_token) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: 'Please provide a device token.' });
  }
  next();
};
