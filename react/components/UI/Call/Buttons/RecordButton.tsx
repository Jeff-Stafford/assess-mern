interface RecordButtonProps {
	active: boolean;
	disabled?: boolean;
	onClick: () => void;
}

export default function RecordButton({ active, disabled, onClick }: RecordButtonProps) {
	const handleClick = () => {
		if (disabled) return;
		onClick();
	};

	return (
		<button
			onClick={() => handleClick()}
			className={`${active ? ' text-dp-red' : 'bg-opacity-25 text-white hover:bg-opacity-50'} ${
				disabled ? 'cursor-not-allowed' : ''
			} h-11 w-11 rounded-full focus:outline-none flex items-center justify-center transition bg-white`}
		>
			<svg className="h-3" viewBox="0 0 26.182 12">
				<path
					d="M20.193 0h-.005a6.005 6.005 0 00-4.228 10.254h-5.733A6.005 6.005 0 006 0h-.011a6 6 0 000 12h14.2a6 6 0 000-12zm4.244 6a4.249 4.249 0 11-4.25-4.266A4.261 4.261 0 0124.436 6zM5.995 10.265A4.265 4.265 0 1110.244 6a4.265 4.265 0 01-4.249 4.265z"
					fill="currentColor"
				/>
			</svg>
		</button>
	);
}
