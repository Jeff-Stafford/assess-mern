import { NewNoteAddedResponse } from '../../types/customer-thread';
import { httpClient, twiHttpClient } from '../http-client';

export const fetchCustomerThread = async (user_id: number, customer_id: number) =>
	httpClient.get(`/users/${user_id}/customer-threads/${customer_id}`);

export const sendNoteForCustomer = async (customer_id: number, comment: string): Promise<NewNoteAddedResponse> =>
	httpClient.post(`/customers/${customer_id}/notes`, { comment });

export const addReaction = async (customer_id: number, user_id: number, note_id: number, frn_emojiid: number) =>
	httpClient.post(`/users/${user_id}/customer-threads/${customer_id}/notes/${note_id}/emoji-reactions`, {
		frn_emojiid,
	});

export const twiSaveLiveTranscription = async (transcriptions: any, call_sid: string) => {
	console.log('transcriptions, call_sid', transcriptions, call_sid);

	return twiHttpClient.post(`/save_transcription`, {
		transcriptions,
		call_sid,
	});
};

export const twiGetCurrentDPCallId = async (dpcustomer_id: number, dpcustomer_note_id: string) => {
	return twiHttpClient.post(`/getDPCallIdFromDPNoteID`, {
		dpcustomer_note_id,
		dpcustomer_id,
	});
};

export const updateReaction = async (
	customer_id: number,
	user_id: number,
	note_id: number,
	reaction_id: number,
	frn_emojiid: number
) =>
	httpClient.patch(
		`/users/${user_id}/customer-threads/${customer_id}/notes/${note_id}/emoji-reactions/${reaction_id}`,
		{
			frn_emojiid,
		}
	);

export const deleteReaction = async (customer_id: number, user_id: number, note_id: number, reaction_id: number) =>
	httpClient.delete(
		`/users/${user_id}/customer-threads/${customer_id}/notes/${note_id}/emoji-reactions/${reaction_id}`
	);
