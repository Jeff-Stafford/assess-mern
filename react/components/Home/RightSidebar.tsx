import TeamMembers from '../UI/Team/TeamMembers';

export default function RightSidebar() {
	return (
		<div className="px-3.5 pt-2.5">
			<div className="flex flex-col justify-between h-full w-320">
				<div className="flex flex-col flex-1 space-y-3">
					<TeamMembers />
				</div>
			</div>
		</div>
	);
}
