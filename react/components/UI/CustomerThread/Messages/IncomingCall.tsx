import { FC, useState } from 'react';
import { CustomerThreadNote } from '../../../../types/customer-thread';
import { getNoteTimeFormat } from '../../../../utils/helpers/customer-thread';
import CallDataModal from '../../CallData/CallDataModal';
import Tooltip from '../../Tooltip/Tooltip';
import CallDetailsIcon from './Icons/CallDetailsIcon';
import IncomingCallIcon from './Icons/IncomingCallIcon';
import LinkIcon from './Icons/LinkIcon';
import { Reactions } from './Reactions';

interface IncomingCallProps {
	note: CustomerThreadNote;
	position: 'left' | 'right';
}

const IncomingCall: FC<IncomingCallProps> = ({ children, note, position }) => {
	const [showModal, setShowModal] = useState(false);
	return (
		<>
			{showModal && (
				<CallDataModal show={showModal} id={note.transaction_reference} onClose={() => setShowModal(false)} />
			)}
			<div className="bg-note-incoming-call w-full max-w-360 p-2.5 rounded-xl">
				<div className="flex justify-between space-x-4 items-center">
					<div className="flex items-center text-note-call-blue">
						<IncomingCallIcon />
						<span className="text-xs ml-1.5">Incoming call</span>
					</div>
					{note.show_details && note.transaction_reference && (
						<button onClick={() => setShowModal(true)} className="focus:outline-none">
							<Tooltip content="Show Call Details">
								<CallDetailsIcon />
							</Tooltip>
						</button>
					)}
				</div>
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
		</>
	);
};

export default IncomingCall;
