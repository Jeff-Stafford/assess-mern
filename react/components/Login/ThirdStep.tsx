import { useState } from 'react';

import SubmitButton from './SubmitButton';
import LoginUserOption from './LoginUserOption';
import { LOCAL_STORAGE_KEY } from '../../consts';
import { VerifyResponseUser } from '../../utils/api/auth';

interface ThirdStepProps {
	users: VerifyResponseUser[];
}

const ThirdStep = ({ users }: ThirdStepProps) => {
	const [token, setToken] = useState('');
	const [loading, setLoading] = useState(false);

	const loginUser = () => {
		setLoading(true);
		localStorage.setItem(LOCAL_STORAGE_KEY.JWT_TOKEN, token);
		window.location.href = '/';
	};

	return (
		<div className="text-center text-sm text-dp-gray-very-dark">
			<p className="mb-6">
				Please choose the account
				<br />
				you wish to log into.
			</p>
			<div className="space-y-3 mb-6">
				{users.map(user => (
					<LoginUserOption
						key={user.user.id}
						{...user}
						selected={user.token === token}
						onClick={() => setToken(user.token)}
					/>
				))}
			</div>
			<SubmitButton loading={loading} onClick={loginUser} type="button" disabled={!token}>
				Log In
			</SubmitButton>
		</div>
	);
};

export default ThirdStep;
