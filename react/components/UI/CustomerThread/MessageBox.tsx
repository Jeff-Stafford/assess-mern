import { useMemo, useState } from 'react';

import { useDispatch } from 'react-redux';
import { setIRTCStatus } from '../../../store/actions/rtc-status.actions';

interface MessageBoxProps {
	onSubmit?: (value: string) => void;
	disabled?: boolean;
}

export default function MessageBox({ disabled, onSubmit }: MessageBoxProps) {
	const [value, setValue] = useState('');
	const dispatch = useDispatch();

	const handleSubmit = e => {
		e.preventDefault();
		if (isDisabled) return;
		onSubmit(value);
		setValue('');
	};

	// onChangeNoteBox
	const onChangeNoteBox = (value: string) => {
		// set the activity for enter the number.
		const onTypeNote = value == '' ? false : true;
		dispatch(setIRTCStatus({ onTypeNote: onTypeNote }));

		setValue(value);
	};

	const isDisabled = useMemo(() => {
		return disabled || !value;
	}, [disabled, value]);

	return (
		<div className="mx-4 mt-4 mb-3 rounded-lg bg-dp-gray-very-light text-dp-gray-very-dark focus-within:ring-2 ring-dp-blue-dark">
			<form className="flex items-center justify-between px-3 py-4" onSubmit={handleSubmit}>
				<input
					type="text"
					className="block border-0 px-0 placeholder-dp-gray-dark py-0 focus:ring-0 w-full text-sm bg-transparent focus:outline-none break-word"
					placeholder="Write a note..."
					value={value}
					onChange={e => onChangeNoteBox(e.target.value)}
				/>
				<button type="submit" className={`${isDisabled ? 'cursor-default ' : ''}focus:outline-none`}>
					<svg
						className={`${isDisabled ? 'text-dp-gray-dark' : 'text-dp-blue-dark'} transition w-5 h-5`}
						viewBox="0 0 20 20"
					>
						<path
							d="M1.393 20.001a1.347 1.347 0 01-1.241-1.963c.848-1.719 1.742-3.416 2.555-5.151a2.654 2.654 0 011.916-1.531C5.8 11.067 7 10.906 8.2 10.734c.7-.1 1.4-.182 2.1-.278a.967.967 0 00.323-.1.382.382 0 00.208-.416.419.419 0 00-.365-.363c-.378-.061-.759-.106-1.139-.16a44.026 44.026 0 01-4.714-.785 3.207 3.207 0 01-1.128-.469 1.807 1.807 0 01-.56-.648C2 5.667 1.063 3.815.147 1.955A1.343 1.343 0 011.166.015a1.428 1.428 0 01.881.176q4.861 2.433 9.725 4.862 3.682 1.841 7.365 3.679A1.361 1.361 0 0120 9.915a1.341 1.341 0 01-.846 1.347q-2.646 1.313-5.285 2.641l-11.81 5.898a1.436 1.436 0 01-.666.2"
							fill="currentColor"
						/>
					</svg>
				</button>
			</form>
		</div>
	);
}
