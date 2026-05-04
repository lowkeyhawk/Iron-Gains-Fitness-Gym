import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [hasMembership, setHasMembership] = useState(false);

    // ---------------------------
    // Load stored auth on app start
    // ---------------------------
    useEffect(() => {
        const loadUser = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const userData = await AsyncStorage.getItem('user');

                if (token) setUserToken(token);

                if (userData) {
                    const parsedUser = JSON.parse(userData);

                    setUser(parsedUser);

                    if (parsedUser.role === 'member') {
                        setHasMembership(!!parsedUser.plan);
                    }
                }
            } catch (err) {
                console.error('Auth load error:', err);
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    // ---------------------------
    // 🔥 FIXED: updateUser (syncs state + AsyncStorage)
    // ---------------------------
    const updateUser = async (updates) => {
        setUser(prev => {
            const updated = {
                ...prev,
                ...updates,
            };

            AsyncStorage.setItem('user', JSON.stringify(updated));

            return updated;
        });
    };

    // ---------------------------
    // Membership update helper
    // ---------------------------
    const updateMembership = (value) => {
        setHasMembership(value);
    };

    // ---------------------------
    // Logout
    // ---------------------------
    const logout = async () => {
        try {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('user');

            setUserToken(null);
            setUser(null);
            setHasMembership(false);
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                userToken,
                setUserToken,
                loading,
                user,
                setUser,
                updateUser,       // ✅ IMPORTANT
                hasMembership,
                setHasMembership,
                updateMembership,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};