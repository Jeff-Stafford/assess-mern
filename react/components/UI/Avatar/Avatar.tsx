import { StatusDisplay } from '../../../enums/status-display.enums';

interface AvatarProps {
	url?: string;
	available: number;
	size?: string;
	borderColor?: string;
	borderSize?: string;
	initials?: string;
}

const Avatar = ({ url, available, size, borderColor, initials, borderSize }: AvatarProps) => {
	return (
		<div className={`relative`}>
			{url && (
				<img src={url} alt="Avatar" className={`${size ? size : 'h-10 w-10'} rounded-full object-cover object-top`} />
			)}
			{!url && (
				<div
					className={`${
						size ? size : 'h-10 w-10 text-base'
					} bg-dp-gray-dark rounded-full flex items-center justify-center text-white font-medium select-none`}
				>
					<span>{initials}</span>
				</div>
			)}
			{available === StatusDisplay.AVAILABLE && (
				<div
					className={`${borderSize ? borderSize : 'w-3.5 h-3.5'} ${
						borderColor ? borderColor : 'border-white'
					} bg-dp-green absolute bottom-0 right-0 border-2 -mb-1 rounded-full transition duration-150`}
				></div>
			)}
			{available === StatusDisplay.IN_CALL && (
				<div
					className={`${borderSize ? borderSize : 'w-3.5 h-3.5'} ${
						borderColor ? borderColor : 'border-white'
					} bg-dp-in-call-yellow absolute bottom-0 right-0 border-2 -mb-1 rounded-full transition duration-150`}
				></div>
			)}
		</div>
	);
};

export default Avatar;
