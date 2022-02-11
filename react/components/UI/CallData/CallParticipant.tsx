interface CallParticipantProps {
	avatar: string | null;
	name_first: string;
	name_last: string;
}

const CallParticipant = ({ avatar, name_first, name_last }: CallParticipantProps) => (
	<div className="h-11 flex px-3 items-center space-x-3 flex-shrink-0 bg-dp-gray-very-light rounded-xl mt-2 mr-2">
		{avatar && <img className="h-8 w-8 rounded-full" src={avatar} alt={`${name_first} ${name_last}`} />}
		<span className="text-sm">{`${name_first} ${name_last}`}</span>
	</div>
);

export default CallParticipant;
