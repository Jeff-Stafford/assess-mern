import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { formatPhoneNumber } from '../../../utils/helpers/formatPhoneNumber';
import parsePhoneNumber from 'libphonenumber-js';

import CallButton from './CustomerData/CallButton';
import SMSButton from './CustomerData/SMSButton';
import SMSModal from './CustomerData/SMSModal';
import ProgressModal from '../ProgressModal';

import { setIRTCStatus } from '../../../store/actions/rtc-status.actions';
import { EDialEvent, EDialStatus } from '../../../enums';
import { IRTCStatus } from '../../../models';
import { getDateTime } from '../../../utils/helpers/datetime';
import Portal from '../../Portal/Portal';
import { useCurrentCustomerThread } from '../../../hooks/useCurrentCustomerThread';
import { useRouter } from 'next/router';
import CustomerDataSkeleton from '../Skeleton/CustomerDataSkeleton';
import UpdateContactName from '../Contacts/UpdateContactName';
import { useNotifications } from '../Notifications';
import useXConnect from '../../../hooks/useXConnect';

export default function CustomerData() {
	const dispatch = useDispatch();
	const rtcStatus: IRTCStatus = useSelector(state => state.rtcStatus);
	const [modalVisible, setModalVisible] = useState<boolean>(false);
	const user = useSelector(({ user }) => user);
	const router = useRouter();
	const { customerThread, loading, error } = useCurrentCustomerThread(+user.id, +router.query.id);
	const [showEditContactModal, setShowEditContactModal] = useState(false);
	const { notify } = useNotifications();

	const { data: XConnectData, error: XConnectError, loading: XConnectLoading } = useXConnect(+router.query.id);

	const callCustomer = () => {
		if (customer) {
			const number = parsePhoneNumber(customer.number);
			dispatch(
				setIRTCStatus({
					phoneNumber: number.nationalNumber.toString(),
					dialStatus: EDialStatus.OUTBOUND_RING,
					dialEvent: EDialEvent.E_CALL,
					startedAt: getDateTime(),
				})
			);
		}
	};

	useEffect(() => {
		if (error) {
			notify({
				type: 'error',
				message: 'This customer record is unavailable.',
			});
		}
	}, [error, notify]);

	if (loading || error) {
		return <CustomerDataSkeleton />;
	}

	const { customer } = customerThread;

	return (
		<>
			{!loading && !error && customerThread && (
				<Portal>
					<UpdateContactName
						customerId={customer.id}
						show={showEditContactModal}
						onClose={() => setShowEditContactModal(false)}
						phoneNumber={customer.number}
						customerName={customer.name}
					/>
				</Portal>
			)}
			<div className="flex items-center justify-between h-16 px-3.5 border-b border-dp-gray">
				<div className="flex items-center">
					<div className="flex flex-col">
						<button
							onClick={() => setShowEditContactModal(true)}
							className="text-dp-blue-very-dark font-semibold leading-tight block hover:underline focus:outline-none text-left"
						>
							{customer.name}
						</button>
						<span className="text-dp-gray-very-dark text-sm block">{formatPhoneNumber(customer.number)}</span>
						{!customer.name && (
							<button
								onClick={() => setShowEditContactModal(true)}
								className="text-sm text-dp-blue-dark text-left focus:outline-none hover:underline"
							>
								Add name
							</button>
						)}
					</div>
					{!XConnectLoading && !XConnectError && (
						<div className="ml-5">
							{XConnectData.map(el => (
								<div key={el.id}>
									<a href={el.connect_link} target="_blank" rel="noreferrer">
										<img
											src={el.xconnect.display_image}
											alt={el.xconnect.platform_name}
											className="h-8 transform hover:scale-110 transition"
										/>
									</a>
								</div>
							))}
						</div>
					)}
				</div>
				<div className="flex space-x-1">
					<CallButton
						onClick={callCustomer}
						available={
							rtcStatus.dialStatus !== EDialStatus.OUTBOUND_IN_CALL &&
							rtcStatus.dialStatus !== EDialStatus.OUTBOUND_RINGING &&
							rtcStatus.dialStatus !== EDialStatus.INBOUND_IN_CALL
						}
					/>
					{customer.textable && (
						<SMSButton
							onClick={() => setModalVisible(true)}
							available={
								rtcStatus.dialStatus !== EDialStatus.OUTBOUND_IN_CALL &&
								rtcStatus.dialStatus !== EDialStatus.OUTBOUND_RINGING &&
								rtcStatus.dialStatus !== EDialStatus.INBOUND_IN_CALL
							}
						/>
					)}
				</div>
				<Portal>
					{customer.textable && <SMSModal show={modalVisible} onClose={() => setModalVisible(false)}></SMSModal>}
					<ProgressModal show={rtcStatus.apiCalling} content={rtcStatus.apiNote}></ProgressModal>
				</Portal>
			</div>
		</>
	);
}
