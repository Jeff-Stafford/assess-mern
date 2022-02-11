import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { useCurrentCustomerThread } from '../../../hooks/useCurrentCustomerThread';
import { setIRTCStatus } from '../../../store/actions/rtc-status.actions';

interface MakeCallProps {
	disabled: boolean;
}

export default function MakeCall(props: MakeCallProps) {
	const router = useRouter();
	const dispatch = useDispatch();
	const user = useSelector(({ user }) => user);
	const { loading, customerThread, error } = useCurrentCustomerThread(user.id, +router.query.id);

	const handleClick = () => {
		if (props.disabled) return;
		dispatch(setIRTCStatus({ onTypeNote: false, onEnterNumber: false }));

		if (router.query.id && !loading && !error) {
			router.push(`/make-a-call?number=${encodeURIComponent(customerThread.customer.number)}`);
			return;
		}

		router.push('/make-a-call');
	};

	return (
		<button
			onClick={() => handleClick()}
			className={`${
				props.disabled
					? 'bg-dp-gray-light text-dp-gray-dark cursor-not-allowed'
					: 'bg-dp-blue-dark text-white hover:bg-opacity-75'
			} w-full flex transition justify-center items-center space-x-3 py-3 mt-4 rounded-md focus:outline-none`}
		>
			<svg className="h-5 w-5" viewBox="0 0 20 20">
				<path
					d="M10 15a2.5 2.5 0 102.5 2.5A2.507 2.507 0 0010 15zM2.5 0A2.5 2.5 0 105 2.5 2.507 2.507 0 002.5 0zm0 7.5A2.5 2.5 0 105 10a2.507 2.507 0 00-2.5-2.5zm7.5 0a2.5 2.5 0 102.5 2.5A2.507 2.507 0 0010 7.5zm7.5 0A2.5 2.5 0 1020 10a2.507 2.507 0 00-2.5-2.5zm0-7.5A2.5 2.5 0 1020 2.5 2.507 2.507 0 0017.5 0zM10 0a2.5 2.5 0 102.5 2.5A2.507 2.507 0 0010 0z"
					fill="#fff"
				/>
			</svg>
			<span className="font-semibold text-base">Make a Call</span>
		</button>
	);
}
