import Head from 'next/head';
import { useState } from 'react';
import parsePhoneNumber from 'libphonenumber-js';
import { useEffectOnce, useSearchParam } from 'react-use';

import * as AuthAPI from '../utils/api/auth';
import LogoBlue from '../components/Logo/LogoBlue';
import FirstStep from '../components/LoginVerify/FirstStep';
import { VerifyResponseUser } from '../utils/api/auth';
import UsersPicker from '../components/Login/ThirdStep';
import { LOCAL_STORAGE_KEY } from '../consts';

const getPhoneNumber = (phoneNumber: string) => {
	const number = parsePhoneNumber(phoneNumber, 'US');
	if (!number) return '';
	return number.format('E.164');
};

const LoginVerify = () => {
	const email = useSearchParam('email');
	const phoneNumber = useSearchParam('phone_number');
	const verificationCode = useSearchParam('verificationCode');

	const [users, setUsers] = useState<VerifyResponseUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [step, setStep] = useState(1);

	useEffectOnce(() => {
		if (!process.browser) return;
		if ((!email && !phoneNumber) || !verificationCode) {
			setError("The link you've clicked on is not valid. Please make sure you used the correct link or try again.");
			setLoading(false);
			return;
		}
		(async () => {
			try {
				const value = email ? email : getPhoneNumber(phoneNumber);
				const type = email ? 'email' : 'phone_number';
				const users = await AuthAPI.loginVerify(value, verificationCode, type);
				if (users.length === 1) {
					setLoading(false);
					loginUser(users[0].token);
				} else {
					setUsers(users);
					setStep(2);
				}
			} catch (error) {
				console.log(error);
				const status = error?.response?.status;
				if (status === 400) {
					setError("The link you've used to log in has expired. Please log in again.");
				} else {
					setError('There has been an error trying to log you in. Please try again.');
				}
			} finally {
				setLoading(false);
			}
		})();
	});

	const loginUser = (token: string) => {
		localStorage.setItem(LOCAL_STORAGE_KEY.JWT_TOKEN, token);
		window.location.href = '/';
	};

	return (
		<>
			<Head>
				<title>Verify Login</title>
			</Head>
			<div className="h-screen w-full login-gradient flex items-center justify-center">
				<div className="bg-white p-12 shadow-md rounded-2xl" style={{ width: 376 }}>
					<LogoBlue />
					<h1 className="mt-6 text-center text-2xl font-semibold tracking-tight mb-8">Welcome to Tone</h1>
					{step === 1 && <FirstStep loading={loading} error={error} />}
					{step === 2 && <UsersPicker users={users} />}
				</div>
			</div>
		</>
	);
};

export default LoginVerify;
