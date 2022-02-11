import { useRef, useState } from 'react';
import AudioRecorder from '../vendor/audio-recorder-polyfill/index.js';
import mpegEncoder from '../vendor/audio-recorder-polyfill/mpeg-encoder/index.js';

AudioRecorder.encoder = mpegEncoder;
AudioRecorder.prototype.mimeType = 'audio/mpeg';

export const useMicrophone = (recordedFileName = 'audio-recording.mp3') => {
	const recorder = useRef<any>();
	const stream = useRef<MediaStream>();
	const [recordedData, setRecordedData] = useState<Array<Blob>>([]);
	const [isRecording, setIsRecording] = useState<boolean>(false);
	const [recordedURL, setRecordedURL] = useState<string>();
	const [recordedFile, setRecordedFile] = useState<File>();

	const record = async () => {
		if (isRecording) return;

		setRecordedURL(undefined);
		setRecordedFile(undefined);

		try {
			stream.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
			recorder.current = new AudioRecorder(stream.current);

			recorder.current.addEventListener('dataavailable', (e: any) => {
				const newRecordedData = [...recordedData, e.data];
				setRecordedData(newRecordedData);

				const url = window.URL.createObjectURL(new Blob(newRecordedData, { type: 'audio/mpeg' }));
				const file = new File(newRecordedData, recordedFileName, { type: 'audio/mpeg' });

				setRecordedURL(url);
				setRecordedFile(file);
			});

			recorder.current.addEventListener('stop', () => {
				setIsRecording(false);
				setRecordedData([]);
			});

			recorder.current.start();
			setIsRecording(true);
		} catch (error) {
			throw new Error(error);
		}
	};

	const stopRecording = () => {
		if (!recorder.current || recorder.current.state === 'inactive') return;
		recorder.current.stop();
		recorder.current = undefined;
		stream.current.getAudioTracks().forEach(track => {
			track.stop();
			track.enabled = false;
		});
		stream.current = undefined;
	};

	const reset = () => {
		setRecordedData([]);
		setIsRecording(false);
		setRecordedURL(undefined);
		setRecordedFile(undefined);
	};

	return { isRecording, record, stopRecording, recordedURL, recordedFile, reset };
};
