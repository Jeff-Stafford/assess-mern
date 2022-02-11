import { useEffectOnce } from 'react-use';
import LogoBlue from '../components/Logo/LogoBlue';

const LogoutPage = () => {
	useEffectOnce(() => {
		if (!process.browser) return;
		localStorage.removeItem('token');
		setTimeout(() => {
			window.location.href = '/';
		}, 2000);
	});

	return (
		<div className="h-screen w-full login-gradient flex items-center justify-center">
			<div className="bg-white p-12 shadow-md rounded-2xl" style={{ width: 376 }}>
				<LogoBlue />
				<h1 className="mt-6 text-center text-2xl font-semibold tracking-tight mb-8">Log out</h1>
				<p className="text-center text-sm">You have successfully logged out&nbsp;from&nbsp;Tone.</p>
			</div>
		</div>
	);
};

export default LogoutPage;
