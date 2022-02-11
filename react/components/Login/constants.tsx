import parsePhoneNumber from 'libphonenumber-js';

export const accountNotFoundError = 'An account with that email or phone number does not exist.';
export const genericLoginError = 'There was an error trying to log in. Please try again later.';

export const codeSentToGivenEmail = (email: string) => (
	<p>
		Check your inbox. We found the account and emailed an entry code to{' '}
		<strong className="font-semibold text-dp-blue-very-dark">{email}</strong>.
	</p>
);

export const codeSentToAssociatedEmail = (phone_number: string) => {
	const number = parsePhoneNumber(phone_number, 'US');
	return (
		<p>
			Check your inbox. We found the account and emailed an entry code to the email address associated with your phone
			number: <strong className="font-semibold text-dp-blue-very-dark">{number.formatNational()}</strong>
		</p>
	);
};

export const codeSentViaSMS = (phone_number: string) => {
	const number = parsePhoneNumber(phone_number, 'US');
	return (
		<p>
			Check your phone. We found the account and sent an entry code to your cell phone number:{' '}
			<strong className="font-semibold text-dp-blue-very-dark">{number.formatNational()}</strong>
		</p>
	);
};
