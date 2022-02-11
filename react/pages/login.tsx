import Head from 'next/head';
import { useState } from 'react';

import * as AuthAPI from '../utils/api/auth';
import FirstStep from '../components/Login/FirstStep';
import SecondStep from '../components/Login/SecondStep';
import LogoBlue from '../components/Logo/LogoBlue';
import {
	accountNotFoundError,
	genericLoginError,
	codeSentToGivenEmail,
	codeSentToAssociatedEmail,
	codeSentViaSMS,
} from '../components/Login/constants';
import { LOCAL_STORAGE_KEY } from '../consts';
import ThirdStep from '../components/Login/ThirdStep';

const Login = () => {
	const [step, setStep] = useState(1);
	const [users, setUsers] = useState<AuthAPI.VerifyResponseUser[]>([]);
	const [error, setError] = useState('');
	const [value, setValue] = useState('');
	const [type, setType] = useState<'email' | 'phone_number'>('email');
	const [loading, setLoading] = useState(false);
	const [response, setResponse] = useState<JSX.Element>();

	const submitFirstStep = async (value: string, type: 'email' | 'phone_number') => {
		setError('');
		setType(type);
		setValue(value);
		setLoading(true);
		try {
			const message = await AuthAPI.login(value, type);
			if (message === 'Login Verification email sent.' && type === 'email') {
				setResponse(codeSentToGivenEmail(value));
			} else if (message === 'Login Verification email sent.' && type === 'phone_number') {
				setResponse(codeSentToAssociatedEmail(value));
			} else {
				setResponse(codeSentViaSMS(value));
			}
			setStep(2);
		} catch (error) {
			const status = error?.response?.status;
			if (status === 404) {
				setError(accountNotFoundError);
			} else {
				setError(genericLoginError);
			}
		} finally {
			setLoading(false);
		}
	};

	const submitSecondStep = async (verification_code: string) => {
		setError('');
		setLoading(true);
		try {
			const users = await AuthAPI.loginVerify(value, verification_code, type);
			if (users.length === 1) {
				loginUser(users[0].token);
			} else {
				setUsers(users);
				setStep(3);
			}
		} catch (error) {
			setError('You have entered the wrong verification code. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const loginUser = (token: string) => {
		localStorage.setItem(LOCAL_STORAGE_KEY.JWT_TOKEN, token);
		window.location.href = '/';
	};

	return (
		<>
			<Head>
				<title>Login</title>
			</Head>
			<div className="h-screen w-full login-gradient flex items-center justify-center">
				<div className="bg-white p-12 shadow-md rounded-2xl" style={{ width: 376 }}>
					<LogoBlue />
					<h1 className="mt-6 text-center text-2xl font-semibold tracking-tight mb-8">Welcome to Tone</h1>
					{step === 1 && <FirstStep error={error} onSubmit={submitFirstStep} loading={loading} />}
					{step === 2 && <SecondStep error={error} onSubmit={submitSecondStep} loading={loading} response={response} />}
					{step === 3 && <ThirdStep users={users} />}
				</div>
			</div>
		</>
	);
};

export default Login;
