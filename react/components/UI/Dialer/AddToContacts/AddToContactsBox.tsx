import { FormEvent, useState } from 'react';
import parsePhoneNumber from 'libphonenumber-js';

import AddToContactsInput from './AddToContactsInput';
import AddToContactsCloseButton from './AddToContactsCloseButton';
import AddToContactsSubmitButton from './AddToContactsSubmitButton';
import { createCustomer, updateCustomer } from '../../../../utils/api/contacts';
import { useRouter } from 'next/router';
import { useNotifications } from '../../Notifications';

interface Contact {
	id: number;
	customer_name: string;
	customer_number: string;
	last_update: string;
}

interface AddToContactsBoxProps {
	onClose: () => void;
	phoneNumber: string;
	contact: Contact;
}

export default function AddToContactsBox({ onClose, phoneNumber, contact }: AddToContactsBoxProps) {
	const [name, setName] = useState('');
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const { notify } = useNotifications();

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			if (contact && contact.id) {
				await updateCustomer(contact.id, name);
				await router.push(`/customer-threads/${contact.id}`);
				return;
			}

			const number = parsePhoneNumber(phoneNumber, 'US');
			const { data } = await createCustomer(name, number.format('E.164'));
			await router.push(`/customer-threads/${data.customer_id}`);
			return;
		} catch (error) {
			notify({
				type: 'error',
				message: 'Could not create the customer.',
			});
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<div className="relative flex flex-col p-3 space-y-3 rounded-md bg-dp-gray-light">
				<p className="text-lg text-center">Add to Contacts</p>
				<AddToContactsInput value={name} onChange={setName} />
				<AddToContactsSubmitButton disabled={name.length === 0 || loading} />
				<AddToContactsCloseButton onClick={() => onClose()} />
			</div>
		</form>
	);
}
