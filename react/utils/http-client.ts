import axios from 'axios';
import Router from 'next/router';
import { LOCAL_STORAGE_KEY } from '../consts';

const httpClient = axios.create({
	baseURL: process.env.API_URL,
});

httpClient.interceptors.request.use(config => {
	config.headers.Authorization = `Bearer ${localStorage.getItem(LOCAL_STORAGE_KEY.JWT_TOKEN) || ''}`;
	config.withCredentials = true;
	return config;
});

httpClient.interceptors.response.use(
	response => {
		return response;
	},
	error => {
		if (error.response.status === 401) {
			localStorage.removeItem(LOCAL_STORAGE_KEY.JWT_TOKEN);
			Router.push('/login');
		}

		return Promise.reject(error);
	}
);

const httpV2Client = axios.create({
	baseURL: process.env.API_V2_URL,
});

httpV2Client.interceptors.request.use(config => {
	config.headers.Authorization = `Bearer ${localStorage.getItem(LOCAL_STORAGE_KEY.JWT_TOKEN) || ''}`;
	config.withCredentials = true;
	return config;
});

const twiHttpClient = axios.create({
	baseURL: process.env.TWI_API_URL,
});

twiHttpClient.interceptors.request.use(config => {
	config.headers.Authorization = `Bearer ${localStorage.getItem(LOCAL_STORAGE_KEY.JWT_TOKEN) || ''}`;
	return config;
});

twiHttpClient.interceptors.response.use(
	response => {
		return response;
	},
	error => {
		if (error.response.status === 401) {
			// localStorage.removeItem(LOCAL_STORAGE_KEY.JWT_TOKEN);
			// Router.push('/login');
		}

		return Promise.reject(error);
	}
);

const SWRFetcher = (url: string) => httpClient.get(url).then(res => res.data);

export { httpClient, twiHttpClient, SWRFetcher, httpV2Client };
