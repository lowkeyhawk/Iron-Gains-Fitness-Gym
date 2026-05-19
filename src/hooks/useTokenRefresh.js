import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../../config';

export function useTokenRefresh(userId) {
    const intervalRef = useRef(null);

    const refreshToken = async () => {
        if (!userId) return;
        try {
            const res = await fetch(API_ENDPOINTS.REFRESH_TOKEN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId }),
            });
            const data = await res.json();
            if (data.status === 'success') {
                await AsyncStorage.setItem('userToken', data.token);
                console.log('✅ Token refreshed');
            }
        } catch (err) {
            console.error('Token refresh error:', err);
        }
    };

    useEffect(() => {
        if (!userId) return;
        refreshToken(); // refresh immediately on mount
        // refresh every 11 hours — before 12hr expiry
        intervalRef.current = setInterval(refreshToken, 11 * 60 * 60 * 1000);
        return () => clearInterval(intervalRef.current);
    }, [userId]);
}