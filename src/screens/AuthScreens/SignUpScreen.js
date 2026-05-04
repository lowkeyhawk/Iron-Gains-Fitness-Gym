import React, { useState, useContext, useRef } from 'react';
import {
    View, TextInput, TouchableOpacity, Text, StyleSheet,
    ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS } from '../../../config';

export default function SignUpScreen({ navigation }) {
    const { setUserToken, setHasMembership, setUser } = useContext(AuthContext);

    const [firstName, setFirstName]     = useState('');
    const [middleName, setMiddleName]   = useState('');
    const [lastName, setLastName]       = useState('');
    const [email, setEmail]             = useState('');
    const [password, setPassword]       = useState('');
    const [birthday, setBirthday]       = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress]         = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading]         = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [memberType, setMemberType]   = useState('regular');

    // Refs for jumping between fields on "next"
    const middleNameRef = useRef(null);
    const lastNameRef   = useRef(null);
    const emailRef      = useRef(null);
    const passwordRef   = useRef(null);
    const phoneRef      = useRef(null);
    const addressRef    = useRef(null);

    const formatBirthdayDisplay = (date) => {
        if (!date) return 'MM/DD/YYYY';
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const yyyy = date.getFullYear();
        return `${mm}/${dd}/${yyyy}`;
    };

    const handleSignUp = async () => {
        if (
            !firstName.trim() ||
            !lastName.trim() ||
            !email.trim() ||
            !password.trim()
        ) {
            Alert.alert('Missing Fields', 'Please fill in all required fields.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(API_ENDPOINTS.SIGN_UP, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName,
                    middleName,
                    lastName,
                    email,
                    password,
                    birthday: birthday
                        ? birthday.toISOString().split('T')[0]
                        : null,
                    phoneNumber,
                    address,
                    memberType,
                }),
            });

            const data = await response.json();

            if (data.status === 'success') {

                const token = data.token ?? 'logged-in';

                // ✅ Save session
                await AsyncStorage.setItem('userToken', token);
                await AsyncStorage.setItem('user', JSON.stringify(data.user));

                // ✅ Update global state (THIS triggers RootNavigator)
                setUserToken(token);
                setUser(data.user);
                setHasMembership(false);

                /**
                 * 🚀 IMPORTANT FIX:
                 * DO NOT navigate manually anywhere.
                 * RootNavigator will automatically:
                 * - send student → VerificationStack
                 * - send member → MainTabs
                 */

                Alert.alert(
                    'Success',
                    'Account created successfully!'
                );

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

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            {/* ── Member Type Toggle ──────────────────────── */}
            <View style={styles.toggleSection}>
                <Text style={styles.toggleLabel}>I am a:</Text>
                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, memberType === 'regular' && styles.toggleBtnActive]}
                        onPress={() => setMemberType('regular')}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name="fitness-outline"
                            size={16}
                            color={memberType === 'regular' ? '#000' : '#6B7280'}
                        />
                        <Text style={[styles.toggleText, memberType === 'regular' && styles.toggleTextActive]}>
                            Regular
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.toggleBtn, memberType === 'student' && styles.toggleBtnActive]}
                        onPress={() => setMemberType('student')}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name="school-outline"
                            size={16}
                            color={memberType === 'student' ? '#000' : '#6B7280'}
                        />
                        <Text style={[styles.toggleText, memberType === 'student' && styles.toggleTextActive]}>
                            Student
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Student note */}
            {memberType === 'student' && (
                <View style={styles.studentNote}>
                    <Ionicons name="information-circle-outline" size={15} color="#E3B23C" />
                    <Text style={styles.studentNoteText}>
                        Student ID verification is required after signup to unlock student pricing.
                    </Text>
                </View>
            )}

            {memberType === 'regular' && (
                <View style={styles.studentNote}>
                    <Ionicons name="information-circle-outline" size={15} color="#E3B23C" />
                    <Text style={styles.studentNoteText}>
                        Enjoy instant access — no verification required to start availing plans.
                    </Text>
                </View>
            )}

            {/* ── Form Fields ─────────────────────────────── */}

            {/* First Name */}
            <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.icon} />
                <TextInput
                    placeholder="First Name *"
                    placeholderTextColor="#6B7280"
                    style={styles.input}
                    value={firstName}
                    onChangeText={setFirstName}
                    returnKeyType="next"
                    onSubmitEditing={() => middleNameRef.current?.focus()}
                    blurOnSubmit={false}
                />
            </View>

            {/* Middle Name */}
            <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.icon} />
                <TextInput
                    ref={middleNameRef}
                    placeholder="Middle Name (Optional)"
                    placeholderTextColor="#6B7280"
                    style={styles.input}
                    value={middleName}
                    onChangeText={setMiddleName}
                    returnKeyType="next"
                    onSubmitEditing={() => lastNameRef.current?.focus()}
                    blurOnSubmit={false}
                />
            </View>

            {/* Last Name */}
            <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.icon} />
                <TextInput
                    ref={lastNameRef}
                    placeholder="Last Name *"
                    placeholderTextColor="#6B7280"
                    style={styles.input}
                    value={lastName}
                    onChangeText={setLastName}
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                    blurOnSubmit={false}
                />
            </View>

            {/* Email */}
            <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.icon} />
                <TextInput
                    ref={emailRef}
                    placeholder="Email Address *"
                    placeholderTextColor="#6B7280"
                    style={styles.input}
                    value={email}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onChangeText={setEmail}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    blurOnSubmit={false}
                />
            </View>

            {/* Password */}
            <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.icon} />
                <TextInput
                    ref={passwordRef}
                    placeholder="Password *"
                    placeholderTextColor="#6B7280"
                    style={styles.input}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    returnKeyType="next"
                    onSubmitEditing={() => phoneRef.current?.focus()}
                    blurOnSubmit={false}
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

            {/* Birthdate */}
            <TouchableOpacity
                style={styles.inputWrapper}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
            >
                <Ionicons name="calendar-outline" size={20} color="#6B7280" style={styles.icon} />
                <Text style={[styles.input, {
                    color: birthday ? '#fff' : '#6B7280',
                    paddingVertical: 18,
                    lineHeight: 22,
                }]}>
                    {birthday ? formatBirthdayDisplay(birthday) : 'Birthday: MM/DD/YYYY'}
                </Text>
            </TouchableOpacity>

            {showDatePicker && (
                <DateTimePicker
                    value={birthday || new Date()}
                    mode="date"
                    display="default"
                    onChange={(e, d) => {
                        setShowDatePicker(false);
                        if (d) setBirthday(d);
                    }}
                    maximumDate={new Date()}
                />
            )}

            {/* Phone */}
            <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color="#6B7280" style={styles.icon} />
                <TextInput
                    ref={phoneRef}
                    placeholder="Phone Number"
                    placeholderTextColor="#6B7280"
                    style={styles.input}
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
                    placeholder="Address"
                    placeholderTextColor="#6B7280"
                    style={styles.input}
                    value={address}
                    onChangeText={setAddress}
                    returnKeyType="done"
                />
            </View>

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

            {/* Extra space so last field clears keyboard */}
            <View style={{ height: 60 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#191919',
    },
    scrollContent: {
        paddingHorizontal: 4,
        paddingTop: 8,
        paddingBottom: 20,
    },

    // Toggle
    toggleSection: {
        marginTop: 16,
    },

    toggleLabel: {
        color: '#9CA3AF',
        fontSize: 16,
        marginBottom: 8,
        marginLeft: 4,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#262626',
        borderRadius: 8,
        padding: 6,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#3d3d3d',
    },
    toggleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 6,
    },
    toggleBtnActive: {
        backgroundColor: '#E3B23C',
    },
    toggleText: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '600',
    },
    toggleTextActive: {
        color: '#000',
        fontWeight: 'bold',
    },

    // Student note
    studentNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        backgroundColor: '#1a1400',
        borderRadius: 8,
        padding: 10,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E3B23C44',
    },
    studentNoteText: {
        flex: 1,
        color: '#E3B23C',
        fontSize: 12,
        lineHeight: 18,
    },

    // Inputs
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        paddingHorizontal: 4,
        marginBottom: 4,
        backgroundColor: '#191919',
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        color: '#fff',
        fontSize: 16,
        minHeight: 56,
    },
    eyeIcon: {
        padding: 8,
    },

    // Button
    button: {
        backgroundColor: '#E3B23C',
        paddingVertical: 16,
        borderRadius: 8,
        marginTop: 24,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 54,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#000',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
    },
});