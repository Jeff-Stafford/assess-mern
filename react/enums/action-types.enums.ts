/**
 * App basic action types
 */
export enum EBasicActionTypes {
	INIT_STORE = 'A_ON_INIT',
}

/**
 * Web RtC status action types
 */
export enum ERTCStatusActionTypes {
	SET_IRTC_Status = 'A_SET_IRTC_STATUS',
	SET_RTC_STATUS = 'A_SET_RTC_STATUS',
	SET_MUTE = 'A_SET_MUTE',
	SET_DEVICE = 'A_SET_DEVICE',
	SET_CONNECTION = 'A_SET_CONNECTION',
	SET_INBOUND_STATUS = 'A_SET_INBOUND_STATUS',
	SET_OUTBOUND_STATUS = 'A_SET_OUTBOUND_STATUS',
	SET_CALL_SID = 'SET_CALL_SID',
}

/**
 * User status action types
 */
export enum UserActionTypes {
	SET_USER = 'A_SET_USER',
}
