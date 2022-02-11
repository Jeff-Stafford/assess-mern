import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { w3cwebsocket as W3CWebSocket } from 'websocket';

import Head from 'next/head';
import LeftSidebar from '../../components/Home/LeftSidebar';
import RightSidebar from '../../components/Home/RightSidebar';
import CustomerThread from '../../components/UI/CustomerThread/CustomerThread';
import PageWrap from '../../components/UI/Layouts/PageWrap';
import Navbar from '../../components/UI/Navbar';

import { useCurrentCustomerThread } from '../../hooks/useCurrentCustomerThread';
import { formatPhoneNumber } from '../../utils/helpers/formatPhoneNumber';
import { socket_stream } from '../../utils/socket';
import { REALTIME_TRANSCRIPTION, CALL_PREFIX_DPUSER, FORWARDER_STATUS } from '../../consts';
import { getDateTime } from '../../utils/helpers/datetime';
import { addCallTranscript, updatePartialCallTranscript } from '../../store/actions/customer-thread';
import { useNotifications } from '../../components/UI/Notifications';
import { IRTCStatus } from '../../models';
import { setIRTCStatus } from '../../store/actions/rtc-status.actions';

export default function CustomerThreadPage() {
	const user = useSelector(({ user }) => user);
	const router = useRouter();
	const { customerThread, loading, error } = useCurrentCustomerThread(+user.id, +router.query.id);
	const rtcStatus: IRTCStatus = useSelector(state => state.rtcStatus);

	const dispatch = useDispatch();
	const { notify } = useNotifications();

	const getPageTitle = useMemo(() => {
		if (loading || error) return 'Tone';
		return customerThread.customer.name || formatPhoneNumber(customerThread.customer.number);
	}, [loading, error, customerThread]);

	let customer_name = 'Contact';
	let agent_name = 'Agent';

	useEffect(() => {
		// clairfy the customer_name and user_name
		if (customerThread.customer && customerThread.customer.name) {
			customer_name = customerThread.customer.name;
		}
		if (user.name_first) {
			agent_name = user.name_first;
		}
	}, [user.id, customerThread.customer]);

	// // add live transcription to redux store
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

	useEffect(() => {
		const connect = socket_stream => {
			console.log('Socket Stream On Message Connecting => ');
			if (socket_stream.readyState >= 2) {
				socket_stream = new W3CWebSocket(process.env.SOCKET_STREAM_URL);
			}

			socket_stream.onmessage = async message => {
				const data = JSON.parse(message.data);

				// when the transcription data for live call.
				if (data.event === REALTIME_TRANSCRIPTION.CHANNEL_RECEIVED_DPUSER + user.id) {
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

				if (data.event === CALL_PREFIX_DPUSER + user.id && rtcStatus.forwarder && rtcStatus.onConference) {
					console.log(data.event, user.id, rtcStatus);

					dispatch(
						setIRTCStatus({
							forwarder: { ...rtcStatus.forwarder, status: data.data },
							onConference: data.data === FORWARDER_STATUS.DISCONNECTED ? false : true,
						})
					);

					notify({
						type: 'success',
						message:
							data.data === FORWARDER_STATUS.DISCONNECTED
								? rtcStatus.forwarder.name + ' disconnected from the call'
								: rtcStatus.forwarder.name + ' connected',
					});
				}
			};

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

		socket_stream.close();
		connect(socket_stream);
	}, [user.id]);

	return (
		<>
			<Head>
				<title>{getPageTitle}</title>
			</Head>
			<PageWrap>
				<Navbar />
				<div className="flex flex-1 main-content-height">
					<LeftSidebar />
					<CustomerThread />
					<RightSidebar />
				</div>
			</PageWrap>
		</>
	);
}
