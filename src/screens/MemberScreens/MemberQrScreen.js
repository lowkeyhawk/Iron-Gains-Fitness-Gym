import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    ScrollView,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { API_ENDPOINTS } from '../../../config';

export default function MemberQRScreen({ navigation }) {
    const { user } = useContext(AuthContext);
    const [qrToken, setQrToken] = useState(null);
    const [expiresAt, setExpiresAt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [countdown, setCountdown] = useState(60);
    const [error, setError] = useState('');
    const [qrStatus, setQrStatus] = useState('active');

    // Use useFocusEffect to handle screen focus/blur
    useFocusEffect(
        React.useCallback(() => {
            // Screen is focused - generate QR
            console.log('Screen focused - generating QR');
            generateQRCode();

            // Set up auto-refresh interval
            const refreshInterval = setInterval(() => {
                generateQRCode();
            }, 60000);

            // Cleanup function - runs when screen loses focus
            return () => {
                console.log('Screen unfocused - cleaning up');
                clearInterval(refreshInterval);
                // Reset all states
                setQrToken(null);
                setExpiresAt(null);
                setCountdown(60);
                setError('');
                setQrStatus('active');
                setLoading(true);
            };
        }, [user?.plan])
    );

    // Countdown timer
    useEffect(() => {
        if (!expiresAt) {
            return;
        }

        const timer = setInterval(() => {
            const now = new Date();

            let expiryDate;

            try {
                if (expiresAt.includes(' ')) {
                    expiryDate = new Date(expiresAt.replace(' ', 'T'));
                } else {
                    expiryDate = new Date(expiresAt);
                }

                if (isNaN(expiryDate.getTime())) {
                    console.error('Invalid expiry date:', expiresAt);
                    setCountdown(60);
                    return;
                }

                const diffMs = expiryDate - now;
                const diffSecs = Math.floor(diffMs / 1000);

                setCountdown(diffSecs > 0 ? diffSecs : 0);
            } catch (error) {
                console.error('Error parsing date:', error);
                setCountdown(60);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [expiresAt]);

    // Update QR status based on countdown
    useEffect(() => {
        if (countdown === 0) {
            setQrStatus('expired');
        } else {
            setQrStatus('active');
        }
    }, [countdown]);

    const isWithinGymHours = () => {
        const now = new Date();

        const day = now.getDay(); 
        // 0 = Sunday, 1 = Monday ... 6 = Saturday

        const hour = now.getHours();
        const minutes = now.getMinutes();

        const timeInMinutes = hour * 60 + minutes;

        // Sunday: 2:00 PM - 9:00 PM
        if (day === 0) {
            const open = 14 * 60; // 2:00 PM
            const close = 21 * 60; // 9:00 PM
            return timeInMinutes >= open && timeInMinutes <= close;
        }

        // Monday - Saturday: 8:00 AM - 10:00 PM
        const open = 8 * 60;   // 8:00 AM
        const close = 22 * 60; // 10:00 PM

        return timeInMinutes >= open && timeInMinutes <= close;
    };

    const generateQRCode = async () => {
        try {
            // BLOCK OUTSIDE GYM HOURS
            if (!isWithinGymHours()) {
                setError('Gym is currently closed. Please come back during operating hours.');
                setLoading(false);
                setQrToken(null);
                return;
            }
            
            setLoading(true);
            setError('');

            // Check membership FIRST
            if (!user?.plan) {
                setError('No active membership');
                setLoading(false);
                return;
            }

            const authToken = await AsyncStorage.getItem('userToken');

            if (!authToken) {
                Alert.alert('Error', 'Please login again');
                navigation.navigate('Login');
                return;
            }

            const response = await fetch(API_ENDPOINTS.GENERATE_QR, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    auth_token: authToken,
                }),
            });

            const data = await response.json();

            if (data.status === 'success') {
                setQrToken(data.qr_token);
                setExpiresAt(data.expires_at);
                setCountdown(60);
            } else {

                // ✅ NEW: retry if membership still syncing
                if (data.message?.includes('membership')) {
                    setError('Activating membership... please wait');

                    setTimeout(() => {
                        generateQRCode();
                    }, 3000);

                    return;
                }

                setError(data.message || 'Failed to generate QR code');
            }

        } catch (err) {
            console.error('Generate QR error:', err);
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatCountdown = (seconds) => {
        if (typeof seconds !== 'number' || isNaN(seconds)) {
            return '0:00';
        }

        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#E3B23C" />
                    <Text style={styles.loadingText}>Generating QR Code...</Text>
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color="#ff4444" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={generateQRCode}>
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    {/* User Info */}
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user?.name || user?.email}</Text>
                        {user?.plan && (
                            <View style={styles.planBadge}>
                                <Text style={styles.planText}>{user.plan.name}</Text>
                            </View>
                        )}
                    </View>

                    {/* QR Status Banners */}
                    {qrStatus === 'used' && (
                        <View style={styles.usedBanner}>
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            <Text style={styles.usedText}>QR Code Used - Generate New One</Text>
                        </View>
                    )}

                    {qrStatus === 'expired' && (
                        <View style={styles.expiredBanner}>
                            <Ionicons name="time-outline" size={20} color="#fff" />
                            <Text style={styles.expiredText}>QR Code Expired - Generating New One...</Text>
                        </View>
                    )}

                    {/* QR Code */}
                    <View style={styles.qrContainer}>
                        <View style={[
                            styles.qrWrapper,
                            qrStatus === 'expired' && styles.qrWrapperExpired,
                            qrStatus === 'used' && styles.qrWrapperUsed
                        ]}>
                            {qrToken ? (
                                <QRCode
                                    value={qrToken}
                                    size={250}
                                    backgroundColor="white"
                                    color="black"
                                />
                            ) : (
                                <Text style={styles.noQrText}>No QR Code</Text>
                            )}

                            {/* Overlay for expired/used QR */}
                            {(qrStatus === 'expired' || qrStatus === 'used') && (
                                <View style={styles.qrOverlay}>
                                    <Ionicons
                                        name={qrStatus === 'expired' ? 'time-outline' : 'checkmark-circle'}
                                        size={80}
                                        color="rgba(255, 255, 255, 0.9)"
                                    />
                                    <Text style={styles.overlayText}>
                                        {qrStatus === 'expired' ? 'EXPIRED' : 'USED'}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Countdown Timer */}
                    <View style={[
                        styles.timerContainer,
                        countdown <= 10 && styles.timerContainerWarning
                    ]}>
                        <Ionicons
                            name="time-outline"
                            size={24}
                            color={countdown <= 10 ? '#ff4444' : '#E3B23C'}
                        />
                        <Text style={[
                            styles.timerText,
                            countdown <= 10 && styles.timerTextWarning
                        ]}>
                            Expires in {formatCountdown(countdown)}
                        </Text>
                    </View>

                    {/* Instructions */}
                    <View style={styles.instructions}>
                        <Text style={styles.instructionsTitle}>How to use:</Text>
                        <View style={styles.instructionItem}>
                            <Text style={styles.bullet}>1.</Text>
                            <Text style={styles.instructionText}>
                                Show this QR code to the staff at the gym entrance
                            </Text>
                        </View>
                        <View style={styles.instructionItem}>
                            <Text style={styles.bullet}>2.</Text>
                            <Text style={styles.instructionText}>
                                Staff will scan it to check you in/out
                            </Text>
                        </View>
                        <View style={styles.instructionItem}>
                            <Text style={styles.bullet}>3.</Text>
                            <Text style={styles.instructionText}>
                                QR code can only be used once for security
                            </Text>
                        </View>
                        <View style={styles.instructionItem}>
                            <Text style={styles.bullet}>4.</Text>
                            <Text style={styles.instructionText}>
                                QR code refreshes automatically every 60 seconds
                            </Text>
                        </View>
                    </View>

                    {/* Manual Refresh Button */}
                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={generateQRCode}
                    >
                        <Ionicons name="refresh" size={20} color="#000" />
                        <Text style={styles.refreshButtonText}>Generate New QR Code</Text>
                    </TouchableOpacity>
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#191919',
    },
    scrollContent: {
        padding: 20,
        paddingTop: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 400,
    },
    loadingText: {
        color: '#fff',
        marginTop: 15,
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        minHeight: 400,
    },
    errorText: {
        color: '#ff4444',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 15,
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#E3B23C',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
    userInfo: {
        alignItems: 'center',
        marginBottom: 30,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    planBadge: {
        backgroundColor: '#E3B23C',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    planText: {
        color: '#000',
        fontSize: 14,
        fontWeight: 'bold',
    },
    usedBanner: {
        flexDirection: 'row',
        backgroundColor: '#28a745',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    usedText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    expiredBanner: {
        flexDirection: 'row',
        backgroundColor: '#ff4444',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    expiredText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    qrContainer: {
        alignItems: 'center',
        marginBottom: 25,
    },
    qrWrapper: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 15,
        shadowColor: '#E3B23C',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
        position: 'relative',
    },
    qrWrapperExpired: {
        opacity: 0.5,
    },
    qrWrapperUsed: {
        opacity: 0.5,
    },
    qrOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 10,
    },
    noQrText: {
        fontSize: 16,
        color: '#666',
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2a2a2a',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        marginBottom: 30,
    },
    timerContainerWarning: {
        backgroundColor: '#3a1a1a',
    },
    timerText: {
        color: '#E3B23C',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    timerTextWarning: {
        color: '#ff4444',
    },
    instructions: {
        backgroundColor: '#2a2a2a',
        padding: 20,
        borderRadius: 10,
        marginBottom: 20,
    },
    instructionsTitle: {
        color: '#E3B23C',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    instructionItem: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    bullet: {
        color: '#E3B23C',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 10,
        width: 20,
    },
    instructionText: {
        color: '#ccc',
        fontSize: 14,
        flex: 1,
        lineHeight: 20,
    },
    refreshButton: {
        flexDirection: 'row',
        backgroundColor: '#E3B23C',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
    },
    refreshButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});