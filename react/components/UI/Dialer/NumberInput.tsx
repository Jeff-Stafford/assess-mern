import { AsYouType } from 'libphonenumber-js';
import { ChangeEvent, useEffect, useRef } from 'react';

interface NumberInputProps {
	value: string;
	disabled: boolean;
	onChange: (value: string) => void;
}

export default function NumberInput({ value, disabled, onChange }: NumberInputProps) {
	const field = useRef<HTMLInputElement>();

	useEffect(() => {
		const inputField = field.current;
		const inputFieldValue = formattedPhoneNumber(value);

		inputField.value = inputFieldValue;

		if (inputFieldValue.slice(-1) === ')') {
			inputField.focus();
			inputField.setSelectionRange(inputFieldValue.length - 1, inputFieldValue.length - 1);
		}
	});

	const formattedPhoneNumber = (value: string): string => {
		return new AsYouType('US').input(value);
	};

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		const input = new AsYouType('US');
		input.input(event.target.value);
		onChange(input.getChars());
	};

	return (
		<div className="relative flex justify-between rounded-md">
			<input
				ref={field}
				type="text"
				placeholder="Enter a number"
				className={`
				${
					disabled ? 'opacity-50 ' : ''
				}w-full h-full border-0 focus:ring-0 text-dp-blue-very-dark placeholder-dp-gray bg-transparent text-center focus:outline-none px-3 text-xl font-medium`}
				onChange={handleChange}
				readOnly={disabled}
			/>
			{!disabled && value.length > 0 && (
				<button
					onClick={() => {
						onChange(value.slice(0, -1));
					}}
					className="absolute top-0 right-0 block h-full mr-3 transition opacity-75 focus:outline-none hover:opacity-100"
				>
					<svg className="w-6 text-dp-gray-light hover:text-dp-gray transition" viewBox="0 0 24 18">
						<path
							d="M24 3.026v11.94a3.148 3.148 0 01-.74 2.279 2.962 2.962 0 01-2.212.755l-11.79-.008a4.581 4.581 0 01-1.045-.121 3.356 3.356 0 01-.943-.392 3.7 3.7 0 01-.834-.679L.892 10.845a5.2 5.2 0 01-.507-.645 2.625 2.625 0 01-.29-.611 2.028 2.028 0 010-1.223 2.73 2.73 0 01.29-.6 4.276 4.276 0 01.508-.642L6.428 1.14a3.468 3.468 0 01.835-.672A3.549 3.549 0 018.2.106 5.249 5.249 0 019.25 0h11.8a2.962 2.962 0 012.21.755A3.141 3.141 0 0124 3.026"
							fill="currentColor"
						/>
						<path
							d="M19.16 12.099a.906.906 0 01.248.63.868.868 0 01-.248.63.818.818 0 01-.608.261.852.852 0 01-.616-.269l-3.04-3.1-3.017 3.1a.847.847 0 01-1.231.008.9.9 0 01-.248-.63.849.849 0 01.248-.614l3.04-3.109-3.04-3.107a.883.883 0 010-1.227.807.807 0 01.6-.254.765.765 0 01.608.254l3.04 3.109 3.081-3.122a.781.781 0 01.591-.27.8.8 0 01.6.261.821.821 0 01.248.614.892.892 0 01-.248.623L16.12 8.999z"
							fill="#081e42"
						/>
					</svg>
				</button>
			)}
		</div>
	);
}
