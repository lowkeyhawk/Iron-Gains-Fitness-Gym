import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { API_ENDPOINTS } from '../../config';

// How to handle notifications when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export function useNotifications(userId) {
    useEffect(() => {
        if (!userId) return;
        registerPushToken(userId);
    }, [userId]);
}

async function registerPushToken(userId) {
    // Push notifications only work on real devices
    if (!Device.isDevice) {
        console.log('Push notifications require a real device.');
        return;
    }

    // Ask for permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Push notification permission denied.');
        return;
    }

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    console.log('Expo Push Token:', token);

    // Send token to PHP backend
    try {
        await fetch(API_ENDPOINTS.REGISTER_PUSH_TOKEN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                token_type: 'expo',
                token,
            }),
        });
    } catch (err) {
        console.error('Failed to register push token:', err);
    }
}