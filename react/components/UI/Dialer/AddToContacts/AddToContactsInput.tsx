interface AddToContactsInputProps {
	value: string;
	onChange: (value: string) => void;
}

export default function AddToContactsInput(props: AddToContactsInputProps) {
	return (
		<input
			onChange={e => props.onChange(e.target.value)}
			className="w-full px-3 bg-white rounded-md h-11 focus:outline-none"
			placeholder="Name"
			type="text"
		/>
	);
}
