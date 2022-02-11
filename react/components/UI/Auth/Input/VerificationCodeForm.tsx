import { useEffect, useCallback, useState, useRef } from 'react';

interface VerificationCodeFormProps {
	error?: string;
	onSubmit: (value: string) => void;
	disabled?: boolean;
}

export default function VerificationCodeForm({ disabled, error, onSubmit }: VerificationCodeFormProps) {
	const [value, setValue] = useState([]);

	const number1 = useRef();
	const number2 = useRef();
	const number3 = useRef();
	const number4 = useRef();
	const number5 = useRef();
	const number6 = useRef();

	const focusNumber = ref => {
		ref.current.focus();
	};

	useEffect(() => {
		focusNumber(number1);
	}, []);

	const handleValueChange = useCallback(
		position => e => {
			const eventValue = e.target.value;

			const codeArray = value;
			codeArray[position] = eventValue;
			setValue(codeArray);

			if (eventValue.length > 0) {
				if (position === 1) focusNumber(number2);
				if (position === 2) focusNumber(number3);
				if (position === 3) focusNumber(number4);
				if (position === 4) focusNumber(number5);
				if (position === 5) focusNumber(number6);
			}

			const finalCode = codeArray.join('');
			if (finalCode.length === 6 && typeof onSubmit === 'function') onSubmit(finalCode);
		},
		[onSubmit, value]
	);

	return (
		<div className="flex flex-col space-y-2">
			<p className="text-sm text-dp-gray-very-dark mb-2.5">Enter the code here:</p>

			<form
				onSubmit={e => e.preventDefault()}
				className={`${
					disabled ? 'opacity-30 cursor-not-allowed' : 'opacity-100'
				} transition flex space-x-1 justify-center`}
			>
				{[number1, number2, number3, number4, number5, number6].map((ref, i) => (
					<input
						key={i}
						ref={ref}
						onChange={handleValueChange(i + 1)}
						type="number"
						min={1}
						max={9}
						className="text-xl text-center border-b w-7 border-dp-gray focus:outline-none"
						maxLength={1}
						disabled={disabled}
					/>
				))}
			</form>
			<p className="text-xs text-dp-red">{error}</p>
		</div>
	);
}
