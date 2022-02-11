import { FC } from 'react';
import { CustomerThreadNote } from '../../../../types/customer-thread';
import { getNoteTimeFormat } from '../../../../utils/helpers/customer-thread';
import LinkIcon from './Icons/LinkIcon';

interface OutgoingTextProps {
	note: CustomerThreadNote;
	createdBy: string;
	position: 'left' | 'right';
}

const OutgoingText: FC<OutgoingTextProps> = ({ children, createdBy, note }) => {
	return (
		<div className="bg-note-outgoing-text w-full max-w-360 p-2.5 rounded-xl">
			<p className="text-note-text-green text-xs mb-0.5">
				Text Message from <span className="font-semibold">{createdBy}</span>
			</p>
			<p>{children}</p>
			{note.note_url && (
				<a
					target="_blank"
					rel="noreferrer"
					href={note.note_url}
					className="inline-flex items-center text-dp-blue-very-dark font-medium space-x-1 underline"
				>
					<span>Link</span>
					<LinkIcon />
				</a>
			)}
			{note.note_image && (
				<div className="mt-1.5">
					<a href={note.note_image} target="_blank" rel="noreferrer">
						<img style={{ maxWidth: '100%' }} src={note.note_image} alt="Image attachment" />
					</a>
				</div>
			)}
			<div className="flex items-end justify-between pt-2 space-x-2">
				<div></div>
				<span className="mt-1.5 text-right text-dp-blue-very-dark text-opacity-50 text-xs">
					{note.datetime ? getNoteTimeFormat(note.datetime) : 'Sending...'}
				</span>
			</div>
		</div>
	);
};

export default OutgoingText;
