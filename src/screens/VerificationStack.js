import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StudentVerificationInstructions from './StudentScreens/StudentVerificationInstructions';
import StudentVerificationUpload from './StudentScreens/StudentVerificationUpload';

const Stack = createNativeStackNavigator();

export default function VerificationStack({ route }) {
    const userId = route?.params?.userId;

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="StudentVerificationInstructions"
                component={StudentVerificationInstructions}
                initialParams={{ userId }}
            />

            <Stack.Screen
                name="StudentVerificationUpload"
                component={StudentVerificationUpload}
                initialParams={{ userId }}
            />
        </Stack.Navigator>
    );
}