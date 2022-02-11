interface RecordButtonProps {
	onClick: () => void;
	bgWhite?: boolean;
}

export default function SwitchCarrierButton({ onClick, bgWhite }: RecordButtonProps) {
	return (
		<button
			onClick={() => onClick()}
			className={`${
				bgWhite
					? 'bg-white bg-opacity-25 text-white hover:bg-opacity-50'
					: 'bg-dp-blue-dark hover:bg-opacity-75 bg-opacity-100 text-white '
			} h-11 w-11 rounded-full focus:outline-none flex items-center justify-center transition`}
		>
			<svg className="h-3" viewBox="0 0 25.414 25.414">
				<g id="Group_1548" data-name="Group 1548" transform="translate(-156.586 -576.586)">
					<g id="Group_1546" data-name="Group 1546" transform="translate(158 582.5)">
						<rect
							id="Rectangle_416"
							data-name="Rectangle 416"
							width="4.5"
							height="6"
							rx="2"
							transform="translate(0 13.5)"
							fill="#fff"
						/>
						<rect
							id="Rectangle_418"
							data-name="Rectangle 418"
							width="4.5"
							height="10.5"
							rx="2"
							transform="translate(6.5 9)"
							fill="#fff"
						/>
						<rect
							id="Rectangle_419"
							data-name="Rectangle 419"
							width="4.5"
							height="15"
							rx="2"
							transform="translate(13 4.5)"
							fill="#fff"
						/>
						<rect
							id="Rectangle_420"
							data-name="Rectangle 420"
							width="4.5"
							height="19.5"
							rx="2"
							transform="translate(19.5)"
							fill="#fff"
						/>
					</g>
					<g id="Group_1547" data-name="Group 1547" transform="translate(158 578)">
						<path
							id="Path_314"
							data-name="Path 314"
							d="M6.429,6.429H0V0"
							transform="translate(1.071 7.5) rotate(-90)"
							fill="none"
							stroke="#fff"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
						/>
						<path
							id="Path_315"
							data-name="Path 315"
							d="M0,7.5,7.5,0"
							transform="translate(0 7.5) rotate(-90)"
							fill="none"
							stroke="#fff"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
						/>
					</g>
				</g>
			</svg>
		</button>
	);
}
