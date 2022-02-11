import useSWR from 'swr';
import { httpClient, SWRFetcher } from '../utils/http-client';
import parsePhoneNumber from 'libphonenumber-js';
import { useNotifications } from '../components/UI/Notifications';
import { wait } from '../utils/helpers/wait';

interface useCellPhonePayload {
	data: {
		cell_phone_number: string | null;
	};
	error: any;
	loading: boolean;
	updateUserCellPhone: (phoneNumber: string) => Promise<any>;
	mutate: () => Promise<any>;
}

export const useCellPhone = (userId: number): useCellPhonePayload => {
	const key = `/users/${userId}/cell-phone`;
	const { data, error, mutate } = useSWR(key, SWRFetcher);

	const { notify } = useNotifications();

	const updateUserCellPhone = async (phoneNumber: string) => {
		try {
			const number = parsePhoneNumber(phoneNumber, 'US');
			if (number && number.isPossible()) {
				await httpClient.post(key, {
					cell_phone_number: number.format('E.164'),
				});
				notify({
					type: 'success',
					message: 'Cell phone updated',
				});
				await wait(1000);
				await mutate();
			} else {
				notify({
					type: 'error',
					message: 'You have not entered a valid phone number. The cell phone number will not be updated.',
				});
			}
		} catch (error) {
			notify({
				type: 'error',
				message: 'Error while updating cell phone number.',
			});
		}
	};

	return {
		data,
		error,
		loading: !data && !error,
		updateUserCellPhone,
		mutate,
	};
};
