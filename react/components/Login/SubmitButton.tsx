import { FC } from 'react';

interface SubmitButtonProps {
	loading?: boolean;
	type?: 'button' | 'reset' | 'submit';
	disabled?: boolean;
	onClick?: () => any;
}

const SubmitButton: FC<SubmitButtonProps> = ({ children, disabled, type = 'submit', onClick, loading }) => (
	<button
		className={`${loading ? 'is-loading' : ''} ${
			disabled ? 'cursor-default opacity-75' : 'cursor-pointer'
		} py-3 block w-full text-white font-semibold text-base text-center bg-dp-blue-dark rounded-md focus:outline-none focus:ring-0`}
		disabled={disabled || loading}
		onClick={onClick}
		type={type}
	>
		{children}
	</button>
);

export default SubmitButton;
