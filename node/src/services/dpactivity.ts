import DPActivity from '../models/DPActivity';
import { DPActivityType } from '../types';
import { generateMySqlNOWFunction } from '../utils';

export const updateContinuedActivity = async (userId: number) => {
  const now = generateMySqlNOWFunction();
  const dpActivity = await DPActivity.findOne({
    where: {
      frn_dpuserid: userId,
      frn_dpactivity_typeid: DPActivityType.ACTIVITY_CONTINUED
    }
  });
  if (dpActivity) {
    return dpActivity.update({
      activity_datetime: now,
      activity_value: `User ${userId} continued his activity`
    });
  }
  DPActivity.create({
    frn_dpuserid: userId,
    frn_dpactivity_typeid: DPActivityType.ACTIVITY_CONTINUED,
    activity_datetime: now,
    activity_value: `User ${userId} started his activity`
  });
};
