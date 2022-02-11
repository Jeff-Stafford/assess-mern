import { useAudio } from 'react-use';

interface CallRecordingProps {
	recording_file: string;
}

const CallRecording = ({ recording_file }: CallRecordingProps) => {
	const [audio] = useAudio(<audio className="w-full focus:outline-none" src={recording_file} controls />);
	return <div>{audio}</div>;
};

export default CallRecording;
