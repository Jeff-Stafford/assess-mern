import DPActivity from '../models/DPActivity';
import { DPActivityType } from '../types';
import { generateMySqlNOWFunction } from '../utils';
import { ENVIRONMENT } from '../config/constants';

export default (
  activityType: DPActivityType,
  activityDescription: string,
  userId: number
): void => {
  if (ENVIRONMENT === 'production') {
    DPActivity.create({
      frn_dpactivity_typeid: activityType,
      frn_dpuserid: userId,
      activity_datetime: generateMySqlNOWFunction(),
      activity_value: activityDescription
    });
  }
};
