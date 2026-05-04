import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../../../config';

const StaffScanner = ({ navigation }) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);
    const [staffToken, setStaffToken] = useState(null);

    // Get staff token from storage on mount
    useEffect(() => {
        getStaffToken();
    }, []);

    const getStaffToken = async () => {
        try {
            console.log('Attempting to get staff token...'); // DEBUG
            const token = await AsyncStorage.getItem('staffToken');
            console.log('Retrieved staff token:', token); // DEBUG

            if (token) {
                setStaffToken(token);
                console.log('Staff token set in state'); // DEBUG
            } else {
                console.log('No staff token found in AsyncStorage'); // DEBUG

                // Check all keys in AsyncStorage
                const allKeys = await AsyncStorage.getAllKeys();
                console.log('All AsyncStorage keys:', allKeys); // DEBUG

                Alert.alert('Error', 'Staff token not found. Please login again.');
                navigation.navigate('Login');
            }
        } catch (error) {
            console.error('Error getting staff token:', error);
        }
    };

    // Request camera permission
    useEffect(() => {
        if (permission && !permission.granted) {
            requestPermission();
        }
    }, [permission]);

    const handleBarCodeScanned = async ({ type, data }) => {
        if (scanned || !staffToken) return;

        console.log('QR SCANNED:', data);

        setScanned(true);
        setLoading(true);

        try {
            console.log(staffToken, 'staffToken');
            
            const qrToken = data;

            const response = await fetch(API_ENDPOINTS.SCAN_QR, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${staffToken}`,
                },
                body: JSON.stringify({
                    qr_token: qrToken,
                }),
            });

            const result = await response.json();
            console.log('Scan result:', result); // DEBUG

            if (result.status === 'success') {
                // Show member name and action
                const actionText = result.action === 'check_in' ? 'Checked In' : 'Checked Out';

                Alert.alert(
                    '✅ Success',
                    `${result.member_name}\n${actionText} successfully!`,
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                setScanned(false);
                                setLoading(false);
                            },
                        },
                    ]
                );
            } else {
                Alert.alert(
                    '❌ Error',
                    result.message || 'Failed to process scan',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                setScanned(false);
                                setLoading(false);
                            },
                        },
                    ]
                );
            }
        } catch (error) {
            console.error('Scan error:', error);
            Alert.alert(
                '❌ Error',
                'Network error. Please check your connection.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setScanned(false);
                            setLoading(false);
                        },
                    }
                ]
            );
        }
    };

    if (!permission) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#2196F3" />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionTitle}>Camera Permission Required</Text>
                <Text style={styles.permissionMessage}>
                    We need your permission to use the camera for scanning QR codes
                </Text>
                <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                    <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            >
                <View style={styles.overlay}>
                    {/* Top overlay */}
                    <View style={styles.topOverlay}>
                        <Text style={styles.headerText}>Scan Member QR Code</Text>
                    </View>

                    {/* Middle row with scan area */}
                    <View style={styles.middleRow}>
                        <View style={styles.sideOverlay} />
                        <View style={styles.scanArea}>
                            {/* Corner brackets */}
                            <View style={styles.cornerTopLeft} />
                            <View style={styles.cornerTopRight} />
                            <View style={styles.cornerBottomLeft} />
                            <View style={styles.cornerBottomRight} />

                            {/* Scanning line animation could go here */}
                        </View>
                        <View style={styles.sideOverlay} />
                    </View>

                    {/* Bottom overlay */}
                    <View style={styles.bottomOverlay}>
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#fff" />
                                <Text style={styles.loadingText}>Processing...</Text>
                            </View>
                        ) : (
                            <Text style={styles.instructionText}>
                                Align QR code within the frame
                            </Text>
                        )}

                        {scanned && !loading && (
                            <TouchableOpacity
                                style={styles.resetButton}
                                onPress={() => {
                                    setScanned(false);
                                    setLoading(false);
                                }}
                            >
                                <Text style={styles.resetButtonText}>Scan Again</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </CameraView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    permissionContainer: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    permissionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    permissionMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    permissionButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 8,
    },
    permissionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
    },
    topOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    middleRow: {
        flexDirection: 'row',
        height: 280,
    },
    sideOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    scanArea: {
        width: 280,
        height: 280,
        position: 'relative',
    },
    bottomOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 30,
    },
    instructionText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    loadingContainer: {
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 10,
    },
    cornerTopLeft: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 50,
        height: 50,
        borderTopWidth: 5,
        borderLeftWidth: 5,
        borderColor: '#00ff00',
    },
    cornerTopRight: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 50,
        height: 50,
        borderTopWidth: 5,
        borderRightWidth: 5,
        borderColor: '#00ff00',
    },
    cornerBottomLeft: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: 50,
        height: 50,
        borderBottomWidth: 5,
        borderLeftWidth: 5,
        borderColor: '#00ff00',
    },
    cornerBottomRight: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 50,
        height: 50,
        borderBottomWidth: 5,
        borderRightWidth: 5,
        borderColor: '#00ff00',
    },
    resetButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 8,
        marginTop: 10,
    },
    resetButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default StaffScanner;