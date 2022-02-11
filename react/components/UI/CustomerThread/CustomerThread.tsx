import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Messages } from './Messages';
import MessageBox from './MessageBox';
import CustomerData from './CustomerData';
import { useNotifications } from '../Notifications';
import { sendNoteForCustomer } from '../../../utils/api/customer-thread';
import { useSocket } from '../../SocketContext';
import { EVENTS } from '../../../consts';
import { useCurrentCustomerThread } from '../../../hooks/useCurrentCustomerThread';
import { NoteCreatedEventPayload } from '../../../types/customer-thread';
import { useCustomerThreads } from '../../../hooks/useCustomerThreads';
import RealTimeTranscription from './RealTimeTranscription';

export default function CustomerThread() {
	const router = useRouter();
	const socket = useSocket();
	const { notify } = useNotifications();
	const bottomDiv = useRef<HTMLInputElement>();

	const user = useSelector(({ user }) => user);
	const {
		customerThread,
		loading,
		addNoteToCustomerThread,
		removeNoteFromCustomerThread,
		reactionHandler,
	} = useCurrentCustomerThread(+user.id, +router.query.id);
	const { markAsRead, loading: loadingCustomerThreads } = useCustomerThreads(user.id);

	useEffect(() => {
		if (!loadingCustomerThreads) {
			markAsRead(+router.query.id);
		}
	}, [router.query.id, markAsRead, loadingCustomerThreads]);

	useEffect(() => {
		if (!loading) {
			bottomDiv.current?.scrollIntoView();
		}
	}, [loading, bottomDiv, router.query.id]);

	const sendNote = async (note: string) => {
		try {
			const { data } = await sendNoteForCustomer(+customerThread.customer.id, note);
			addNoteToCustomerThread({
				...data,
				user_id: user.id,
				user_name_first: user.name_first,
				user_name_last: user.name_last,
				user_avatar: user.avatar,
			});
		} catch (error) {
			notify({
				type: 'error',
				message: 'Could not add the note.',
			});
		}
	};

	useEffect(() => {
		const noteHandler = (note: NoteCreatedEventPayload) => {
			if (note.customer_id === +router.query.id) {
				addNoteToCustomerThread(
					{
						id: note.id,
						note_comment: note.note_comment,
						note_datetime: note.datetime,
						note_type_description: note.note_type,
						note_file: note.note_file,
						note_url: note.note_url,
						user_id: note.user.id,
						user_name_first: note.user.name_first,
						user_name_last: note.user.name_last,
						user_avatar: note.user.avatar,
					},
					() => bottomDiv.current?.scrollIntoView()
				);
			}
		};

		socket.on(EVENTS.NOTE_CREATED, noteHandler);
		socket.on(EVENTS.REACTION, reactionHandler);

		return () => {
			socket.off(EVENTS.NOTE_CREATED, noteHandler);
			socket.off(EVENTS.REACTION, reactionHandler);
		};
	}, [bottomDiv, socket, addNoteToCustomerThread, router.query.id, reactionHandler]);

	useEffect(() => {
		const handler = note => {
			removeNoteFromCustomerThread(note.id);
		};
		socket.on(EVENTS.NOTE_DELETED, handler);
		return () => socket.off(EVENTS.NOTE_DELETED, handler);
	});

	return (
		<div className={`${loading ? 'justify-end' : 'justify-between'} flex-1 bg-white flex flex-col shadow-md relative`}>
			<CustomerData />
			<Messages bottomDiv={bottomDiv} />
			<RealTimeTranscription />
		</div>
	);
}
