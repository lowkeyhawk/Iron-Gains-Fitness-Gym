import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '../../config';

export function useInAppNotifications(userId) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        if (!userId) return;

        try {
            const res = await fetch(`${API_ENDPOINTS.GET_NOTIFICATIONS}&user_id=${userId}`);
            const data = await res.json();

            if (data.status === 'success') {
                setNotifications(data.notifications);
                setUnreadCount(data.unread_count);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchNotifications();

        // Poll every 30 seconds for new notifications
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const markAllRead = async () => {
        if (!userId) return;
        try {
            await fetch(API_ENDPOINTS.MARK_NOTIFICATIONS_READ, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId }),
            });
            // Update local state immediately
            setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark notifications as read:', err);
        }
    };

    const markOneRead = async (notificationId) => {
        try {
            await fetch(API_ENDPOINTS.MARK_NOTIFICATIONS_READ, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, notification_id: notificationId }),
            });
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, is_read: 1 } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    };

    return { notifications, unreadCount, loading, markAllRead, markOneRead, refetch: fetchNotifications };
}