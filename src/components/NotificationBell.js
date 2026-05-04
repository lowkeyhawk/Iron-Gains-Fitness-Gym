import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    FlatList,
    StyleSheet,
    TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Icon per notification type
function getIcon(type) {
    switch (type) {
        case 'payment':     return { name: 'checkmark-circle', color: '#22c55e' };
        case 'expiry':      return { name: 'warning',          color: '#f59e0b' };
        case 'announcement':
        default:            return { name: 'megaphone',        color: '#E3B23C' };
    }
}

// Format timestamp nicely
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function NotificationBell({ notifications, unreadCount, onMarkAllRead, onMarkOneRead }) {
    const [visible, setVisible] = useState(false);

    const handleOpen = () => {
        setVisible(true);
    };

    const handleClose = () => {
        setVisible(false);
    };

    const handleMarkAll = () => {
        onMarkAllRead();
    };

    const renderItem = ({ item }) => {
        const icon = getIcon(item.type);
        return (
            <TouchableOpacity
                style={[styles.notifItem, item.is_read == 0 && styles.unreadItem]}
                onPress={() => onMarkOneRead(item.id)}
                activeOpacity={0.7}
            >
                <View style={styles.notifIcon}>
                    <Ionicons name={icon.name} size={22} color={icon.color} />
                </View>
                <View style={styles.notifContent}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    <Text style={styles.notifBody}>{item.body}</Text>
                    <Text style={styles.notifDate}>{formatDate(item.created_at)}</Text>
                </View>
                {item.is_read == 0 && <View style={styles.unreadDot} />}
            </TouchableOpacity>
        );
    };

    return (
        <>
            {/* Bell Icon Button */}
            <TouchableOpacity onPress={handleOpen} style={styles.bellButton}>
                <Ionicons name="notifications-outline" size={26} color="#fff" />
                {unreadCount > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* Notifications Modal */}
            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={handleClose}
            >
                <TouchableWithoutFeedback onPress={handleClose}>
                    <View style={styles.overlay}>
                        <TouchableWithoutFeedback>
                            <SafeAreaView style={styles.panel}>
                                {/* Header */}
                                <View style={styles.panelHeader}>
                                    <Text style={styles.panelTitle}>Notifications</Text>
                                    {unreadCount > 0 && (
                                        <TouchableOpacity onPress={handleMarkAll}>
                                            <Text style={styles.markAllText}>Mark all read</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* List */}
                                {notifications.length === 0 ? (
                                    <View style={styles.emptyContainer}>
                                        <Ionicons name="notifications-off-outline" size={48} color="#4B5563" />
                                        <Text style={styles.emptyText}>No notifications yet</Text>
                                    </View>
                                ) : (
                                    <FlatList
                                        data={notifications}
                                        keyExtractor={item => item.id.toString()}
                                        renderItem={renderItem}
                                        showsVerticalScrollIndicator={false}
                                        contentContainerStyle={{ paddingBottom: 20 }}
                                    />
                                )}
                            </SafeAreaView>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    bellButton: {
        position: 'relative',
        padding: 4,
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 3,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },

    // Modal
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 60,
        paddingRight: 16,
    },
    panel: {
        backgroundColor: '#1f1f1f',
        borderRadius: 12,
        width: 320,
        maxHeight: 480,
        borderColor: '#3d3d3d',
        borderWidth: 1,
    },
    panelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2d2d2d',
    },
    panelTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    markAllText: {
        color: '#E3B23C',
        fontSize: 13,
    },

    // Notification item
    notifItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    unreadItem: {
        backgroundColor: '#262626',
    },
    notifIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    notifContent: {
        flex: 1,
    },
    notifTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 3,
    },
    notifBody: {
        color: '#9CA3AF',
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 5,
    },
    notifDate: {
        color: '#4B5563',
        fontSize: 11,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E3B23C',
        marginTop: 6,
        marginLeft: 8,
    },

    // Empty state
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        color: '#4B5563',
        marginTop: 12,
        fontSize: 14,
    },
});