import { EDialStatus, EDialEvent } from '../enums';

export interface IRTCStatus {
	twilioDevice?: any;
	onMuted?: boolean;
	onHold?: boolean;
	onRecord?: boolean;
	onForward?: boolean;
	onDTMF?: boolean;
	selectedDTMF?: string;
	twilioConn?: any;
	dialStatus?: EDialStatus;
	phoneNumber?: string;
	identity?: string;
	selectedCustomer?: any;
	duration?: string;
	startedAt?: any;
	dialEvent?: EDialEvent;
	onEnterNumber?: boolean;
	onTypeNote?: boolean;
	isSocketConnected?: boolean;
	socketDisConnectCount?: any;
	apiCalling?: boolean;
	apiNote?: string;
	callSid?: string;
	onConference?: boolean;
	forwarder?: any;
}
