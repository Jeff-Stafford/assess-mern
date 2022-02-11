import { MobileRingChangeDays } from '../types';
import MobileRingChange from '../models/MobileRingChange';

const addDay = (currentDay: number): number => {
  // Since Saturday = 7 in the database and Sunday = 1
  if (currentDay === MobileRingChangeDays.SATURDAY)
    return MobileRingChangeDays.SUNDAY;

  return currentDay + 1;
};

const substractDay = (currentDay: number): number => {
  // Since Sunday = 1 in the database and Saturday = 7
  if (currentDay === MobileRingChangeDays.SUNDAY)
    return MobileRingChangeDays.SATURDAY;

  return currentDay - 1;
};

export const mobileRingChangeWithTimezoneOffset = (
  array: MobileRingChange[],
  timezone_offset: number
) => {
  if (!array.length) return [];
  if (timezone_offset === 0) return array;

  return array.map((element) => {
    const hour = element.change_hour + timezone_offset;
    const day = element.change_dayofweek;

    // We have advanced to the next day
    if (hour >= 24) {
      const newHour = hour - 24;
      const newDay = addDay(day);
      return {
        ...element,
        change_hour: newHour,
        change_dayofweek: newDay
      };
    }

    // We have gone to the previous day
    if (hour < 0) {
      const newHour = 24 - Math.abs(hour);
      const newDay = substractDay(day);
      return {
        ...element,
        change_hour: newHour,
        change_dayofweek: newDay
      };
    }

    // We are still in the same day. Only modify the hour
    return {
      ...element,
      change_hour: hour
    };
  });
};
