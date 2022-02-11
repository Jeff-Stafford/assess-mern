interface AcceptCallButtonProps {
	onClick: () => void;
}

export default function AcceptCallButton({ onClick }: AcceptCallButtonProps) {
	return (
		<button
			onClick={() => onClick()}
			className="flex items-center justify-center flex-1 h-10 transition rounded-br-lg bg-dp-green hover:bg-opacity-75 focus:outline-none"
		>
			<svg className="flex-shrink-0 h-6 overflow-visible" viewBox="0 0 27 27">
				<path
					d="M26.23 21.148a22.686 22.686 0 00-4.739-3.171c-1.42-.682-1.941-.668-2.946.056-.837.6-1.378 1.167-2.341.956s-2.862-1.645-4.7-3.48-3.277-3.741-3.48-4.7.359-1.5.956-2.341c.724-1.005.745-1.526.056-2.946A22.238 22.238 0 005.86.778C4.826-.256 4.594-.031 4.025.178a10.443 10.443 0 00-1.68.893A5.069 5.069 0 00.326 3.198c-.4.865-.865 2.475 1.5 6.68a37.272 37.272 0 006.553 8.74l.007.007.007.007a37.418 37.418 0 008.74 6.553c4.2 2.362 5.815 1.9 6.68 1.5a4.983 4.983 0 002.13-2.018 10.443 10.443 0 00.893-1.68c.202-.573.434-.805-.606-1.839z"
					fill="#fff"
				/>
			</svg>
		</button>
	);
}
