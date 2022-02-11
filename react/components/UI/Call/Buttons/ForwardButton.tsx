interface ForwardButtonProps {
	disabled?: boolean;
	onClick: () => void;
}

export default function ForwardButton({ disabled, onClick }: ForwardButtonProps) {
	const handleClick = () => {
		if (disabled) return;
		onClick();
	};

	return (
		<button
			onClick={() => handleClick()}
			className={`${disabled ? ' cursor-not-allowed' : ''}
            flex items-center justify-center text-white transition bg-opacity-25 rounded-full w-11 h-11 hover:bg-opacity-50 focus:outline-none bg-white`}
		>
			<svg className="h-5" viewBox="0 0 22.871 20">
				<g transform="translate(0 -30.864)">
					<path
						d="M22.591 39.714l-8.571-8.571a.952.952 0 00-1.626.673v3.814A12.825 12.825 0 00.6 44.856a15.6 15.6 0 00-.592 4.871v.185a.952.952 0 00.7.918.972.972 0 00.253.034.954.954 0 00.818-.465c3.772-6.341 8.77-6.521 10.61-6.342v4.9a.952.952 0 001.626.673l8.571-8.571a.951.951 0 00.005-1.345z"
						fill="#fff"
					/>
				</g>
			</svg>
		</button>
	);
}
