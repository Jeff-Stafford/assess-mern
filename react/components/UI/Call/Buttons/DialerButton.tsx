interface DialerButtonProps {
	active: boolean;
	onClick: (active: boolean) => void;
}

export default function DialerButton({ active, onClick }: DialerButtonProps) {
	return (
		<button
			onClick={() => onClick(active)}
			className={`${
				active ? 'bg-white text-dp-blue-very-dark' : 'bg-white bg-opacity-25 text-white hover:bg-opacity-50'
			} h-11 w-11 transition rounded-full flex items-center justify-center focus:outline-none`}
		>
			<svg className="h-5" viewBox="0 0 22 22">
				<path
					d="M11 16.5a2.75 2.75 0 102.75 2.75A2.758 2.758 0 0011 16.5zM2.75 0A2.75 2.75 0 105.5 2.75 2.758 2.758 0 002.75 0zm0 8.25A2.75 2.75 0 105.5 11a2.758 2.758 0 00-2.75-2.75zm8.25 0A2.75 2.75 0 1013.75 11 2.758 2.758 0 0011 8.25zm8.25 0A2.75 2.75 0 1022 11a2.758 2.758 0 00-2.75-2.75zm0-8.25A2.75 2.75 0 1022 2.75 2.758 2.758 0 0019.25 0zM11 0a2.75 2.75 0 102.75 2.75A2.758 2.758 0 0011 0z"
					fill="currentColor"
				/>
			</svg>
		</button>
	);
}
