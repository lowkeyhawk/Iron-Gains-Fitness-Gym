import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS } from '../../../config';
import { useFocusEffect } from '@react-navigation/native';
import { useContext } from 'react';
import { registerPushToken } from '../../hooks/useNotifications'; // 🆕

export default function LoginScreen() {
    const { setUserToken, setHasMembership, setUser } = useContext(AuthContext);

    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const passwordRef = useRef(null);

    useFocusEffect(
        useCallback(() => {
            setEmail('');
            setPassword('');
            setError('');
            setSubmitted(false);
            setShowPassword(false);
        }, [])
    );

    const handleLogin = async () => {
        setSubmitted(true);
        setError('');

        if (!email.trim() || !password.trim()) {
            setError('Please enter both email and password');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(API_ENDPOINTS.LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (data.status === 'success') {
                const token = data.token ?? 'logged-in';

                await AsyncStorage.setItem('userToken', token);
                await AsyncStorage.setItem('user', JSON.stringify(data.user));

                if (data.user?.role === 'staff' || data.user?.role === 'admin') {
                    await AsyncStorage.setItem('staffToken', token);
                }

                setUserToken(token);
                setUser(data.user);
                setHasMembership(!!data.user?.plan);

                // 🆕 Register push token immediately after login
                registerPushToken(data.user.id);
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            console.error('❌ Login error:', err);
            setError('Network error or server problem');
        } finally {
            setLoading(false);
        }
    };

    const emailMissing    = submitted && !email.trim();
    const passwordMissing = submitted && !password.trim();

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            {/* Email */}
            <View style={[styles.inputWrapper, emailMissing && styles.inputWrapperError]}>
                <Ionicons
                    name="mail-outline"
                    size={22}
                    color={emailMissing ? '#ef4444' : '#6B7280'}
                    style={styles.icon}
                />
                <TextInput
                    placeholder="Email Address"
                    placeholderTextColor="#6B7280"
                    style={styles.input}
                    value={email}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    blurOnSubmit={false}
                    onChangeText={text => { setEmail(text); setError(''); }}
                />
            </View>
            {emailMissing && <Text style={styles.fieldError}>Email is required</Text>}

            {/* Password */}
            <View style={[styles.inputWrapper, passwordMissing && styles.inputWrapperError]}>
                <Ionicons
                    name="lock-closed-outline"
                    size={22}
                    color={passwordMissing ? '#ef4444' : '#6B7280'}
                    style={styles.icon}
                />
                <TextInput
                    ref={passwordRef}
                    placeholder="Password"
                    placeholderTextColor="#6B7280"
                    style={styles.input}
                    secureTextEntry={!showPassword}
                    value={password}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    onChangeText={text => { setPassword(text); setError(''); }}
                />
                <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color="#6B7280"
                    />
                </TouchableOpacity>
            </View>
            {passwordMissing && <Text style={styles.fieldError}>Password is required</Text>}

            {/* General error */}
            {error && !emailMissing && !passwordMissing ? (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : null}

            {/* Sign In Button */}
            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
            >
                {loading
                    ? <ActivityIndicator color="#000" />
                    : <Text style={styles.buttonText}>Sign In →</Text>
                }
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#191919',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        paddingHorizontal: 12,
        marginBottom: 16,
        backgroundColor: '#191919',
    },
    inputWrapperError: { borderBottomColor: '#ef4444' },
    icon: { marginRight: 10 },
    input: {
        flex: 1,
        paddingVertical: 16,
        color: '#fff',
        fontSize: 16,
        minHeight: 56,
    },
    eyeIcon: { padding: 8 },
    fieldError: {
        color: '#ef4444',
        fontSize: 12,
        marginLeft: 4,
        marginBottom: 12,
        marginTop: 2,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
        marginTop: 8,
        paddingHorizontal: 4,
    },
    errorText: { color: '#ef4444', fontSize: 14, flex: 1 },
    button: {
        backgroundColor: '#E3B23C',
        paddingVertical: 16,
        borderRadius: 8,
        marginTop: 24,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 54,
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: '#000', textAlign: 'center', fontSize: 16, fontWeight: 'bold' },
});