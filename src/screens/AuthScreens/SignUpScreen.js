import React, { useState, useContext, useRef, useCallback } from 'react';
import {
    View, TextInput, TouchableOpacity, Text, StyleSheet,
    ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS } from '../../../config';
import { useFocusEffect } from '@react-navigation/native';

// ─── Validation helpers ───────────────────────────────────────────────────────
const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const passwordRules = [
    { label: 'At least 8 characters',      test: (p) => p.length >= 8 },
    { label: 'At least 1 uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { label: 'At least 1 number',           test: (p) => /[0-9]/.test(p) },
];

const isPasswordValid = (p) => passwordRules.every((r) => r.test(p));

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title }) {
    return (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    );
}

export default function SignUpScreen({ navigation }) {
    const { setUserToken, setHasMembership, setUser } = useContext(AuthContext);

    const [firstName, setFirstName]             = useState('');
    const [middleName, setMiddleName]           = useState('');
    const [lastName, setLastName]               = useState('');
    const [email, setEmail]                     = useState('');
    const [password, setPassword]               = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [birthday, setBirthday]               = useState(null);
    const [phoneNumber, setPhoneNumber]         = useState('');
    const [address, setAddress]                 = useState('');
    const [showDatePicker, setShowDatePicker]   = useState(false);
    const [loading, setLoading]                 = useState(false);
    const [showPassword, setShowPassword]       = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [memberType, setMemberType]           = useState('regular');
    const [showPasswordRules, setShowPasswordRules] = useState(false);
    const [submitted, setSubmitted]             = useState(false);

    // Email check state
    const [emailTaken, setEmailTaken]       = useState(false);
    const [checkingEmail, setCheckingEmail] = useState(false);
    const emailCheckTimer                   = useRef(null);

    const middleNameRef      = useRef(null);
    const lastNameRef        = useRef(null);
    const phoneRef           = useRef(null);
    const addressRef         = useRef(null);
    const emailRef           = useRef(null);
    const passwordRef        = useRef(null);
    const confirmPasswordRef = useRef(null);

    // 🆕 Clear all fields when tab is focused
    useFocusEffect(
        useCallback(() => {
            setFirstName('');
            setMiddleName('');
            setLastName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setBirthday(null);
            setPhoneNumber('');
            setAddress('');
            setMemberType('regular');
            setShowPassword(false);
            setShowConfirmPassword(false);
            setEmailTaken(false);
            setSubmitted(false);
            setShowPasswordRules(false);
        }, [])
    );

    const formatBirthdayDisplay = (date) => {
        if (!date) return 'MM/DD/YYYY';
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const yyyy = date.getFullYear();
        return `${mm}/${dd}/${yyyy}`;
    };

    // Debounced email check
    const handleEmailChange = (text) => {
        setEmail(text);
        setEmailTaken(false);

        if (emailCheckTimer.current) clearTimeout(emailCheckTimer.current);
        if (!isValidEmail(text)) return;

        emailCheckTimer.current = setTimeout(async () => {
            setCheckingEmail(true);
            try {
                const res = await fetch(API_ENDPOINTS.CHECK_EMAIL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: text }),
                });
                const data = await res.json();
                setEmailTaken(data.taken);
            } catch (err) {
                console.error('Email check error:', err);
            } finally {
                setCheckingEmail(false);
            }
        }, 800);
    };

    const handleSignUp = async () => {
        setSubmitted(true);

        if (!firstName.trim() || !lastName.trim() || !email.trim()) {
            Alert.alert('Missing Fields', 'Please fill in required fields.');
            return;
        }
        if (!email.trim() || !isValidEmail(email)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }
        if (emailTaken) {
            Alert.alert('Email Taken', 'This email is already registered. Please use a different email.');
            return;
        }
        if (!isPasswordValid(password)) {
            Alert.alert('Weak Password', 'Password must be at least 8 characters, contain 1 uppercase letter and 1 number.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Password Mismatch', 'Passwords do not match. Please try again.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(API_ENDPOINTS.SIGN_UP, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName, middleName, lastName, email, password,
                    birthday: birthday ? birthday.toISOString().split('T')[0] : null,
                    phoneNumber, address, memberType,
                }),
            });

            const data = await response.json();

            if (data.status === 'success') {
                const token = data.token ?? 'logged-in';
                await AsyncStorage.setItem('userToken', token);
                await AsyncStorage.setItem('user', JSON.stringify(data.user));
                setUserToken(token);
                setUser(data.user);
                setHasMembership(false);
                Alert.alert('Success', 'Account created successfully!');
            } else {
                Alert.alert('Error', data.message || 'Signup failed');
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Network error or server problem');
        } finally {
            setLoading(false);
        }
    };

    // Validation states
    const emailTouched   = email.length > 0;
    const emailValid     = isValidEmail(email);
    const confirmTouched = confirmPassword.length > 0;
    const passwordsMatch = password === confirmPassword;
    const pwValid        = isPasswordValid(password);
    const pwTouched      = password.length > 0;

    // Email field status
    const emailError   = emailTouched && (!emailValid || emailTaken);
    const emailSuccess = emailTouched && emailValid && !emailTaken && !checkingEmail;

    // 🆕 Missing required fields after submit
    const firstNameMissing = submitted && !firstName.trim();
    const lastNameMissing  = submitted && !lastName.trim();
    const emailMissing     = submitted && !email.trim();
    const passwordMissing  = submitted && !password.trim();
    const confirmMissing   = submitted && !confirmPassword.trim();

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            {/* ── Member Type Toggle ──────────────────────── */}
            <View style={styles.toggleContainer}>
                <TouchableOpacity
                    style={[styles.toggleBtn, memberType === 'regular' && styles.toggleBtnActive]}
                    onPress={() => setMemberType('regular')}
                    activeOpacity={0.8}
                >
                    <Ionicons name="fitness-outline" size={16} color={memberType === 'regular' ? '#000' : '#6B7280'} />
                    <Text style={[styles.toggleText, memberType === 'regular' && styles.toggleTextActive]}>Regular</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleBtn, memberType === 'student' && styles.toggleBtnActive]}
                    onPress={() => setMemberType('student')}
                    activeOpacity={0.8}
                >
                    <Ionicons name="school-outline" size={16} color={memberType === 'student' ? '#000' : '#6B7280'} />
                    <Text style={[styles.toggleText, memberType === 'student' && styles.toggleTextActive]}>Student</Text>
                </TouchableOpacity>
            </View>

            {/* Note */}
            <View style={styles.note}>
                <Ionicons name="information-circle-outline" size={14} color="#E3B23C" />
                <Text style={styles.noteText}>
                    {memberType === 'student'
                        ? 'Student ID verification required after signup to unlock student pricing.'
                        : 'Enjoy instant access — no verification required to start availing plans.'}
                </Text>
            </View>

            {/* ── Personal Information ─────────────────────── */}
            <SectionHeader title="PERSONAL INFORMATION" />

            {/* First Name */}
            <View style={[styles.inputWrapper, firstNameMissing && styles.inputWrapperError]}>
                <Ionicons name="person-outline" size={20} color={firstNameMissing ? '#ef4444' : '#6B7280'} style={styles.icon} />
                <TextInput
                    style={styles.input}
                    placeholder="First Name *"
                    placeholderTextColor="#6B7280"
                    value={firstName}
                    onChangeText={setFirstName}
                    returnKeyType="next"
                    onSubmitEditing={() => middleNameRef.current?.focus()}
                    blurOnSubmit={false}
                />
            </View>
            {/* {firstNameMissing && <Text style={styles.fieldError}>First name is required</Text>} */}

            {/* Middle Name */}
            <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.icon} />
                <TextInput
                    ref={middleNameRef}
                    style={styles.input}
                    placeholder="Middle Name (Optional)"
                    placeholderTextColor="#6B7280"
                    value={middleName}
                    onChangeText={setMiddleName}
                    returnKeyType="next"
                    onSubmitEditing={() => lastNameRef.current?.focus()}
                    blurOnSubmit={false}
                />
            </View>

            {/* Last Name */}
            <View style={[styles.inputWrapper, lastNameMissing && styles.inputWrapperError]}>
                <Ionicons name="person-outline" size={20} color={lastNameMissing ? '#ef4444' : '#6B7280'} style={styles.icon} />
                <TextInput
                    ref={lastNameRef}
                    style={styles.input}
                    placeholder="Last Name *"
                    placeholderTextColor="#6B7280"
                    value={lastName}
                    onChangeText={setLastName}
                    returnKeyType="next"
                    onSubmitEditing={() => phoneRef.current?.focus()}
                    blurOnSubmit={false}
                />
            </View>
            {/* {lastNameMissing && <Text style={styles.fieldError}>Last name is required</Text>} */}

            {/* Birthday */}
            <TouchableOpacity style={styles.inputWrapper} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
                <Ionicons name="calendar-outline" size={20} color="#6B7280" style={styles.icon} />
                <Text style={[styles.input, { color: birthday ? '#fff' : '#6B7280', paddingVertical: 18, lineHeight: 22 }]}>
                    {birthday ? formatBirthdayDisplay(birthday) : 'Birthday: MM/DD/YYYY'}
                </Text>
            </TouchableOpacity>

            {showDatePicker && (
                <DateTimePicker
                    value={birthday || new Date()}
                    mode="date"
                    display="default"
                    onChange={(e, d) => { setShowDatePicker(false); if (d) setBirthday(d); }}
                    maximumDate={new Date()}
                />
            )}

            {/* Phone */}
            <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color="#6B7280" style={styles.icon} />
                <TextInput
                    ref={phoneRef}
                    style={styles.input}
                    placeholder="Phone Number"
                    placeholderTextColor="#6B7280"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    returnKeyType="next"
                    onSubmitEditing={() => addressRef.current?.focus()}
                    blurOnSubmit={false}
                />
            </View>

            {/* Address */}
            <View style={styles.inputWrapper}>
                <Ionicons name="location-outline" size={20} color="#6B7280" style={styles.icon} />
                <TextInput
                    ref={addressRef}
                    style={styles.input}
                    placeholder="Address"
                    placeholderTextColor="#6B7280"
                    value={address}
                    onChangeText={setAddress}
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                    blurOnSubmit={false}
                />
            </View>

            {/* ── Account Details ──────────────────────────── */}
            <SectionHeader title="ACCOUNT DETAILS" />

            {/* Email */}
            <View style={[
                styles.inputWrapper,
                (emailError || emailMissing) && styles.inputWrapperError,
                emailSuccess && styles.inputWrapperSuccess,
            ]}>
                <Ionicons
                    name="mail-outline"
                    size={20}
                    color={emailError || emailMissing ? '#ef4444' : emailSuccess ? '#22c55e' : '#6B7280'}
                    style={styles.icon}
                />
                <TextInput
                    ref={emailRef}
                    style={styles.input}
                    placeholder="Email Address *"
                    placeholderTextColor="#6B7280"
                    value={email}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onChangeText={handleEmailChange}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    blurOnSubmit={false}
                />
                {emailTouched && (
                    checkingEmail ? (
                        <ActivityIndicator size="small" color="#E3B23C" />
                    ) : (
                        <Ionicons
                            name={emailSuccess ? 'checkmark-circle' : 'close-circle'}
                            size={18}
                            color={emailSuccess ? '#22c55e' : '#ef4444'}
                        />
                    )
                )}
            </View>
            {/* {emailMissing && <Text style={styles.fieldError}>Email is required</Text>} */}
            {emailTouched && !emailValid && <Text style={styles.fieldError}>Please enter a valid email address</Text>}
            {emailTouched && emailValid && emailTaken && <Text style={styles.fieldError}>This email is already registered</Text>}

            {/* Password */}
            <View style={[
                styles.inputWrapper,
                (passwordMissing || (pwTouched && !pwValid)) && styles.inputWrapperError,
                pwTouched && pwValid && styles.inputWrapperSuccess,
            ]}>
                <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={passwordMissing || (pwTouched && !pwValid) ? '#ef4444' : pwTouched && pwValid ? '#22c55e' : '#6B7280'}
                    style={styles.icon}
                />
                <TextInput
                    ref={passwordRef}
                    style={styles.input}
                    placeholder="Password *"
                    placeholderTextColor="#6B7280"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setShowPasswordRules(true)}
                    onBlur={() => setShowPasswordRules(false)}
                    returnKeyType="next"
                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                    blurOnSubmit={false}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#6B7280" />
                </TouchableOpacity>
            </View>
            {/* {passwordMissing && <Text style={styles.fieldError}>Password is required</Text>} */}

            {/* Password rules */}
            <View style={styles.rulesBox}>
                {passwordRules.map((rule, idx) => {
                    const passed = rule.test(password);
                    return (
                        <View key={idx} style={styles.ruleRow}>
                            <Ionicons
                                name={passed ? 'checkmark-circle' : 'ellipse-outline'}
                                size={13}
                                color={passed ? '#22c55e' : '#6B7280'}
                            />
                            <Text style={[styles.ruleText, passed && styles.ruleTextPassed]}>{rule.label}</Text>
                        </View>
                    );
                })}
            </View>

            {/* Confirm Password */}
            <View style={[
                styles.inputWrapper,
                (confirmMissing || (confirmTouched && !passwordsMatch)) && styles.inputWrapperError,
                confirmTouched && passwordsMatch && styles.inputWrapperSuccess,
            ]}>
                <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={confirmMissing || (confirmTouched && !passwordsMatch) ? '#ef4444' : confirmTouched && passwordsMatch ? '#22c55e' : '#6B7280'}
                    style={styles.icon}
                />
                <TextInput
                    ref={confirmPasswordRef}
                    style={styles.input}
                    placeholder="Confirm Password *"
                    placeholderTextColor="#6B7280"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    returnKeyType="done"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#6B7280" />
                </TouchableOpacity>
            </View>
            {/* {confirmMissing && <Text style={styles.fieldError}>Please confirm your password</Text>} */}
            {confirmTouched && !passwordsMatch && <Text style={styles.fieldError}>Passwords do not match</Text>}

            {/* ── Submit ───────────────────────────────────── */}
            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSignUp}
                disabled={loading}
                activeOpacity={0.8}
            >
                {loading ? (
                    <ActivityIndicator color="#000" />
                ) : (
                    <Text style={styles.buttonText}>
                        {memberType === 'student' ? 'Sign Up & Verify →' : 'Start Membership →'}
                    </Text>
                )}
            </TouchableOpacity>

            <View style={{ height: 60 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#191919' },
    scrollContent: { paddingBottom: 20 },

    // Toggle
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#262626',
        borderRadius: 8,
        padding: 4,
        marginBottom: 12,
        marginTop: 24,
        borderWidth: 1,
        borderColor: '#3d3d3d',
    },
    toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 6 },
    toggleBtnActive: { backgroundColor: '#E3B23C' },
    toggleText: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
    toggleTextActive: { color: '#000', fontWeight: 'bold' },

    // Note
    note: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#1a1400', borderRadius: 8, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#E3B23C33' },
    noteText: { flex: 1, color: '#E3B23C', fontSize: 11, lineHeight: 16 },

    // Section header
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 32, marginBottom: 8, gap: 10 },
    sectionTitle: { color: '#6B7280', fontSize: 13, fontWeight: '600' },

    // Input fields
    inputWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#333', paddingHorizontal: 4, marginBottom: 4, backgroundColor: '#191919' },
    inputWrapperError: { borderBottomColor: '#ef4444' },
    inputWrapperSuccess: { borderBottomColor: '#22c55e' },
    icon: { marginRight: 10 },
    input: { flex: 1, paddingVertical: 16, color: '#fff', fontSize: 16, minHeight: 56 },

    // Password rules
    rulesBox: { backgroundColor: '#1f1f1f', borderRadius: 8, padding: 10, marginBottom: 4, marginTop: 2, gap: 5, borderWidth: 1, borderColor: '#2d2d2d' },
    ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    ruleText: { color: '#6B7280', fontSize: 12 },
    ruleTextPassed: { color: '#22c55e' },

    // Feedback
    fieldError: { color: '#ef4444', fontSize: 12, marginLeft: 4, marginBottom: 8, marginTop: 2 },
    successText: { color: '#22c55e', fontSize: 12, marginLeft: 4, marginBottom: 4, marginTop: 2 },

    // Button
    button: { backgroundColor: '#E3B23C', paddingVertical: 16, borderRadius: 8, marginTop: 24, alignItems: 'center', justifyContent: 'center', minHeight: 54 },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
});