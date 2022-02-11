import Head from 'next/head';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { wait } from '../../utils/helpers/wait';
import Portal from '../../components/Portal/Portal';
import useVoicemail from '../../hooks/useVoicemail';
import SettingsLayout from '../../components/Layout/SettingsLayout';
import VoicemailGreetingSkeleton from '../../components/UI/Voicemail/VoicemailGreetingSkeleton';
import AddVoicemailGreetingButton from '../../components/UI/Voicemail/AddVoicemailGreetingButton';
import VoicemailGreetingOption from '../../components/UI/Voicemail/Option/VoicemailGreetingOption';
import CreateVoicemailGreetingModal from '../../components/UI/Voicemail/CreateVoicemailGreetingModal';

const VoicemailSettings = () => {
	const user = useSelector(({ user }) => user);
	const [showModal, setShowModal] = useState<boolean>(false);
	const [loading, setLoading] = useState<boolean>(false);
	const {
		loading: greetingsLoading,
		currentVoicemailGreeting,
		allVoicemailGreetings,
		currentVoicemailGreetingError,
		allVoicemailGreetingsError,
		setSelectedVoicemail,
		refreshCurrentVoicemailGreeting,
	} = useVoicemail(user.id);

	const updateVoicemail = async (greeting_id: number) => {
		setLoading(true);
		try {
			await setSelectedVoicemail(greeting_id);
			await wait(1000);
			await refreshCurrentVoicemailGreeting();
		} catch (error) {}
		setLoading(false);
	};

	return (
		<>
			<Head>
				<title>Voicemail Settings</title>
			</Head>
			<Portal>
				<CreateVoicemailGreetingModal show={showModal} onClose={() => setShowModal(false)} />
			</Portal>
			<SettingsLayout>
				<p className="text-xs mb-4">Choose a greeting for your voicemail. You may record or use a default one.</p>
				{(currentVoicemailGreetingError || allVoicemailGreetingsError) && (
					<p className="text-xs">There has been an error. Please refresh the page.</p>
				)}
				{greetingsLoading && (
					<div className="space-y-1.5">
						<VoicemailGreetingSkeleton />
						<VoicemailGreetingSkeleton />
						<VoicemailGreetingSkeleton />
						<VoicemailGreetingSkeleton />
						<VoicemailGreetingSkeleton />
					</div>
				)}
				{!greetingsLoading && !currentVoicemailGreetingError && !allVoicemailGreetingsError && (
					<div className={`${loading ? 'opacity-50' : 'opacity-100'} space-y-1.5 transition`}>
						{allVoicemailGreetings.map(greeting => (
							<VoicemailGreetingOption
								key={greeting.greeting_id}
								{...greeting}
								selected={greeting.greeting_id === currentVoicemailGreeting.greeting_id}
								onClick={() => updateVoicemail(greeting.greeting_id)}
								disabled={loading}
							/>
						))}
					</div>
				)}
				<div className="mt-1.5">
					<AddVoicemailGreetingButton onClick={() => setShowModal(true)} />
				</div>
			</SettingsLayout>
		</>
	);
};

export default VoicemailSettings;
