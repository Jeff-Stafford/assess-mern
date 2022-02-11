import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import {
  createDeviceToken,
  deleteDeviceToken,
  deviceTokenCount
} from '../services/mobile-device-token';

export const createMobileDeviceToken = async (
  { tokenPayload, body }: Request,
  res: Response
) => {
  const userId = tokenPayload.id;
  const { device_token, provider_id } = body;

  const count = await deviceTokenCount(+userId, device_token);

  if (!count) {
    await createDeviceToken(+userId, device_token, +provider_id);
    return res.status(StatusCodes.CREATED).json({
      message: 'Device token created.'
    });
  }

  res.json({
    message: 'Device token already exists. Did not create a new one.'
  });
};

export const deleteMobileDeviceToken = async (
  { tokenPayload, query }: Request,
  res: Response
) => {
  const userId = tokenPayload.id;
  const device_token: any = query.device_token;

  await deleteDeviceToken(+userId, device_token);

  res.json({
    message: 'Device token deleted.'
  });
};
