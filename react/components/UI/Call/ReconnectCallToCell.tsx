import React, { FC, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { CSSTransition } from 'react-transition-group';

import { IRTCStatus, Call } from '../../../models';
import Portal from '../../Portal/Portal';
import AcceptCallToCellButton from './Buttons/AcceptCallToCellButton';
import WhiteButton from '../ForwardModal/Buttons/WhiteButton';
import { useNotifications } from '../Notifications';

import { TwiRtcAPI } from '../../../utils/api';
import { EDialStatus, EDialEvent } from '../../../enums';
import { setIRTCStatus } from '../../../store/actions/rtc-status.actions';
import { setShowReconnectCallToCellModal } from '../../../store/actions/call';

const transitionClassNames = {
	enter: 'animate__animated',
	enterActive: 'animate__fadeIn',
	exit: 'animate__animated',
	exitActive: 'animate__fadeOut',
};

const ReconnectCallToCell: FC = () => {
	const modalRef = useRef<HTMLDivElement>(null);
	const rtcStatus: IRTCStatus = useSelector(state => state.rtcStatus);
	const callStatus: Call = useSelector(state => state.call);
	const dispatch = useDispatch();
	const { notify } = useNotifications();

	const handleReconnectCallToCellAction = async () => {
		const identity = rtcStatus.identity;
		try {
			let direction = 0;
			if (callStatus.isInbound) {
				direction = 0;
			} else {
				direction = 1;
			}
			const result = await TwiRtcAPI.switch_call_to_cell(direction, identity);

			if (result.data) {
				// end the current call.
				dispatch(
					setIRTCStatus({
						dialStatus: EDialStatus.OUTBOUND_END_CALL,
						dialEvent: EDialEvent.E_CALL,
					})
				);
			}
		} catch (message) {
			notify({ type: 'error', message });
		} finally {
			dispatch(setShowReconnectCallToCellModal(false));
		}
	};

	const handleClose = () => {
		dispatch(setShowReconnectCallToCellModal(false));
	};

	return (
		<Portal>
			<CSSTransition
				in={callStatus.showReconnectCallToCellModal}
				timeout={500}
				nodeRef={modalRef}
				classNames={transitionClassNames}
				mountOnEnter={true}
				unmountOnExit={true}
			>
				<div ref={modalRef} className="fixed z-20 inset-0 animation-duration-250">
					<div className="flex justify-center items-center h-screen px-4 py-14 text-center">
						<div className="fixed inset-0">
							<div className="absolute inset-0 bg-dp-blue-very-dark bg-opacity-50"></div>
						</div>
						<div
							className={`p-5 max-w-sm bg-white relative z-30 inline-flex flex-col rounded-lg max-w-580 w-full max-h-full flex-1 transition`}
							role="dialog"
							aria-modal="true"
							aria-labelledby="modal-headline"
						>
							<div className="mb-2 text-center">
								<p className="font-semibold text-xl leading-tight">
									Call quality is not good. Do you want to reconnect via your cell carrier?
								</p>
							</div>
							<div className="flex justify-between items-center py-2 px-5">
								<AcceptCallToCellButton onClick={handleReconnectCallToCellAction}>Accept</AcceptCallToCellButton>
								<WhiteButton onClick={handleClose}>Cancel</WhiteButton>
							</div>
						</div>
					</div>
				</div>
			</CSSTransition>
		</Portal>
	);
};

export default ReconnectCallToCell;
