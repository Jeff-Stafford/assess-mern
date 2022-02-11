export const LOCAL_STORAGE_KEY = {
	JWT_TOKEN: 'token',
	TWI_TOKEN: 'twi_token',
	USER: 'user',
};

export const EVENTS = {
	NOTE_CREATED: 'note-created',
	NOTE_UPDATED: 'note-updated',
	NOTE_DELETED: 'note-deleted',
	USER_AVAILABILITY_CHANGED: 'user-availability-changed',
	USER_STATUS_DISPLAY_CHANGED: 'user-status-display-changed',
	REACTION: 'emoji-reaction',
};

export const WEB_SOCKET = {
	ALERT_DISCONNECT_COUNT: 3,
};

export const FORWARDER_STATUS = {
	RINGING: 'forwarder_ringing',
	CONNECTED: 'forwarder_connected',
	DISCONNECTED: 'forwarder_disconnected',
};
