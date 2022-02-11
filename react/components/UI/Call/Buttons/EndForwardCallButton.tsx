import { MouseEvent } from 'react';

interface EndForwardCallButton {
	onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}

export default function EndForwardCallButton({ onClick }: EndForwardCallButton) {
	return (
		<button
			onClick={e => onClick(e)}
			className="flex items-center justify-center rounded-full h-11 w-11 bg-white hover:filter-darken focus:outline-none"
		>
			<svg className="h-6" viewBox="0 0 24.414 24.413">
				<g id="Group_2480" data-name="Group 2480" transform="translate(1025 -12726.586)">
					<path
						id="Icon_ionic-ios-call"
						data-name="Icon ionic-ios-call"
						d="M23.307,18.791A20.158,20.158,0,0,0,19.1,15.973c-1.262-.606-1.724-.594-2.618.05-.743.537-1.225,1.037-2.081.85s-2.543-1.462-4.18-3.093S7.306,10.457,7.125,9.6s.319-1.337.85-2.081c.644-.893.662-1.356.05-2.618A19.76,19.76,0,0,0,5.207.691C4.289-.227,4.082-.027,3.576.154A9.279,9.279,0,0,0,2.083.947,4.5,4.5,0,0,0,.29,2.841c-.356.768-.768,2.2,1.331,5.935a33.119,33.119,0,0,0,5.823,7.766h0l.006.006.006.006h0a33.248,33.248,0,0,0,7.766,5.823c3.736,2.1,5.167,1.687,5.935,1.331a4.428,4.428,0,0,0,1.893-1.793,9.279,9.279,0,0,0,.793-1.493C24.025,19.916,24.231,19.709,23.307,18.791Z"
						transform="translate(-1025 12727.001)"
						fill="#ff3139"
					/>
					<g id="Group_2479" data-name="Group 2479" transform="translate(-1 1)">
						<line
							id="Line_129"
							data-name="Line 129"
							x2="8"
							y2="8"
							transform="translate(-1009 12727)"
							fill="none"
							stroke="#fd3139"
							strokeLinecap="round"
							strokeWidth="2"
						/>
						<line
							id="Line_130"
							data-name="Line 130"
							y1="8"
							x2="8"
							transform="translate(-1009 12727)"
							fill="none"
							stroke="#fd3139"
							strokeLinecap="round"
							strokeWidth="2"
						/>
					</g>
				</g>
			</svg>
		</button>
	);
}
