import { ChangeEventHandler, FormEventHandler, useState } from 'react';

interface SecondStepProps {
	response: JSX.Element;
	onSubmit: (value: string) => any;
	loading?: boolean;
	error?: string;
}

const SecondStep = ({ response, onSubmit, loading, error }: SecondStepProps) => {
	const [value, setValue] = useState('');

	const handleSubmit: FormEventHandler<HTMLFormElement> = e => {
		e.preventDefault();
	};

	const handleChange: ChangeEventHandler<HTMLInputElement> = e => {
		if (loading) return;
		if (e.target.value.length === 6) {
			onSubmit(e.target.value);
		}
		if (e.target.value.length <= 6) {
			setValue(e.target.value);
		}
	};

	return (
		<form className="text-sm text-center" onSubmit={handleSubmit}>
			<div className="text-center text-dp-gray-very-dark">{response}</div>
			<p className="my-6 text-dp-gray-very-dark">Enter the code here:</p>
			<div>
				<input
					className={`${
						loading ? 'opacity-50 cursor-wait' : ''
					} border-b font-mono border-dp-gray text-center border-t-0 border-l-0 border-r-0 focus:ring-0 text-2xl tracking-widest placeholder-dp-gray`}
					style={{ width: 130 }}
					type="number"
					value={value}
					onChange={handleChange}
					placeholder="123456"
					readOnly={loading}
				/>
			</div>
			{error && <p className="mt-4 text-sm text-dp-red">{error}</p>}
		</form>
	);
};

export default SecondStep;
