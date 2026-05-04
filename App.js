import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

const MyTheme = {
    ...DefaultTheme,
    dark: true,
    colors: {
        ...DefaultTheme.colors,
        background: '#191711',
        card: '#191711',
        text: '#fff',
        border: '#191711',
        primary: '#007bff',
    },
};

export default function App() {
    return (
        <AuthProvider>
            <NavigationContainer theme={MyTheme}>
                <RootNavigator />
            </NavigationContainer>
        </AuthProvider>
    );
}