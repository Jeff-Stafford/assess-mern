import { StatusDisplay } from '../../enums/status-display.enums';
import { VerifyResponseUser } from '../../utils/api/auth';
import generateInitials from '../../utils/helpers/generateInitials';
import Avatar from '../UI/Avatar/Avatar';

interface LoginUserOptionProps {
	onClick?: () => void;
	selected?: boolean;
}

const LoginUserOption = ({
	user: { name_first, name_last, account, avatar },
	onClick,
	selected,
}: VerifyResponseUser & LoginUserOptionProps) => (
	<button
		type="button"
		onClick={onClick}
		className={`${
			selected ? 'border-dp-blue-dark ring-1 ring-dp-blue-dark' : 'border-dp-gray'
		} flex items-center justify-between rounded-lg border block w-full px-2.5 py-1 truncate focus:outline-none`}
	>
		<div className="flex items-center space-x-2.5">
			<Avatar
				available={StatusDisplay.NOT_AVAILABLE}
				url={avatar}
				initials={generateInitials(`${name_first} ${name_last}`)}
				size="h-9 w-9"
			/>
			<div className="text-left truncate">
				<p className="text-dp-blue-very-dark">{`${name_first} ${name_last}`}</p>
				<p className="text-xs">{account.account_name}</p>
			</div>
		</div>
		{selected && (
			<svg className="h-5 flex-shrink-0" viewBox="0 0 20 20">
				<path
					d="M10 0a10 10 0 1010 10A10 10 0 0010 0zm5.125 7.236l-6.428 6.457a.868.868 0 01-.558.264.842.842 0 01-.562-.274L4.875 10.99a.192.192 0 010-.274l.856-.856a.186.186 0 01.269 0l2.135 2.135L14 6.086a.19.19 0 01.135-.061.175.175 0 01.135.058l.841.87a.19.19 0 01.014.283z"
					fill="#375dd0"
				/>
			</svg>
		)}
	</button>
);

export default LoginUserOption;
