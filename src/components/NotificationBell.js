import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    FlatList,
    StyleSheet,
    TouchableWithoutFeedback,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

function getIcon(type) {
    switch (type) {
        case 'payment':     return { name: 'checkmark-circle', color: '#22c55e' };
        case 'expiry':      return { name: 'warning',          color: '#f59e0b' };
        case 'renewal':     return { name: 'refresh-circle',   color: '#E3B23C' };
        case 'announcement':
        default:            return { name: 'megaphone',        color: '#E3B23C' };
    }
}

function formatDate(dateStr) {
    const utcString = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
    const date = new Date(utcString);
    return date.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function NotificationBell({ notifications, unreadCount, onMarkAllRead, onMarkOneRead }) {
    const [visible, setVisible] = useState(false);

    const handleOpen = () => setVisible(true);
    const handleClose = () => setVisible(false);

    const renderItem = ({ item }) => {
        const icon = getIcon(item.type);

        // Only show URL/redirect for expiry and renewal — not for payment confirmations
        const hasUrl = !!item.url && item.type !== 'payment';

        return (
            <TouchableOpacity
                style={[styles.notifItem, item.is_read == 0 && styles.unreadItem]}
                onPress={() => {
                    onMarkOneRead(item.id);
                    if (hasUrl) {
                        setVisible(false);
                        Linking.openURL(item.url);
                    }
                }}
                activeOpacity={0.7}
            >
                {/* Icon */}
                <View style={styles.notifIcon}>
                    <Ionicons name={icon.name} size={22} color={icon.color} />
                </View>

                {/* Content */}
                <View style={styles.notifContent}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    <Text style={styles.notifBody}>{item.body}</Text>
                    <Text style={styles.notifDate}>{formatDate(item.created_at)}</Text>

                    {/* Tap to pay label */}
                    {hasUrl && (
                        <View style={styles.tapToPayRow}>
                            <Ionicons name="card-outline" size={12} color="#E3B23C" />
                            <Text style={styles.tapToPayText}>Tap to pay now</Text>
                        </View>
                    )}
                </View>

                {/* Right indicator */}
                {hasUrl ? (
                    <Ionicons name="chevron-forward" size={16} color="#E3B23C" style={styles.chevron} />
                ) : (
                    item.is_read == 0 && <View style={styles.unreadDot} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <>
            {/* Bell Icon */}
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

            {/* Modal */}
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
                                        <TouchableOpacity onPress={onMarkAllRead}>
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
    bellButton: { position: 'relative', padding: 4 },
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
    badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
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
        borderRadius: 4,
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
    panelTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    markAllText: { color: '#E3B23C', fontSize: 13 },
    notifItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    unreadItem: { backgroundColor: '#262626' },
    notifIcon: { marginRight: 12, marginTop: 2 },
    notifContent: { flex: 1 },
    notifTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 3 },
    notifBody: { color: '#9CA3AF', fontSize: 13, lineHeight: 18, marginBottom: 5 },
    notifDate: { color: '#4B5563', fontSize: 11 },
    tapToPayRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    tapToPayText: { color: '#E3B23C', fontSize: 11, fontWeight: '600' },
    chevron: { marginTop: 6, marginLeft: 8 },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E3B23C', marginTop: 6, marginLeft: 8 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40 },
    emptyText: { color: '#4B5563', marginTop: 12, fontSize: 14 },
});