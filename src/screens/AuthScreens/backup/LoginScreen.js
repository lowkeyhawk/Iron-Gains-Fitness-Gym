import React, { useState, useContext } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS } from '../../../config';

export default function LoginScreen() {
    const { setUserToken, setHasMembership, setUser } = useContext(AuthContext);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        setError('');

        if (!email.trim() || !password.trim()) {
            setError('Please enter both email and password');
            return;
        }

        setLoading(true);

        try {
            console.log('=== ATTEMPTING LOGIN ===');
            console.log('Email:', email);
            console.log('API URL:', API_ENDPOINTS.LOGIN);

            const response = await fetch(`${API_ENDPOINTS.LOGIN}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            console.log('=== LOGIN RESPONSE ===');
            console.log('Status:', data.status);
            console.log('User:', JSON.stringify(data.user, null, 2));
            console.log('User Role:', data.user?.role);
            console.log('Token:', data.token);
            console.log('=====================');

            if (data.status === 'success') {
                const token = data.token ?? 'logged-in';

                // Save to AsyncStorage
                await AsyncStorage.setItem('userToken', token);
                await AsyncStorage.setItem('user', JSON.stringify(data.user));

                console.log('=== SAVING TO STORAGE ===');
                console.log('Saved user:', JSON.stringify(data.user, null, 2));

                // Save staffToken for staff/admin
                if (data.user?.role === 'staff' || data.user?.role === 'admin') {
                    await AsyncStorage.setItem('staffToken', token);
                    console.log('✅ Staff token saved');
                }

                // Update context
                setUserToken(token);
                setUser(data.user);
                setHasMembership(!!data.user?.plan);

                console.log('✅ Context updated');
                console.log('========================');
            } else {
                console.log('❌ Login failed:', data.message);
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            console.error('❌ Login error:', err);
            setError('Network error or server problem');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                {/* Email */}
                <View style={[styles.inputWrapper, error && styles.inputError]}>
                    <Ionicons name="mail-outline" size={24} color="#6B7280" style={[styles.icon, { paddingTop: 1 }]} />
                    <TextInput
                        placeholder="Email Address"
                        placeholderTextColor="#6B7280"
                        style={[styles.input, error ? styles.inputError : null]}
                        value={email}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        onChangeText={text => { setEmail(text); setError(''); }}
                    />
                </View>

                {/* Password */}
                <View style={[styles.inputWrapper, error && styles.inputError]}>
                    <Ionicons name="lock-closed-outline" size={24} color="#6B7280" style={[styles.icon, { paddingTop: 6 }]} />
                    <TextInput
                        placeholder="Password"
                        placeholderTextColor="#6B7280"
                        style={[styles.input, error ? styles.inputError : null, { marginTop: 8 }]}
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={text => { setPassword(text); setError(''); }}
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                    >
                        <Ionicons
                            name={showPassword ? "eye-outline" : "eye-off-outline"}
                            size={20}
                            color="#6B7280"
                        />
                    </TouchableOpacity>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity
                    style={[styles.button, loading && { opacity: 0.7 }]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Sign In →</Text>}
                </TouchableOpacity>

                {/* <Text style={styles.forgot}>Forgot your password?</Text> */}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    container: {
        flexGrow: 1,
        backgroundColor: '#191919',
        justifyContent: 'center',
        // paddingHorizontal: 20,
    },
    formContainer: {
        width: '100%',
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
    icon: { marginRight: 8 },
    input: { flex: 1, paddingVertical: 12, color: '#fff', fontSize: 16, minHeight: 60 },
    inputError: { borderBottomColor: 'red' },
    errorText: { color: 'red', marginBottom: 16, fontSize: 14 },
    button: { backgroundColor: '#E3B23C', paddingVertical: 16, borderRadius: 8, marginTop: 12 },
    buttonText: { color: '#000', textAlign: 'center', fontSize: 16, fontFamily: 'Inter-Bold' },
    forgot: { color: '#E3B23C', textAlign: 'center', marginTop: 32 },
});