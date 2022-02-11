import { httpV2Client } from '../http-client';

export type LoginMessage = 'Login Verification email sent.' | 'Login Verification SMS sent.';

export interface VerifyResponseUser {
	token: string;
	user: {
		id: number;
		avatar: string;
		name_first: string;
		name_last: string;
		account: {
			id: number;
			account_logo: string;
			account_name: string;
		};
		number: {
			id: number;
			number_did: string;
			number_label: string;
		};
	};
}

export const login = async (value: string, type: 'email' | 'phone_number'): Promise<LoginMessage> => {
	try {
		const {
			data: { message },
		} = await httpV2Client.post('/login', {
			email: type === 'email' ? value : undefined,
			phone_number: type === 'phone_number' ? value : undefined,
			isMobile: false,
		});
		return message;
	} catch (error) {
		throw error;
	}
};

export const loginVerify = async (value: string, verification_code: string, type: 'email' | 'phone_number') => {
	try {
		const { data }: { data: Array<VerifyResponseUser> } = await httpV2Client.post('/login/verify', {
			verification_code,
			email: type === 'email' ? value : undefined,
			phone_number: type === 'phone_number' ? value : undefined,
		});
		return data;
	} catch (error) {
		throw error;
	}
};
