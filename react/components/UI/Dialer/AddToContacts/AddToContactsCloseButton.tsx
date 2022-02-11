interface AddToContactsCloseButtonProps {
	onClick: () => void;
}

export default function AddToContactsCloseButton(props: AddToContactsCloseButtonProps) {
	return (
		<div className="absolute top-0 right-0 px-3 pt-1">
			<button
				className="transition focus:outline-none text-dp-gray-dark hover:text-dp-blue-very-dark"
				onClick={() => props.onClick()}
			>
				<svg className="h-3" viewBox="0 0 14.828 14.828">
					<g transform="translate(1.414 1.414)" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2">
						<path d="M0 0l12.00030918 12.00030918" />
						<path d="M12 0L-.00030918 12.00030918" />
					</g>
				</svg>
			</button>
		</div>
	);
}
