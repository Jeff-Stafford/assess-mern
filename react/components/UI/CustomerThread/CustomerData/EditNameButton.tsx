interface EditNameButtonProps {
	onClick?: () => void;
}

const EditNameButton = ({ onClick }: EditNameButtonProps) => (
	<button
		onClick={onClick}
		className="h-11 w-11 flex items-center justify-center focus:outline-none rounded-md transition text-dp-blue-dark bg-dp-gray bg-opacity-0 hover:bg-opacity-25"
	>
		<svg className="h-5" viewBox="0 0 18.667 18.667">
			<g
				transform="translate(1 1)"
				fill="none"
				stroke="#375DD0"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			>
				<path d="M7.455 1.757h-5.8A1.657 1.657 0 000 3.414v11.6a1.657 1.657 0 001.657 1.653h11.6a1.657 1.657 0 001.657-1.657v-5.8" />
				<path d="M13.67.515A1.75716035 1.75716035 0 0116.155 3l-7.869 7.869-3.316.828.828-3.313z" />
			</g>
		</svg>
	</button>
);

export default EditNameButton;
