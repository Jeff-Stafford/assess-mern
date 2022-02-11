interface InputProps {
	type: string;
	placeholder?: string;
	value: string;
	onChange: (value: string) => void;
	error?: string;
}

export default function Input({ type, placeholder, value, onChange, error }: InputProps) {
	return (
		<input
			type={type}
			className={`${
				error ? 'border-dp-red' : 'border-dp-gray hover:border-dp-blue-dark focus:border-dp-blue-dark'
			} block w-full border rounded-md  transition focus:outline-none h-11 px-5`}
			placeholder={placeholder}
			value={value}
			onChange={e => onChange(e.target.value)}
			autoFocus={true}
		/>
	);
}
