interface SubmitButtonProps {
	disabled?: boolean;
	children: any;
}

export default function SubmitButton({ disabled, children }: SubmitButtonProps) {
	return (
		<button
			type="submit"
			className={`${
				disabled ? 'opacity-50' : 'hover:filter-darken'
			} w-full focus:outline-none text-white transition-all bg-dp-blue-dark h-10 rounded-md`}
		>
			{children}
		</button>
	);
}
