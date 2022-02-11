import parsePhoneNumber from 'libphonenumber-js';
import { FormEventHandler, useCallback, useState } from 'react';
import isEmail from '../../utils/validation/isEmail';
import SubmitButton from './SubmitButton';

interface FirstStepProps {
	loading?: boolean;
	error?: string;
	onSubmit: (value: string, type: 'email' | 'phone_number') => any;
}

const FirstStep = ({ loading, onSubmit, error = '' }: FirstStepProps) => {
	const [value, setValue] = useState('');

	const validateInput = useCallback(() => {
		if (!value) return false;
		if (isEmail(value)) return 'email';
		const number = parsePhoneNumber(value, 'US');
		if (number && number.isPossible()) {
			return 'phone_number';
		}
		return false;
	}, [value]);

	const handleSubmit: FormEventHandler<HTMLFormElement> = e => {
		e.preventDefault();
		if (loading) return;
		const inputType = validateInput();
		if (!inputType) return;
		if (inputType === 'email') {
			return onSubmit(value, inputType);
		}
		const number = parsePhoneNumber(value, 'US');
		if (number && number.isPossible()) {
			return onSubmit(number.format('E.164'), inputType);
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<input
				type="text"
				value={value}
				onChange={e => setValue(e.target.value)}
				placeholder="Email or phone number"
				className="block w-full p-3 text-base border font-regular leading-none mb-4 rounded-md border-dp-gray placeholder-dp-gray-dark"
			/>
			<SubmitButton disabled={!validateInput()} loading={loading}>
				Log In
			</SubmitButton>
			{error && <p className="mt-4 text-sm text-dp-red text-center">{error}</p>}
		</form>
	);
};

export default FirstStep;
