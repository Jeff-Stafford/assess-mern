import { RoutingProfile as RoutingProfileType } from '../Types/RoutingProfile.type';
import { CSSTransition } from 'react-transition-group';
import { useRef } from 'react';
import {
	UserDirect,
	UserMultipleRoundRobin,
	UserMultipleSimultaneous,
	ExternalDID,
	Voicemail,
	Bridge,
} from '../RoutingProfiles/RoutingProfilesIcons';

const transitionClassNames = {
	enter: 'animate__animated',
	enterActive: 'animate__fadeIn',
	exit: 'animate__animated',
	exitActive: 'animate__fadeOut',
};

interface RoutingProfileProps {
	selected?: boolean;
	onClick?: () => void;
}

const RoutingProfile = ({ hunt_label, type, selected, onClick }: RoutingProfileProps & RoutingProfileType) => {
	const iconRef = useRef<HTMLDivElement>(null);
	const getIcon = (type: string): JSX.Element => {
		if (type === 'User direct') return <UserDirect />;
		if (type === 'User multiple roundrobin') return <UserMultipleRoundRobin />;
		if (type === 'User multiple simultaneous') return <UserMultipleSimultaneous />;
		if (type === 'Bridge') return <Bridge />;
		if (type === 'Voicemail') return <Voicemail />;
		return <ExternalDID />;
	};

	return (
		<div
			onClick={onClick}
			className={`${
				selected ? 'border-dp-blue-dark' : 'border-transparent'
			} h-16 bg-white rounded-lg flex items-center justify-between px-2.5 border hover:border-dp-blue-dark cursor-pointer`}
		>
			<div className="flex items-center space-x-2.5">
				{getIcon(type.type_description)}
				<div className="flex flex-col justify-center">
					<span className="font-medium leading-tight">{hunt_label}</span>
					<span className="text-xs text-dp-gray-dark">{type.type_description}</span>
				</div>
			</div>
			<CSSTransition
				timeout={1000}
				in={selected}
				mountOnEnter={true}
				unmountOnExit={true}
				nodeRef={iconRef}
				classNames={transitionClassNames}
			>
				<div ref={iconRef} className="animation-duration-150">
					<svg className="h-6" viewBox="0 0 24 24">
						<path
							d="M12 0a12 12 0 1012 12A12 12 0 0012 0zm6.144 8.683l-7.713 7.748h-.006a1.042 1.042 0 01-.669.317 1.01 1.01 0 01-.675-.329L5.85 13.188a.23.23 0 010-.329l1.027-1.027a.223.223 0 01.323 0l2.562 2.562 7.038-7.09a.228.228 0 01.162-.069.21.21 0 01.163.069l1.01 1.044a.227.227 0 01.009.335z"
							fill="#375dd0"
						/>
					</svg>
				</div>
			</CSSTransition>
		</div>
	);
};

export default RoutingProfile;
