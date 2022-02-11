interface SMSButtonProps {
	available?: boolean;
	onClick: () => void;
}

export default function SMSButton({ available, onClick }: SMSButtonProps) {
	const handleClick = () => {
		if (!available) return;

		onClick();
	};

	return (
		<button
			onClick={handleClick}
			className={`${
				available
					? 'text-dp-blue-dark bg-dp-gray bg-opacity-0 hover:bg-opacity-25 cursor-pointer'
					: 'text-dp-gray cursor-not-allowed'
			} h-11 w-11 flex items-center justify-center focus:outline-none rounded-md transition`}
			title="Send a Message"
		>
			<svg className="h-5" viewBox="0 0.763 27.238 26">
				<path
					d="M13.619.763c-7.51 0-13.62 5.525-13.62 12.316 0 2.373.748 4.673 2.165 6.661-.268 2.982-.987 5.196-2.031 6.244a.458.458 0 0 0 .32.779c.022 0 .042-.001.064-.005.184-.026 4.455-.643 7.544-2.435a14.71 14.71 0 0 0 5.558 1.072c7.51 0 13.619-5.525 13.619-12.316S21.128.763 13.619.763zm-6.356 14.14a1.822 1.822 0 0 1-1.815-1.824c0-1.007.814-1.825 1.815-1.825 1.002 0 1.816.818 1.816 1.825a1.822 1.822 0 0 1-1.816 1.824zm6.356 0a1.822 1.822 0 0 1-1.816-1.824c0-1.007.815-1.825 1.816-1.825 1.002 0 1.816.818 1.816 1.825a1.822 1.822 0 0 1-1.816 1.824zm6.356 0a1.822 1.822 0 0 1-1.816-1.824c0-1.007.814-1.825 1.816-1.825 1.001 0 1.815.818 1.815 1.825a1.822 1.822 0 0 1-1.815 1.824z"
					fill="currentColor"
				/>
			</svg>
		</button>
	);
}
