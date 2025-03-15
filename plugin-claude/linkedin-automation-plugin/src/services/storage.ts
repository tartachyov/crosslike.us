Sure, here's the contents for the file `/linkedin-automation-plugin/linkedin-automation-plugin/src/services/storage.ts`:

import { UserData } from '../utils/types';

const STORAGE_KEY = 'linkedinAutomationData';

export const saveUserData = (data: UserData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getUserData = (): UserData | null => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
};

export const clearUserData = () => {
    localStorage.removeItem(STORAGE_KEY);
};