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
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from "../../context/AuthContext";
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../../../config';
import Svg, { Path } from "react-native-svg";

export default function Profile({ navigation }) {
    const { user, logout, setUser } = useContext(AuthContext);
    const [profileImage, setProfileImage] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        phone_number: '',
    });

    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Password modal state
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

    // for auto renew toggle
    const [autoRenew, setAutoRenew] = useState(false);
    const [loadingAutoRenew, setLoadingAutoRenew] = useState(false);

    const [refreshing, setRefreshing] = useState(false);

    // Initialize form data when user data loads
    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                middle_name: user.middle_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone_number: user.phone_number || '',
            });
            setAutoRenew(Number(user?.auto_renew) === 1);
        }
    }, [user]);

    // Detect if there are unsaved changes
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

    // Handle input changes
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle password input changes
    const handlePasswordChange = (field, value) => {
        setPasswordData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Open password modal
    const openPasswordModal = () => {
        setPasswordData({
            current_password: '',
            new_password: '',
            confirm_password: '',
        });
        setShowPasswordModal(true);
    };

    // Close password modal
    const closePasswordModal = () => {
        setShowPasswordModal(false);
        setPasswordData({
            current_password: '',
            new_password: '',
            confirm_password: '',
        });
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
    };

    // Change password
    const handleChangePassword = async () => {
        // Validation
        if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
            Alert.alert('Error', 'All fields are required');
            return;
        }

        if (passwordData.new_password.length < 6) {
            Alert.alert('Error', 'New password must be at least 6 characters');
            return;
        }

        if (passwordData.new_password !== passwordData.confirm_password) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }

        setIsChangingPassword(true);

        try {
            // TODO: Replace with your actual change password endpoint
            const response = await fetch(API_ENDPOINTS.CHANGE_PASSWORD, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user.id,
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
            console.error('Change password error:', error);
            Alert.alert('Error', 'Failed to change password. Please try again.');
        } finally {
            setIsChangingPassword(false);
        }
    };

    // Discard changes
    const handleDiscardChanges = () => {
        Alert.alert(
            'Discard Changes',
            'Are you sure you want to discard your changes?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
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

                        // Remove focus from all inputs (dismiss keyboard)
                        Keyboard.dismiss();
                    },
                },
            ]
        );
    };

    // Save changes
    const handleSaveChanges = async () => {
        setIsSaving(true);

        try {
            const response = await fetch(API_ENDPOINTS.UPDATE_PROFILE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user.id,
                    ...formData,
                }),
            });

            const result = await response.json();

            if (result.status === 'success') {
                // Update user in context with returned data
                setUser({
                    ...user,
                    ...result.user,
                });

                // Also update AsyncStorage
                await AsyncStorage.setItem('user', JSON.stringify({
                    ...user,
                    ...result.user,
                }));

                // Remove focus from all inputs (dismiss keyboard)
                Keyboard.dismiss();

                Alert.alert('Success', 'Profile updated successfully!');
            } else {
                Alert.alert('Error', result.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Update error:', error);
            Alert.alert('Error', 'Failed to update profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    // Helper functions
    const getSavedFullName = () => {
        if (!user) return 'User';

        const { first_name, middle_name, last_name } = user;

        return [first_name, middle_name, last_name]
            .filter(Boolean)
            .join(' ') || 'User';
    };

    const formatMemberSince = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const options = { month: 'long', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const getDaysLeft = (expiryDate) => {
        if (!expiryDate) return 0;
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const getStatusColor = () => {
        if (!user?.plan) return '#666';
        const daysLeft = getDaysLeft(user.plan.expires_at);
        if (daysLeft === 0) return '#ff4444';
        if (daysLeft <= 7) return '#FFA500';
        return '#4CAF50';
    };

    const getStatusText = () => {
        if (!user?.plan) return 'No Plan';
        const daysLeft = getDaysLeft(user.plan.expires_at);
        if (daysLeft === 0) return 'Expired';
        if (daysLeft <= 7) return 'Expiring Soon';
        return 'Active';
    };

    const handleChangeAvatar = () => {
        Alert.alert('Coming Soon', 'Avatar upload feature coming soon!');
    };

    const handleLogout = () => {
        if (hasChanges) {
            Alert.alert(
                'Unsaved Changes',
                'You have unsaved changes. Do you want to discard them?',
                [
                    {
                        text: 'Discard & Logout',
                        style: 'destructive',
                        onPress: logout,
                    },
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                ]
            );
        } else {
            Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Logout',
                        onPress: logout,
                        style: 'destructive',
                    },
                ]
            );
        }
    };

    const handleCancelMembership = () => {
        Alert.alert(
            'Cancel Membership',
            'Are you sure you want to cancel your membership? This action cannot be undone.',
            [
                {
                    text: 'No, Keep It',
                    style: 'cancel',
                },
                {
                    text: 'Yes, Cancel',
                    onPress: async () => {
                        Alert.alert('Success', 'Membership cancelled successfully');
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const parsed = JSON.parse(userData);
                setUser(parsed);
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

    const toggleAutoRenew = async () => {
        const newValue = autoRenew ? 0 : 1;
        setLoadingAutoRenew(true);

        try {
            const response = await fetch(API_ENDPOINTS.UPDATE_AUTO_RENEW, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user.id,
                    auto_renew: newValue,
                }),
            });

            const result = await response.json();

            if (result.status === 'success') {
                setAutoRenew(!autoRenew);

                const updatedUser = {
                    ...user,
                    auto_renew: newValue,
                };

                setUser(updatedUser);
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            } else {
                Alert.alert('Error', result.message || 'Failed to update auto-renew');
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Something went wrong');
        } finally {
            setLoadingAutoRenew(false);
        }
    };

    const CrownIcon = ({ size = 16, color = "#FFD700" }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M3 7l4 5 5-7 5 7 4-5 1 13H2L3 7z"
                fill={color}
            />
        </Svg>
    );

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
                    <Text style={styles.headerTitle}>My Profile</Text>
                    <View style={[styles.planBadge]}>
                        {user?.plan?.name && (
                            <CrownIcon size={16} color="#FFD700" />
                        )}
                        <Text style={styles.planText}>
                            {user?.plan?.name
                                ? `${user.plan.name} Member`
                                : "Free Member"}
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
                            <Text style={styles.userName}>{getSavedFullName()}</Text>
                            <TouchableOpacity
                                style={styles.changeAvatarButton}
                                onPress={handleChangeAvatar}
                            >
                                <Ionicons name="camera" size={16} color="#000" />
                                <Text style={styles.changeAvatarText}>Change Avatar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
                
                <View style={[styles.section]}>
                    <View style={styles.infoRow}>
                        <Ionicons name="refresh-outline" size={20} color="#E3B23C" />

                        <View style={[styles.infoContent, { flex: 1 }]}>
                            <Text style={styles.infoLabel}>Auto-Renew</Text>
                            <Text style={styles.infoValue}>
                                Enable auto-renew notification
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={toggleAutoRenew}
                            disabled={loadingAutoRenew}
                            style={{
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                backgroundColor: autoRenew ? '#4CAF50' : '#444',
                                borderRadius: 20,
                                minWidth: 50,
                                alignItems: 'center',
                            }}>
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                                {loadingAutoRenew ? '...' : autoRenew ? 'ON' : 'OFF'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* User Details - EDITABLE */}
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
                        {/* First Name */}
                        <View style={styles.inputRow}>
                            <Ionicons name="person-outline" size={20} color="#E3B23C" />
                            <View style={styles.inputContent}>
                                <Text style={styles.inputLabel}>First Name</Text>
                                <View style={styles.inputWithIcon}>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.first_name}
                                        onChangeText={(value) => handleInputChange('first_name', value)}
                                        placeholder="Enter first name"
                                        placeholderTextColor="#666"
                                    />
                                    <Ionicons name="create-outline" size={16} color="#888" style={styles.editIcon} />
                                </View>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Middle Name */}
                        <View style={styles.inputRow}>
                            <Ionicons name="person-outline" size={20} color="#E3B23C" />
                            <View style={styles.inputContent}>
                                <Text style={styles.inputLabel}>Middle Name (Optional)</Text>
                                <View style={styles.inputWithIcon}>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.middle_name}
                                        onChangeText={(value) => handleInputChange('middle_name', value)}
                                        placeholder="Enter middle name"
                                        placeholderTextColor="#666"
                                    />
                                    <Ionicons name="create-outline" size={16} color="#888" style={styles.editIcon} />
                                </View>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Last Name */}
                        <View style={styles.inputRow}>
                            <Ionicons name="person-outline" size={20} color="#E3B23C" />
                            <View style={styles.inputContent}>
                                <Text style={styles.inputLabel}>Last Name</Text>
                                <View style={styles.inputWithIcon}>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.last_name}
                                        onChangeText={(value) => handleInputChange('last_name', value)}
                                        placeholder="Enter last name"
                                        placeholderTextColor="#666"
                                    />
                                    <Ionicons name="create-outline" size={16} color="#888" style={styles.editIcon} />
                                </View>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Email */}
                        <View style={styles.inputRow}>
                            <Ionicons name="mail-outline" size={20} color="#E3B23C" />
                            <View style={styles.inputContent}>
                                <Text style={styles.inputLabel}>Email</Text>
                                <View style={styles.inputWithIcon}>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.email}
                                        onChangeText={(value) => handleInputChange('email', value)}
                                        placeholder="Enter email"
                                        placeholderTextColor="#666"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                    <Ionicons name="create-outline" size={16} color="#888" style={styles.editIcon} />
                                </View>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Phone */}
                        <View style={styles.inputRow}>
                            <Ionicons name="call-outline" size={20} color="#E3B23C" />
                            <View style={styles.inputContent}>
                                <Text style={styles.inputLabel}>Phone</Text>
                                <View style={styles.inputWithIcon}>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.phone_number}
                                        onChangeText={(value) => handleInputChange('phone_number', value)}
                                        placeholder="Enter phone number"
                                        placeholderTextColor="#666"
                                        keyboardType="phone-pad"
                                    />
                                    <Ionicons name="create-outline" size={16} color="#888" style={styles.editIcon} />
                                </View>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Member Since (Read-only) */}
                        <View style={styles.infoRow}>
                            <Ionicons name="calendar-outline" size={20} color="#E3B23C" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Member Since</Text>
                                <Text style={styles.infoValue}>
                                    {formatMemberSince(user?.created_at)}
                                </Text>
                            </View>
                        </View>

                        {/* Save Changes Button */}
                        <TouchableOpacity
                            style={[
                                styles.saveButton,
                                !hasChanges && styles.saveButtonDisabled
                            ]}
                            onPress={handleSaveChanges}
                            disabled={!hasChanges || isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <ActivityIndicator size="small" color="#000" />
                                    <Text style={styles.saveButtonText}>Saving...</Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={20} color={hasChanges ? "#000" : "#666"} />
                                    <Text style={[
                                        styles.saveButtonText,
                                        !hasChanges && styles.saveButtonTextDisabled
                                    ]}>
                                        Save Changes
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Security Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Security</Text>

                    <View style={styles.infoCard}>
                        <TouchableOpacity
                            style={styles.securityRow}
                            onPress={openPasswordModal}
                        >
                            <Ionicons name="lock-closed-outline" size={20} color="#E3B23C" />
                            <View style={styles.securityContent}>
                                <Text style={styles.securityLabel}>Password</Text>
                                <Text style={styles.securityValue}>••••••••</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Membership Details */}
                {user?.plan && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Membership Details</Text>

                        <View style={styles.infoCard}>
                            {/* Status */}
                            <View style={styles.infoRow}>
                                <Ionicons name="checkmark-circle-outline" size={20} color="#E3B23C" />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Status</Text>
                                    <View style={styles.statusContainer}>
                                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                                            <Text style={styles.statusText}>{getStatusText()}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            {/* Current Plan */}
                            <View style={styles.infoRow}>
                                <Ionicons name="layers-outline" size={20} color="#E3B23C" />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Current Plan</Text>
                                    <Text style={styles.infoValue}>{user.plan.name}</Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            {/* Expires */}
                            <View style={styles.infoRow}>
                                <Ionicons name="time-outline" size={20} color="#E3B23C" />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Expires</Text>
                                    <Text style={styles.infoValue}>
                                        {formatMemberSince(user.plan.expires_at)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            {/* Days Left */}
                            <View style={styles.infoRow}>
                                <Ionicons name="calendar-outline" size={20} color="#E3B23C" />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Days Left</Text>
                                    <Text style={[
                                        styles.infoValue,
                                        { color: getDaysLeft(user.plan.expires_at) <= 7 ? '#FFA500' : '#fff' }
                                    ]}>
                                        {getDaysLeft(user.plan.expires_at)} {getDaysLeft(user.plan.expires_at) === 1 ? 'day' : 'days'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Cancel Membership Button */}
                        <TouchableOpacity
                            style={styles.cancelMembershipButton}
                            onPress={handleCancelMembership}
                        >
                            <Ionicons name="close-circle-outline" size={20} color="#ff4444" />
                            <Text style={styles.cancelMembershipText}>Cancel Membership</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.section}>
                    {/* <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('Settings')}
                    >
                        <Ionicons name="settings-outline" size={20} color="#E3B23C" />
                        <Text style={styles.actionButtonText}>Settings</Text>
                        <Ionicons name="chevron-forward" size={20} color="#666" />
                    </TouchableOpacity> */}

                    <TouchableOpacity
                        style={[styles.actionButton, styles.logoutButton]}
                        onPress={handleLogout}
                    >
                        <Ionicons name="log-out-outline" size={20} color="#ff4444" />
                        <Text style={[styles.actionButtonText, styles.logoutText]}>Sign Out</Text>
                        <Ionicons name="chevron-forward" size={20} color="#ff4444" />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Change Password Modal */}
            <Modal
                visible={showPasswordModal}
                animationType="slide"
                transparent={true}
                onRequestClose={closePasswordModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Change Password</Text>
                            <TouchableOpacity onPress={closePasswordModal}>
                                <Ionicons name="close" size={28} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Current Password */}
                            <View style={styles.modalInputGroup}>
                                <Text style={styles.modalLabel}>Current Password</Text>
                                <View style={styles.passwordInputContainer}>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={passwordData.current_password}
                                        onChangeText={(value) => handlePasswordChange('current_password', value)}
                                        placeholder="Enter current password"
                                        placeholderTextColor="#666"
                                        secureTextEntry={!showCurrentPassword}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                                        style={styles.eyeIcon}
                                    >
                                        <Ionicons
                                            name={showCurrentPassword ? "eye-outline" : "eye-off-outline"}
                                            size={20}
                                            color="#888"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* New Password */}
                            <View style={styles.modalInputGroup}>
                                <Text style={styles.modalLabel}>New Password</Text>
                                <View style={styles.passwordInputContainer}>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={passwordData.new_password}
                                        onChangeText={(value) => handlePasswordChange('new_password', value)}
                                        placeholder="Enter new password (min. 6 characters)"
                                        placeholderTextColor="#666"
                                        secureTextEntry={!showNewPassword}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowNewPassword(!showNewPassword)}
                                        style={styles.eyeIcon}
                                    >
                                        <Ionicons
                                            name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                                            size={20}
                                            color="#888"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Confirm New Password */}
                            <View style={styles.modalInputGroup}>
                                <Text style={styles.modalLabel}>Confirm New Password</Text>
                                <View style={styles.passwordInputContainer}>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={passwordData.confirm_password}
                                        onChangeText={(value) => handlePasswordChange('confirm_password', value)}
                                        placeholder="Re-enter new password"
                                        placeholderTextColor="#666"
                                        secureTextEntry={!showConfirmPassword}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                        style={styles.eyeIcon}
                                    >
                                        <Ionicons
                                            name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                                            size={20}
                                            color="#888"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Buttons */}
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={handleChangePassword}
                                disabled={isChangingPassword}
                            >
                                {isChangingPassword ? (
                                    <>
                                        <ActivityIndicator size="small" color="#000" />
                                        <Text style={styles.modalButtonText}>Changing...</Text>
                                    </>
                                ) : (
                                    <Text style={styles.modalButtonText}>Change Password</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={closePasswordModal}
                            >
                                <Text style={styles.modalCancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#191919',
    },
    header: {
        paddingTop: 16,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: '#1a1a1a',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    planBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#231F13',
        borderWidth: 1,
        borderColor: '#584A1E',
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    planText: {
        color: '#D4AF37',
        fontSize: 14,
        fontWeight: 'bold',
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    profileCard: {
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 15,
        backgroundColor: '#2a2a2a',
        borderRadius: 15,
        padding: 20,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        marginRight: 20,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: '#E3B23C',
    },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#3a3a3a',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#E3B23C',
    },
    profileInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    changeAvatarButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3B23C',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    changeAvatarText: {
        color: '#000',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 6,
    },
    section: {
        marginHorizontal: 20,
        marginBottom: 30,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 0,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
    },
    discardText: {
        color: '#ff4444',
        fontSize: 14,
        fontWeight: 'bold',
        paddingBottom: 12
    },
    infoCard: {
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 8
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 4,
    },
    inputContent: {
        flex: 1,
        marginLeft: 15,
    },
    inputLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 4,
    },
    inputWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
        fontWeight: '500',
        paddingVertical: 0,
        paddingHorizontal: 0,
        paddingBottom: 8,
        paddingRight: 24,
        borderBottomWidth: 0,
        margin: 0,
    },
    editIcon: {
        position: 'absolute',
        right: 0,
        bottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    infoContent: {
        flex: 1,
        marginLeft: 15,
    },
    infoLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#3a3a3a',
        marginTop: 0,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E3B23C',
        padding: 14,
        borderRadius: 8,
        marginVertical: 16,
    },
    saveButtonDisabled: {
        backgroundColor: '#3a3a3a',
        opacity: 0.5,
    },
    saveButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    saveButtonTextDisabled: {
        color: '#666',
    },
    securityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    securityContent: {
        flex: 1,
        marginLeft: 15,
    },
    securityLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 4,
    },
    securityValue: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '500',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    cancelMembershipButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2a1a1a',
        padding: 16,
        borderRadius: 12,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#ff4444',
    },
    cancelMembershipText: {
        fontSize: 16,
        color: '#ff4444',
        marginLeft: 8,
        fontWeight: 'bold',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    actionButtonText: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
        marginLeft: 15,
        fontWeight: '500',
    },
    logoutButton: {
        backgroundColor: '#2a1a1a',
    },
    logoutText: {
        color: '#ff4444',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    modalInputGroup: {
        marginBottom: 20,
    },
    modalLabel: {
        fontSize: 14,
        color: '#999',
        marginBottom: 8,
    },
    passwordInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3a3a3a',
    },
    modalInput: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        padding: 12,
    },
    eyeIcon: {
        padding: 12,
    },
    modalButton: {
        flexDirection: 'row',
        backgroundColor: '#E3B23C',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    modalButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    modalCancelButton: {
        backgroundColor: '#3a3a3a',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    modalCancelButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
});