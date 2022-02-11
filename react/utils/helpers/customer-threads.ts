import { Thread } from '../../store/actions/customer-threads';
import { getDateTime } from './datetime';
import { formatPhoneNumber } from './formatPhoneNumber';

export const formatDateTime = (value: string): string => {
	const date = getDateTime(value);
	const now = getDateTime();

	if (date.c.day === now.c.day && date.c.month === now.c.month && date.c.year === now.c.year) {
		return date.toFormat('h:mm a');
	}

	if (now.diff(date, 'days').values.days < 6) {
		return date.toFormat('cccc');
	}

	if (now.diff(date, 'days').values.days > 180) {
		return date.toFormat('yyyy-LL-dd');
	}

	return date.toFormat('LLL dd');
};

export const getProperCustomerName = ({ customer_name, customer_number }: Thread) => {
	return customer_name ? customer_name : formatPhoneNumber(customer_number);
};
