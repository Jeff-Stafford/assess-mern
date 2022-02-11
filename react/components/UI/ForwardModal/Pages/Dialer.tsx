import { useCallback, useEffect, useState } from 'react';
import parsePhoneNumber, { PhoneNumber } from 'libphonenumber-js';
import { useNotifications } from '../../Notifications';
import { checkIfCustomerExists } from '../../../../utils/api/contacts';
import NumberInput from '../../Dialer/NumberInput';
import ContactName from '../../Dialer/ContactName';
import Keypad from '../../Dialer/Keypad/Keypad';

interface DialerProps {
	onUpdateNumber: (data: any) => void;
}

const Dialer = ({ onUpdateNumber }: DialerProps) => {
	const [inputNumber, setInputNumber] = useState<string>('');
	const [loadingContact, setLoadingContact] = useState(false);
	const [contact, setContact] = useState(null);
	const { notify } = useNotifications();

	const findContact = useCallback(
		async (number: PhoneNumber) => {
			try {
				const { data } = await checkIfCustomerExists(number);
				setContact(data);
				setLoadingContact(false);
				return data;
			} catch (error) {
				if (error.response.status === 404) {
					setLoadingContact(false);
					setContact(null);
				} else {
					notify({
						type: 'error',
						message: 'We were unable to check if this number exists in contacts. Please contact customer support.',
					});
				}
				return null;
			}
		},
		[notify]
	);

	const onDigitClick = (digit: string) => {
		if (digit !== '#' && digit !== '*') {
			setInputNumber(`${inputNumber}${digit}`);
			onUpdateNumber({ type: 'NUMBER', value: `${inputNumber}${digit}` });
		}
	};

	const onInputNumberChange = (inputNumber: string) => {
		setInputNumber(inputNumber);
		onUpdateNumber({ type: 'NUMBER', value: inputNumber });
	};

	useEffect(() => {
		setLoadingContact(true);
		const number = parsePhoneNumber(inputNumber, 'US');
		if (number === undefined || !number.isPossible()) {
			setLoadingContact(true);
			return;
		}
		findContact(number);
	}, [inputNumber, findContact]);

	return (
		<div className="py-4 px-2.5 text-center">
			<NumberInput value={inputNumber} onChange={onInputNumberChange} disabled={false} />
			<div className="h-5 mt-2.5 mb-5 flex items-center justify-center">
				{!loadingContact && contact && contact.customer_name !== null && (
					<ContactName id={contact.id} name={contact.customer_name} />
				)}
			</div>
			<div className="inline-block">
				<Keypad onClick={onDigitClick} />
			</div>
		</div>
	);
};

export default Dialer;
