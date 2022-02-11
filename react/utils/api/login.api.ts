import { httpClient } from '../http-client';

export const LoginAPI = (function () {
	const sendLoginEmail = async (email: string) => httpClient.post('/login', { email });
	const sendVerificationCode = async (email: string, verificationCode: string) =>
		httpClient.post('/login/verify', { email, verificationCode });

	return {
		sendLoginEmail,
		sendVerificationCode,
	};
})();
