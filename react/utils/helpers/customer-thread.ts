import { DateTime } from 'luxon';
import { getUserZone } from '../helpers/timezone';
import { getDateTime } from './datetime';

export const getDateSeparatorFormat = (time: string) => {
	const date = getDateTime(time);
	const now = getDateTime();

	if (date.c.day === now.c.day && date.c.month === now.c.month && date.c.year === now.c.year) {
		return 'Today';
	}

	return date.toFormat('cccc, dd LLL');
};

export const getNoteTimeFormat = (time: string) => {
	const date = DateTime.fromISO(time, { zone: getUserZone() });
	return date.toFormat('h:mm a');
};

export const getCallTimeFormat = getNoteTimeFormat;
