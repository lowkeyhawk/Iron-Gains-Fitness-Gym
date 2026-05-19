import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList,
    ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS } from '../../../config';

// ─── Format date nicely ───────────────────────────────────────────────────────
function formatDate(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const config = {
        paid: { color: '#22c55e', bg: '#052e16', label: 'Paid', icon: 'checkmark-circle' },
        pending: { color: '#f59e0b', bg: '#2d1f00', label: 'Pending', icon: 'time' },
        failed: { color: '#ef4444', bg: '#2d0a0a', label: 'Failed', icon: 'close-circle' },
    };
    const s = config[status] ?? config.pending;

    return (
        <View style={[styles.badge, { backgroundColor: s.bg }]}>
            <Ionicons name={s.icon} size={13} color={s.color} />
            <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
        </View>
    );
}

// ─── Single payment card ──────────────────────────────────────────────────────
function PaymentCard({ item }) {
    return (
        <View style={styles.card}>
            {/* Top row: plan name + status */}
            <View style={styles.cardHeader}>
                <View style={styles.planIconWrapper}>
                    <Ionicons name="barbell-outline" size={20} color="#E3B23C" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.planName}>{item.plan_name} Plan</Text>
                    <Text style={styles.planDuration}>{item.duration_days} days</Text>
                </View>
                <StatusBadge status={item.status} />
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Details */}
            <View style={styles.cardBody}>
                <View style={styles.row}>
                    <Text style={styles.label}>Amount</Text>
                    <Text style={styles.amount}>₱{parseFloat(item.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Method</Text>
                    <View style={styles.methodRow}>
                        <Ionicons name="phone-portrait-outline" size={14} color="#9CA3AF" />
                        <Text style={styles.methodValue}>
                            {item.payment_method}
                        </Text>
                    </View>
                </View>

                {item.paymongo_reference && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Reference</Text>
                        <Text style={[styles.value, { fontSize: 11 }]}>{item.paymongo_reference}</Text>
                    </View>
                )}

                <View style={styles.row}>
                    <Text style={styles.label}>Date</Text>
                    <Text style={styles.value}>{formatDate(item.paid_at ?? item.created_at)}</Text>
                </View>
            </View>
        </View>
    );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function History() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchHistory = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);

            const userData = await AsyncStorage.getItem('user');
            if (!userData) return;
            const { id: userId } = JSON.parse(userData);

            const res = await fetch(`${API_ENDPOINTS.PAYMENT_HISTORY}&user_id=${userId}`);
            const data = await res.json();

            if (data.status === 'success') {
                setPayments(data.payments);
            }
        } catch (err) {
            console.error('Failed to fetch payment history:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#E3B23C" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <FlatList
                data={payments}
                keyExtractor={item => item.id.toString()}
                ListHeaderComponent={
                    <Text style={styles.title}>Payment History</Text>
                }
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Ionicons name="receipt-outline" size={64} color="#374151" />
                        <Text style={styles.emptyTitle}>No payments yet</Text>
                        <Text style={styles.emptySubtitle}>Your payment history will appear here.</Text>
                    </View>
                }
                renderItem={({ item }) => <PaymentCard item={item} />}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchHistory(true)}
                        colors={['#E3B23C']}
                        progressBackgroundColor="#262626"
                    />
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#191919',
        paddingTop: 16,         // keep this
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#191919',
    },
    title: {
        color: '#fff',
        fontSize: 28,
        fontFamily: 'Inter-Bold',
        marginBottom: 24,
        textAlign: 'center',
    },

    // Card
    card: {
        backgroundColor: '#262626',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3d3d3d',
        marginBottom: 16,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    planIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1a1400',
        borderWidth: 1,
        borderColor: '#E3B23C33',
        justifyContent: 'center',
        alignItems: 'center',
    },
    planName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    planDuration: {
        color: '#6B7280',
        fontSize: 12,
        marginTop: 2,
    },

    // Badge
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 4,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },

    divider: {
        height: 1,
        backgroundColor: '#2d2d2d',
        marginHorizontal: 16,
    },

    // Body rows
    cardBody: {
        padding: 16,
        gap: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        color: '#6B7280',
        fontSize: 13,
    },
    value: {
        color: '#D1D5DB',
        fontSize: 13,
    },
    methodValue: {
        textTransform: 'uppercase',
        color: '#D1D5DB',
    },
    amount: {
        color: '#E3B23C',
        fontSize: 18,
        fontWeight: 'bold',
    },
    methodRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },

    // Empty state
    emptyTitle: {
        color: '#6B7280',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
    },
    emptySubtitle: {
        color: '#4B5563',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
});