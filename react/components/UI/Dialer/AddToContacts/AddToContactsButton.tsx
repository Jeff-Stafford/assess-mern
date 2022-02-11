interface AddToContactsButtonProps {
	phoneNumber: string;
	onClick: () => void;
}

export default function AddToContactsButton({ onClick }: AddToContactsButtonProps) {
	return (
		<button
			onClick={onClick}
			className={`inline-block text-sm text-dp-blue-dark hover:underline transition focus:outline-none`}
		>
			Add to Contacts
		</button>
	);
}
