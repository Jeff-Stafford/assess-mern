import { useEffect, useMemo, useState, FormEvent } from 'react';
import { useCurrentCustomerThread } from '../../../hooks/useCurrentCustomerThread';
import { formatPhoneNumber } from '../../../utils/helpers/formatPhoneNumber';
import Modal from '../../Portal/Modal';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { useCustomerThreads } from '../../../hooks/useCustomerThreads';
import { updateCustomer } from '../../../utils/api/contacts';
import { useNotifications } from '../Notifications';
import { wait } from '../../../utils/helpers/wait';

interface UpdateContactNameProps {
	onClose?: () => void;
	show?: boolean;
	phoneNumber: string;
	customerId: number;
	customerName?: string;
}

const UpdateContactName = ({ onClose, show, phoneNumber, customerId, customerName }: UpdateContactNameProps) => {
	const [name, setName] = useState(customerName || '');
	const [loading, setLoading] = useState(false);
	const user = useSelector(({ user }) => user);
	const router = useRouter();
	const { notify } = useNotifications();

	const { refreshData: refreshCurrentCustomerThread } = useCurrentCustomerThread(user.id, +router.query.id);
	const { refreshData: refreshCustomerThreads } = useCustomerThreads(user.id);

	const isButtonDisabled = useMemo(() => {
		return !name || loading;
	}, [loading, name]);

	const handleUpdateContact = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (isButtonDisabled) return;
		setLoading(true);
		try {
			await updateCustomer(customerId, name);
			await wait(1000);
			await refreshCurrentCustomerThread();
			await refreshCustomerThreads();
			notify({
				type: 'success',
				title: 'Success',
				message: 'You have successfully updated this customer',
			});
			setLoading(false);
			onClose();
		} catch (error) {
			notify({
				type: 'error',
				title: "Error adding customer's name",
				message: "There was an error adding customer's name. Please try again.",
			});
			setLoading(false);
		}
	};

	useEffect(() => {
		customerName ? setName(customerName) : setName('');
	}, [customerName]);

	return (
		<Modal onClose={onClose} show={show}>
			<form onSubmit={handleUpdateContact} className="w-full max-w-350 bg-white rounded-lg z-30 p-6">
				<h2 className="text-center text-base font-semibold mb-2">{formatPhoneNumber(phoneNumber)}</h2>
				<p className="mb-6 text-sm text-dp-gray-very-dark">Edit name for this number.</p>
				<input
					className="w-full p-3 text-sm rounded-lg border border-dp-gray-dark block mb-6"
					onChange={event => setName(event.target.value)}
					value={name}
					type="text"
					placeholder="Name"
				/>
				<div className="space-y-2">
					<button
						disabled={isButtonDisabled}
						type="submit"
						className={`${!name ? 'cursor-not-allowed ' : ''}${
							loading ? 'is-loading ' : ''
						}w-full font-semibold text-sm bg-dp-blue-dark text-white py-3 rounded-md transition focus:outline-none`}
					>
						Done
					</button>
					<button
						type="button"
						onClick={onClose}
						className="w-full font-semibold text-sm bg-dp-gray-very-light hover:bg-dp-gray-light text-dp-blue-dark py-3 rounded-md transition focus:outline-none"
					>
						Cancel
					</button>
				</div>
			</form>
		</Modal>
	);
};

export default UpdateContactName;
