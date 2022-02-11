import { getDateTime } from './datetime';

export interface CallDuration {
	hours?: number;
	minutes?: number;
	seconds?: number;
}

export const getCallDuration = (startedAt): CallDuration => {
	const now = getDateTime();
	return now.diff(startedAt, ['hours', 'minutes', 'seconds']).toObject();
};

export const callDurationString = (duration: CallDuration) => {
	if (!duration) {
		return '00:00';
	}
	const seconds = Math.floor(duration.seconds).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });
	const minutes = Math.floor(duration.minutes).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });
	const hours = Math.floor(duration.hours);

	return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
};
