import { useDispatch, useSelector } from 'react-redux';
import { TwiRtcAPI } from '../../../utils/api';
import parsePhoneNumber, { PhoneNumber } from 'libphonenumber-js';
import AcceptCallButton from './Buttons/AcceptCallButton';
import RejectCallButton from './Buttons/RejectCallButton';
import VoiceMailButton from './Buttons/VoiceMailButton';
import SwitchCarrierButton from './Buttons/SwitchCarrierButton';
import { IRTCStatus } from '../../../models';
import { EDialStatus, EDialEvent } from '../../../enums';
import { setIRTCStatus } from '../../../store/actions/rtc-status.actions';
import { getDateTime } from '../../../utils/helpers/datetime';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { checkIfCustomerExists, createCustomer, subscribeToCustomer } from '../../../utils/api/contacts';
import { useNotifications } from '../Notifications';
import { formatPhoneNumber } from '../../../utils/helpers/formatPhoneNumber';
import Portal from '../../Portal/Portal';
import SetCellModal from './SetCellModal';
import SetVoiceMailModal from './SetVoiceMailModal';

export default function IncomingCall() {
	const user = useSelector(({ user }) => user);
	const dispatch = useDispatch();
	const rtcStatus: IRTCStatus = useSelector(state => state.rtcStatus);
	const router = useRouter();
	const { notify } = useNotifications();
	const [name, setName] = useState(null);
	const [cellModal, setCellModal] = useState(false);
	const [voiceMailModal, setVoiceMailModal] = useState(false);

	const setCallerName = useCallback(async () => {
		const number = parsePhoneNumber(rtcStatus.phoneNumber);
		if (number !== undefined && number.isPossible()) {
			try {
				const { data } = await checkIfCustomerExists(number);
				if (data.customer_name) {
					await setName(data.customer_name);
				}
			} catch (error) {}
		}
	}, [rtcStatus.phoneNumber]);

	const findContact = useCallback(
		async (number: PhoneNumber) => {
			try {
				const { data } = await checkIfCustomerExists(number);
				return data;
			} catch (error) {
				if (error.response.status !== 404) {
					notify({
						type: 'error',
						message: 'We were unable to check if this number exists in contacts. Please contact customer support.',
					});
				}
				return null;
			}
		},
		[notify]
	);

	useEffect(() => {
		const number = parsePhoneNumber(rtcStatus.phoneNumber, 'US');

		if (number !== undefined && number.isPossible()) {
			setCallerName();
		}
	}, [rtcStatus.phoneNumber, setCallerName]);

	const redirectToCustomerThread = async (number: PhoneNumber) => {
		const contact = await findContact(number);
		if (contact) {
			await subscribeToCustomer(user.id, contact.id);
			await router.push(`/customer-threads/${contact.id}`);
			return;
		}
		try {
			const {
				data: { customer_id },
			} = await createCustomer(null, number.format('E.164'));
			await router.push(`/customer-threads/${customer_id}`);
		} catch (error) {
			notify({
				type: 'error',
				message: 'Could not open the customer thread.',
			});
		}
	};

	const onCallAccepted = () => {
		rtcStatus.twilioConn.accept();
		dispatch(
			setIRTCStatus({
				dialStatus: EDialStatus.INBOUND_IN_CALL,
				dialEvent: EDialEvent.E_CALL,
				startedAt: getDateTime(),
			})
		);

		const number = parsePhoneNumber(rtcStatus.phoneNumber, 'US');
		if (number !== undefined && number.isPossible()) {
			redirectToCustomerThread(number);
		}
		console.log('Call accepted');
	};

	const onCallRejected = () => {
		rtcStatus.twilioConn.reject();

		//set inbound status
		dispatch(
			setIRTCStatus({
				dialStatus: EDialStatus.INBOUND_END_CALL,
				dialEvent: EDialEvent.E_CALL,
			})
		);

		console.log('Call rejected');
	};

	const onTransferVoicemail = async () => {
		dispatch(
			setIRTCStatus({
				apiCalling: true,
				apiNote: 'Switching to voicemail',
			})
		);

		const result = await TwiRtcAPI.leave_voicemail(rtcStatus.identity);

		if (result.data) {
			if (result.data['data'] === 'success') {
				rtcStatus.twilioConn.reject();
				notify({ type: 'success', message: 'Sent Voicemail' });

				//set inbound status
				dispatch(
					setIRTCStatus({
						dialStatus: EDialStatus.INBOUND_END_CALL,
						dialEvent: EDialEvent.E_CALL,
						apiCalling: false,
					})
				);
			} else {
				//set inbound status
				dispatch(
					setIRTCStatus({
						apiCalling: false,
					})
				);
				setVoiceMailModal(true);
				notify({ type: 'warning', message: result.data['data'] });
			}
		}
	};

	const onSwitchCarrier = async () => {
		const direction = 0;

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
		<div className="flex flex-col bg-white rounded-lg shadow">
			<div className="flex flex-col items-center justify-center p-4 space-y-1">
				<span className="text-xl">{name ? name : formatPhoneNumber(rtcStatus.phoneNumber)}</span>
				<span className="text-dp-gray-dark">Incoming call...{rtcStatus.onConference && '(Conference Call)'}</span>
			</div>
			<div className="grid grid-cols-2 gap-5 mb-3 mt-3">
				<div className="flex flex-col items-center space-y-1">
					<VoiceMailButton onClick={onTransferVoicemail} />
				</div>
				<div className="flex flex-col items-center space-y-1">
					<SwitchCarrierButton onClick={onSwitchCarrier} />
				</div>
			</div>
			<div className="flex">
				<RejectCallButton onClick={onCallRejected} />
				<AcceptCallButton onClick={onCallAccepted} />
			</div>
			<Portal>
				<SetCellModal show={cellModal} onClose={() => setCellModal(false)}></SetCellModal>
			</Portal>
			<Portal>
				<SetVoiceMailModal show={voiceMailModal} onClose={() => setVoiceMailModal(false)}></SetVoiceMailModal>
			</Portal>
		</div>
	);
}
