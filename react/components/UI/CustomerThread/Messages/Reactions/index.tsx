import React, { useMemo, FC, useState, useRef } from 'react';
import { groupBy } from 'lodash';
import Image from 'next/image';
import { useSelector } from 'react-redux';
import { useClickAway } from 'react-use';
import { useRouter } from 'next/router';
import { ReactionModal } from './ReactionsModal';
import { REACTION_ICONS } from './consts';
import { NoteReaction } from '../../../../../types/customer-thread';
import Modal from '../../../../Portal/Modal';
import { addReaction, deleteReaction, updateReaction } from '../../../../../utils/api/customer-thread';

interface ReactionProps {
	noteID: number;
	reactions: NoteReaction[];
	position: 'left' | 'right';
}

export const Reactions: FC<ReactionProps> = ({ noteID, reactions = [], position }) => {
	const { query } = useRouter();
	const user = useSelector(({ user }) => user);

	const [selected, setSelected] = useState(reactions.find(({ user_id }) => user_id === user.id)?.reaction_id || 0);
	const myReaction = useMemo(() => REACTION_ICONS[selected], [selected]);

	const [showModal, setShowModal] = useState(false);
	const closeModal = () => setShowModal(false);

	const picker = useRef<HTMLDivElement>(null);
	const [pickerOpened, setPickerOpened] = useState(false);
	useClickAway(picker, ({ target }) => (target as HTMLElement)?.id !== `toggle-${noteID}` && setPickerOpened(false));

	const selectReaction = async (reactionID: number) => {
		if (selected === reactionID) {
			await deleteReaction(+query.id, user.id, noteID, reactionID);
		} else if (selected) {
			await updateReaction(+query.id, user.id, noteID, selected, reactionID);
		} else {
			await addReaction(+query.id, user.id, noteID, reactionID);
		}

		setSelected(selected => (selected === reactionID ? 0 : reactionID));
		setPickerOpened(false);
	};

	const grouped = useMemo(() => {
		const unique = groupBy(reactions, ({ reaction_id }) => reaction_id);

		return Object.values(unique)
			.map(([{ reaction_id }, ...rest]) => ({ reaction_id, count: rest.length + 1 }))
			.filter(Boolean);
	}, [reactions]);

	return (
		<div className="flex space-x-1">
			<div className="relative">
				{/* Toggle reaction picker */}
				<div
					id={`toggle-${noteID}`}
					title={myReaction || 'add'}
					onClick={() => setPickerOpened(po => !po)}
					className={`flex items-center justify-center h-6 px-3 py-1 rounded-full cursor-pointer transition ${
						myReaction ? 'bg-white border-2 border-blue-700' : 'bg-dp-blue-very-dark bg-opacity-10 hover:bg-opacity-25'
					}`}
				>
					<Image key={myReaction} src={`/reactions/reaction-${myReaction || 'add'}.svg`} height={16} width={16} />
				</div>

				{/* Reaction picker */}
				{pickerOpened && (
					<div
						ref={picker}
						className={`absolute bottom-0 mb-8 rounded-lg p-3 space-x-1 flex items-center bg-white shadow-lg ${
							position === 'left' ? 'left-0' : 'right-0'
						}`}
					>
						{Object.entries(REACTION_ICONS).map(([id, icon]) => (
							<div
								key={id}
								onClick={() => selectReaction(+id)}
								className={`p-1 cursor-pointer hover:bg-gray-100 border-2 rounded-lg box-content ${
									+id === selected ? 'border-blue-700 bg-gray-100' : 'border-white'
								}`}
							>
								<Image src={`/reactions/reaction-${icon}.svg`} height={24} width={24} />
							</div>
						))}
					</div>
				)}
			</div>

			{/* List of reactions */}
			{grouped.map(({ reaction_id, count }) => {
				const reaction = REACTION_ICONS[reaction_id] || 'smile';

				return (
					<div
						key={reaction_id}
						title={reaction}
						onClick={() => setShowModal(true)}
						className="flex items-center justify-center h-6 px-2 py-1 mr-1 space-x-1 bg-white rounded-full cursor-pointer hover:bg-gray-100"
					>
						<Image src={`/reactions/reaction-${reaction}.svg`} height={16} width={16} />
						<span className="text-gray-500">{count}</span>
					</div>
				);
			})}

			<Modal show={showModal} onClose={closeModal}>
				{showModal && <ReactionModal onClose={closeModal} reactions={reactions} />}
			</Modal>
		</div>
	);
};
