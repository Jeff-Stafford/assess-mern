import { useCallback, useEffect, useMemo, useState } from 'react';
import { httpClient } from '../../../../utils/http-client';
import { useNotifications } from '../../Notifications';
import RoutingProfile from '../RoutingProfiles/RoutingProfile';
import Skeleton from '../RoutingProfiles/Skeleton';
import { RoutingProfile as RoutingProfileType } from '../Types/RoutingProfile.type';

interface RoutingProfileProps {
	onUpdateNumber: (data: any) => void;
}

const RoutingProfiles = ({ onUpdateNumber }: RoutingProfileProps) => {
	const [loading, setLoading] = useState(true);
	const [routingProfiles, setRoutingProfiles] = useState<Array<RoutingProfileType>>([]);
	const [selectedProfile, setSelectedProfile] = useState<RoutingProfileType | null>(null);

	const { notify } = useNotifications();

	const filteredRoutingProfiles = useMemo(() => {
		if (!routingProfiles.length) return [];
		return routingProfiles.filter(value => {
			return value.type.type_description !== 'User direct';
		});
	}, [routingProfiles]);

	const fetchRoutingProfiles = useCallback(async () => {
		try {
			const { data } = await httpClient.get('/hunts');
			setRoutingProfiles(data);
		} catch (error) {
			notify({
				type: 'error',
				message: error,
			});
		} finally {
			setLoading(false);
		}
	}, [notify]);

	useEffect(() => {
		fetchRoutingProfiles();
	}, [fetchRoutingProfiles]);

	const handleNumberChange = (profile: RoutingProfileType) => {
		setSelectedProfile(profile);
		onUpdateNumber({ type: 'HUNT', value: profile });
	};

	return (
		<div className="space-y-2.5 px-2.5 py-4">
			{loading && (
				<>
					<Skeleton />
					<Skeleton />
					<Skeleton />
					<Skeleton />
					<Skeleton />
					<Skeleton />
					<Skeleton />
					<Skeleton />
					<Skeleton />
					<Skeleton />
				</>
			)}
			{filteredRoutingProfiles.map(profile => (
				<RoutingProfile
					key={profile.id}
					{...profile}
					selected={selectedProfile?.id === profile.id}
					onClick={() => handleNumberChange(profile)}
				/>
			))}
		</div>
	);
};

export default RoutingProfiles;
