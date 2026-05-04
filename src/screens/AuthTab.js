import { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import LoginScreen from './AuthScreens/LoginScreen';
import SignUpScreen from './AuthScreens/SignUpScreen';
import CompanyLogo from '../../assets/company-logo.png';

const Tab = createMaterialTopTabNavigator();

export default function AuthTabs() {
    const [activeTab, setActiveTab] = useState('Login');

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#191711' }}>
            {/* Logo and Titles */}
            <View style={styles.header}>
                <Image source={CompanyLogo} style={styles.icon} resizeMode="contain" />
                <Text style={styles.title}>ARMS</Text>
                <Text style={styles.title}>Iron Gym Fitness</Text>
            </View>

            {/* Box container for Tabs */}
            <View
                style={[
                styles.box,
                    { minHeight: activeTab === 'Register' ? 880 : 400 },
                    { marginBottom: 60 }
                ]}
            >
                <Tab.Navigator
                    initialRouteName="Login"
                    screenListeners={{
                        state: (e) => {
                            // get the current route name
                            const routeName = e.data.state.routes[e.data.state.index].name;
                            setActiveTab(routeName);
                        },
                    }}
                    style={{ backgroundColor: '#191919' }}
                    screenOptions={{
                        tabBarStyle: {
                            backgroundColor: '#141414',
                            borderRadius: 8,
                            paddingVertical: 2,
                        },
                        tabBarActiveTintColor: '#D4AF37',
                        tabBarInactiveTintColor: '#9CA3AF',
                        tabBarLabelStyle: {
                            fontFamily: 'Inter-Bold',
                            fontSize: 16,
                        },
                        swipeEnabled: false,
                        tabBarIndicatorStyle: {
                            backgroundColor: 'transparent',
                        },
                    }}
                >
                    <Tab.Screen name="Login" component={LoginScreen} />
                    <Tab.Screen name="Register" component={SignUpScreen} />
                </Tab.Navigator>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 40
    },
    icon: {
        width: 200,
        height: 200,
        marginBottom: 10
    },
    title: {
        fontSize: 32,
        fontFamily: 'Inter-Bold',
        color: '#fff',
        textAlign: 'center'
    },
    subtitle: {
        fontSize: 18,
        color: '#fff',
        textAlign: 'center'
    },
    box: {
        minHeight: 440,
        backgroundColor: '#191919',
        marginHorizontal: 16,
        borderRadius: 12,
        paddingVertical: 24,
        paddingHorizontal: 24,
        borderWidth: 1,
        borderColor: '#2A2A2A'
    }
});