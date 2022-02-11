import React, { useMemo, FC } from 'react';
import { useSelector } from 'react-redux';
import { keyBy } from 'lodash';
import Image from 'next/image';
import { ModalProps } from '../../../../Portal/Modal';
import { useTeamMembers } from '../../../../../hooks/useTeamMembers';
import { REACTION_ICONS } from './consts';
import { NoteReaction } from '../../../../../types/customer-thread';

interface ReactionModalProps extends ModalProps {
	reactions: NoteReaction[];
}

export const ReactionModal: FC<ReactionModalProps> = ({ reactions, onClose }) => {
	const occurrences = useMemo(
		() =>
			reactions.reduce((all, { reaction_id }) => {
				all[reaction_id] = all[reaction_id] ? all[reaction_id] + 1 : 1;
				return all;
			}, {}),
		[reactions]
	);

	const sorted = useMemo(
		() =>
			Object.entries(REACTION_ICONS)
				.map(([id, icon]) => ({ icon, count: occurrences[id] }))
				.sort(({ count: a = 0 }, { count: b = 0 }) => b - a),
		[occurrences]
	);

	const user = useSelector(({ user }) => user);
	const { teamMembers = [] } = useTeamMembers(user.id);
	const memberMap = useMemo(() => keyBy([...teamMembers, user], 'id'), [teamMembers, user]);

	return (
		<div className="z-20 bg-white rounded-lg">
			<div className="flex items-center justify-between p-2.5 text-xl font-semibold border-b-2">
				<div className="h-10 w-10"></div>
				<h2 className="text-base font-semibold text-dp-blue-very-dark">Team reactions</h2>
				<button
					type="button"
					onClick={onClose}
					className="flex focus:outline-none items-center justify-center w-10 h-10 rounded-full text-dp-gray-very-dark hover:bg-dp-gray-light transition"
				>
					<svg className="fill-current" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 18 18">
						<path d="M14.53 4.53l-1.06-1.06L9 7.94 4.53 3.47 3.47 4.53 7.94 9l-4.47 4.47 1.06 1.06L9 10.06l4.47 4.47 1.06-1.06L10.06 9z"></path>
					</svg>
				</button>
			</div>

			<div className="bg-dp-gray-very-light space-y-4 text-left">
				<div className={`space-x-4 flex items-center justify-between bg-white px-6 py-3 border-b-2`}>
					{sorted.map(({ icon, count }) => (
						<div
							key={icon}
							className={`py-1 w-14 border-2 border-transparent flex items-center justify-center space-x-2 rounded-full box-content bg-gray-100 ${
								count ? '' : 'opacity-50'
							} `}
						>
							<img src={`/reactions/reaction-${icon}.svg`} alt="Reaction" className="h-4" />
							{count && <span className="text-gray-500">{count}</span>}
						</div>
					))}
				</div>

				<div className="space-y-3 px-6 overflow-y-auto h-80">
					{reactions.map(({ reaction_id, user_id }, i) => {
						const { name_first, name_last, avatar } = memberMap[user_id];
						const icon = REACTION_ICONS[reaction_id];

						return (
							<div key={`${reaction_id}${user_id}${i}`} className="bg-white flex items-center p-2 pr-4 rounded-lg">
								<div
									className="bg-center bg-cover rounded-full h-8 w-8"
									style={{ backgroundImage: `url(${avatar})` }}
								/>
								<div className="flex-grow text-base text-sm ml-3">
									{name_first} {name_last}
								</div>
								<Image src={`/reactions/reaction-${icon}.svg`} height={24} width={24} />
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};
