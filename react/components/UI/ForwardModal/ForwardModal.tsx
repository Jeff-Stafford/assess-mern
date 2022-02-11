import { FC, useEffect, useRef, useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import { TwiRtcAPI } from '../../../utils/api';
import BlueButton from './Buttons/BlueButton';
import WhiteButton from './Buttons/WhiteButton';
import DialerIcon from './Icons/DialerIcon';
import RoutingProfilesIcon from './Icons/RoutingProfilesIcon';
import UserIcon from './Icons/UserIcon';
import Dialer from './Pages/Dialer';
import RoutingProfiles from './Pages/RoutingProfiles';
import Team from './Pages/Team';
import Tab from './Tabs/Tab';
import TabContent from './Tabs/TabContent';
import Tabs from './Tabs/Tabs';
import { useSelector, useDispatch } from 'react-redux';
import { EDialStatus } from '../../../enums';
import { FORWARDER_STATUS } from '../../../consts';
import { setIRTCStatus } from '../../../store/actions/rtc-status.actions';
import { parsePhoneNumber } from 'libphonenumber-js';
import { useNotifications } from '../Notifications';

const transitionClassNames = {
	enter: 'animate__animated',
	enterActive: 'animate__fadeIn',
	exit: 'animate__animated',
	exitActive: 'animate__fadeOut',
};

interface ForwardModalProps {
	show?: boolean;
	onClose?: () => void;
}

interface Forward {
	type: 'HUNT' | 'TEAM' | 'NUMBER';
	value: any;
}

const numberFormat = (number: string) => {
	return '+1' + number.replace('+1', '');
};

const ForwardModal: FC<ForwardModalProps> = ({ show, onClose }) => {
	const modalRef = useRef<HTMLDivElement>(null);
	const [activeTab, setActiveTab] = useState<number>(1);
	const [forwardData, setForwardData] = useState<Forward | null>(null);
	const rtc = useSelector(state => state.rtcStatus);
	const dispatch = useDispatch();
	const { notify } = useNotifications();

	const handleClose = () => {
		if (onClose !== undefined) {
			onClose();
		}
	};

	useEffect(() => {
		setForwardData(null);
	}, [activeTab]);

	const handleForwardCall = async () => {
		if (!forwardData) {
			return null;
		}

		let direction = 0;
		if (rtc.dialStatus === EDialStatus.INBOUND_IN_CALL) {
			direction = 0;
		} else {
			direction = 1;
		}
		let result: any;

		dispatch(
			setIRTCStatus({
				apiCalling: true,
				apiNote: 'Forwarding',
			})
		);

		if (forwardData.type === 'TEAM') {
			result = await TwiRtcAPI.transfer_call(
				numberFormat(rtc.phoneNumber),
				numberFormat(forwardData.value?.number?.number_did),
				direction,
				rtc.identity
			);
		}
		if (forwardData.type === 'HUNT') {
			result = await TwiRtcAPI.forward_hunt(
				numberFormat(rtc.phoneNumber),
				forwardData.value?.id,
				direction,
				rtc.identity
			);
		}
		if (forwardData.type === 'NUMBER') {
			const number = parsePhoneNumber(forwardData.value, 'US');
			if (number === undefined || !number.isPossible()) {
				notify({ type: 'error', message: 'Invalid phone number' });
				return;
			}
			result = await TwiRtcAPI.transfer_call(
				numberFormat(rtc.phoneNumber),
				numberFormat(forwardData.value),
				direction,
				rtc.identity
			);
		}
		if (result.data) {
			notify({ type: 'success', message: 'Call forwarded' });

			if (forwardData.type === 'HUNT') {
				dispatch(
					setIRTCStatus({
						dialStatus:
							rtc.dialStatus === EDialStatus.INBOUND_IN_CALL
								? EDialStatus.INBOUND_END_CALL
								: EDialStatus.OUTBOUND_END_CALL,
						apiCalling: false,
					})
				);
			} else {
				dispatch(
					setIRTCStatus({
						onConference: true,
						apiCalling: false,
						forwarder: { ...result.data?.data, status: FORWARDER_STATUS.RINGING },
						dialStatus: EDialStatus.OUTBOUND_IN_CALL,
					})
				);
			}
		}
		onClose();
	};

	return (
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

					<span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
						&#8203;
					</span>
					<div
						className={`${
							activeTab === 3 ? 'bg-white' : 'bg-dp-gray-very-light'
						} relative z-30 inline-flex flex-col rounded-lg max-w-580 w-full max-h-full h-650 flex-1 transition`}
						role="dialog"
						aria-modal="true"
						aria-labelledby="modal-headline"
					>
						<div className="bg-white rounded-t-lg shadow-md relative z-10">
							<div className="flex justify-between items-center p-5">
								<WhiteButton onClick={handleClose}>Cancel</WhiteButton>
								<div className="text-center">
									<p className="font-semibold text-xl leading-tight">Forward this call</p>
								</div>
								<BlueButton onClick={handleForwardCall} disabled={!forwardData}>
									Forward
								</BlueButton>
							</div>
							<Tabs>
								<Tab active={activeTab === 1} onClick={() => setActiveTab(1)} render={true}>
									<UserIcon />
									<span>Team</span>
								</Tab>
								<Tab
									active={activeTab === 2}
									onClick={() => setActiveTab(2)}
									render={rtc.dialStatus == EDialStatus.INBOUND_IN_CALL || true}
								>
									<RoutingProfilesIcon />
									<span>Routing Profiles</span>
								</Tab>
								<Tab active={activeTab === 3} onClick={() => setActiveTab(3)} render={true}>
									<DialerIcon />
									<span>Dialer</span>
								</Tab>
							</Tabs>
						</div>
						<TabContent>
							{activeTab === 1 && <Team onUpdateNumber={setForwardData} />}
							{activeTab === 2 && <RoutingProfiles onUpdateNumber={setForwardData} />}
							{activeTab === 3 && <Dialer onUpdateNumber={setForwardData} />}
						</TabContent>
					</div>
				</div>
			</div>
		</CSSTransition>
	);
};

export default ForwardModal;
