import onNumberInputKeyDown from '../../../utils/helpers/onNumberInputKeyDown';

interface ForwardInputProps {
	value: string;
	onChange: (phoneNumber: string) => void;
	onCall: () => void;
}

export default function ForwardInput(props: ForwardInputProps) {
	const handleKeyDown = e => {
		props.onChange(onNumberInputKeyDown(e, props.value));
	};

	return (
		<div className="relative rounded-md h-11 bg-dp-gray-very-light">
			<input
				type="text"
				value={props.value}
				placeholder="Phone number"
				className="w-full h-full px-3 text-lg text-center bg-transparent border border-opacity-50 rounded-md focus:border-dp-gray-dark focus:outline-none border-dp-gray-very-light"
				readOnly={true}
				onKeyDown={e => handleKeyDown(e)}
			/>
			<button
				onClick={() => {
					props.onCall();
				}}
				className="absolute top-0 right-0 block h-full mr-3 transition opacity-75 focus:outline-none hover:opacity-100"
			>
				<svg className="h-5" viewBox="0 0 28 28">
					<path
						d="M27.191 21.925a23.518 23.518 0 00-4.913-3.288c-1.472-.707-2.012-.693-3.054.058-.867.627-1.429 1.21-2.427.991s-2.967-1.706-4.876-3.608-3.397-3.88-3.611-4.88.372-1.56.991-2.427c.751-1.042.773-1.582.058-3.054A23.055 23.055 0 006.072.804C5.001-.268 4.76-.034 4.172.177a10.826 10.826 0 00-1.742.926A5.256 5.256 0 00.338 3.315c-.415.9-.9 2.566 1.553 6.925a38.641 38.641 0 006.793 9.058l.007.007.007.007a38.789 38.789 0 009.06 6.794c4.359 2.449 6.028 1.968 6.925 1.553a5.166 5.166 0 002.209-2.092 10.827 10.827 0 00.926-1.742c.211-.588.452-.827-.627-1.9z"
						fill="#adb3bf"
					></path>
				</svg>
			</button>
		</div>
	);
}
