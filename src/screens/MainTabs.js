import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

import Home from './MemberScreens/Home';
import Membership from './MemberScreens/Membership';
import MemberQRScreen from './MemberScreens/MemberQrScreen';
import History from './MemberScreens/History';
import Profile from './MemberScreens/Profile';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
    const { hasMembership, user } = useContext(AuthContext);

    // Decide initial tab based on subscription
    const initialTab = hasMembership ? 'Home' : 'Membership';

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#191919' }}>
            <Tab.Navigator
                initialRouteName={initialTab}
                screenOptions={({ route }) => ({
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: '#191919',
                        height: 90,
                        borderTopWidth: 2,
                        borderTopColor: '#202329',
                        paddingTop: 12,
                        paddingBottom: 10,
                    },
                    tabBarLabelStyle: {
                        fontSize: 12,
                        marginTop: 6,
                        textAlign: 'center',
                    },
                    tabBarActiveTintColor: '#D4AF37',
                    tabBarInactiveTintColor: '#6B7280',
                    tabBarIcon: ({ focused, color }) => (
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                            {focused && (
                                <View
                                    style={{
                                        position: 'absolute',
                                        top: -22,
                                        width: 6,
                                        height: 6,
                                        borderRadius: 3,
                                        backgroundColor: '#D4AF37',
                                    }}
                                />
                            )}
                            {route.name === 'Home' && <Ionicons name="home-outline" size={24} color={color} />}
                            {route.name === 'Membership' && <Ionicons name="layers-outline" size={26} color={color} />}
                            {route.name === 'QRCode' && <Ionicons name="qr-code-outline" size={26} color={color} />}
                            {route.name === 'History' && <FontAwesome5 name="credit-card" size={22} color={color} />}
                            {route.name === 'Profile' && <Ionicons name="person-outline" size={24} color={color} />}
                        </View>
                    ),
                })}
            >
                {hasMembership && (
                    <Tab.Screen name="Home" component={Home} />
                )}
                
                {hasMembership ? (
                    <Tab.Screen
                        name="QRCode"
                        component={MemberQRScreen}
                        options={{ title: 'QR Code' }}
                    />
                ) : (
                    <Tab.Screen
                        name="Membership"
                        options={{ title: 'Plans' }}
                    >
                        {() => <Membership subscribed={hasMembership} subscribedPlan={user?.plan} />}
                    </Tab.Screen>
                )}

                {hasMembership && (
                    <Tab.Screen name="History" component={History} />
                )}

                <Tab.Screen name="Profile" component={Profile} />
            </Tab.Navigator>

            {/* <Tab.Navigator
                initialRouteName={initialTab}
                screenOptions={({ route }) => ({
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: '#191919',
                        height: 90,
                        borderTopWidth: 2,
                        borderTopColor: '#202329',
                        paddingTop: 12,
                        paddingBottom: 10,
                    },
                    tabBarLabelStyle: {
                        fontSize: 12,
                        marginTop: 6,
                        textAlign: 'center',
                    },
                    tabBarActiveTintColor: '#D4AF37',
                    tabBarInactiveTintColor: '#6B7280',
                    tabBarIcon: ({ focused, color }) => (
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                            {focused && (
                                <View
                                    style={{
                                        position: 'absolute',
                                        top: -22,
                                        width: 6,
                                        height: 6,
                                        borderRadius: 3,
                                        backgroundColor: '#D4AF37',
                                    }}
                                />
                            )}
                            {route.name === 'Home' && <Ionicons name="home-outline" size={24} color={color} />}
                            {route.name === 'Membership' && <Ionicons name="layers-outline" size={26} color={color} />}
                            {route.name === 'Profile' && <Ionicons name="person-outline" size={24} color={color} />}
                        </View>
                    ),
                })}
            >
                <Tab.Screen name="Home" component={Home} />
                
                {!hasMembership && (
                    <Tab.Screen
                        name="Membership"
                        options={{ title: 'Plans' }}
                    >
                        {() => <Membership subscribed={hasMembership} subscribedPlan={user?.plan} />}
                    </Tab.Screen>
                )}

                <Tab.Screen name="Profile" component={Profile} />
            </Tab.Navigator> */}
        </SafeAreaView>
    );
}
