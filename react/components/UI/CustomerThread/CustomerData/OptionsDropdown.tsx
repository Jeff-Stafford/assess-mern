import { useState } from 'react';
import MenuItem from '../../Navbar/ProfileDropdown/MenuItem';
import MenuItemSwitch from '../../Navbar/ProfileDropdown/MenuItemSwitch';

export default function OptionsDropdown() {
	const [open, setOpen] = useState(false);
	const [notificationsEnabled, setNotificationsEnabled] = useState(true);

	return (
		<div className="relative">
			<button
				onClick={() => setOpen(!open)}
				className={`${
					open ? 'bg-opacity-25' : 'bg-opacity-0 hover:bg-opacity-25'
				} bg-dp-gray h-11 w-11 flex items-center justify-center rounded-md focus:outline-none`}
			>
				<svg className="h-5" viewBox="0 0 5 20">
					<g transform="translate(-293 -98)" fill="#3a5199">
						<circle cx="2.5" cy="2.5" r="2.5" transform="translate(293 98)" />
						<circle cx="2.5" cy="2.5" r="2.5" transform="translate(293 105.5)" />
						<circle cx="2.5" cy="2.5" r="2.5" transform="translate(293 113)" />
					</g>
				</svg>
			</button>

			<div
				className={`${
					open ? 'flex flex-col' : 'hidden'
				} mt-3 z-20 absolute right-0 w-300 bg-white shadow-md rounded-md space-y-2 p-2`}
			>
				<MenuItemSwitch
					icon="/icons/bell.svg"
					title="Notifications"
					checked={notificationsEnabled}
					onChange={setNotificationsEnabled}
				/>
				<button className="focus:outline-none">
					<MenuItem icon="/icons/dot.svg" title="Mark as unread" />
				</button>
			</div>
		</div>
	);
}
