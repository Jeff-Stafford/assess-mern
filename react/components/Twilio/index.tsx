import { useDispatch, useSelector } from 'react-redux';

import { useEffect, FC, useCallback, useState } from 'react';
import { Device } from 'twilio-client';
import { IRTCStatus, Call, User } from '../../models';
import { EDialStatus, EDialEvent } from '../../enums';
import { LOCAL_STORAGE_KEY, WEB_SOCKET } from '../../consts';
import { setDevice, setConnection, setIRTCStatus, setCallSid } from '../../store/actions/rtc-status.actions';
import { setCallStatus, setCallIsInbound, setShowReconnectCallToCellModal } from '../../store/actions/call';
import { TwiRtcAPI } from '../../utils/api';
import { useNotifications } from '../UI/Notifications';
import { useSocket } from '../SocketContext';
import { Room } from '../../consts';

const qualityErr = ['high-rtt', 'low-mos', 'high-jitter', 'high-packet-loss', 'high-packets-lost-fraction'];

const TwilioApp: FC = () => {
	const rtcStatus: IRTCStatus = useSelector(state => state.rtcStatus);
	const callStatus: Call = useSelector(state => state.call);
	const user: User = useSelector(state => state.user);
	const { notify } = useNotifications();
	const dispatch = useDispatch();
	const socket = useSocket();
	const [isCallLive, setIsCallLive] = useState(false);
	const [shouldRefresh, setShouldRefresh] = useState(false);
	const [curQualityErr, setCurQualityErr] = useState([]);

	let callSid;

	let ActiveStatusSenderInterval: any;

	//Send Device active status using socket
	useEffect(() => {
		console.log('isCallLive => ', isCallLive);
		if (isCallLive == false) {
			ActiveStatusSenderInterval = startActiveStatusSenderInterval(ActiveStatusSenderInterval);
		} else {
			clearInterval(ActiveStatusSenderInterval);
			console.log('clearInterval ActiveStatusSenderInterval => ', ActiveStatusSenderInterval);
		}
	}, [isCallLive]);

	function startActiveStatusSenderInterval(ActiveStatusSenderInterval) {
		if (!ActiveStatusSenderInterval) {
			console.log('start ActiveStatusSenderInterval !');
			ActiveStatusSenderInterval = setInterval(() => {
				if (isCallLive == true) {
					console.log('IsCallLive Now! Can not refresh Tone.');
					return;
				}

				if (socket.connected) {
					if (
						localStorage.getItem(LOCAL_STORAGE_KEY.TWI_TOKEN) !== null &&
						rtcStatus.twilioDevice &&
						rtcStatus.twilioDevice !== null
					) {
						if (!rtcStatus.isSocketConnected) {
							dispatch(
								setIRTCStatus({
									isSocketConnected: true,
									socketDisConnectCount: 0,
								})
							);
						}
						socket.emit(Room.DEVICE_ACTIVE, { identity: rtcStatus.identity, userId: user.id });
					}
				} else {
					//socket disconnected
					const socketDisConnectCount = Number(rtcStatus.socketDisConnectCount) + 1;
					dispatch(
						setIRTCStatus({
							isSocketConnected: false,
							socketDisConnectCount: socketDisConnectCount,
						})
					);

					if (Number(socketDisConnectCount) >= Number(WEB_SOCKET.ALERT_DISCONNECT_COUNT)) {
						// force refresh the page.
						if (
							!rtcStatus.isSocketConnected &&
							rtcStatus.dialStatus == EDialStatus.READY &&
							!rtcStatus.onEnterNumber &&
							!rtcStatus.onTypeNote &&
							localStorage.getItem(LOCAL_STORAGE_KEY.JWT_TOKEN) !== null
						) {
							setTimeout(function () {
								location.reload();
							}, 100);
						}
					}
				}
			}, 1000 * 90);
		}

		return ActiveStatusSenderInterval;
	}

	//unsubscribeEvent when page change.
	const unsubscribeTwilioEventListener = useCallback(() => {
		rtcStatus.twilioDevice.removeListener('ready', () => {});
		rtcStatus.twilioDevice.removeListener('error', () => {});
		rtcStatus.twilioDevice.removeListener('disconnect', () => {});
		rtcStatus.twilioDevice.removeListener('offline', () => {});
		rtcStatus.twilioDevice.removeListener('incoming', () => {});
		rtcStatus.twilioDevice.removeListener('twilioDeviceConnect', () => {});
		rtcStatus.twilioDevice.removeListener('connect', () => {});
		rtcStatus.twilioDevice.removeListener('cancel', () => {});
		rtcStatus.twilioDevice.removeListener('warning', () => {});
		rtcStatus.twilioDevice.removeListener('warning-cleared', () => {});
	}, [rtcStatus.twilioDevice]);

	const numberFormat = (number: string) => {
		return '+1' + number.replace('+1', '');
	};

	// when call live or curErrList updated
	useEffect(() => {
		// if there is the quality issue
		if (curQualityErr.length > 0) {
			if (isCallLive) {
				dispatch(setShowReconnectCallToCellModal(true));
			}
		}
	}, [isCallLive, curQualityErr, dispatch]);

	// update TWilio Device
	useEffect(() => {
		const twiToken = localStorage.getItem(LOCAL_STORAGE_KEY.TWI_TOKEN);

		if (rtcStatus.dialStatus === EDialStatus.SET_TOKEN && twiToken) {
			const options: any = {
				codecPreferences: ['pcmu', 'opus'],
				fakeLocalDTMF: true,
				enableRingingState: true,
				allowIncomingWhileBusy: true,
			};

			const device = new Device();
			device.setup(twiToken, options);
			dispatch(setDevice(device));
			dispatch(setIRTCStatus({ dialStatus: EDialStatus.NEED_EVENT_HANDLER }));
			console.log('device updated');
		}
	}, [dispatch, rtcStatus.dialStatus, callStatus, rtcStatus.twilioDevice]);

	//setup device when token generated
	useEffect(() => {
		// do stuff
		if (rtcStatus.twilioDevice !== null && rtcStatus.dialStatus === EDialStatus.NEED_EVENT_HANDLER) {
			unsubscribeTwilioEventListener();
			//Add event listener

			//ready status
			rtcStatus.twilioDevice.on('ready', key => {
				console.log(key);
				console.log('Ready');
			});

			//error
			rtcStatus.twilioDevice.on('error', async err => {
				console.log(err);
				console.log(callStatus);

				if (isCallLive == false) {
					// refresh the page.
					setTimeout(function () {
						location.reload();
					}, 1000);
				} else {
					setShouldRefresh(true);
				}
			});

			//disconnect
			rtcStatus.twilioDevice.on('disconnect', conn => {
				console.log(conn);
				dispatch(
					setIRTCStatus({
						dialStatus: EDialStatus.READY,
						onMuted: false,
						onHold: false,
						onRecord: false,
						onDTMF: false,
						onForward: false,
						selectedDTMF: '',
						phoneNumber: '',
						duration: '',
						onConference: false,
					})
				);
				dispatch(setCallStatus(false));
				setIsCallLive(false);

				if (shouldRefresh) {
					// refresh the page.
					setTimeout(function () {
						location.reload();
					}, 1000);
				}
			});

			// connected.
			rtcStatus.twilioDevice.on('connect', conn => {
				console.log(conn);
				callSid = conn.parameters.CallSid;

				let fromNumber = null;
				if (conn.parameters.From) {
					fromNumber = numberFormat(conn.parameters.From);
				}
				if (user.number.number_did !== fromNumber && fromNumber) {
					// update the call.isInbound = true
					dispatch(setCallIsInbound(true));
				} else {
					// update the call.isInbound = false
					dispatch(setCallIsInbound(false));
				}
				dispatch(setCallSid(callSid));

				// update call.status.
				dispatch(setCallStatus(true));
				setIsCallLive(true);
			});

			/**
			 * offline
			 * regenerate the webRTC token when the token was expired.
			 */
			rtcStatus.twilioDevice.on('offline', device => {
				if (isCallLive == false) {
					// refresh the page.
					setTimeout(function () {
						location.reload();
					}, 1000);
				} else {
					setShouldRefresh(true);
				}
			});

			/**
			 * incoming
			 * handle the inbound calls from the customer number.
			 */
			rtcStatus.twilioDevice.on('incoming', conn => {
				let phoneNumber = numberFormat(conn.parameters.From);
				// check if the connection has the custom Params info.
				// ex: Params: "customer_number=+12016133156"
				let onConference = false;
				if (conn.parameters.Params) {
					const custom_params = conn.parameters.Params;
					const customer_number = numberFormat(custom_params.replace('customer_number=', ''));
					if (customer_number.length == 12) {
						phoneNumber = customer_number;
						onConference = true;
					}
				}

				dispatch(
					setIRTCStatus({
						phoneNumber: phoneNumber,
						dialStatus: EDialStatus.INBOUND_RING,
						onConference: onConference,
					})
				);
				//set connection to handle accept trigger.
				dispatch(setConnection(conn));
				console.log('INCOMING');
			});

			//twilioDeviceConnect
			rtcStatus.twilioDevice.on('twilioDeviceConnect', conn => {
				console.log(conn);
				console.log('Device Connect');
			});

			/**
			 * Cancel
			 * handle the inbound call when the call was cancelled from the customer side.
			 */
			rtcStatus.twilioDevice.on('cancel', conn => {
				console.log(conn);
				console.log('Cancel');

				dispatch(
					setIRTCStatus({
						phoneNumber: numberFormat(conn.parameters.From),
						dialStatus: EDialStatus.INBOUND_END_CALL,
					})
				);
			});

			//disconnect
			rtcStatus.twilioDevice.on('warning', (warningName, warningData) => {
				console.log('warning');
				console.log(warningData);
				console.log(warningName);

				//add to quality error list if the quality is not good
				if (warningName != undefined && qualityErr.includes(warningName)) {
					if (!curQualityErr.includes(warningName)) {
						setCurQualityErr([...curQualityErr, warningName]);
					}
				}
			});

			rtcStatus.twilioDevice.on('warning-cleared', function (warningName) {
				//add to quality error list if the quality is not good

				console.log(warningName);
				if (warningName != undefined && qualityErr.includes(warningName)) {
					if (curQualityErr.includes(warningName)) {
						let arr = curQualityErr;
						arr = arr.filter(e => e !== warningName);
						setCurQualityErr(arr);
					}
				}
			});

			dispatch(setIRTCStatus({ dialStatus: EDialStatus.READY }));
		}
	}, [
		dispatch,
		rtcStatus.twilioDevice,
		rtcStatus.dialStatus,
		rtcStatus.onEnterNumber,
		rtcStatus.onTypeNote,
		callStatus,
		user,
		unsubscribeTwilioEventListener,
		notify,
		isCallLive,
		// socket_stream,
		curQualityErr,
	]);

	//Handling Call
	useEffect(() => {
		// do stuff
		(async () => {
			try {
				let apiNote = '';
				if (rtcStatus.apiCalling === false) {
					switch (rtcStatus.dialEvent) {
						case EDialEvent.E_CALL:
							if (rtcStatus.dialStatus === EDialStatus.OUTBOUND_RING) {
								console.log('call connect');
								const connection = rtcStatus.twilioDevice.connect({
									phoneNumber: numberFormat(rtcStatus.phoneNumber) + '_' + user.id,
								});

								connection.on('accept', connection => {
									dispatch(setIRTCStatus({ dialStatus: EDialStatus.OUTBOUND_IN_CALL }));
								});

								connection.on('cancel', connection => {
									console.log('cancel');
								});

								connection.on('disconnect', () => {
									console.log('The other person hung up.');
								});

								dispatch(setConnection(connection));
								dispatch(setIRTCStatus({ dialStatus: EDialStatus.OUTBOUND_RINGING }));
							}

							console.log(rtcStatus);
							if ([EDialStatus.OUTBOUND_END_CALL, EDialStatus.INBOUND_END_CALL].includes(rtcStatus.dialStatus)) {
								dispatch(
									setIRTCStatus({
										dialStatus: EDialStatus.READY,
										onMuted: false,
										onHold: false,
										onRecord: false,
										onDTMF: false,
										onForward: false,
										selectedDTMF: '',
										phoneNumber: '',
										duration: '',
										onConference: false,
									})
								);
								rtcStatus.twilioDevice.disconnectAll();
								console.log('close the call action');
							}

							break;

						case EDialEvent.E_HOLD:
							if (rtcStatus.twilioConn !== null) {
								apiNote = rtcStatus.onHold === true ? 'Start Holding' : 'Stop Holding';
								if (rtcStatus.dialStatus === EDialStatus.INBOUND_IN_CALL) {
									dispatch(setIRTCStatus({ apiCalling: true, apiNote: apiNote }));
									const direction = rtcStatus.onConference ? 1 : 0;
									await TwiRtcAPI.hold_call(
										rtcStatus.onHold,
										numberFormat(rtcStatus.phoneNumber),
										direction,
										rtcStatus.identity
									);
									dispatch(setIRTCStatus({ apiCalling: false }));
								} else if (rtcStatus.dialStatus === EDialStatus.OUTBOUND_IN_CALL) {
									dispatch(setIRTCStatus({ apiCalling: true, apiNote: apiNote }));
									await TwiRtcAPI.hold_call(
										rtcStatus.onHold,
										numberFormat(rtcStatus.phoneNumber),
										1,
										rtcStatus.identity
									);
									dispatch(setIRTCStatus({ apiCalling: false }));
								} else {
									if (rtcStatus.onHold === true) {
										dispatch(setIRTCStatus({ onHold: false }));
									}
								}
							}

							break;

						case EDialEvent.E_MUTE:
							if (rtcStatus.twilioConn !== null) {
								rtcStatus.twilioConn.mute(rtcStatus.onMuted);
							}
							break;

						case EDialEvent.E_RECORD:
							apiNote = rtcStatus.onRecord === true ? 'Start Recording' : 'Stop Recording';
							if (rtcStatus.twilioConn !== null) {
								if (rtcStatus.dialStatus === EDialStatus.INBOUND_IN_CALL) {
									dispatch(setIRTCStatus({ apiCalling: true, apiNote: apiNote }));
									await TwiRtcAPI.call_record(
										rtcStatus.onRecord,
										numberFormat(rtcStatus.phoneNumber),
										0,
										rtcStatus.identity
									);
									dispatch(setIRTCStatus({ apiCalling: false }));
								} else if (rtcStatus.dialStatus === EDialStatus.OUTBOUND_IN_CALL) {
									dispatch(setIRTCStatus({ apiCalling: true, apiNote: apiNote }));
									await TwiRtcAPI.call_record(
										rtcStatus.onRecord,
										numberFormat(rtcStatus.phoneNumber),
										1,
										rtcStatus.identity
									);
									dispatch(setIRTCStatus({ apiCalling: false }));
								} else {
									if (rtcStatus.onRecord === true) {
										dispatch(setIRTCStatus({ onRecord: false }));
									}
								}
							}
							break;

						case EDialEvent.E_FORWARD:
							if ([EDialStatus.OUTBOUND_END_CALL, EDialStatus.INBOUND_END_CALL].includes(rtcStatus.dialStatus)) {
								dispatch(
									setIRTCStatus({
										dialStatus: EDialStatus.READY,
										onMuted: false,
										onHold: false,
										onRecord: false,
										onDTMF: false,
										onForward: false,
										selectedDTMF: '',
										phoneNumber: '',
										duration: '',
										onConference: false,
									})
								);
								rtcStatus.twilioDevice.disconnectAll();
								console.log('close the call action');
							}

							break;
						default:
							break;
					}
				}

				//set event as ready
				if (rtcStatus.dialEvent !== EDialEvent.E_READY) {
					dispatch(setIRTCStatus({ dialEvent: EDialEvent.E_READY }));
				}
			} catch (error) {
				const message = error.response ? error.response.data.errorMessage : 'Failed!';
				notify({ type: 'error', message });
				dispatch(setIRTCStatus({ apiCalling: false }));
			}
		})();
	}, [dispatch, rtcStatus, callStatus, user.id, notify]);

	// for selected DTMF
	useEffect(() => {
		if (rtcStatus.selectedDTMF !== '') {
			rtcStatus.twilioDevice.activeConnection().sendDigits(rtcStatus.selectedDTMF);

			//reset the selected DTMF
			dispatch(setIRTCStatus({ selectedDTMF: '' }));
		}
	}, [dispatch, rtcStatus.selectedDTMF, rtcStatus]);

	return null;
};

export default TwilioApp;
