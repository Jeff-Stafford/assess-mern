import { FC, useRef, useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import { TwiRtcAPI } from '../../../../utils/api';

import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import parsePhoneNumber from 'libphonenumber-js';

import { useNotifications } from '../../Notifications';
import { useCurrentCustomerThread } from '../../../../hooks/useCurrentCustomerThread';

const transitionClassNames = {
	enter: 'animate__animated',
	enterActive: 'animate__fadeIn',
	exit: 'animate__animated',
	exitActive: 'animate__fadeOut',
};

interface SMSModalProps {
	show?: boolean;
	onClose?: () => void;
}

const SMSModal: FC<SMSModalProps> = ({ show, onClose }) => {
	const router = useRouter();
	const user = useSelector(({ user }) => user);
	const [file, setFile] = useState<File>();
	const { customerThread } = useCurrentCustomerThread(+user.id, +router.query.id);
	const modalRef = useRef<HTMLDivElement>(null);
	const [smsData, setSMSData] = useState<string>('');
	const { notify } = useNotifications();
	const [loading, setLoading] = useState(false);
	const { customer } = customerThread;
	const handleClose = () => {
		if (onClose !== undefined) {
			onClose();
		}
	};

	const handleSendSMS = async () => {
		if (!smsData) {
			return null;
		}
		setLoading(true);

		try {
			let attachmentURL = '';
			if (file) {
				const result: any = await TwiRtcAPI.uploadAttachment(file);
				attachmentURL = result.data?.url;
			}
			const number = parsePhoneNumber(customer.number);
			await TwiRtcAPI.send_sms(smsData, '+1' + number.nationalNumber.toString(), attachmentURL);
			notify({ type: 'success', message: 'Text message sent.' });
		} catch (error) {
			notify({ type: 'error', message: 'Could not upload the attachment. Please check the file type' });
		}

		setLoading(false);
		setSMSData('');
		onClose();
	};

	return (
		<CSSTransition
			in={show}
			timeout={500}
			nodeRef={modalRef}
			classNames={transitionClassNames}
			mountOnEnter={true}
			unmountOnExit={true}
		>
			<div ref={modalRef} className="fixed z-20 inset-0 animation-duration-250">
				<div className="flex justify-center items-center h-screen px-4 py-14 text-center">
					<div className="fixed inset-0">
						<div onClick={handleClose} className="absolute inset-0 bg-dp-blue-very-dark bg-opacity-50"></div>
					</div>
					<span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
						&#8203;
					</span>

					<div
						className=" bg-white relative z-30 inline-flex flex-col rounded-lg max-w-580 w-full max-h-full h-auto flex-1 transition"
						role="dialog"
						aria-modal="true"
						aria-labelledby="modal-headline"
					>
						<div className="bg-white rounded-t-lg relative z-10 border-b border-dp-gray">
							<div className="flex justify-center items-center p-4">
								<div className="text-center">
									<h5 className="font-semibold text-base leading-tight mb-0.5">Send Text Message</h5>
									<p className="text-sm">Recipient: {customer.name ? customer.name : customer.number}</p>
								</div>
							</div>
							<div
								className="modal-close absolute top-0 right-0 cursor-pointer flex flex-col items-center mt-4 mr-4 text-white text-sm z-50"
								onClick={handleClose}
							>
								<svg className="h-10 w-10 text-dp-gray-very-light hover:text-dp-gray-light" viewBox="0 0 40 40">
									<circle cx="20" cy="20" r="20" fill="currentColor" />
									<g transform="translate(12 12)" fill="none" stroke="#656f83" strokeLinecap="round" strokeWidth="2">
										<path d="M0 0l15.99970514 15.99970514" />
										<path d="M16 0L.00029486 15.99970514" />
									</g>
								</svg>
							</div>
						</div>
						<div className="p-4">
							<textarea
								className="text-dp-blue-very-dark border-0 focus:ring-0 p-0 bg-transparent w-full text-sm focus:outline-none resize-none"
								placeholder="Write a SMS"
								rows={8}
								value={smsData}
								onChange={e => setSMSData(e.target.value)}
							></textarea>
							<input onChange={e => setFile(e.target.files[0])} type="file" className="hidden" id="file" />
							<div className="mb-4 flex items-center overflow-hidden">
								<label htmlFor="file" className="flex cursor-pointer items-center">
									<svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
										/>
									</svg>
									<span className="text-sm ml-2 hover:underline">{file ? file.name : 'Add an attachment'}</span>
								</label>
								{file && (
									<button
										type="button"
										className="text-dp-red text-sm focus:outline-none ml-2 flex-shrink-0"
										onClick={() => setFile(undefined)}
									>
										Remove
									</button>
								)}
							</div>

							<button
								className={`${loading ? 'is-loading ' : ''}${
									!smsData
										? 'bg-dp-gray-light text-dp-gray-dark cursor-default'
										: 'bg-dp-green text-white hover:bg-opacity-75'
								} relative w-full block transition flex justify-between items-center p-3 rounded-md focus:outline-none`}
								onClick={handleSendSMS}
								disabled={loading || !smsData}
							>
								<div style={{ height: 18, width: 18 }}></div>
								<span className="font-semibold text-sm">Send</span>
								<div>
									<svg style={{ height: 18 }} viewBox="0 0 18 18">
										<path
											d="M1.253 18.001a1.213 1.213 0 01-1.117-1.767C.9 14.687 1.7 13.16 2.437 11.601a2.389 2.389 0 011.724-1.378c1.061-.26 2.14-.4 3.219-.56.629-.09 1.26-.164 1.889-.25a.87.87 0 00.291-.087.344.344 0 00.188-.374.377.377 0 00-.328-.327c-.34-.055-.683-.1-1.025-.144a39.623 39.623 0 01-4.243-.706 2.886 2.886 0 01-1.016-.424 1.626 1.626 0 01-.5-.583C1.8 5.101.957 3.433.132 1.76A1.209 1.209 0 011.049.013a1.285 1.285 0 01.793.159q4.375 2.19 8.752 4.376 3.314 1.653 6.629 3.311A1.224 1.224 0 0118 8.923a1.206 1.206 0 01-.761 1.212q-2.381 1.182-4.756 2.377l-10.63 5.312a1.293 1.293 0 01-.6.175"
											fill="currentColor"
										/>
									</svg>
								</div>
							</button>
						</div>
					</div>
				</div>
			</div>
		</CSSTransition>
	);
};

export default SMSModal;
