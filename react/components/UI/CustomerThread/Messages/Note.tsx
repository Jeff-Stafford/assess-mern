import { FC } from 'react';
import { CustomerThreadNote } from '../../../../types/customer-thread';
import { getNoteTimeFormat } from '../../../../utils/helpers/customer-thread';
import LinkIcon from './Icons/LinkIcon';
import { Reactions } from './Reactions';

interface NoteProps {
	createdBy?: string;
	position: 'left' | 'right';
	note: CustomerThreadNote;
}

export const Note: FC<NoteProps> = ({ createdBy, position, note }) => {
	const { id, note_comment, datetime, reactions, note_url } = note;

	return (
		<div
			className={`${
				datetime === null ? 'opacity-50' : 'opacity-100'
			} transition bg-note-note w-full max-w-360 p-2.5 rounded-xl`}
		>
			<p className="text-dp-gray-very-dark text-xs mb-0.5">
				Note by <span className="font-semibold">{createdBy}</span>
			</p>
			<p>{note_comment}</p>
			{note_url && (
				<a
					target="_blank"
					rel="noreferrer"
					href={note_url}
					className="inline-flex items-center space-x-1 font-medium underline text-dp-blue-very-dark"
				>
					<span>Link</span>
					<LinkIcon />
				</a>
			)}
			<div className="flex items-end justify-between pt-2 space-x-2">
				<Reactions noteID={id} reactions={reactions} position={position} />

				<span className="mt-1.5 text-right text-dp-blue-very-dark text-opacity-50 text-xs">
					{datetime ? getNoteTimeFormat(datetime) : 'Sending...'}
				</span>
			</div>
		</div>
	);
};
