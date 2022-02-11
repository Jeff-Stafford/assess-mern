import { httpClient } from '../http-client';

const updateAvatar = async (userId: number, file: File) => {
	const formData = new FormData();
	formData.append('image', file);

	return httpClient.put(`/users/${userId}/avatar`, formData, {
		headers: {
			'Content-Type': 'multipart/form-data',
		},
	});
};

const updateUserData = async (
	userId: number,
	name_first: string,
	name_last: string,
	email: string,
	cell_number: string
) => httpClient.put(`/users/${userId}`, { name_first, name_last, email, cell_number });

export const UserAPI = {
	updateAvatar,
	updateUserData,
};
