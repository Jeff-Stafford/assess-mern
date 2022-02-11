import User from './Navbar/User/User';
import Logo from './Navbar/Logo';
import { useSelector } from 'react-redux';
import { formatPhoneNumber } from '../../utils/helpers/formatPhoneNumber';

export default function Navbar() {
	const user = useSelector(({ user }) => user);

	return (
		<header className="relative flex items-center justify-between px-3.5 bg-dp-blue-dark py-2">
			<Logo />
			<User
				name={`${user.name_first} ${user.name_last}`}
				number={formatPhoneNumber(user.number?.number_did)}
				avatar={user.avatar}
				available={user.status_display}
			/>
		</header>
	);
}
