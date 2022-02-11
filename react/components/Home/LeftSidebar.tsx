import { useState } from 'react';

import CallBox from '../UI/Call/CallBox';
import ReconnectCallToCell from '../UI/Call/ReconnectCallToCell';
import MakeCall from '../UI/Call/MakeCall';
import CustomerThreads from '../UI/CustomerThreads/CustomerThreads';
import { useSelector } from 'react-redux';
import { IRTCStatus } from '../../models';
import { EDialStatus } from '../../enums';
import IncomingCall from '../UI/IncomingCall/IncomingCall';

export default function LeftSidebar() {
	const [makeCallDisabled] = useState(false);
	const rtcStatus: IRTCStatus = useSelector(state => state.rtcStatus);

	return (
		<div className="px-3.5 pt-2.5 relative">
			<div className="flex flex-col justify-between h-full w-320">
				<div className="flex flex-col flex-1 space-y-3">
					<CustomerThreads />
				</div>
				<div className="flex flex-col py-3.5 flex-shrink-0">
					<IncomingCall />
					<ReconnectCallToCell />
					{(rtcStatus.dialStatus === EDialStatus.INBOUND_IN_CALL ||
						rtcStatus.dialStatus === EDialStatus.OUTBOUND_RING ||
						rtcStatus.dialStatus === EDialStatus.OUTBOUND_IN_CALL ||
						rtcStatus.dialStatus === EDialStatus.OUTBOUND_RINGING) && <CallBox />}
					{rtcStatus.dialStatus !== EDialStatus.OUTBOUND_IN_CALL &&
						rtcStatus.dialStatus !== EDialStatus.INBOUND_RING &&
						rtcStatus.dialStatus !== EDialStatus.INBOUND_IN_CALL &&
						rtcStatus.dialStatus !== EDialStatus.OUTBOUND_RINGING && <MakeCall disabled={makeCallDisabled} />}
				</div>
			</div>
		</div>
	);
}
