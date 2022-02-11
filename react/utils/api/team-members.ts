import { httpClient } from '../http-client';

export const fetchTeamMembers = (userId: number) => httpClient.get(`/users/${userId}/team-members`);
