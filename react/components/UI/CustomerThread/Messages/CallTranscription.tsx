import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';

import { useCurrentCustomerThread } from '../../../../hooks/useCurrentCustomerThread';

interface CallTranscriptionProps {
	callMessages: Array<any>;
}

const CallTranscription = ({ callMessages }: CallTranscriptionProps) => {
	const bottomDiv = useRef<HTMLDivElement>();

	const user = useSelector(({ user }) => user);
	const router = useRouter();
	const { customerThread } = useCurrentCustomerThread(+user.id, +router.query.id);

	useEffect(() => {
		bottomDiv.current.scrollIntoView();
	}, [callMessages, bottomDiv]);

	return (
		<div className="p-4 pt-0">
			<div
				style={{ height: 140 }}
				className="flex flex-col bg-dp-blue-light w-full px-3.5 py-2.5 rounded-lg overflow-y-auto relative"
			>
				{callMessages.length === 0 && (
					<div className="absolute inset-0 flex items-center justify-center text-sm">
						<span>Real Time Transcription will appear here.</span>
					</div>
				)}
				<div className="mt-auto"></div>
				<div className="text-xs space-y-2">
					{callMessages.map((message, index) => (
						<p
							className={`${index !== callMessages.length - 1 ? 'opacity-60' : ''} transition duration-300`}
							key={message.id}
						>
							<span className="font-medium">{message.speaker}:</span>
							{message.text}
						</p>
					))}
				</div>
				<div ref={bottomDiv}></div>
			</div>
		</div>
	);
};

export default CallTranscription;
