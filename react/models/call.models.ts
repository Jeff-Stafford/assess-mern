export interface Call {
	showCallingBox: boolean;
	title: string;
	status: boolean;
	isInbound: boolean;
	recording: boolean;
	onHold: boolean;
	muted: boolean;
	keypad: boolean;
	showReconnectCallToCellModal: boolean;
}
