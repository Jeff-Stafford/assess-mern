import { Request, Response } from 'express';
import HttpStatus from 'http-status-codes';

import { getUserById, updateUser } from '../services/user';
import {
  getMobileRingByUserId,
  removeMobileRingByUserId,
  createMobileRing
} from '../services/notification-schedule';
import { mobileRingChangeWithTimezoneOffset } from '../helpers/notification-schedule';

export const getNotificationSchedule = async (req: Request, res: Response) => {
  const userId = req.tokenPayload.id;
  try {
    const { timezone_offset } = await getUserById(userId);
    const mobileRing = await getMobileRingByUserId(userId);
    const data = mobileRingChangeWithTimezoneOffset(
      mobileRing,
      timezone_offset
    );

    return res.json({
      data
    });
  } catch {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Unable to retrieve notification schedule.' });
  }
};

export const setNotificationSchedule = async (req: Request, res: Response) => {
  const { id: userId, accountId } = req.tokenPayload;

  try {
    const { timezone_offset } = await getUserById(userId);
    await removeMobileRingByUserId(userId);
    const data = mobileRingChangeWithTimezoneOffset(
      req.body.data,
      -timezone_offset
    );

    if (!data.length) {
      updateUser(userId, accountId, {
        mobile_ring: true
      });
    }

    await createMobileRing(
      data.map((el) => {
        return {
          ...el,
          frn_dpuserid: userId
        };
      })
    );
    return res.json({
      message: 'Success'
    });
  } catch (error) {
    console.log(error);
    return res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Unable to set notification schedule.' });
  }
};
