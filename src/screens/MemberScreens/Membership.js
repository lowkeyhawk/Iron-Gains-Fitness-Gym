import React, { useEffect, useState, useContext, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, ActivityIndicator, Alert, AppState, Linking,
    RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../../../config';
import { AuthContext } from '../../context/AuthContext';

export default function Membership({ navigation }) {
    const [plans, setPlans] = useState([]);
    const [subscribedPlan, setSubscribedPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [payingPlanId, setPayingPlanId] = useState(null);

    const [user, setLocalUser] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const { setHasMembership, setUser } = useContext(AuthContext);

    const appState = useRef(AppState.currentState);
    const isWaitingForPayment = useRef(false);

    // -------------------------
    // FETCH USER FROM SERVER (IMPORTANT FIX)
    // -------------------------
    const fetchUser = async () => {
        const stored = await AsyncStorage.getItem('user');
        if (!stored) return null;

        const parsed = JSON.parse(stored);

        const res = await fetch(API_ENDPOINTS.GET_USER_MEMBERSHIP, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: parsed.id }),
        });

        const data = await res.json();
        console.log('LIVE USER DATA:', data);

        // merge backend result into user object
        const updatedUser = {
            ...parsed,
            ...data.user,
            verification_status: data?.verification_status || parsed.verification_status
        };

        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        setLocalUser(updatedUser);

        return updatedUser;
    };

    // -------------------------
    // FETCH DATA
    // -------------------------
    const fetchData = async () => {
        try {
            const user = await fetchUser();
            if (!user) return;

            const userId = user.id;

            // GET PLANS
            const plansRes = await fetch(API_ENDPOINTS.GET_MEMBERSHIP_PLANS);
            const plansData = await plansRes.json();

            if (plansData.status === 'success') {
                let filtered = plansData.plans;

                if (user.memberType === 'student') {
                    filtered = filtered.filter(p =>
                        p.name.toLowerCase().includes('student')
                    );
                } else {
                    filtered = filtered.filter(p =>
                        !p.name.toLowerCase().includes('student')
                    );
                }

                setPlans(filtered);
            }

            // USER PLAN
            const userPlanRes = await fetch(API_ENDPOINTS.GET_USER_MEMBERSHIP, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId }),
            });

            const userPlanData = await userPlanRes.json();

            if (userPlanData.status === 'success') {
                setSubscribedPlan(userPlanData.plan);
            }

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // -------------------------
    // PULL TO REFRESH
    // -------------------------
    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // -------------------------
    // CHECK VERIFICATION (LIVE)
    // -------------------------
    const isStudentUnverified =
        user?.memberType === 'student' &&
        user?.verification_status !== 'approved';       

    // -------------------------
    // PAYMENT
    // -------------------------
    const handlePayment = async (plan) => {
        try {
            const stored = await AsyncStorage.getItem('user');
            const { id } = JSON.parse(stored);

            setPayingPlanId(plan.id);

            const res = await fetch(API_ENDPOINTS.CREATE_PAYMENT_LINK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: id,
                    plan_id: plan.id,
                }),
            });

            const data = await res.json();

            if (data.status !== 'success') {
                Alert.alert('Error', data.message);
                setPayingPlanId(null);
                return;
            }

            isWaitingForPayment.current = true;
            await Linking.openURL(data.checkout_url);

        } catch (err) {
            console.error(err);
            setPayingPlanId(null);
        }
    };

    // -------------------------
    // LOADING
    // -------------------------
    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#E3B23C" />
            </View>
        );
    }

    // -------------------------
    // SUBSCRIBED VIEW (UNCHANGED UI)
    // -------------------------
    if (subscribedPlan) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Your Current Plan</Text>

                <View style={styles.planCard}>
                    <Text style={styles.planName}>{subscribedPlan.name}</Text>

                    <View style={styles.priceRow}>
                        <Text style={styles.planPrice}>₱{subscribedPlan.price}</Text>
                        <Text style={styles.priceSuffix}> /month</Text>
                    </View>

                    <Text style={styles.mainText}>
                        Expires on: {subscribedPlan.end_date}
                    </Text>

                    <TouchableOpacity style={[styles.button, { opacity: 0.4 }]} disabled>
                        <Text style={[styles.buttonText, { color: '#2a2a2a' }]}>
                            Subscribed
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // -------------------------
    // MAIN UI
    // -------------------------
    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <Text style={styles.title}>Membership Plans</Text>
            <Text style={styles.subtitle}>Choose the level of access that fits your lifestyle.</Text>

            {plans.map(plan => (
                <View key={plan.id} style={styles.planCard}>

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
                            (payingPlanId === plan.id || isStudentUnverified) && { opacity: 0.6 }
                        ]}
                        onPress={() => handlePayment(plan)}
                        disabled={payingPlanId !== null || isStudentUnverified}
                    >
                        {payingPlanId === plan.id ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={styles.buttonText}>
                                Pay — ₱{plan.price}
                            </Text>
                        )}
                    </TouchableOpacity>

                    {isStudentUnverified && (
                        <Text style={{
                            color: '#EF4444',
                            fontSize: 12,
                            marginTop: 10,
                            textAlign: 'center'
                        }}>
                            Your account is pending verification approval.
                        </Text>
                    )}

                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#191919', paddingTop: 40, paddingHorizontal: 24 },
    title: { color: '#fff', fontSize: 30, marginBottom: 20, fontFamily: 'Inter-Bold', textAlign: 'center' },
    subtitle: { color: '#9CA3AF', fontSize: 16, marginBottom: 40, fontFamily: 'Inter-Regular', textAlign: 'center' },
    planCard: {
        backgroundColor: '#262626',
        padding: 20,
        marginBottom: 24,
        borderRadius: 8,
        borderColor: '#3d3d3d',
        borderWidth: 1,
    },
    priceRow: { flexDirection: 'row', alignItems: 'flex-end' },
    priceSuffix: { fontSize: 16, color: '#6B7280', marginLeft: 4, paddingBottom: 4 },
    planName: { color: '#fff', fontSize: 24, fontFamily: 'Inter-Bold' },
    planPrice: { color: '#E3B23C', fontSize: 32, marginTop: 16, fontFamily: 'Inter-Bold' },
    mainText: { fontSize: 14, color: '#9CA3AF', fontFamily: 'Inter-Regular', marginVertical: 24 },
    listText: { fontSize: 14, color: '#D1D5DB', marginVertical: 12 },
    button: { backgroundColor: '#E3B23C', paddingVertical: 16, borderRadius: 8, marginTop: 24 },
    buttonText: { color: '#000', textAlign: 'center', fontSize: 16, fontWeight: 'bold' },
});