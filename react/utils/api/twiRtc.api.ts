import { twiHttpClient } from '../http-client';

export const TwiRtcAPI = (function () {
	const endpoint_get_v1_app_values_roles = async () => {
		return twiHttpClient.post('/hook/generate_token');
	};

	const transfer_call = async (
		outbound_number: string,
		forward_number: string,
		direction: number,
		identity: string
	) => {
		return twiHttpClient.post('/transfer_call', {
			outbound_number: outbound_number,
			forward_number: forward_number,
			direction: direction,
			identity,
		});
	};

	const switch_call_to_cell = async (direction: number, identity: string) => {
		return twiHttpClient.post('/switch_call_to_cell', {
			direction: direction,
			identity,
		});
	};

	const hold_call = async (onHold: boolean, outbound_number: string, direction: number, identity: string) => {
		return twiHttpClient.post('/hold_call', {
			onHold: onHold,
			outbound_number: outbound_number,
			direction: direction,
			identity,
		});
	};

	const remove_owner = async (outbound_number: string, identity: string) => {
		return twiHttpClient.post('/remove_owner', {
			outbound_number: outbound_number,
			identity,
		});
	};

	const remove_forwarder = async (outbound_number: string, identity: string) => {
		return twiHttpClient.post('/remove_forwarder', {
			outbound_number: outbound_number,
			identity,
		});
	};

	const call_record = async (onRecord: boolean, outbound_number: string, direction: number, identity: string) => {
		return twiHttpClient.post('/call_record', {
			onRecord: onRecord,
			outbound_number: outbound_number,
			direction: direction,
			identity,
		});
	};

	const forward_hunt = async (outbound_number: string, id: number, direction: number, identity: string) => {
		return twiHttpClient.post('/transfer_hunt', {
			outbound_number,
			direction,
			identity,
			forward_hunt: id,
		});
	};

	const send_sms = async (message_body: string, to_number: string, attachment: string) => {
		return twiHttpClient.post('/sms/send', {
			message_body,
			to_number,
			attachment,
		});
	};

	const uploadAttachment = async (file: File) => {
		const formData = new FormData();
		formData.append('file', file);

		return twiHttpClient.put('/sms/upload', formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		});
	};

	const leave_voicemail = async (identity: string) => {
		return twiHttpClient.post('/transfer/voicemail', {
			identity,
		});
	};

	return {
		endpoint_get_v1_app_values_roles,
		transfer_call,
		hold_call,
		call_record,
		switch_call_to_cell,
		forward_hunt,
		send_sms,
		leave_voicemail,
		remove_owner,
		remove_forwarder,
		uploadAttachment,
	};
})();
