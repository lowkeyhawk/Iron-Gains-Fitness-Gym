import React, { createContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [hasMembership, setHasMembership] = useState(false);

    const tokenRefreshInterval = useRef(null); // 
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
    // Silent token refresh every 11 hours
    // Runs regardless of which screen opens first
    // ---------------------------
    useEffect(() => {
        const refreshToken = async () => {
            if (!user?.id) return;
            try {
                const res = await fetch(API_ENDPOINTS.REFRESH_TOKEN, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: user.id }),
                });
                const data = await res.json();
                if (data.status === 'success') {
                    await AsyncStorage.setItem('userToken', data.token);
                    console.log('✅ Token refreshed silently');
                }
            } catch (err) {
                console.error('Token refresh error:', err);
            }
        };

        if (user?.id) {
            refreshToken(); // refresh immediately when user is set
            tokenRefreshInterval.current = setInterval(
                refreshToken,
                11 * 60 * 60 * 1000 // every 11 hours
            );
        }

        return () => {
            if (tokenRefreshInterval.current) {
                clearInterval(tokenRefreshInterval.current);
            }
        };
    }, [user?.id]);

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
            // Clear refresh interval on logout
            if (tokenRefreshInterval.current) {
                clearInterval(tokenRefreshInterval.current);
            }

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
                updateUser,
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