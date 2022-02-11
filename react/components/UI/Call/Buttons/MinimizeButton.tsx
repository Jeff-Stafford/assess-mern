export default function MinimizeButton() {
	return (
		<div className="absolute top-0 right-0">
			<button className="opacity-75 hover:opacity-100 transition focus:outline-none p-3">
				<svg className="h-4.5" viewBox="0 0 20.828 20.828">
					<g
						transform="translate(-3.086 -3.086)"
						fill="none"
						stroke="#fff"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
					>
						<path d="M5.5 15.5h6v6" />
						<path d="M21.5 11.5h-6v-6" />
						<path d="M15.5 11.5l7-7" />
						<path d="M4.5 22.5l7-7" />
					</g>
				</svg>
			</button>
		</div>
	);
}
