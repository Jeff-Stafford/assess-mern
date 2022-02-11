import { FC } from 'react';
import { CustomerThreadNote } from '../../../../types/customer-thread';
import { getNoteTimeFormat } from '../../../../utils/helpers/customer-thread';
import LinkIcon from './Icons/LinkIcon';
import { Reactions } from './Reactions';

interface CRMUpdateProps {
	note: CustomerThreadNote;
	position: 'left' | 'right';
}

const CRMUpdate: FC<CRMUpdateProps> = ({ children, note, position }) => {
	return (
		<div className="bg-note-crm-update w-full max-w-360 p-2.5 rounded-xl">
			<p className="text-dp-gray-very-dark text-xs mb-0.5">CRM Update</p>
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
			<div className="flex items-end justify-between pt-2 space-x-2">
				<Reactions noteID={note.id} reactions={note.reactions} position={position} />
				<span className="mt-1.5 text-right text-dp-blue-very-dark text-opacity-50 text-xs">
					{note.datetime ? getNoteTimeFormat(note.datetime) : 'Sending...'}
				</span>
			</div>
		</div>
	);
};

export default CRMUpdate;
