import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

import StaffScanner from './StaffScreens/StaffScanner';
import StaffProfile from './StaffScreens/StaffProfile'

const Tab = createBottomTabNavigator();

export default function StaffTabs() {
    const { hasMembership, user } = useContext(AuthContext);

    // Decide initial tab based on subscription
    // const initialTab = hasMembership ? 'Home' : 'Membership';
    const initialTab = 'Profile';

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
                        paddingTop: 10,
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
                                        top: -18,
                                        width: 6,
                                        height: 6,
                                        borderRadius: 3,
                                        backgroundColor: '#D4AF37',
                                    }}
                                />
                            )}
                            {route.name === 'QR Scanner' && <Ionicons name="qr-code-outline" size={24} color={color} />}
                            {route.name === 'Profile' && <Ionicons name="person-outline" size={24} color={color} />}
                        </View>
                    ),
                })}
            >
                <Tab.Screen name="QR Scanner" component={StaffScanner} />
                <Tab.Screen name="Profile" component={StaffProfile} />
            </Tab.Navigator>
        </SafeAreaView>
    );
}