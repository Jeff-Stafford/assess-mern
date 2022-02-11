import React, { FC, useRef } from 'react';
import { CSSTransition } from 'react-transition-group';

import Portal from '../../Portal/Portal';
import AcceptCallToCellButton from './Buttons/AcceptCallToCellButton';
import WhiteButton from '../ForwardModal/Buttons/WhiteButton';

const transitionClassNames = {
	enter: 'animate__animated',
	enterActive: 'animate__fadeIn',
	exit: 'animate__animated',
	exitActive: 'animate__fadeOut',
};
interface SetCellModalProps {
	show?: boolean;
	onClose?: () => void;
}

const SetCellModal: FC<SetCellModalProps> = ({ show, onClose }) => {
	const modalRef = useRef<HTMLDivElement>(null);

	const handleClose = () => {
		if (onClose !== undefined) {
			onClose();
		}
	};

	const redirectToSetCellAction = async () => {
		window.open('/user-settings/personal', '_blank');
		if (onClose !== undefined) {
			onClose();
		}
	};

	return (
		<Portal>
			<CSSTransition
				in={show}
				timeout={500}
				nodeRef={modalRef}
				classNames={transitionClassNames}
				mountOnEnter={true}
				unmountOnExit={true}
			>
				<div ref={modalRef} className="fixed z-20 inset-0 animation-duration-250">
					<div className="flex justify-center items-center h-screen px-4 py-14 text-center">
						<div className="fixed inset-0">
							<div onClick={handleClose} className="absolute inset-0 bg-dp-blue-very-dark bg-opacity-50"></div>
						</div>
						<div
							className={`p-5 max-w-sm bg-white relative z-30 inline-flex flex-col rounded-lg max-w-580 w-full max-h-full flex-1 transition`}
							role="dialog"
							aria-modal="true"
							aria-labelledby="modal-headline"
						>
							<div className="mb-2 text-center">
								<p className="font-semibold text-xl leading-tight">Please configure your cell phone number.</p>
							</div>
							<div className="flex justify-between items-center py-2 px-5">
								<AcceptCallToCellButton onClick={redirectToSetCellAction}>Set Now</AcceptCallToCellButton>
								<WhiteButton onClick={handleClose}>Cancel</WhiteButton>
							</div>
						</div>
					</div>
				</div>
			</CSSTransition>
		</Portal>
	);
};

export default SetCellModal;
