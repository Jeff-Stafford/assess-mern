import { useCallback, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import { groupBy } from 'lodash';
import { SWRFetcher } from '../utils/http-client';
import { subscribeToCustomer as subscribeToCustomerService } from '../utils/api/contacts';
import {
	CustomerThreadNote,
	CustomerThreadPayload,
	NewNoteAddedData,
	NewReaction,
	ReactionAction,
} from '../types/customer-thread';
import { getDateTime } from '../utils/helpers/datetime';

interface NoteUserData {
	user_id: number;
	user_name_first: string;
	user_name_last: string;
	user_avatar: string | null;
}

interface useCurrentCustomerThreadResponse {
	subscribeToCustomer: () => Promise<boolean>;
	addNoteToCustomerThread: (note: NewNoteAddedData & NoteUserData, callback?: () => void) => void;
	removeNoteFromCustomerThread: (noteId: number) => void;
	reactionHandler: (reaction: NewReaction) => void;
	refreshData: () => Promise<void>;
	customerThread: CustomerThreadPayload;
	loading: boolean;
	error: any;
}

export const useCurrentCustomerThread = (userId: number, customerId: number): useCurrentCustomerThreadResponse => {
	const key = userId && customerId ? `/users/${userId}/customer-threads/${customerId}` : null;
	const { data: res = {} as Unwrapped, error } = useSWR(key, unwrap(SWRFetcher), { errorRetryCount: 1 });
	const { customer, data } = res;

	const refreshData = () => {
		return mutate(key);
	};

	const subscribeToCustomer = useCallback(async () => {
		try {
			const { status } = await subscribeToCustomerService(userId, customerId);
			return status === 200;
		} catch (error) {}
	}, [userId, customerId]);

	const addNoteToCustomerThread = async (note: NewNoteAddedData & NoteUserData, callback?: () => void) => {
		const fullNote = {
			id: note.id,
			datetime: note.note_datetime,
			note_comment: note.note_comment,
			note_file: note.note_file,
			note_url: note.note_url,
			note_type_description: note.note_type_description || 'Note',
			user_id: note.user_id,
			user_name_first: note.user_name_first,
			user_name_last: note.user_name_last,
			user_avatar: note.user_avatar,
		};

		const existing = data.find(({ id }) => id === note.id);

		const updated = existing
			? data.map(existingNote => (existingNote.id === note.id ? fullNote : existingNote))
			: [...data, fullNote];

		await mutate(
			key,
			{
				customer: customer,
				data: updated,
			},
			false
		);

		callback && callback();
	};

	const removeNoteFromCustomerThread = (noteID: number) =>
		mutate(key, { customer, data: data.filter(({ id }) => id !== noteID) }, false);

	const reactionHandler = useCallback(
		(reaction: NewReaction) => {
			if (!data || customerId !== reaction.thread_id) return;

			mutate(
				key,
				{
					customer,
					data: data.map(note => (note.id !== reaction.note_id ? note : modifyReaction(note, reaction))),
				},
				false
			);
		},
		[customerId, customer, data, key]
	);

	const customerThread = useMemo(
		() => ({
			customer,
			data: groupNotesByDate(data),
		}),
		[customer, data]
	);

	return {
		subscribeToCustomer,
		addNoteToCustomerThread,
		removeNoteFromCustomerThread,
		refreshData,
		reactionHandler,
		customerThread,
		loading: !error && !data,
		error,
	};
};

/**
 * Remove unwrap function when data payload changes
 */
interface Unwrapped {
	customer: CustomerThreadPayload['customer'];
	data: CustomerThreadNote[];
}
const unwrap = (fetcher: (url: string) => Promise<CustomerThreadPayload>) => async (url: string) =>
	await fetcher(url).then(
		({ data, customer }: CustomerThreadPayload): Unwrapped => ({
			customer,
			data: Array.isArray(data) ? data : Object.values(data).flat(),
		})
	);

/**
 * Takes list of notes and groups them by the local date
 */
const groupNotesByDate = (notes: CustomerThreadNote[]) =>
	groupBy(notes, ({ datetime }) => getDateTime(datetime).toFormat('y-LL-dd'));

/**
 * Adds, removes or edits the reaction based on the received action type
 */
const modifyReaction = (note: CustomerThreadNote, reaction: NewReaction): CustomerThreadNote => {
	const { user_id, reaction_id, type } = reaction;
	const update = { user_id, reaction_id };
	const { reactions = [], ...rest } = note;

	switch (type) {
		case ReactionAction.Create:
			return { ...rest, reactions: [...reactions, update] };

		case ReactionAction.Delete:
			return { ...rest, reactions: reactions.filter(currentReaction => currentReaction.user_id !== user_id) };

		case ReactionAction.Update:
			return {
				...rest,
				reactions: reactions.map(currentReaction => (currentReaction.user_id === user_id ? update : currentReaction)),
			};

		default:
			return note;
	}
};
