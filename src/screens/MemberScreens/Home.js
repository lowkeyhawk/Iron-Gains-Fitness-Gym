import React, { useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    RefreshControl,
    Image,
    Dimensions,
    Linking,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import NotificationBell from '../../components/NotificationBell';
import { useNotifications } from '../../hooks/useNotifications';
import { useInAppNotifications } from '../../hooks/useInAppNotifications';
import { API_ENDPOINTS } from '../../../config';
import Svg, { Path } from "react-native-svg";
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const PHOTO_WIDTH = (width - 48) / 2.5;
const ITEM_WIDTH = width * 0.75; // 👈 shows side previews
const SPACING = 12;

export default function Home() {
    const { user, setUser, setUserToken } = useContext(AuthContext);
    const [userId, setUserId] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [userImage, setUserImage] = useState(null);
    const [gymData, setGymData] = useState(null);
    const [loading, setLoading] = useState(true);
    const scrollViewRef = useRef(null);

    const navigation = useNavigation();

    const CrownIcon = ({ size = 16, color = "#D4AF37" }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M3 7l4 5 5-7 5 7 4-5 1 13H2L3 7z"
                fill={color}
            />
        </Svg>
    );

    // Load user from AsyncStorage
    const loadUser = useCallback(async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const parsed = JSON.parse(userData);
                setUserId(parsed.id);
                if (parsed.profile_picture) {
                    setUserImage(parsed.profile_picture);
                }
            }
        } catch (error) {
            console.error('Error loading user:', error);
        }
    }, []);

    // Local slider images using correct path
    const sliderImages = [
        { id: '1', source: require('../../../assets/slider-images/1.jpg') },
        { id: '2', source: require('../../../assets/slider-images/2.jpg') },
        { id: '3', source: require('../../../assets/slider-images/3.jpg') },
        { id: '4', source: require('../../../assets/slider-images/4.jpg') },
        { id: '5', source: require('../../../assets/slider-images/5.jpg') },
    ];
 
    useEffect(() => {
        sliderImages.forEach((img) => {
            console.log(`Image ${img.id} source:`, img.source);
        });
    }, []);

    // Fetch gym data
    const fetchGymData = useCallback(async () => {
        try {
            const gymInfoUrl = `${API_ENDPOINTS.GET_GYM_INFO}`;            
            const response = await fetch(gymInfoUrl);            
            const responseText = await response.text();
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = JSON.parse(responseText);
            
            if (result.status === 'success' && result.data) {
                setGymData({
                    ...result.data,
                    photos: sliderImages,
                    hours: ['Mon - Sat - (8:00 AM – 10:00 PM)', 'Sun - (2:00 PM - 9:00 PM)'],
                });
            } else {
                throw new Error(result.message || 'No data returned');
            }
        } catch (error) {            
            // Fallback to mock data with local images
            setGymData({
                name: 'Iron Gains Fitness Gym',
                location: 'Tuguegarao',
                address: 'Mabini Street Corner Aguinaldo Street, Tuguegarao City, Philippines, 3500',
                hours: ['Mon - Sat - (8:00 AM – 10:00 PM)', 'Sun - (2:00 PM - 9:00 PM)'],
                // amenities: ['Weights', 'Sauna', 'Pool', 'Classes'],
                phone_number: '+63 917 123 4567',
                photos: sliderImages,
            });
        }
    }, []);

    // Setup notifications
    useNotifications(userId);
    const { notifications, unreadCount, markAllRead, markOneRead, refetch } = useInAppNotifications(userId);

    // Initial load
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await loadUser();
            await fetchGymData();
            setLoading(false);
        };
        loadData();
    }, [loadUser, fetchGymData]);

    // Refetch on screen focus
    useFocusEffect(
        useCallback(() => {
            onRefresh();
        }, [])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                loadUser(),
                fetchGymData(),
                refetch()
            ]);
        } catch (error) {
            console.error('Refresh error:', error);
        } finally {
            setRefreshing(false);
        }
    }, [loadUser, fetchGymData, refetch]);

    // Get current date and greeting
    const getCurrentDate = () => {
        const options = { weekday: 'long', month: 'short', day: 'numeric' };
        return new Date().toLocaleDateString('en-US', options);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    // Helper functions
    const getSavedFullName = () => {
        if (!user) return 'User';
        const { first_name, middle_name, last_name } = user;
        return [first_name, middle_name, last_name].filter(Boolean).join(' ') || 'User';
    };

    const formatMemberSince = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const options = { month: 'short', year: 'numeric' };
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
        return '#D4AF37';
    };

    const getStatusText = () => {
        if (!user?.plan) return 'No Plan';
        const daysLeft = getDaysLeft(user.plan.expires_at);
        if (daysLeft === 0) return 'Expired';
        if (daysLeft <= 7) return 'Expiring Soon';
        return 'Active';
    };

    const handleQRPress = () => {
        // Navigate to QR screen
        navigation.navigate('QRCode');
    };

    const handleCallGym = () => {
        if (gymData?.phone_number) {
            Linking.openURL(`tel:${gymData.phone_number.replace(/\s/g, '')}`);
        }
    };

    const handleMapPress = () => {
        if (gymData?.address) {
            const url = `https://maps.google.com/?q=${encodeURIComponent(gymData.address)}`;
            Linking.openURL(url);
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('user');
        setUserToken(null);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['bottom']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#D4AF37" />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header with Notification Bell */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.dateText}>{getCurrentDate()}</Text>
                    <Text style={styles.greetingText}>
                        {getGreeting()}, {getSavedFullName().split(' ')[0]}
                    </Text>
                </View>
                <NotificationBell
                    notifications={notifications}
                    unreadCount={unreadCount}
                    onMarkAllRead={markAllRead}
                    onMarkOneRead={markOneRead}
                />
            </View>

            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#D4AF37']}
                        progressBackgroundColor="#262626"
                    />
                }
            >
                {/* Membership Card */}
                <View style={styles.membershipCard}>
                    {/* Card Header */}
                    <View style={styles.cardHeader}>
                        <View style={styles.gymNameSection}>
                            <View style={styles.gymIcon}>
                                <MaterialIcons name="bolt" size={20} color="#191919" />
                            </View>
                            <Text style={styles.gymName}>{gymData?.name || 'FITNESS GYM'}</Text>
                        </View>
                        <View style={styles.activeBadge}>
                            <View style={[
                                styles.activeDot,
                                { backgroundColor: getStatusColor() }
                            ]} />
                            <Text style={[
                                styles.activeText,
                                { color: getStatusColor() }
                            ]}>
                                {getStatusText()}
                            </Text>
                        </View>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Membership Info */}
                    <View style={styles.membershipInfo}>
                        <Text style={styles.membershipType}>
                            {user?.plan?.name || 'FREE'} MEMBER
                        </Text>
                        <Text style={styles.memberName}>{getSavedFullName()}</Text>
                    </View>

                    {/* Member Details */}
                    <View style={styles.detailsRow}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>MEMBER SINCE</Text>
                            <Text style={styles.detailValue}>
                                {formatMemberSince(user?.created_at)}
                            </Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>NEXT PAYMENT</Text>
                            <Text style={styles.detailValue}>
                                {user?.plan ? formatMemberSince(user.plan.expires_at) : 'N/A'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.qrButton}
                        onPress={handleQRPress}
                    >
                        <MaterialIcons name="qr-code-2" size={28} color="#191919" />
                        <Text style={styles.qrButtonText}>Show QR</Text>
                    </TouchableOpacity>
                </View>

                {/* Your Gym Section */}
                {gymData && (
                    <View style={styles.gymSection}>
                        <Text style={styles.sectionTitle}>Your Gym</Text>
                        <Text style={styles.gymNameBig}>{gymData.name}</Text>
                        <Text style={styles.gymLocationText}>{gymData.location}</Text>

                        {/* Gym Photos Carousel */}
                        {gymData.photos && gymData.photos.length > 0 && (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                snapToInterval={ITEM_WIDTH + SPACING}
                                scrollEventThrottle={16}
                                style={styles.photosScroll}
                                contentContainerStyle={styles.photosContent}
                            >
                                {gymData.photos.map((photo) => (
                                    <View key={photo.id} style={styles.photoItem}>
                                        <Image
                                            source={photo.source}
                                            style={styles.photoImage}
                                        />
                                    </View>
                                ))}
                            </ScrollView>
                        )}

                        {/* Gym Details Box */}
                        <View style={styles.detailsBox}>
                            {/* Address */}
                            <TouchableOpacity
                                style={styles.detailRowBox}
                                onPress={handleMapPress}
                            >
                                <MaterialIcons name="location-on" size={20} color="#D4AF37" />
                                <Text style={styles.detailRowText}>{gymData.address}</Text>
                            </TouchableOpacity>

                            {/* Hours */}
                            <View style={styles.detailRowBox}>
                                <MaterialIcons name="access-time" size={20} color="#D4AF37" />
                                <View style={{ flexDirection: 'column' }}>
                                    {gymData.hours.map((hour, index) => (
                                        <Text key={index} style={styles.detailRowText}>
                                            {hour}
                                        </Text>
                                    ))}
                                </View>
                            </View>

                            {/* Phone */}
                            <TouchableOpacity
                                style={[styles.detailRowBox, { marginBottom: 0 }]}
                                onPress={handleCallGym}
                            >
                                <MaterialIcons name="phone" size={20} color="#D4AF37" />
                                <Text style={styles.detailRowText}>{gymData.phone_number}</Text>
                            </TouchableOpacity>

                            {/* Amenities */}
                            {gymData.amenities && gymData.amenities.length > 0 && (
                                <View style={styles.amenitiesContainer}>
                                    {gymData.amenities.map((amenity, index) => (
                                        <TouchableOpacity key={index} style={styles.amenityTag}>
                                            <Text style={styles.amenityText}>{amenity}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Logout Button */}
                {/* <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <Ionicons name="log-out-outline" size={20} color="#ff4444" />
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>

                <View style={styles.bottomSpace} /> */}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#191919',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        marginTop: 12,
        fontSize: 16,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginBottom: 8,
    },
    dateText: {
        fontSize: 14,
        color: '#9ca3af',
        fontWeight: '500',
        marginBottom: 8,
    },
    greetingText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },

    // Scroll Content
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },

    // Membership Card
    membershipCard: {
        backgroundColor: '#262626',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    gymNameSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    gymIcon: {
        width: 35,
        height: 35,
        borderRadius: 99,
        backgroundColor: '#D4AF37',
        justifyContent: 'center',
        alignItems: 'center',
    },
    gymName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        flex: 1,
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#D4AF37',
    },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#D4AF37',
    },
    activeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#D4AF37',
    },

    // Divider
    divider: {
        height: 1,
        backgroundColor: '#404040',
        marginVertical: 16,
    },

    // Membership Info
    membershipInfo: {
        marginBottom: 28,
    },
    membershipType: {
        fontSize: 12,
        color: '#D4AF37',
        fontWeight: '600',
        marginBottom: 6,
        letterSpacing: 0.5,
        textTransform: 'uppercase'
    },
    memberName: {
        fontSize: 30,
        fontWeight: '700',
        color: '#fff',
    },

    // Details Row
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 10,
        color: '#9ca3af',
        fontWeight: '600',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },

    // Action Buttons
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    qrButton: {
        flex: 1,
        backgroundColor: '#D4AF37',
        borderRadius: 12,
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
    qrButtonText: {
        color: '#191919',
        fontSize: 14,
        fontWeight: '700',
    },

    // Gym Section
    gymSection: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        color: '#9ca3af',
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 32,
        letterSpacing: 0.5,
    },
    gymNameBig: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 2,
    },
    gymLocationText: {
        fontSize: 14,
        color: '#9ca3af',
        fontWeight: '500',
    },

    // Photos Carousel
    photosScroll: {
        marginHorizontal: -16,
        marginBottom: 16,
    },
    photosContent: {
        paddingHorizontal: 16,
        gap: 4,
    },
    // photoItem: {
    //     width: PHOTO_WIDTH,
    //     aspectRatio: 4 / 3,
    // },
    // photoImage: {
    //     width: '100%',
    //     height: '100%',
    //     borderRadius: 12,
    // },

    photoItem: {
        width: ITEM_WIDTH,
        aspectRatio: 16 / 9,
        marginRight: SPACING,
    },
    photoImage: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
    },
    // Details Box
    detailsBox: {
        backgroundColor: '#262626',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    detailRowBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    detailRowText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '500',
        flex: 1,
    },

    // Amenities
    amenitiesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    amenityTag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#333',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#404040',
    },
    amenityText: {
        fontSize: 12,
        color: '#9ca3af',
        fontWeight: '500',
    },

    // Logout Button
    // logoutButton: {
    //     flexDirection: 'row',
    //     backgroundColor: '#2a1a1a',
    //     borderRadius: 12,
    //     paddingVertical: 14,
    //     justifyContent: 'center',
    //     alignItems: 'center',
    //     marginBottom: 20,
    //     borderWidth: 1,
    //     borderColor: '#ff4444',
    // },
    // logoutText: {
    //     color: '#ff4444',
    //     fontWeight: '700',
    //     fontSize: 14,
    //     marginLeft: 8,
    // },

    // // Bottom Space
    // bottomSpace: {
    //     height: 10,
    // },
});