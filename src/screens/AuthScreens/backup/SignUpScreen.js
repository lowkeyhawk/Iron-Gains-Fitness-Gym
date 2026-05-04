import React, { useState, useContext } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS } from '../../../config';

export default function SignUpScreen({ navigation }) { // <-- add navigation
    const { setUserToken, setHasMembership, setUser } = useContext(AuthContext);

    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [birthday, setBirthday] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const formatBirthdayDisplay = (date) => {
        if (!date) return 'MM/DD/YYYY';
        const d = new Date(date);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${mm}/${dd}/${yyyy}`;
    };

    const handleSignUp = async () => {
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
                    birthday: birthday ? birthday.toISOString().split('T')[0] : null,
                    phoneNumber,
                    address,
                }),
            });

            const data = await response.json();

            if (data.status === 'success') {
                const token = data.token ?? 'logged-in';
                await AsyncStorage.setItem('userToken', token);
                await AsyncStorage.setItem('user', JSON.stringify(data.user));

                // Update context
                setUserToken(token);
                setUser(data.user);
                setHasMembership(false); // newly signed up → not subscribed
            } else {
                Alert.alert('Error', data.message);
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
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
        >

            {/* First Name */}
            <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.icon} />
                <TextInput
                    placeholder="First Name"
                    placeholderTextColor="#6B7280"
                    style={styles.input}
                    value={firstName}
                    onChangeText={setFirstName}
                />
            </View>

            {/* Middle Name */}
            <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.icon} />
                <TextInput
                    placeholder="Middle Name"
                    placeholderTextColor="#6B7280"
                    style={styles.input}
                    value={middleName}
                    onChangeText={setMiddleName}
                />
            </View>

            {/* Last Name */}
            <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.icon} />
                <TextInput
                    placeholder="Last Name"
                    placeholderTextColor="#6B7280"
                    style={styles.input}
                    value={lastName}
                    onChangeText={setLastName}
                />
            </View>

            {/* Email */}
            <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.icon} />
                <TextInput
                    placeholder="Email Address"
                    placeholderTextColor="#6B7280"
                    style={styles.input}
                    value={email}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onChangeText={setEmail}
                />
            </View>

            {/* Password */}
            <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.icon} />
                <TextInput
                    placeholder="Password"
                    placeholderTextColor="#6B7280"
                    style={styles.input}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={text => { setPassword(text); }}
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

            {/* Birthdate */}
            <TouchableOpacity
                style={styles.inputWrapper}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
            >
                <Ionicons name="calendar-outline" size={20} color="#6B7280" style={styles.icon} />
                <Text style={[styles.input, { color: birthday ? '#fff' : '#6B7280', fontSize: 16, paddingVertical: 20, marginLeft: 4 }]}>
                    {birthday ? formatBirthdayDisplay(birthday) : 'Birthdate: MM/DD/YYYY'}
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
                    placeholder="Phone Number"
                    placeholderTextColor="#6B7280"
                    style={styles.input}
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                />
            </View>

            {/* Address */}
            <View style={styles.inputWrapper}>
                <Ionicons name="location-outline" size={20} color="#6B7280" style={styles.icon} />
                <TextInput
                    placeholder="Address"
                    placeholderTextColor="#6B7280"
                    style={styles.input}
                    value={address}
                    onChangeText={setAddress}
                />
            </View>

            <TouchableOpacity
                style={[styles.button, loading && { opacity: 0.7 }]}
                onPress={handleSignUp}
                disabled={loading}
            >
                {loading
                    ? <ActivityIndicator color="#000" />
                    : <Text style={styles.buttonText}>Start Membership →</Text>
                }
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: { backgroundColor: '#191919' },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        paddingHorizontal: 12,
        marginBottom: 16,
        backgroundColor: '#191919',
    },
    icon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        color: '#fff',
        fontSize: 16,
        minHeight: 60,
    },
    dateInput: { borderBottomWidth: 1, borderBottomColor: '#333', paddingVertical: 14, paddingHorizontal: 16, marginBottom: 20, borderRadius: 4 },
    button: { backgroundColor: '#E3B23C', paddingVertical: 16, borderRadius: 8, marginTop: 20 },
    buttonText: { color: '#000', textAlign: 'center', fontSize: 16, fontFamily: 'Inter-Bold' },
});
