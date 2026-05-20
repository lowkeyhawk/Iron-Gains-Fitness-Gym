import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Alert,
    TextInput,
    ActivityIndicator,
    Modal,
    Keyboard,
    RefreshControl,
    KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { API_ENDPOINTS, API_BASE_URL } from '../../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

export default function StaffProfile({ navigation }) {
    const { user, logout, setUser } = useContext(AuthContext);
    const [profileImage, setProfileImage] = useState(null);

    const [formData, setFormData] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        phone_number: '',
    });

    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [showNewPasswordRules, setShowNewPasswordRules] = useState(false);

    const passwordRules = [
        { label: 'At least 8 characters',      test: (p) => p.length >= 8 },
        { label: 'At least 1 uppercase letter', test: (p) => /[A-Z]/.test(p) },
        { label: 'At least 1 number',           test: (p) => /[0-9]/.test(p) },
    ];

    const isPasswordValid = (p) => passwordRules.every((r) => r.test(p));

    const staffId = user?.id;

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                middle_name: user.middle_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone_number: user.phone_number || '',
            });
            // 🆕 Sync profileImage on user load
            if (user.profile_picture) {
                setProfileImage(user.profile_picture);
            }
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;
        const changed =
            formData.first_name !== (user.first_name || '') ||
            formData.middle_name !== (user.middle_name || '') ||
            formData.last_name !== (user.last_name || '') ||
            formData.email !== (user.email || '') ||
            formData.phone_number !== (user.phone_number || '');
        setHasChanges(changed);
    }, [formData, user]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePasswordChange = (field, value) => {
        setPasswordData(prev => ({ ...prev, [field]: value }));
    };

    const openPasswordModal = () => {
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        setShowPasswordModal(true);
    };

    const closePasswordModal = () => {
        setShowPasswordModal(false);
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        setShowNewPasswordRules(false);
    };

    const handleChangePassword = async () => {
        if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
            Alert.alert('Error', 'All fields are required');
            return;
        }
        if (!isPasswordValid(passwordData.new_password)) {
            Alert.alert('Weak Password', 'Password must be at least 8 characters, contain 1 uppercase letter and 1 number.');
            return;
        }
        if (passwordData.new_password !== passwordData.confirm_password) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }
        setIsChangingPassword(true);
        try {
            const response = await fetch(API_ENDPOINTS.CHANGE_PASSWORD_STAFF, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: staffId,
                    current_password: passwordData.current_password,
                    new_password: passwordData.new_password,
                }),
            });
            const result = await response.json();
            if (result.status === 'success') {
                Alert.alert('Success', 'Password changed successfully!');
                closePasswordModal();
            } else {
                Alert.alert('Error', result.message || 'Failed to change password');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to change password. Please try again.');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleDiscardChanges = () => {
        Alert.alert('Discard Changes', 'Are you sure you want to discard your changes?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Discard',
                style: 'destructive',
                onPress: () => {
                    setFormData({
                        first_name: user.first_name || '',
                        middle_name: user.middle_name || '',
                        last_name: user.last_name || '',
                        email: user.email || '',
                        phone_number: user.phone_number || '',
                    });
                    Keyboard.dismiss();
                },
            },
        ]);
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            const payload = {
                id: user.id,
                first_name: formData.first_name,
                middle_name: formData.middle_name,
                last_name: formData.last_name,
                email: formData.email,
                phone_number: formData.phone_number,
            };

            const response = await fetch(API_ENDPOINTS.UPDATE_PROFILE_STAFF, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();

            if (result.status === 'success') {
                const updatedUser = { ...user, ...formData };
                setUser(updatedUser);
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                Keyboard.dismiss();
                Alert.alert('Success', 'Profile updated successfully!');
            } else {
                Alert.alert('Error', result.message || 'Failed to update profile');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const formatMemberSince = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    // 🆕 Fixed handleChangeAvatar — same as member Profile
    const handleChangeAvatar = async () => {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('Permission required', 'Please allow access to your photos.');
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });
            if (result.canceled) return;

            const image = result.assets[0];
            const formData = new FormData();
            formData.append('user_id', user.id);
            formData.append('role', user.role);
            formData.append('avatar', {
                uri: image.uri,
                name: 'avatar.jpg',
                type: 'image/jpeg',
            });

            const res = await fetch(`${API_BASE_URL}/upload-avatar.php`, {
                method: 'POST',
                body: formData,
                headers: { Accept: 'application/json' },
            });

            const text = await res.text();
            let data;
            try { data = JSON.parse(text); } catch (e) {
                Alert.alert('Error', 'Server returned invalid response');
                return;
            }

            if (data.status === 'success') {
                // 🆕 Fix double api/ in URL
                const newAvatarUrl = data.profile_picture.startsWith('http')
                    ? data.profile_picture.replace(/\/api\/api\//g, '/api/')
                    : `${API_BASE_URL}/uploads/${data.profile_picture}`;

                const updatedUser = { ...user, profile_picture: newAvatarUrl };
                setUser(updatedUser);
                setProfileImage(newAvatarUrl);
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                Alert.alert('Success', 'Profile picture updated!');
            } else {
                Alert.alert('Error', data.message || 'Upload failed');
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Something went wrong while uploading image.');
        }
    };

    const handleLogout = () => {
        if (hasChanges) {
            Alert.alert('Unsaved Changes', 'You have unsaved changes. Do you want to discard them?', [
                { text: 'Discard & Logout', style: 'destructive', onPress: logout },
                { text: 'Cancel', style: 'cancel' },
            ]);
        } else {
            Alert.alert('Logout', 'Are you sure you want to logout?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', onPress: logout, style: 'destructive' },
            ]);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const parsed = JSON.parse(userData);
                try {
                    console.log('Fetching:', `${API_ENDPOINTS.GET_STAFF_DETAILS}?staff_id=${parsed.id}`);
                    const res = await fetch(
                        `${API_ENDPOINTS.GET_STAFF_DETAILS}?staff_id=${parsed.id}`
                    );
                    const data = await res.json();
                    if (data.status === 'success' && data.data) {
                        const freshUser = {
                            ...parsed,
                            ...data.data,
                            profile_picture: parsed.profile_picture, // keep existing
                        };
                        await AsyncStorage.setItem('user', JSON.stringify(freshUser));
                        setUser(freshUser);
                        if (freshUser.profile_picture) setProfileImage(freshUser.profile_picture);
                        setFormData({
                            first_name: freshUser.first_name || '',
                            middle_name: freshUser.middle_name || '',
                            last_name: freshUser.last_name || '',
                            email: freshUser.email || '',
                            phone_number: freshUser.phone_number || '',
                        });
                        return; // ✅ API succeeded, skip fallback
                    }
                } catch (apiErr) {
                    console.error('API fetch failed, using AsyncStorage:', apiErr);
                }

                // Fallback to AsyncStorage if API fails
                setUser(parsed);
                if (parsed.profile_picture) setProfileImage(parsed.profile_picture);
                setFormData({
                    first_name: parsed.first_name || '',
                    middle_name: parsed.middle_name || '',
                    last_name: parsed.last_name || '',
                    email: parsed.email || '',
                    phone_number: parsed.phone_number || '',
                });
            }
        } catch (err) {
            console.error('Refresh error:', err);
        } finally {
            setRefreshing(false);
        }
    }, []);

    return (
        <>
            <ScrollView
                style={styles.container}
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
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <View style={[styles.roleBadge]}>
                        <Text style={styles.roleText}>
                            {user?.role === 'admin' ? 'Admin' : 'Staff'}
                        </Text>
                    </View>
                </View>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.profileSection}>
                        <View style={styles.avatarContainer}>
                            {profileImage || user?.profile_picture ? (
                                <Image
                                    source={{ uri: profileImage || user?.profile_picture }}
                                    style={styles.avatar}
                                />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Ionicons name="person" size={50} color="#666" />
                                </View>
                            )}
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.userName}>
                                {[user?.first_name, user?.middle_name, user?.last_name]
                                    .filter(Boolean).join(' ') || 'Staff'}
                            </Text>
                            <TouchableOpacity
                                style={[styles.changeAvatarButton, isSaving && { opacity: 0.6 }]}
                                onPress={handleChangeAvatar}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator size="small" color="#000" />
                                ) : (
                                    <Ionicons name="camera" size={16} color="#000" />
                                )}
                                <Text style={styles.changeAvatarText}>
                                    {isSaving ? 'Uploading...' : 'Change Avatar'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Personal Information */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Personal Information</Text>
                        {hasChanges && (
                            <TouchableOpacity onPress={handleDiscardChanges}>
                                <Text style={styles.discardText}>Discard</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={styles.infoCard}>
                        <View style={styles.inputRow}>
                            <Ionicons name="person-outline" size={20} color="#E3B23C" />
                            <View style={styles.inputContent}>
                                <Text style={styles.inputLabel}>First Name</Text>
                                <View style={styles.inputWithIcon}>
                                    <TextInput style={styles.input} value={formData.first_name} onChangeText={(v) => handleInputChange('first_name', v)} placeholder="Enter first name" placeholderTextColor="#666" />
                                    <Ionicons name="create-outline" size={16} color="#888" style={styles.editIcon} />
                                </View>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.inputRow}>
                            <Ionicons name="person-outline" size={20} color="#E3B23C" />
                            <View style={styles.inputContent}>
                                <Text style={styles.inputLabel}>Middle Name (Optional)</Text>
                                <View style={styles.inputWithIcon}>
                                    <TextInput style={styles.input} value={formData.middle_name} onChangeText={(v) => handleInputChange('middle_name', v)} placeholder="Enter middle name" placeholderTextColor="#666" />
                                    <Ionicons name="create-outline" size={16} color="#888" style={styles.editIcon} />
                                </View>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.inputRow}>
                            <Ionicons name="person-outline" size={20} color="#E3B23C" />
                            <View style={styles.inputContent}>
                                <Text style={styles.inputLabel}>Last Name</Text>
                                <View style={styles.inputWithIcon}>
                                    <TextInput style={styles.input} value={formData.last_name} onChangeText={(v) => handleInputChange('last_name', v)} placeholder="Enter last name" placeholderTextColor="#666" />
                                    <Ionicons name="create-outline" size={16} color="#888" style={styles.editIcon} />
                                </View>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.inputRow}>
                            <Ionicons name="mail-outline" size={20} color="#E3B23C" />
                            <View style={styles.inputContent}>
                                <Text style={styles.inputLabel}>Email</Text>
                                <View style={styles.inputWithIcon}>
                                    <TextInput style={styles.input} value={formData.email} onChangeText={(v) => handleInputChange('email', v)} placeholder="Enter email" placeholderTextColor="#666" keyboardType="email-address" autoCapitalize="none" />
                                    <Ionicons name="create-outline" size={16} color="#888" style={styles.editIcon} />
                                </View>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.inputRow}>
                            <Ionicons name="call-outline" size={20} color="#E3B23C" />
                            <View style={styles.inputContent}>
                                <Text style={styles.inputLabel}>Phone</Text>
                                <View style={styles.inputWithIcon}>
                                    <TextInput style={styles.input} value={formData.phone_number} onChangeText={(v) => handleInputChange('phone_number', v)} placeholder="Enter phone number" placeholderTextColor="#666" keyboardType="phone-pad" />
                                    <Ionicons name="create-outline" size={16} color="#888" style={styles.editIcon} />
                                </View>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Ionicons name="calendar-outline" size={20} color="#E3B23C" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Staff Since</Text>
                                <Text style={styles.infoValue}>{formatMemberSince(user?.created_at)}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
                            onPress={handleSaveChanges}
                            disabled={!hasChanges || isSaving}
                        >
                            {isSaving ? (
                                <><ActivityIndicator size="small" color="#000" /><Text style={styles.saveButtonText}>Saving...</Text></>
                            ) : (
                                <><Ionicons name="checkmark-circle" size={20} color={hasChanges ? "#000" : "#666"} /><Text style={[styles.saveButtonText, !hasChanges && styles.saveButtonTextDisabled]}>Save Changes</Text></>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Security */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Security</Text>
                    <View style={styles.infoCard}>
                        <TouchableOpacity style={styles.securityRow} onPress={openPasswordModal}>
                            <Ionicons name="lock-closed-outline" size={20} color="#E3B23C" />
                            <View style={styles.securityContent}>
                                <Text style={styles.securityLabel}>Password</Text>
                                <Text style={styles.securityValue}>••••••••</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Sign Out */}
                <View style={[styles.section, { marginTop: 40, marginBottom: 12 }]}>
                    <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={20} color="#ff4444" />
                        <Text style={[styles.actionButtonText, styles.logoutText]}>Logout</Text>
                        <Ionicons name="chevron-forward" size={20} color="#ff4444" />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Change Password Modal */}
            <Modal visible={showPasswordModal} animationType="slide" transparent={true} onRequestClose={closePasswordModal}>
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior="padding"
                        keyboardVerticalOffset={0}
                        style={[styles.modalContent, { paddingBottom: 0 }]}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Change Password</Text>
                            <TouchableOpacity onPress={closePasswordModal}>
                                <Ionicons name="close" size={28} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            bounces={false}
                            contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
                        >
                            {/* Current Password */}
                            <View style={styles.modalInputGroup}>
                                <Text style={styles.modalLabel}>Current Password</Text>
                                <View style={styles.passwordInputContainer}>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={passwordData.current_password}
                                        onChangeText={(v) => handlePasswordChange('current_password', v)}
                                        placeholder="Enter current password"
                                        placeholderTextColor="#666"
                                        secureTextEntry={!showCurrentPassword}
                                        returnKeyType="next"
                                    />
                                    <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={styles.eyeIcon}>
                                        <Ionicons name={showCurrentPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#888" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* New Password */}
                            <View style={styles.modalInputGroup}>
                                <Text style={styles.modalLabel}>New Password</Text>
                                <View style={[
                                    styles.passwordInputContainer,
                                    passwordData.new_password.length > 0 && !isPasswordValid(passwordData.new_password) && { borderColor: '#ef4444' },
                                    passwordData.new_password.length > 0 && isPasswordValid(passwordData.new_password) && { borderColor: '#22c55e' },
                                ]}>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={passwordData.new_password}
                                        onChangeText={(v) => handlePasswordChange('new_password', v)}
                                        placeholder="Enter new password"
                                        placeholderTextColor="#666"
                                        secureTextEntry={!showNewPassword}
                                        onFocus={() => setShowNewPasswordRules(true)}
                                        onBlur={() => setShowNewPasswordRules(false)}
                                        returnKeyType="next"
                                    />
                                    <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeIcon}>
                                        <Ionicons name={showNewPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#888" />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.rulesBox}>
                                    {passwordRules.map((rule, idx) => {
                                        const passed = rule.test(passwordData.new_password);
                                        return (
                                            <View key={idx} style={styles.ruleRow}>
                                                <Ionicons name={passed ? 'checkmark-circle' : 'ellipse-outline'} size={13} color={passed ? '#22c55e' : '#6B7280'} />
                                                <Text style={[styles.ruleText, passed && styles.ruleTextPassed]}>{rule.label}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Confirm New Password */}
                            <View style={styles.modalInputGroup}>
                                <Text style={styles.modalLabel}>Confirm New Password</Text>
                                <View style={[
                                    styles.passwordInputContainer,
                                    passwordData.confirm_password.length > 0 && passwordData.new_password !== passwordData.confirm_password && { borderColor: '#ef4444' },
                                    passwordData.confirm_password.length > 0 && passwordData.new_password === passwordData.confirm_password && { borderColor: '#22c55e' },
                                ]}>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={passwordData.confirm_password}
                                        onChangeText={(v) => handlePasswordChange('confirm_password', v)}
                                        placeholder="Re-enter new password"
                                        placeholderTextColor="#666"
                                        secureTextEntry={!showConfirmPassword}
                                        returnKeyType="done"
                                    />
                                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                                        <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#888" />
                                    </TouchableOpacity>
                                </View>
                                {passwordData.confirm_password.length > 0 && passwordData.new_password !== passwordData.confirm_password && (
                                    <Text style={styles.errorText}>Passwords do not match</Text>
                                )}
                            </View>

                            <TouchableOpacity style={styles.modalButton} onPress={handleChangePassword} disabled={isChangingPassword}>
                                {isChangingPassword ? (
                                    <><ActivityIndicator size="small" color="#000" /><Text style={styles.modalButtonText}>Changing...</Text></>
                                ) : (
                                    <Text style={styles.modalButtonText}>Change Password</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.modalCancelButton} onPress={closePasswordModal}>
                                <Text style={styles.modalCancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#191919' },
    header: { paddingTop: 20, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: '#1a1a1a', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
    roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#3b83f61c', borderWidth: 1, borderColor: '#3B82F6' },
    roleText: { color: '#3B82F6', fontSize: 14, fontWeight: 'bold', paddingHorizontal: 4, paddingVertical: 2 },
    profileCard: { marginHorizontal: 20, marginTop: 20, marginBottom: 30, backgroundColor: '#2a2a2a', borderRadius: 8, padding: 16 },
    profileSection: { flexDirection: 'row', alignItems: 'center' },
    avatarContainer: { marginRight: 20 },
    avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#E3B23C' },
    avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#3a3a3a', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#E3B23C' },
    profileInfo: { flex: 1 },
    userName: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
    changeAvatarButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3B23C', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 4, alignSelf: 'flex-start' },
    changeAvatarText: { color: '#000', fontSize: 14, fontWeight: 'bold', marginLeft: 6 },
    section: { marginHorizontal: 20, marginBottom: 30 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
    discardText: { color: '#ff4444', fontSize: 14, fontWeight: 'bold', paddingBottom: 12 },
    infoCard: { backgroundColor: '#2a2a2a', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
    inputRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
    inputContent: { flex: 1, marginLeft: 15 },
    inputLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
    inputWithIcon: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
    input: { flex: 1, fontSize: 16, color: '#fff', fontWeight: '500', paddingVertical: 0, paddingHorizontal: 0, paddingBottom: 8, paddingRight: 24, borderBottomWidth: 0, margin: 0 },
    editIcon: { position: 'absolute', right: 0, bottom: 16 },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    infoContent: { flex: 1, marginLeft: 15 },
    infoLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
    infoValue: { fontSize: 16, color: '#fff', fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#3a3a3a', marginTop: 0 },
    saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E3B23C', padding: 14, borderRadius: 4, marginVertical: 16 },
    saveButtonDisabled: { backgroundColor: '#3a3a3a', opacity: 0.5 },
    saveButtonText: { color: '#000', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    saveButtonTextDisabled: { color: '#666' },
    securityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    securityContent: { flex: 1, marginLeft: 15 },
    securityLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
    securityValue: { fontSize: 16, color: '#fff', fontWeight: '500' },
    actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a2a', padding: 16, borderRadius: 4, marginBottom: 12 },
    actionButtonText: { flex: 1, fontSize: 16, color: '#fff', marginLeft: 15, fontWeight: '500' },
    logoutButton: { backgroundColor: '#2a1a1a' },
    logoutText: { color: '#ff4444' },
    modalContent: {
        width: '100%',
        height: '75%',
        backgroundColor: '#2a2a2a',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        padding: 20,
        paddingBottom: 0,
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 20 },
    modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    modalInputGroup: { marginBottom: 20 },
    modalLabel: { fontSize: 14, color: '#999', marginBottom: 8 },
    passwordInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 4, borderWidth: 1, borderColor: '#3a3a3a' },
    modalInput: { flex: 1, color: '#fff', fontSize: 16, padding: 14 },
    eyeIcon: { padding: 12 },
    modalButton: { flexDirection: 'row', backgroundColor: '#E3B23C', padding: 16, borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
    modalButtonText: { color: '#000', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    modalCancelButton: { backgroundColor: '#3a3a3a', padding: 16, borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
    modalCancelButtonText: { color: '#fff', fontSize: 16, fontWeight: '500' },

    rulesBox: { backgroundColor: '#1a1a1a', borderRadius: 8, padding: 10, marginTop: 8, gap: 5, borderWidth: 1, borderColor: '#2d2d2d' },
    ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    ruleText: { color: '#6B7280', fontSize: 12 },
    ruleTextPassed: { color: '#22c55e' },
    errorText: { color: '#ef4444', fontSize: 12, marginTop: 6 },
});