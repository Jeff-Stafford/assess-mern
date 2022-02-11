import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useTeamMembers } from '../../../../hooks/useTeamMembers';
import { TeamMember as TeamMemberType } from '../../../../types/team-members';
import TeamMember from '../Team/TeamMember';

interface TeamProps {
	onUpdateNumber: (data: any) => void;
}

const Team = ({ onUpdateNumber }: TeamProps) => {
	const [selectedMember, setSelectedMember] = useState<TeamMemberType>(null);
	const user = useSelector(({ user }) => user);
	const { teamMembers, loading } = useTeamMembers(user.id);

	const handleNumberChange = (member: any) => {
		setSelectedMember(member);
		onUpdateNumber({ type: 'TEAM', value: member });
	};

	return (
		<div className="space-y-2.5 px-2.5 py-4">
			{!loading && (
				<>
					{teamMembers
						.filter(member => member.available)
						.map(member => (
							<TeamMember
								selected={selectedMember?.id === member.id}
								onClick={() => handleNumberChange(member)}
								key={member.id}
								{...member}
							/>
						))}
				</>
			)}
		</div>
	);
};

export default Team;
