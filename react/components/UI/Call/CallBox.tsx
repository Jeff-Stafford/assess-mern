import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useEffect, useState } from 'react';
import { TwiRtcAPI } from '../../../utils/api';
import { useInterval } from 'react-use';
import parsePhoneNumber from 'libphonenumber-js';

import MuteButton from './Buttons/MuteButton';
import DialerButton from './Buttons/DialerButton';
import EndCallButton from './Buttons/EndCallButton';
import RecordButton from './Buttons/RecordButton';
import HoldButton from './Buttons/HoldButton';
import ForwardButton from './Buttons/ForwardButton';
import Keypad from '../Dialer/Keypad/Keypad';
import SwitchCarrierButton from './Buttons/SwitchCarrierButton';
import EndForwardCallButton from './Buttons/EndForwardCallButton';

import { IRTCStatus } from '../../../models';
import { setIRTCStatus } from '../../../store/actions/rtc-status.actions';
import { EDialStatus, EDialEvent } from '../../../enums';
import { FORWARDER_STATUS } from '../../../consts';
import { getCallDuration, CallDuration, callDurationString } from '../../../utils/helpers/calling-box';
import { checkIfCustomerExists } from '../../../utils/api/contacts';
import { formatPhoneNumber } from '../../../utils/helpers/formatPhoneNumber';
import Portal from '../../Portal/Portal';
import { useNotifications } from '../Notifications';
import ForwardModal from '../ForwardModal/ForwardModal';
import SetCellModal from './SetCellModal';

export default function CallBox() {
	const call = useSelector(({ call }) => call);
	const rtcStatus: IRTCStatus = useSelector(state => state.rtcStatus);
	const dispatch = useDispatch();
	const { notify } = useNotifications();
	const [name, setName] = useState(null);
	const [cellModal, setCellModal] = useState(false);

	const numberFormat = (number: string) => {
		return '+1' + number.replace('+1', '');
	};

	const [callDuration, setCallDuration] = useState<CallDuration>(
		getCallDuration(rtcStatus.startedAt ? rtcStatus.startedAt : null)
	);
	const [intervalIsRunning, setIntervalIsRunning] = useState(false);

	useInterval(
		() => {
			setCallDuration(getCallDuration(rtcStatus.startedAt));
		},
		intervalIsRunning ? 1000 : null
	);

	const getName = useCallback(async () => {
		const number = parsePhoneNumber(rtcStatus.phoneNumber, 'US');
		if (number !== undefined && number.isPossible()) {
			try {
				const { data } = await checkIfCustomerExists(number);
				setName(data.customer_name);
			} catch (error) {}
		}
	}, [rtcStatus.phoneNumber]);

	useEffect(() => {
		getName();
	}, [rtcStatus.phoneNumber, getName]);

	useEffect(() => {
		setIntervalIsRunning(rtcStatus.dialStatus !== EDialStatus.OUTBOUND_RING);
	}, [rtcStatus.dialStatus]);

	const handleRecordButtonClick = () => {
		dispatch(
			setIRTCStatus({
				onRecord: !rtcStatus.onRecord,
				dialEvent: EDialEvent.E_RECORD,
			})
		);
	};

	const handleHoldButtonClick = () => {
		dispatch(
			setIRTCStatus({
				onHold: !rtcStatus.onHold,
				dialEvent: EDialEvent.E_HOLD,
			})
		);
	};

	const handleForwardCallButtonClick = async () => {
		dispatch(
			setIRTCStatus({
				onForward: !rtcStatus.onForward,
				dialEvent: EDialEvent.E_FORWARD,
			})
		);
	};

	const handleMuteButtonClick = () => {
		dispatch(
			setIRTCStatus({
				onMuted: !rtcStatus.onMuted,
				dialEvent: EDialEvent.E_MUTE,
			})
		);
	};

	const handleKeypadButtonClick = () => {
		dispatch(setIRTCStatus({ onDTMF: !rtcStatus.onDTMF }));
	};

	const handleRemoveOwner = async () => {
		dispatch(
			setIRTCStatus({
				apiCalling: true,
				apiNote: 'Removing Me',
			})
		);

		try {
			await TwiRtcAPI.remove_owner(numberFormat(rtcStatus.phoneNumber), rtcStatus.identity);
		} catch (err) {
			//set inbound status
			console.log(err);
		}

		dispatch(
			setIRTCStatus({
				apiCalling: false,
				onConference: false,
			})
		);
	};

	const handleRemoveForwarder = async () => {
		dispatch(
			setIRTCStatus({
				apiCalling: true,
				apiNote: 'Removing ' + rtcStatus.forwarder?.name,
			})
		);
		try {
			await TwiRtcAPI.remove_forwarder(numberFormat(rtcStatus.phoneNumber), rtcStatus.identity);
		} catch (err) {
			//set inbound status
			console.log(err);
		}

		dispatch(
			setIRTCStatus({
				apiCalling: false,
				onConference: false,
			})
		);
	};

	const handleEndCallButtonClick = async () => {
		dispatch(
			setIRTCStatus({
				dialStatus: EDialStatus.OUTBOUND_END_CALL,
				dialEvent: EDialEvent.E_CALL,
			})
		);
	};

	const onDigitClick = (digit: string) => {
		dispatch(setIRTCStatus({ selectedDTMF: digit }));
	};

	const onSwitchCarrier = async () => {
		let direction = 0;
		if (rtcStatus.dialStatus === EDialStatus.INBOUND_IN_CALL) {
			direction = 0;
		} else {
			direction = 1;
		}

		if (rtcStatus.onConference) {
			direction = 2;
		}

		dispatch(
			setIRTCStatus({
				apiCalling: true,
				apiNote: 'Switching Carrier',
			})
		);

		let result: any = null;

		try {
			result = await TwiRtcAPI.switch_call_to_cell(direction, rtcStatus.identity);
		} catch (err) {
			console.log(err);
			//set inbound status
			dispatch(
				setIRTCStatus({
					apiCalling: false,
				})
			);
		}

		if (result && result.data) {
			if (result.data['data'] === 'success') {
				rtcStatus.twilioConn.reject();
				notify({ type: 'success', message: 'Successfully changed carrier' });

				//set inbound status
				dispatch(
					setIRTCStatus({
						dialStatus: EDialStatus.INBOUND_END_CALL,
						dialEvent: EDialEvent.E_CALL,
						apiCalling: false,
					})
				);
			} else {
				dispatch(
					setIRTCStatus({
						apiCalling: false,
					})
				);
				setCellModal(true);
			}
		}
	};

	return (
		<>
			{call.showCallingBox && (
				<div className="absolute bottom-0 left-0 p-4 w-full text-white">
					<div className="backdrop-filter backdrop-blur-sm relative flex flex-col items-center justify-center h-full py-6 transition bg-opacity-90 rounded-lg bg-dp-blue-dark">
						<span className="text-lg leading-relaxed">{name ? name : formatPhoneNumber(rtcStatus.phoneNumber)}</span>
						<span>
							{rtcStatus.dialStatus === EDialStatus.OUTBOUND_RING && 'Connecting'}
							{rtcStatus.dialStatus !== EDialStatus.OUTBOUND_RING && callDurationString(callDuration)}
							{rtcStatus.onConference && <span>&nbsp;&#183;&nbsp;</span>}
							{rtcStatus.onConference &&
								rtcStatus.dialStatus === EDialStatus.OUTBOUND_IN_CALL &&
								rtcStatus.forwarder?.name}
							{rtcStatus.onConference &&
								rtcStatus.dialStatus === EDialStatus.OUTBOUND_IN_CALL &&
								rtcStatus.forwarder?.status === FORWARDER_STATUS.RINGING &&
								' Ringing...'}
							{rtcStatus.onConference &&
								rtcStatus.dialStatus === EDialStatus.OUTBOUND_IN_CALL &&
								rtcStatus.forwarder?.status === FORWARDER_STATUS.CONNECTED &&
								' Connected'}
							{rtcStatus.onConference && rtcStatus.dialStatus === EDialStatus.INBOUND_IN_CALL && '(Conference Call)'}
						</span>
						<div className="grid grid-cols-3 gap-5 mt-8">
							<div className="flex flex-col items-center space-y-1">
								<RecordButton
									disabled={rtcStatus.dialStatus == EDialStatus.OUTBOUND_RINGING}
									active={rtcStatus.onRecord}
									onClick={handleRecordButtonClick}
								/>
								<span className="text-sm">record</span>
							</div>
							<div className="flex flex-col items-center space-y-1">
								<HoldButton
									disabled={rtcStatus.dialStatus == EDialStatus.OUTBOUND_RINGING}
									active={rtcStatus.onHold}
									onClick={handleHoldButtonClick}
								/>
								<span className="text-sm">hold</span>
							</div>
							<div className="flex flex-col items-center space-y-1">
								<ForwardButton
									disabled={rtcStatus.dialStatus == EDialStatus.OUTBOUND_RINGING || rtcStatus.onConference}
									onClick={handleForwardCallButtonClick}
								/>
								<span className="text-sm">forward</span>
							</div>
							<div className="flex flex-col items-center space-y-1">
								<MuteButton active={rtcStatus.onMuted} onClick={handleMuteButtonClick} />
								<span className="text-sm">mute</span>
							</div>
							<div className="flex flex-col items-center space-y-1">
								<DialerButton active={rtcStatus.onDTMF} onClick={handleKeypadButtonClick} />
								<span className="text-sm">keypad</span>
							</div>
							<div className="flex flex-col items-center space-y-1">
								<SwitchCarrierButton onClick={onSwitchCarrier} bgWhite={true} />
								<span className="text-sm">Switch</span>
							</div>
							<div className="flex flex-col items-center space-y-1"></div>
							{!(
								rtcStatus.onConference &&
								rtcStatus.dialStatus === EDialStatus.OUTBOUND_IN_CALL &&
								rtcStatus.forwarder?.status === FORWARDER_STATUS.CONNECTED
							) && (
								<div className="flex flex-col items-center space-y-1">
									<EndCallButton onClick={handleEndCallButtonClick} />
									<span className="text-sm">end</span>
								</div>
							)}
						</div>

						{rtcStatus.onConference &&
							rtcStatus.dialStatus === EDialStatus.OUTBOUND_IN_CALL &&
							rtcStatus.forwarder?.status === FORWARDER_STATUS.CONNECTED && (
								<div className="grid grid-cols-2 gap-10 mt-0">
									<div className="flex flex-col items-center space-y-1">
										<EndCallButton onClick={handleEndCallButtonClick} />
										<span className="text-xs text-center">
											Remove me <br /> from call
										</span>
									</div>
									<div className="flex flex-col items-center space-y-1">
										<EndForwardCallButton onClick={handleRemoveForwarder} />
										<span className="text-xs text-center">
											Remove <br /> {rtcStatus.forwarder?.name}{' '}
										</span>
									</div>
								</div>
							)}
						{rtcStatus.onDTMF && (
							<div className="px-6 pt-4 pb-6 mt-5 text-black bg-white rounded-md shadow-md">
								<Keypad onClick={onDigitClick} />
							</div>
						)}
						<Portal>
							<ForwardModal show={rtcStatus.onForward} onClose={() => handleForwardCallButtonClick()}></ForwardModal>
						</Portal>
						<Portal>
							<SetCellModal show={cellModal} onClose={() => setCellModal(false)}></SetCellModal>
						</Portal>
					</div>
				</div>
			)}
		</>
	);
}
