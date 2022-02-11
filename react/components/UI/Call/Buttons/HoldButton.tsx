interface HoldButtonProps {
	active: boolean;
	disabled?: boolean;
	onClick: () => void;
}

export default function HoldButton({ active, disabled, onClick }: HoldButtonProps) {
	const handleClick = () => {
		if (disabled) return;
		onClick();
	};

	return (
		<button
			onClick={() => handleClick()}
			className={`${active ? 'text-dp-blue-very-dark' : 'bg-opacity-25 hover:bg-opacity-75 text-white'} ${
				disabled ? 'cursor-not-allowed' : ''
			} bg-white w-11 h-11 rounded-full flex items-center justify-center focus:outline-none transition`}
		>
			<svg className="h-5" viewBox="0 0 18 22">
				<g transform="translate(-9 -6.75)" fill="currentColor">
					<path d="M14.055 28.75H9.57A.56.56 0 019 28.2V7.3a.56.56 0 01.57-.55h4.486a.56.56 0 01.57.55v20.9a.56.56 0 01-.571.55z" />
					<path d="M26.43 28.75h-4.485a.56.56 0 01-.57-.55V7.3a.56.56 0 01.57-.55h4.485a.56.56 0 01.57.55v20.9a.56.56 0 01-.57.55z" />
				</g>
			</svg>
		</button>
	);
}
