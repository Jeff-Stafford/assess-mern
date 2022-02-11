import { FC } from 'react';

interface AcceptCallToCellButtonProps {
	onClick?: () => void;
}

const AcceptCallToCellButton: FC<AcceptCallToCellButtonProps> = ({ children, onClick }) => {
	const handleClick = () => {
		if (onClick !== undefined) {
			onClick();
		}
	};

	return (
		<button
			onClick={handleClick}
			className="w-28 text-center rounded-lg py-3 bg-dp-blue-dark text-white hover:opacity-75 transition font-semibold"
		>
			{children}
		</button>
	);
};

export default AcceptCallToCellButton;
