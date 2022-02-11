import { Fragment, useEffect, useState } from 'react';
import useCallData from '../../../hooks/useCallData';
import { getDateTime } from '../../../utils/helpers/datetime';
import { formatCallDuration } from '../../../utils/helpers/formatCallDuration';
import { formatPhoneNumber } from '../../../utils/helpers/formatPhoneNumber';
import Modal from '../../Portal/Modal';
import CloseButton from '../MyVoicemail/Buttons/CloseButton';
import CallRecording from './CallRecording';
import IncomingCallIcon from './Icons/IncomingCall';
import OutgoingCallIcon from './Icons/OutgoingCall';
import RecordingsIcon from './Icons/Recordings';
import TranscriptionIcon from './Icons/TranscriptionIcon';
import Separator from './Separator';

interface CallDataModalProps {
	show?: boolean;
	onClose?: () => void;
	id: number;
}

const CallDataModal = ({ show, onClose, id }: CallDataModalProps) => {
	const { data, loading, error } = useCallData(id.toString());
	const [display_users, SetDisplayUsers] = useState([]);

	useEffect(() => {
		if (data?.users) {
			SetDisplayUsers(data.users.filter((user, index, self) => index === self.findIndex(t => t.id === user.id)));
		}
	}, [data]);

	return (
		<Modal show={show} onClose={onClose}>
			<div className="max-h-modal w-600 min-h bg-white z-50 overflow-y-auto rounded-lg overflow-x-hidden p-4">
				{loading && (
					<div className="h-48 flex items-center justify-center">
						<div className="loading-screen-ring blue">
							<div></div>
							<div></div>
							<div></div>
							<div></div>
						</div>
					</div>
				)}
				{error && (
					<p className="text-center">
						There has been an error fetching the call details. Please try again later, or contact Tone Support.
					</p>
				)}
				{!error && !loading && (
					<div className="text-left">
						<div className="flex items-center justify-between">
							<div className="flex flex-col justify-center ml-2">
								<span className="text-sm font-semibold">{data.customer.customer_name}</span>
								<span className="text-sm text-dp-gray-very-dark">
									{formatPhoneNumber(data.customer.customer_number)}
								</span>
							</div>
							<div className="flex items-center justify-end">
								<CloseButton onClick={onClose} />
							</div>
						</div>
						<Separator />
						<div className="flex">
							<div className="mx-3">
								{data.call.call_type === 'Incoming' ? <IncomingCallIcon /> : <OutgoingCallIcon />}
							</div>
							<div>
								<p className="font-semibold text-sm mb-3">
									{`${data.call.call_type} call `}
									{data.call.call_result.toLowerCase()}
								</p>
								<p className="text-sm">
									{getDateTime(data.call.start_datetime).toFormat('ff')} •{' '}
									{data.call.call_result === 'Answered' && (
										<span>{formatCallDuration(data.call.call_duration_seconds)}</span>
									)}
								</p>
								{display_users.length > 0 && (
									<p className="text-sm mt-1 text-dp-gray-very-dark">
										{display_users.map((user, index, array) => (
											<span key={index}>
												{`${user.name_first} ${user.name_last}`}
												{index !== array.length - 1 && ', '}
											</span>
										))}
									</p>
								)}
							</div>
						</div>
						{data.transcriptions.length > 0 && (
							<>
								<Separator />
								<div className="flex">
									<div className="mx-3">
										<TranscriptionIcon />
									</div>
									<div>
										<p className="font-semibold text-sm mb-1">Transcription</p>
									</div>
								</div>
								<div className="text-sm mt-3 space-y-3 mx-3">
									{data.transcriptions.map(({ transcription_data }, index) => (
										<Fragment key={index}>
											{Array.isArray(JSON.parse(transcription_data)) &&
												JSON.parse(transcription_data).map((element: string, index: number) => (
													<p key={index}>{element}</p>
												))}
										</Fragment>
									))}
								</div>
							</>
						)}
						{data.recordings.length > 0 && (
							<>
								<Separator />
								<div className="flex">
									<div className="mx-3">
										<RecordingsIcon />
									</div>
									<div>
										<p className="font-semibold text-sm mb-1">Recordings</p>
									</div>
								</div>
								<div className="mt-2 space-y-2">
									{data.recordings.map((recording, index) => (
										<CallRecording key={index} recording_file={recording.recording_file} />
									))}
								</div>
							</>
						)}
					</div>
				)}
			</div>
		</Modal>
	);
};

export default CallDataModal;
