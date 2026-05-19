import { useEffect } from 'react';
import { Platform, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { API_ENDPOINTS } from '../../config';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export function useNotifications(userId) {
    // Register token when userId is available
    useEffect(() => {
        if (!userId) return;
        registerPushToken(userId);
    }, [userId]);

    // Notification tap listener — runs once on mount, no userId dependency
    useEffect(() => {
        // Handle tap when app is in foreground or background
        const tapSubscription = Notifications.addNotificationResponseReceivedListener(response => {
            const url = response.notification.request.content.data?.url;
            console.log('Notification tapped, data:', response.notification.request.content.data);
            if (url) {
                Linking.openURL(url);
            }
        });

        // Also handle last notification response
        // This handles the case when app was CLOSED and user taps notification
        Notifications.getLastNotificationResponseAsync().then(response => {
            if (!response) return;
            const url = response.notification.request.content.data?.url;
            console.log('Last notification response:', url);
            if (url) {
                Linking.openURL(url);
            }
        });

        return () => tapSubscription.remove();
    }, []); // ← empty dependency, runs once on mount
}

async function registerPushToken(userId) {
    console.log('Registering push token for user:', userId);

    if (!Device.isDevice) {
        console.log('Push notifications require a real device.');
        return;
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
            sound: 'default',
        });
    }

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

    try {
        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ??
            Constants?.easConfig?.projectId;

        if (!projectId) {
            console.error('❌ No projectId found.');
            return;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        const token = tokenData.data;

        console.log('✅ Expo Push Token:', token);

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
        console.error('❌ Failed to get push token:', err);
    }
}