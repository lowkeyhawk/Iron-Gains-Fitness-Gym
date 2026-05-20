import React, { useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';

import AuthTab from '../screens/AuthTab';
import MainTabs from '../screens/MainTabs';
import StaffTabs from '../screens/StaffTabs';
import VerificationStack from "../screens/VerificationStack";
import RenewScreen from '../screens/MemberScreens/RenewScreen';

const Stack = createNativeStackNavigator();

// Wrap MainTabs + RenewScreen in a stack
function MemberStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
                name="RenewScreen"
                component={RenewScreen}
                options={{
                    headerShown: true,
                    headerTitle: 'Renew Membership',
                    headerStyle: { backgroundColor: '#191919' },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            />
        </Stack.Navigator>
    );
}

export default function RootNavigator() {
    const { userToken, loading, user } = useContext(AuthContext);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#E3B23C" />
            </View>
        );
    }

    const isStudentUnverified =
        user?.role === 'member' &&
        user?.memberType === 'student' &&
        Number(user?.isVerified) === 0 &&
        !user?.plan;

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!userToken ? (
                <Stack.Screen name="Auth" component={AuthTab} />
            ) : isStudentUnverified ? (
                <Stack.Screen name="VerificationStack" component={VerificationStack} />
            ) : user?.role === 'member' ? (
                // Use MemberStack instead of MainTabs directly
                <Stack.Screen name="MemberStack" component={MemberStack} />
            ) : (
                <Stack.Screen name="StaffTabs" component={StaffTabs} />
            )}
        </Stack.Navigator>
    );
}