import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { REALTIME_TRANSCRIPTION, CALL_PREFIX_DPUSER, FORWARDER_STATUS } from '../../../consts';
import { EDialStatus } from '../../../enums';
import { useCurrentCustomerThread } from '../../../hooks/useCurrentCustomerThread';
import { IRTCStatus } from '../../../models/rtc-status.models';
import {
	addCallTranscript,
	resetCallTranscript,
	updatePartialCallTranscript,
} from '../../../store/actions/customer-thread';
import { setCallSid } from '../../../store/actions/rtc-status.actions';
import { twiGetCurrentDPCallId, twiSaveLiveTranscription } from '../../../utils/api/customer-thread';
import { getDateTime } from '../../../utils/helpers/datetime';
import { socket_stream } from '../../../utils/socket';
import CallTranscription from './Messages/CallTranscription';

import { w3cwebsocket as W3CWebSocket } from 'websocket';
import { setIRTCStatus } from '../../../store/actions/rtc-status.actions';
import { useNotifications } from '../../../components/UI/Notifications';

const RealTimeTranscription = () => {
	const { query } = useRouter();
	const rtcStatus: IRTCStatus = useSelector(state => state.rtcStatus);
	const user = useSelector(({ user }) => user);
	const callMessages = useSelector(({ customerThread }) => customerThread.callMessages);
	const router = useRouter();
	const { customerThread, loading, error } = useCurrentCustomerThread(+user.id, +router.query.id);
	const [saveTranscriptions, setSaveTranscriptions] = useState(false);
	const [showTranscriptionBox, setShowTranscriptionBox] = useState(false);
	const dispatch = useDispatch();
	const { data } = customerThread;
	const bottomDiv: any = useRef();

	const [customer_name, setCustomerName] = useState('Contact');
	const [agent_name, setAgentName] = useState('Agent');
	const [dpcall_raw_id, setDpCallRawId] = useState(0);

	const [local_socket_stream, setSocketStream] = useState(socket_stream);

	const { notify } = useNotifications();

	// save transcription data to server.
	const saveLiveTranscription = async () => {
		const transcription = callMessages.map(msg => msg.text);
		await twiSaveLiveTranscription(transcription, rtcStatus.callSid);

		// initialize of the transcriptions and callsid.
		dispatch(resetCallTranscript());
		dispatch(setCallSid(''));
		setDpCallRawId(0);
		setSaveTranscriptions(false);

		if (bottomDiv.current) {
			bottomDiv.current.scrollIntoView();
		}
	};

	useEffect(() => {
		if (saveTranscriptions && rtcStatus.callSid != '' && callMessages.length > 0) {
			saveLiveTranscription();
		}
	}, [saveTranscriptions]);

	useEffect(() => {
		if (loading || error) return;
		if (rtcStatus.dialStatus === EDialStatus.INBOUND_IN_CALL || rtcStatus.dialStatus === EDialStatus.OUTBOUND_IN_CALL) {
		} else {
			if (rtcStatus.callSid != '') {
				setSaveTranscriptions(true);
			} else {
				if (rtcStatus.callSid == '') {
					//after saved the transcription data.
					// initialize of the transcriptions
					dispatch(resetCallTranscript());
				}
			}
		}
	}, [loading, error, rtcStatus.dialStatus]);

	/**
	 * handle the transcription data for the selected live call.
	 */
	useEffect(() => {
		// only when the live call is selected by the other member's live call.

		if (dpcall_raw_id != 0 && showTranscriptionBox) {
			local_socket_stream.onmessage = async message => {
				const data = JSON.parse(message.data);

				if (
					rtcStatus.dialStatus === EDialStatus.INBOUND_IN_CALL ||
					rtcStatus.dialStatus === EDialStatus.OUTBOUND_IN_CALL
				) {
					return;
				}
				if (data.event === REALTIME_TRANSCRIPTION.CHANNEL_RECEIVED_DPCALL + dpcall_raw_id) {
					const transcription_data = data.data;

					if (!transcription_data.is_dpuser) {
						await addTranscription(
							transcription_data.id,
							customer_name,
							transcription_data.is_dpuser,
							transcription_data.text,
							transcription_data.transcript_type
						);
					} else {
						await addTranscription(
							transcription_data.id,
							agent_name,
							transcription_data.is_dpuser,
							transcription_data.text,
							transcription_data.transcript_type
						);
					}
				}
			};
		}
	}, [local_socket_stream, rtcStatus.dialStatus, dpcall_raw_id, customer_name, agent_name, showTranscriptionBox]);

	/**
	 * handle the transcription data for the Login User
	 */
	useEffect(() => {
		const connect = socket_stream => {
			console.log('Socket Stream On Message Connecting => ');
			if (socket_stream.readyState >= 2) {
				socket_stream.close();
				socket_stream = new W3CWebSocket(process.env.SOCKET_STREAM_URL);
				setSocketStream(socket_stream);
			}

			socket_stream.onclose = function (e: any) {
				console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);

				setTimeout(function () {
					connect(socket_stream);
				}, 100);
			};

			socket_stream.onerror = function (err: any) {
				console.error('Socket encountered error: ', err.message, 'Closing socket');
				socket_stream.close();
			};
		};

		local_socket_stream.close();
		connect(local_socket_stream);
	}, [user.id]);

	/**
	 * show the transcription box,
	 * get the live call info if the last note is live call.
	 */
	useEffect(() => {
		if (loading || error) return;
		if (customerThread.customer && Object.keys(data).length) {
			const last_date_obj = Object.keys(data)[Object.keys(data).length - 1];
			const last_note_data = Object.keys(data[last_date_obj])[Object.keys(data[last_date_obj]).length - 1];
			const note = data[last_date_obj][last_note_data];

			if (
				rtcStatus.dialStatus === EDialStatus.INBOUND_IN_CALL ||
				rtcStatus.dialStatus === EDialStatus.OUTBOUND_IN_CALL
			) {
				setShowTranscriptionBox(true);
			} else {
				if (note.note_comment === REALTIME_TRANSCRIPTION.CALL_PROGRESS_NOTE_COMMENT && rtcStatus.callSid == '') {
					twiGetCurrentDPCallId(+query.id, note.id).then(dpCalldata => {
						if (dpCalldata.data != undefined && dpCalldata.data.data.dpcall_raw_id != undefined) {
							setDpCallRawId(dpCalldata.data.data.dpcall_raw_id);
							setShowTranscriptionBox(true);

							if (customerThread.customer.name) {
								setCustomerName(customerThread.customer.name);
							}

							if (dpCalldata.data.data.agent_name) {
								setAgentName(dpCalldata.data.data.agent_name);
							}
						}
					});
				} else {
					//if (note.note_type_description === 'Outgoing call' || note.note_type_description === 'Incoming call') {
					setShowTranscriptionBox(false);
				}
			}
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data, loading, error, callMessages, rtcStatus.dialStatus]);

	const addTranscription = async (
		id: string,
		speaker: string,
		is_dpuser: boolean,
		msg: string,
		transcript_type: string
	) => {
		try {
			const transcript = {
				id: id,
				speaker: speaker,
				is_dpuser: is_dpuser,
				text: msg,
				transcript_type: transcript_type,
				datetime: getDateTime(),
			};
			if (transcript_type == REALTIME_TRANSCRIPTION.TRANSCRIPT_TYPE_FULL) {
				// add the full_transcript on transcription data.
				dispatch(addCallTranscript(transcript));
			} else if (transcript_type == REALTIME_TRANSCRIPTION.TRANSCRIPT_TYPE_PARTIAL) {
				// update the lastet partial transcription data.
				dispatch(updatePartialCallTranscript(transcript));
			}
		} catch (error) {
			console.log(error);
			notify({
				type: 'error',
				message: 'Could not add the transcription data.',
			});
		}
	};

	const renderCallText = () => {
		let call = [...callMessages];
		if (callMessages.length > 5) {
			call = callMessages.slice(callMessages.length - 5, callMessages.length);
		}

		return <CallTranscription callMessages={call} />;
	};

	return <div>{showTranscriptionBox && renderCallText()}</div>;
};

export default RealTimeTranscription;
