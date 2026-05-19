import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, ActivityIndicator, Alert, AppState, Linking,
    RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS } from '../../../config';
import { AuthContext } from '../../context/AuthContext';

export default function RenewScreen({ navigation }) {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [payingPlanId, setPayingPlanId] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    const { setUser } = useContext(AuthContext);

    const appState = useRef(AppState.currentState);
    const isWaitingForPayment = useRef(false);
    const selectedPlanRef = useRef(null);

    const fetchData = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (!userData) return;
            const parsedUser = JSON.parse(userData);
            setCurrentUser(parsedUser);

            // Fetch all plans
            const plansRes = await fetch(API_ENDPOINTS.GET_MEMBERSHIP_PLANS);
            const plansData = await plansRes.json();
            if (plansData.status === 'success') {
                setPlans(plansData.plans);
            }
        } catch (err) {
            console.error('Error fetching plans:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Pull to refresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData();
    }, []);

    // AppState listener — refresh user data when coming back from payment
    useEffect(() => {
        const subscription = AppState.addEventListener('change', async nextAppState => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active' &&
                isWaitingForPayment.current
            ) {
                isWaitingForPayment.current = false;
                Alert.alert(
                    '⏳ Verifying Payment...',
                    'Please wait while we confirm your payment.',
                    [{ text: 'OK', onPress: () => refreshUserData() }]
                );
            }
            appState.current = nextAppState;
        });
        return () => subscription.remove();
    }, []);

    const refreshUserData = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (!userData) return;
            const { id: userId } = JSON.parse(userData);

            let attempts = 0;
            const pollInterval = setInterval(async () => {
                attempts++;
                const res = await fetch(API_ENDPOINTS.GET_USER_MEMBERSHIP, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userId }),
                });
                const data = await res.json();

                if (data.status === 'success' && data.plan) {
                    clearInterval(pollInterval);

                    const storedUser = JSON.parse(await AsyncStorage.getItem('user'));
                    const normalizedPlan = {
                        ...data.plan,
                        expires_at: data.plan.expires_at || data.plan.end_date,
                        end_date:   data.plan.end_date   || data.plan.expires_at,
                    };
                    const updatedUser = { ...storedUser, plan: normalizedPlan };

                    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                    setUser(updatedUser);
                    setPayingPlanId(null);

                    Alert.alert(
                        '✅ Renewal Successful!',
                        `Your ${normalizedPlan.name} membership has been renewed.`,
                        [{
                            text: 'OK',
                            onPress: () => navigation.goBack(), // go back to Profile
                        }]
                    );
                } else if (attempts >= 10) {
                    clearInterval(pollInterval);
                    setPayingPlanId(null);
                    Alert.alert('Processing', 'Your payment is being processed. Please wait a moment.');
                }
            }, 3000);
        } catch (err) {
            console.error('Refresh error:', err);
            setPayingPlanId(null);
        }
    };

    const handlePayment = async (plan) => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (!userData) return;
            const { id: userId } = JSON.parse(userData);

            setPayingPlanId(plan.id);
            selectedPlanRef.current = plan;

            const res = await fetch(API_ENDPOINTS.CREATE_PAYMENT_LINK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    plan_id: plan.id,
                }),
            });

            const data = await res.json();

            if (data.status !== 'success') {
                Alert.alert('Payment Error', data.message || 'Could not create payment link.');
                setPayingPlanId(null);
                return;
            }

            isWaitingForPayment.current = true;
            await Linking.openURL(data.checkout_url);

        } catch (err) {
            console.error('Payment error:', err);
            Alert.alert('Error', 'Something went wrong. Please try again.');
            setPayingPlanId(null);
        }
    };

    // Filter plans based on member_type
    const visiblePlans = plans
        .filter(plan => {
            if (
                currentUser?.memberType === 'regular' &&
                plan.name.toLowerCase() === 'student'
            ) return false;
            return true;
        })
        .sort((a, b) => {
            // Highlight current plan first
            if (a.id === currentUser?.plan?.id) return -1;
            if (b.id === currentUser?.plan?.id) return 1;
            return 0;
        });

    if (loading) {
        return (
            <View style={[styles.scrollWrapper, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#E3B23C" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.scrollWrapper}
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#E3B23C']}
                    progressBackgroundColor="#262626"
                />
            }
        >
            <Text style={styles.title}>Choose a Plan</Text>
            <Text style={styles.subtitle}>Select a plan to renew your membership.</Text>

            {visiblePlans.map(plan => {
                const isCurrentPlan = plan.name === currentUser?.plan?.name;

                return (
                    <View
                        key={plan.id}
                        style={[
                            styles.planCard,
                            isCurrentPlan && styles.planCardCurrent,
                        ]}
                    >
                        {/* Current plan badge */}
                        {isCurrentPlan && (
                            <View style={styles.currentBadge}>
                                <Ionicons name="checkmark-circle" size={13} color="#E3B23C" />
                                <Text style={styles.currentBadgeText}>Current Plan</Text>
                            </View>
                        )}

                        <Text style={styles.planName}>{plan.name}</Text>

                        <View style={styles.priceRow}>
                            <Text style={styles.planPrice}>₱{plan.price}</Text>
                            <Text style={styles.priceSuffix}> /month</Text>
                        </View>

                        <Text style={styles.mainText}>{plan.description}</Text>

                        <View>
                            <Text style={styles.listText}>Access to all equipments</Text>
                            <Text style={styles.listText}>Locker room access</Text>
                            <Text style={styles.listText}>Shower access</Text>
                            <Text style={styles.listText}>Basic fitness app access</Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                isCurrentPlan && styles.buttonCurrent,
                                payingPlanId === plan.id && { opacity: 0.6 },
                            ]}
                            onPress={() => handlePayment(plan)}
                            disabled={payingPlanId !== null}
                        >
                            {payingPlanId === plan.id ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <Text style={styles.buttonText}>
                                    {isCurrentPlan ? `Renew — ₱${plan.price}` : `Switch to ${plan.name} — ₱${plan.price}`}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollWrapper: {
        flex: 1,
        backgroundColor: '#191919',
    },
    container: {
        paddingTop: 24,
        paddingHorizontal: 24,
        paddingBottom: 120,
    },
    title: {
        color: '#fff',
        fontSize: 28,
        marginBottom: 8,
        fontFamily: 'Inter-Bold',
        textAlign: 'center',
    },
    subtitle: {
        color: '#9CA3AF',
        fontSize: 14,
        marginBottom: 32,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },

    // Plan card
    planCard: {
        backgroundColor: '#262626',
        padding: 20,
        marginBottom: 24,
        borderRadius: 8,
        borderColor: '#3d3d3d',
        borderWidth: 1,
    },
    planCardCurrent: {
        borderColor: '#E3B23C',
        borderWidth: 2,
    },

    // Current plan badge
    currentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#1a1400',
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        alignSelf: 'flex-start',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E3B23C44',
    },
    currentBadgeText: {
        color: '#E3B23C',
        fontSize: 12,
        fontWeight: 'bold',
    },

    priceRow: { flexDirection: 'row', alignItems: 'flex-end' },
    priceSuffix: { fontSize: 16, color: '#6B7280', marginLeft: 4, paddingBottom: 4 },
    planName: { color: '#fff', fontSize: 24, fontFamily: 'Inter-Bold' },
    planPrice: { color: '#E3B23C', fontSize: 32, marginTop: 16, fontFamily: 'Inter-Bold' },
    mainText: { fontSize: 14, color: '#9CA3AF', fontFamily: 'Inter-Regular', marginVertical: 24 },
    listText: { fontSize: 14, color: '#D1D5DB', marginVertical: 12 },

    // Buttons
    button: {
        backgroundColor: '#E3B23C',
        paddingVertical: 16,
        borderRadius: 8,
        marginTop: 24,
    },
    buttonCurrent: {
        backgroundColor: '#E3B23C',
    },
    buttonText: {
        color: '#000',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
    },
});