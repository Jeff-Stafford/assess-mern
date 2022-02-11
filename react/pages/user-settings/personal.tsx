import Head from 'next/head';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import { UserAPI } from '../../utils/api';
import Input from '../../components/UI/UserSettings/Input/Input';
import { useNotifications } from '../../components/UI/Notifications';
import ChangeAvatar from '../../components/UI/UserSettings/Input/ChangeAvatar';
import SubmitButton from '../../components/UI/UserSettings/Input/SubmitButton';
import { UserStatus } from '../../enums';
import SettingsLayout from '../../components/Layout/SettingsLayout';

export default function UserSettings() {
	const user = useSelector(({ user }) => user);
	const dispatch = useDispatch();
	const { notify } = useNotifications();
	const router = useRouter();
	const [avatar, setAvatar] = useState(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [firstName, setFirstName] = useState<string>(user.name_first);
	const [lastName, setLastName] = useState<string>(user.name_last);
	const [email, setEmail] = useState<string>(user.email);
	const [cellPhoneNumber, setCellPhoneNumber] = useState<string>(user.cell_number);

	const disabled = useMemo(() => {
		return !firstName || !lastName || !email || loading || !cellPhoneNumber;
	}, [firstName, lastName, email, loading, cellPhoneNumber]);

	const handleSubmit = async e => {
		e.preventDefault();
		setLoading(true);
		try {
			await UserAPI.updateUserData(user.id, firstName, lastName, email, cellPhoneNumber);
			let newAvatar = null;
			if (avatar) {
				const { data } = await UserAPI.updateAvatar(user.id, avatar);
				newAvatar = data.avatar;
			}

			dispatch({
				type: UserStatus.SET_USER,
				payload: {
					...user,
					name_first: firstName,
					name_last: lastName,
					email,
					avatar: newAvatar ? newAvatar : user.avatar,
				},
			});
			notify({
				message: 'User data updated!',
			});
			setLoading(false);
			await router.push('/');
		} catch (error) {
			notify({
				type: 'error',
				message: 'Could not update user information. Please try again later.',
			});
			setLoading(false);
		}
	};

	return (
		<>
			<Head>
				<title>Personal Settings</title>
			</Head>
			<SettingsLayout>
				<form className="py-4 px-2" onSubmit={handleSubmit}>
					<ChangeAvatar avatar={user.avatar} name={`${user.name_first} ${user.name_last}`} onChange={setAvatar} />
					<div className="pt-8 flex flex-col space-y-5">
						<Input
							label="First Name"
							type="text"
							name="name_first"
							value={firstName}
							onChange={event => setFirstName(event.target.value)}
						/>
						<Input
							label="Last Name"
							type="text"
							name="name_last"
							value={lastName}
							onChange={event => setLastName(event.target.value)}
						/>
						<Input
							label="Email"
							type="email"
							name="email"
							value={email}
							onChange={event => setEmail(event.target.value)}
						/>
						<Input
							label="Cell Phone"
							type="text"
							name="phone"
							placeholder="Cell Phone"
							value={cellPhoneNumber}
							onChange={e => setCellPhoneNumber(e.target.value)}
						/>
						<SubmitButton loading={loading} disabled={disabled} />
					</div>
				</form>
			</SettingsLayout>
		</>
	);
}
