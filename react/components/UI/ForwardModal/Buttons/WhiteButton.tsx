import { FC } from 'react';

interface WhiteButtonProps {
	onClick?: () => void;
}

const WhiteButton: FC<WhiteButtonProps> = ({ children, onClick }) => {
	const handleClick = () => {
		if (onClick !== undefined) {
			onClick();
		}
	};

	return (
		<button
			onClick={handleClick}
			className="w-28 text-center rounded-lg py-3 border border-dp-gray hover:opacity-75 transition font-semibold flex justify-center space-x-2 items-center"
		>
			{children}
		</button>
	);
};

export default WhiteButton;
