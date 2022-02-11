interface AddToContactsSubmitButtonProps {
	disabled: boolean;
}

export default function AddToContactsSubmitButton(props: AddToContactsSubmitButtonProps) {
	return (
		<button
			type="submit"
			disabled={props.disabled}
			className={`${
				props.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:filter-darken'
			} text-white bg-dp-blue-dark font-semibold h-11 text-center block rounded-md transition-all focus:outline-none`}
		>
			Add
		</button>
	);
}
