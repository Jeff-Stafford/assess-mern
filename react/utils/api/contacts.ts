import { PhoneNumber } from 'libphonenumber-js';
import { httpClient } from '../http-client';

export const checkIfCustomerExists = (phone: PhoneNumber) =>
	httpClient.get(`/customers/check?phone=${encodeURIComponent(phone.format('E.164'))}`);

export const subscribeToCustomer = (user_id: number, customer_id: number) =>
	httpClient.post(`/users/${user_id}/customers/${customer_id}/subscribe`);

export const updateCustomer = (customer_id: number, full_name: string) =>
	httpClient.patch(`/customers/${customer_id}`, { full_name });

export const createCustomer = (full_name: string, phone_number: string) =>
	httpClient.post('/customers', { full_name, phone_number });
