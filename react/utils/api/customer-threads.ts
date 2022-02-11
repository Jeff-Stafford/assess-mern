import { httpClient } from '../http-client';

export const fetchCustomerThreads = async (id: number, q: string) =>
	httpClient.get(`/users/${id}/customer-threads?q=${q}`);
