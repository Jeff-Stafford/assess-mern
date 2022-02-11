import { FC, MutableRefObject } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';

import { Note } from './Messages/Note';
import DateSeparator from './Messages/DateSeparator';
import IncomingCall from './Messages/IncomingCall';
import MessageBlock from './Messages/MessageBlock';
import OutgoingCall from './Messages/OutgoingCall';
import generateInitials from '../../../utils/helpers/generateInitials';
import CRMUpdate from './Messages/CRMUpdate';
import IncomingText from './Messages/IncomingText';
import OutgoingText from './Messages/OutgoingText';
import { useCurrentCustomerThread } from '../../../hooks/useCurrentCustomerThread';

interface MessagesProps {
	bottomDiv: MutableRefObject<HTMLInputElement>;
}

export const Messages: FC<MessagesProps> = ({ bottomDiv }) => {
	const router = useRouter();
	const user = useSelector(({ user }) => user);
	const { customerThread, loading, error } = useCurrentCustomerThread(+user.id, +router.query.id);
	const { data } = customerThread;

	if (error || loading) {
		return <div className="flex-1"></div>;
	}

	const calculateNotePosition = (type: string) => {
		if (
			type === 'Note' ||
			type === 'Outgoing call' ||
			type === 'Outgoing call in progress' ||
			type === 'CRM update' ||
			type === 'Outgoing text'
		) {
			return 'right';
		}

		return 'left';
	};

	const getUserFullName = (note): string => {
		return `${note.user_name_first} ${note.user_name_last}`;
	};

	return (
		<div className="relative flex-1">
			<div className="absolute top-0 left-0 w-full h-full">
				<div className="h-full max-h-full p-6 mb-2 space-y-3.5 overflow-y-auto">
					<div className="mt-auto"></div>
					{Object.keys(data).map((date, index) => (
						<div className="space-y-3.5" key={index}>
							<DateSeparator title={date} />
							{data[date].map((note, index) => (
								<MessageBlock
									key={index}
									position={calculateNotePosition(note.note_type_description)}
									avatar={note.user_avatar}
									initials={generateInitials(getUserFullName(note))}
								>
									{note.note_type_description === 'Note' && (
										<Note
											position={calculateNotePosition(note.note_type_description)}
											createdBy={getUserFullName(note)}
											note={note}
										/>
									)}
									{(note.note_type_description === 'Outgoing call' ||
										note.note_type_description === 'Outgoing call in progress') && (
										<OutgoingCall position={calculateNotePosition(note.note_type_description)} note={note}>
											{note.note_comment}
										</OutgoingCall>
									)}
									{(note.note_type_description === 'Incoming call' ||
										note.note_type_description === 'Incoming call in progress') && (
										<IncomingCall note={note} position={calculateNotePosition(note.note_type_description)}>
											{note.note_comment}
										</IncomingCall>
									)}
									{note.note_type_description === 'CRM update' && (
										<CRMUpdate note={note} position={calculateNotePosition(note.note_type_description)}>
											{note.note_comment}
										</CRMUpdate>
									)}
									{note.note_type_description === 'Incoming text' && (
										<IncomingText
											note={note}
											createdBy={getUserFullName(note)}
											position={calculateNotePosition(note.note_type_description)}
										>
											{note.note_comment}
										</IncomingText>
									)}
									{note.note_type_description === 'Outgoing text' && (
										<OutgoingText
											note={note}
											createdBy={getUserFullName(note)}
											position={calculateNotePosition(note.note_type_description)}
										>
											{note.note_comment}
										</OutgoingText>
									)}
								</MessageBlock>
							))}
						</div>
					))}
					<div ref={bottomDiv} className="bottom-element"></div>
				</div>
			</div>
		</div>
	);
};
