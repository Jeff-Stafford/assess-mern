interface KeypadNumberProps {
	digit: string;
	label?: string;
	onClick: (digit: string) => void;
}

export default function KeypadNumber(props: KeypadNumberProps) {
	return (
		<button
			onClick={() => {
				props.onClick(props.digit);
			}}
			className={`focus:outline-none h-16 w-16 rounded-full bg-dp-gray-light hover:filter-darken transition-all flex flex-col items-center justify-center`}
		>
			<span className="text-2xl font-medium">{props.digit}</span>
			{props.label && <span className="text-xs text-dp-gray-dark">{props.label ? props.label : ''}</span>}
			{!props.label && <div className="h-3"></div>}
		</button>
	);
}
