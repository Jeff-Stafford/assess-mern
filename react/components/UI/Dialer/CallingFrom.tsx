import { useSelector } from 'react-redux';
import { formatPhoneNumber } from '../../../utils/helpers/formatPhoneNumber';
import generateInitials from '../../../utils/helpers/generateInitials';
import Avatar from '../Avatar/Avatar';

export default function CallingFrom() {
	const user = useSelector(({ user }) => user);

	return (
		<div className="flex items-center bg-dp-gray-very-light rounded-md px-3 py-2">
			<Avatar url={user.avatar} initials={generateInitials(user.full_name)} available={user.available} />
			<div className="ml-2 text-sm">
				<span className="block leading-tight">{user.number?.number_label}</span>
				{user.number ? (
					<span className="block text-dp-gray-very-dark">Calling from {formatPhoneNumber(user.number.number_did)}</span>
				) : (
					<span className="block text-dp-gray-dark italic">Phone number does not exist</span>
				)}
			</div>
		</div>
	);
}
