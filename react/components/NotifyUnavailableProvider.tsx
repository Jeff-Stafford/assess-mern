import { useCookie, useEffectOnce } from 'react-use';
import { useSelector } from 'react-redux';
import { useNotifications } from './UI/Notifications';

const NotifyAvailableProvider = ({ children }) => {
	const [value] = useCookie('last_availability_status');
	const { notify } = useNotifications();
	const user = useSelector(state => state.user);

	useEffectOnce(() => {
		if (user && value === 'false') {
			notify({
				type: 'warning',
				title: 'You are Unavailable',
				message: 'Your status is currently set to Unavailable. Update by clicking your profile picture above.',
			});
		}
	});

	return children;
};

export default NotifyAvailableProvider;
