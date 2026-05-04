import React, { useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';

import AuthTab from '../screens/AuthTab';
import MainTabs from '../screens/MainTabs';
import StaffTabs from '../screens/StaffTabs';
import VerificationStack from "../screens/VerificationStack";

const Stack = createNativeStackNavigator();

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
        Number(user?.isVerified) === 0;

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!userToken ? (
                <Stack.Screen name="Auth" component={AuthTab} />
            ) : isStudentUnverified ? (
                <Stack.Screen name="VerificationStack" component={VerificationStack} />
            ) : user?.role === 'member' ? (
                <Stack.Screen name="MainTabs" component={MainTabs} />
            ) : (
                <Stack.Screen name="StaffTabs" component={StaffTabs} />
            )}
        </Stack.Navigator>
    );
}