Sure, here's the contents for the file: /linkedin-automation-plugin/linkedin-automation-plugin/src/services/api.ts

import { createUserMutation, listUsersQuery } from '../../graphql';
import { fetchGraphQL } from '../utils/fetchGraphQL';

export const createUser = async (email: string, password: string, profileUrl: string) => {
    const response = await fetchGraphQL(createUserMutation, {
        email,
        password,
        profileUrl,
    });
    return response;
};

export const listUsers = async () => {
    const response = await fetchGraphQL(listUsersQuery);
    return response;
};