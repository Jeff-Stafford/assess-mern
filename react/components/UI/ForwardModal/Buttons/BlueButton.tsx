import { FC } from 'react';

const BlueButton: FC<React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>> = ({
	children,
	...rest
}) => {
	return (
		<button
			className="w-28 text-center rounded-lg py-3 bg-dp-blue-dark text-white hover:opacity-75 transition font-semibold"
			{...rest}
		>
			{children}
		</button>
	);
};

export default BlueButton;
