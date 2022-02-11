import React from 'react';
import Head from 'next/head';
import { Provider } from 'react-redux';

import store from '../store';
import dynamic from 'next/dynamic';
const TwilioApp = dynamic(() => import('../components/Twilio'), { ssr: false });
import OfflineAlert from '../components/UI/Notifications/OfflineAlert';
import { NotificationGroup, NotificationsProvider } from '../components/UI/Notifications';

import '../styles/animate.css';
import '../styles/tailwind.css';
import { SocketProvider } from '../components/SocketContext';
import AvatarProvider from '../components/AvatarProvider';
import AuthProvider from '../providers/AuthProvider';

const App = ({ Component, pageProps }) => {
	return (
		<NotificationsProvider>
			<Provider store={store}>
				<Head>
					<title>Tone</title>
					<link rel="icon" type="image/png" href="/favicon.png" key="Favicon" />
					<link rel="preconnect" href="https://fonts.gstatic.com" key="Preconnect Google Fonts" />
					<link
						href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&amp;display=swap"
						rel="stylesheet"
						key="Download Google Font"
					/>
				</Head>
				<div className="fixed top-0 right-0 z-50 mt-20 mr-6 space-y-3">
					<NotificationGroup />
				</div>
				<AuthProvider>
					<SocketProvider>
						<AvatarProvider>
							<Component {...pageProps} />
						</AvatarProvider>
					</SocketProvider>

					<OfflineAlert />

					<SocketProvider>
						<TwilioApp />
					</SocketProvider>
				</AuthProvider>
			</Provider>
		</NotificationsProvider>
	);
};

export default App;
