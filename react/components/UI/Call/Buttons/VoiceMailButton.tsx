interface RecordButtonProps {
	onClick: () => void;
}

export default function VoiceMailButton({ onClick }: RecordButtonProps) {
	return (
		<button
			onClick={() => onClick()}
			className="bg-dp-blue-dark hover:bg-opacity-75 bg-opacity-100 text-white h-11 w-11 rounded-full focus:outline-none flex items-center justify-center transition"
		>
			<svg className="h-3" viewBox="0 0 27.882 12.353">
				<g id="Group_1342" data-name="Group 1342" transform="translate(1 1)">
					<path
						id="Union_24"
						data-name="Union 24"
						d="M0,5.176a5.176,5.176,0,1,1,5.176,5.177A5.177,5.177,0,0,1,0,5.176Z"
						transform="translate(0 0)"
						fill="none"
						stroke="#fff"
						strokeMiterlimit="10"
						strokeWidth="2"
					/>
					<path
						id="Union_23"
						data-name="Union 23"
						d="M0,5.176a5.176,5.176,0,1,1,5.176,5.177A5.177,5.177,0,0,1,0,5.176Z"
						transform="translate(15.529 0)"
						fill="none"
						stroke="#fff"
						strokeMiterlimit="10"
						strokeWidth="2"
					/>
					<line
						id="Line_17"
						data-name="Line 17"
						x2="15.529"
						transform="translate(5.176 10.352)"
						fill="none"
						stroke="#fff"
						strokeLinecap="round"
						strokeMiterlimit="10"
						strokeWidth="2"
					/>
				</g>
			</svg>
		</button>
	);
}
