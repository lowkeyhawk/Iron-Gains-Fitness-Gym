import { useEffect } from 'react';
import { Platform, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants'; // 🆕
import { API_ENDPOINTS } from '../../config';

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

    // 🆕 Listen for notification tap
    useEffect(() => {
        const subscription = Notifications.addNotificationResponseReceivedListener(response => {
            const url = response.notification.request.content.data?.url;
            if (url) {
                // Open payment link when notification is tapped
                Linking.openURL(url);
            }
        });

        return () => subscription.remove();
    }, []);
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
            console.error('❌ No projectId found. Add it to app.json under extra.eas.projectId');
            return;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        const token = tokenData.data;

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