import { useSelector } from 'react-redux';
import { useCallback, useEffect, useState } from 'react';
import Router, { useRouter } from 'next/router';
import { useNotifications } from './UI/Notifications';

const AvatarProvider = ({ children }) => {
	const user = useSelector(({ user }) => user);
	const [loading, setLoading] = useState(true);
	const router = useRouter();
	const { notify } = useNotifications();

	const handleRouteChange = useCallback(async () => {
		setLoading(true);
		if (user.id !== null && user.avatar === null) {
			await Router.replace('/user-settings/personal');
			setLoading(false);
			return;
		}
		setLoading(false);
	}, [user]);

	useEffect(() => {
		handleRouteChange();
		if (router.pathname !== '/user-settings/personal' && user.avatar === null) {
			notify({
				type: 'warning',
				message: 'Please upload a profile picture before accessing Tone.',
			});
		}
	}, [router.pathname, handleRouteChange, notify, user]);

	if (loading) return null;
	if (user.avatar === null && router.pathname !== '/user-settings/personal') return null;

	return children;
};

export default AvatarProvider;
