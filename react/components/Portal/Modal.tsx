import { FC, useRef } from 'react';
import { CSSTransition } from 'react-transition-group';

const transitionClassNames = {
	enter: 'animate__animated',
	enterActive: 'animate__fadeIn',
	exit: 'animate__animated',
	exitActive: 'animate__fadeOut',
};

export interface ModalProps {
	show?: boolean;
	onClose?: () => void;
}

const Modal: FC<ModalProps> = ({ children, show, onClose }) => {
	const modalRef = useRef<HTMLDivElement>(null);
	return (
		<CSSTransition
			in={show}
			timeout={500}
			nodeRef={modalRef}
			classNames={transitionClassNames}
			mountOnEnter={true}
			unmountOnExit={true}
		>
			<div ref={modalRef} className="fixed inset-0 z-20 animation-duration-250">
				<div className="flex items-center justify-center h-screen px-4 text-center py-14">
					<div className="fixed inset-0">
						<div onClick={onClose} className="absolute inset-0 bg-opacity-50 bg-dp-blue-very-dark"></div>
					</div>
					<span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
						&#8203;
					</span>
					{children}
				</div>
			</div>
		</CSSTransition>
	);
};

export default Modal;
