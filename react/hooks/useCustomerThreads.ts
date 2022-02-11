import useSWR, { cache } from 'swr';
import { dequal } from 'dequal';
import { NoteCreatedEventPayload } from '../types/customer-thread';
import { CustomerThread } from '../types/customer-threads';
import { getDateTime } from '../utils/helpers/datetime';
import { SWRFetcher } from '../utils/http-client';

interface useCustomerThreadResponse {
	customerThreads: Array<CustomerThread>;
	markAsRead: (customerId: number) => void;
	updateCustomerThreads: (note: NoteCreatedEventPayload, readStatus: number) => void;
	refreshData: () => Promise<any>;
	loading: boolean;
	error: any;
}

export const useCustomerThreads = (userId: number): useCustomerThreadResponse => {
	const key = `/users/${userId}/customer-threads`;
	const { data, error, mutate } = useSWR(key, SWRFetcher, {
		compare: dequal,
		revalidateOnFocus: false,
		revalidateOnMount: !cache.has(key),
	});

	const sortCustomerThreads = (data: Array<CustomerThread>): Array<CustomerThread> => {
		const newArr = <Array<CustomerThread>>[...data];
		newArr.sort((firstEl, secondEl) => {
			if (firstEl.read_status === 2) {
				return 1;
			} else if (secondEl.read_status === 2) {
				return -1;
			} else {
				const firstDate = getDateTime(firstEl.last_update);
				const secondDate = getDateTime(secondEl.last_update);
				if (firstDate < secondDate) return 1;
				if (firstDate > secondDate) return -1;
				return 0;
			}
		});
		return newArr;
	};

	const setReadStatus = (customerId: number, readStatus: number) => {
		if (error || !data) return;
		const index = data.findIndex((thread: CustomerThread) => thread.customer_id === customerId);
		if (index !== -1) {
			const newArr = <Array<CustomerThread>>[...data];
			newArr[index].read_status = readStatus;
			mutate(newArr, false);
		}
	};

	const updateCustomerThreads = (note: NoteCreatedEventPayload, readStatus = 0) => {
		if (error || !data) return;
		const index = data.findIndex((thread: CustomerThread) => thread.customer_id === note.customer_id);
		if (index !== -1) {
			const newArr = <Array<CustomerThread>>[...data];
			newArr[index] = {
				...newArr[index],
				last_update: note.datetime,
				last_update_action: note.last_update_action,
				read_status: newArr[index].read_status !== 2 ? readStatus : 2,
			};
			mutate(sortCustomerThreads(newArr), false);
		}
	};

	const markAsRead = async (customerId: number) => {
		setReadStatus(customerId, 1);
	};

	return {
		customerThreads: data,
		refreshData: mutate,
		markAsRead,
		updateCustomerThreads,
		loading: !data && !error,
		error,
	};
};
