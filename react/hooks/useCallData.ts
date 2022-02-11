import useSWR from 'swr';
import { SWRFetcher } from '../utils/http-client';

interface CallData {
	call: {
		call_duration_seconds: number;
		call_result: 'Answered' | 'Voicemail' | 'Not answered' | 'Failed';
		call_type: 'Incoming' | 'Outgoing';
		start_datetime: string;
	};
	customer: {
		id: number;
		customer_name: string | null;
		customer_number: string;
	};
	users: {
		id: number;
		name_first: string;
		name_last: string;
		avatar: string | null;
	}[];
	transcriptions: {
		transcription_data: string;
	}[];
	recordings: {
		recording_file: string;
	}[];
}

interface CallDataPayload {
	data: CallData;
	error: any;
	loading: boolean;
}

const useCallData = (callId: string | string[]): CallDataPayload => {
	const { data, error } = useSWR(`/calls/${callId}`, SWRFetcher, {
		errorRetryCount: 1,
	});

	return {
		data,
		error,
		loading: !data && !error,
	};
};

export default useCallData;
