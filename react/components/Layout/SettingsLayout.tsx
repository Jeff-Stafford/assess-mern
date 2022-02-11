import { FC } from 'react';
import Navbar from '../UI/Navbar';
import { useRouter } from 'next/router';
import PageWrap from '../UI/Layouts/PageWrap';
import MenuItem from '../UI/UserSettings/Menu/MenuItem';
import MenuWrap from '../UI/UserSettings/Menu/MenuWrap';
import { useSelector } from 'react-redux';

const SettingsLayout: FC = ({ children }) => {
	const router = useRouter();
	const user = useSelector(({ user }) => user);
	return (
		<PageWrap>
			<Navbar />
			<div className="flex-1 py-6 overflow-y-auto">
				<div className="w-full mx-auto bg-white rounded-xl shadow-md flex" style={{ maxWidth: 796, minHeight: 600 }}>
					<div className="border-r border-dp-gray p-3">
						<MenuWrap>
							<MenuItem
								title="Profile"
								icon="/icons/personal.svg"
								active={router.pathname === '/user-settings/personal'}
								href="/user-settings/personal"
							/>
							<MenuItem
								title="Notification Schedule"
								icon="/icons/notification-schedule.svg"
								active={router.pathname === '/user-settings/notification-schedule'}
								href="/user-settings/notification-schedule"
							/>
							<MenuItem
								title="Voicemail Greeting"
								icon="/icons/voicemail.svg"
								active={router.pathname === '/user-settings/voicemail'}
								href="/user-settings/voicemail"
							/>
							{user.permissions.length > 0 && (
								<a href={`https://settings.tone.com/login-token?token=${localStorage.getItem('token')}`}>
									<MenuItem icon="/icons/cog.svg" title="Configurations" active={false} />
								</a>
							)}
						</MenuWrap>
					</div>
					<div className="flex-1 p-3 overflow-x-hidden relative">{children}</div>
				</div>
			</div>
		</PageWrap>
	);
};

export default SettingsLayout;
