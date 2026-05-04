import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, ActivityIndicator, Alert, AppState, Linking,
    RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { API_ENDPOINTS } from '../../../config';
import { AuthContext } from '../../context/AuthContext';

export default function Membership({ navigation }) {
    const [plans, setPlans] = useState([]);
    const [subscribedPlan, setSubscribedPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [payingPlanId, setPayingPlanId] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    const { setHasMembership, setUser } = useContext(AuthContext);

    const appState = useRef(AppState.currentState);
    const isWaitingForPayment = useRef(false);

    const fetchData = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (!userData) return;
            const parsedUser = JSON.parse(userData);
            const { id } = parsedUser;

            // Fetch fresh verification_status from get_members API
            try {
                const membersRes = await fetch(
                    `${API_ENDPOINTS.GET_MEMBERS}?search=${parsedUser.email}&limit=1`
                );
                const membersData = await membersRes.json();

                if (membersData.status === 'success' && membersData.data?.length > 0) {
                    const freshData = membersData.data[0];
                    const freshUser = {
                        ...parsedUser,
                        verification_status: freshData.verification_status,
                        memberType: freshData.member_type,
                    };
                    await AsyncStorage.setItem('user', JSON.stringify(freshUser));
                    setCurrentUser(freshUser);
                    setUser(freshUser);
                } else {
                    setCurrentUser(parsedUser);
                }
            } catch (err) {
                console.error('Failed to fetch fresh user data:', err);
                setCurrentUser(parsedUser);
            }

            // Fetch all plans
            const plansRes = await fetch(API_ENDPOINTS.GET_MEMBERSHIP_PLANS);
            const plansData = await plansRes.json();
            if (plansData.status === 'success') {
                setPlans(plansData.plans);
            }

            // Fetch user's current plan
            const userPlanRes = await fetch(API_ENDPOINTS.GET_USER_MEMBERSHIP, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: id }),
            });
            const userPlanData = await userPlanRes.json();
            if (userPlanData.status === 'success' && userPlanData.plan) {
                setSubscribedPlan(userPlanData.plan);
            } else {
                setSubscribedPlan(null);
            }
        } catch (err) {
            console.error('Error fetching membership data:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Reload every time screen is focused
    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            setSubscribedPlan(null);
            fetchData();
        }, [])
    );

    // Pull to refresh handler
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        setSubscribedPlan(null);
        await fetchData();
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
                        end_date: data.plan.end_date || data.plan.expires_at,
                    };

                    const updatedUser = {
                        ...storedUser,
                        plan: normalizedPlan,
                    };

                    // Refresh token
                    try {
                        const tokenRes = await fetch(API_ENDPOINTS.REFRESH_TOKEN, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ user_id: userId }),
                        });

                        const tokenData = await tokenRes.json();

                        if (tokenData.status === 'success') {
                            await AsyncStorage.setItem('userToken', tokenData.token);
                        } else {
                            console.error('❌ Token refresh failed:', tokenData.message);
                        }
                    } catch (err) {
                        console.error('❌ Token refresh error:', err);
                    }

                    // Update storage + context
                    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

                    setUser(updatedUser);
                    setHasMembership(true);
                    setPayingPlanId(null);

                    Alert.alert(
                        '✅ Payment Successful!',
                        `Your ${normalizedPlan.name} membership is now active.`,
                        [{ text: 'OK' }]
                    );

                } else if (attempts >= 10) {
                    clearInterval(pollInterval);
                    setPayingPlanId(null);

                    Alert.alert(
                        'Processing',
                        'Your payment is being processed. Please wait a moment.'
                    );
                }
            }, 3000);

        } catch (err) {
            console.error('Refresh error:', err);
            setPayingPlanId(null);
        }
    };

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
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

    const handlePayment = async (plan) => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (!userData) return;
            const { id: userId } = JSON.parse(userData);

            setPayingPlanId(plan.id);

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

    // Filter + sort plans based on member_type
    const visiblePlans = plans
        .filter(plan => {
            if (
                currentUser?.memberType === 'regular' &&
                plan.name.toLowerCase() === 'student'
            ) return false;
            return true;
        })
        .sort((a, b) => {
            if (currentUser?.memberType === 'student') {
                if (a.name.toLowerCase() === 'student') return -1;
                if (b.name.toLowerCase() === 'student') return 1;
            }
            return 0;
        });

    if (loading) {
        return (
            <View style={[styles.scrollWrapper, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#E3B23C" />
            </View>
        );
    }

    // Shared RefreshControl
    const refreshControl = (
        <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#E3B23C']}
            progressBackgroundColor="#262626"
        />
    );

    // If user is subscribed, show only their plan
    if (subscribedPlan) {
        return (
            <ScrollView
                style={styles.scrollWrapper}
                contentContainerStyle={styles.container}
                refreshControl={refreshControl}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.title}>Your Current Plan</Text>
                <View style={styles.planCard}>
                    <Text style={styles.planName}>{subscribedPlan.name}</Text>

                    <View style={styles.priceRow}>
                        <Text style={styles.planPrice}>₱{subscribedPlan.price}</Text>
                        <Text style={styles.priceSuffix}> /month</Text>
                    </View>

                    <Text style={styles.mainText}>Expires on: {subscribedPlan.end_date}</Text>

                    <TouchableOpacity style={[styles.button, { opacity: 0.4 }]} disabled>
                        <Text style={[styles.buttonText, { color: '#2a2a2a' }]}>Subscribed</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    }

    // If user is NOT subscribed, show filtered plans
    return (
        <ScrollView
            style={styles.scrollWrapper}
            contentContainerStyle={styles.container}
            refreshControl={refreshControl}
            showsVerticalScrollIndicator={false}
        >
            <Text style={styles.title}>Membership Plans</Text>
            <Text style={styles.subtitle}>Choose the level of access that fits your lifestyle.</Text>

            {visiblePlans.map((plan, index) => {
                const isStudentPlan = plan.name.toLowerCase() === 'student';
                const isStudent     = currentUser?.memberType === 'student';
                const isPending     = currentUser?.verification_status === 'pending';
                const isDisabled    = payingPlanId !== null ||
                    (isStudentPlan && isStudent && isPending);

                return (
                    <React.Fragment key={plan.id}>

                        {/* "Other Plan Options" divider */}
                        {isStudent && !isStudentPlan && index === 1 && (
                            <View style={styles.otherPlansLabel}>
                                <View style={styles.otherPlansLine} />
                                <Text style={styles.otherPlansText}>Other Plan Options</Text>
                                <View style={styles.otherPlansLine} />
                            </View>
                        )}

                        {/* Plan Card */}
                        <View
                            style={[
                                styles.planCard,
                                isStudentPlan && isStudent && styles.planCardRecommended,
                            ]}
                        >
                            {/* Recommended badge */}
                            {isStudentPlan && isStudent && (
                                <View style={styles.recommendedBadge}>
                                    <Text style={styles.recommendedText}>⭐ Recommended for You</Text>
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

                            {/* Pending verification notice */}
                            {isStudentPlan && isStudent && isPending && (
                                <View style={styles.pendingNotice}>
                                    <Ionicons name="time-outline" size={16} color="#f59e0b" />
                                    <Text style={styles.pendingText}>
                                        Your student ID is under review. This plan will be available once verified.
                                    </Text>
                                </View>
                            )}

                            {/* Pay button */}
                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    payingPlanId === plan.id && { opacity: 0.6 },
                                    isDisabled && styles.buttonDisabled,
                                ]}
                                onPress={() => handlePayment(plan)}
                                disabled={isDisabled}
                            >
                                {payingPlanId === plan.id ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <Text style={[
                                        styles.buttonText,
                                        isDisabled && styles.buttonTextDisabled,
                                    ]}>
                                        {isStudentPlan && isStudent && isPending
                                            ? 'Verification Pending'
                                            : `Pay — ₱${plan.price}`
                                        }
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>

                    </React.Fragment>
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
        paddingTop: 40,
        paddingHorizontal: 24,
        paddingBottom: 120,
    },
    title: { color: '#fff', fontSize: 30, marginBottom: 20, fontFamily: 'Inter-Bold', textAlign: 'center' },
    subtitle: { color: '#9CA3AF', fontSize: 16, marginBottom: 40, fontFamily: 'Inter-Regular', textAlign: 'center' },

    // Plan card
    planCard: {
        backgroundColor: '#262626',
        padding: 20,
        marginBottom: 24,
        borderRadius: 8,
        borderColor: '#3d3d3d',
        borderWidth: 1,
    },
    planCardRecommended: {
        borderColor: '#E3B23C',
        borderWidth: 2,
    },

    // Recommended badge
    recommendedBadge: {
        backgroundColor: '#1a1400',
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        alignSelf: 'flex-start',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E3B23C44',
    },
    recommendedText: {
        color: '#E3B23C',
        fontSize: 12,
        fontWeight: 'bold',
    },

    // Other plans divider
    otherPlansLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 10,
    },
    otherPlansLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#3d3d3d',
    },
    otherPlansText: {
        color: '#6B7280',
        fontSize: 13,
        fontWeight: '600',
    },

    // Pending notice
    pendingNotice: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        backgroundColor: '#2d1f00',
        borderRadius: 8,
        padding: 10,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#f59e0b44',
    },
    pendingText: {
        flex: 1,
        color: '#f59e0b',
        fontSize: 12,
        lineHeight: 18,
    },

    priceRow: { flexDirection: 'row', alignItems: 'flex-end' },
    priceSuffix: { fontSize: 16, color: '#6B7280', marginLeft: 4, paddingBottom: 4 },
    planName: { color: '#fff', fontSize: 24, fontFamily: 'Inter-Bold' },
    planPrice: { color: '#E3B23C', fontSize: 32, marginTop: 16, fontFamily: 'Inter-Bold' },
    mainText: { fontSize: 14, color: '#9CA3AF', fontFamily: 'Inter-Regular', marginVertical: 24 },
    listText: { fontSize: 14, color: '#D1D5DB', marginVertical: 12 },

    // Buttons
    button: { backgroundColor: '#E3B23C', paddingVertical: 16, borderRadius: 8, marginTop: 24 },
    buttonDisabled: { backgroundColor: '#3a3a3a', opacity: 0.6 },
    buttonText: { color: '#000', textAlign: 'center', fontSize: 16, fontWeight: 'bold' },
    buttonTextDisabled: { color: '#6B7280' },
});