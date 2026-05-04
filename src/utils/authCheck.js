import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../../config';

export const checkAuthToken = async (logout) => {
    try {
        const token = await AsyncStorage.getItem('userToken');

        if (!token) {
            logout();
            return false;
        }

        const res = await fetch(API_ENDPOINTS.VALIDATE_TOKEN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ auth_token: token }),
        });

        const data = await res.json();

        if (data.status !== 'success') {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('user');

            logout();
            return false;
        }

        return true;

    } catch (err) {
        console.error('Auth check error:', err);
        return false;
    }
};