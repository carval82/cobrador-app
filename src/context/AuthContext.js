import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';
import db from '../services/database';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userType, setUserType] = useState(null); // 'cobrador', 'admin', 'cliente'
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const token = await SecureStore.getItemAsync('token');
            const userData = await SecureStore.getItemAsync('user');
            const storedUserType = await SecureStore.getItemAsync('userType');
            
            if (token && userData) {
                setUser(JSON.parse(userData));
                setUserType(storedUserType || 'cobrador');
            }
        } catch (error) {
            console.error('Error loading user:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (documento, pin) => {
        const response = await api.login(documento, pin);
        
        if (response.cobrador) {
            const userData = { ...response.cobrador, type: 'cobrador' };
            await SecureStore.setItemAsync('user', JSON.stringify(userData));
            await SecureStore.setItemAsync('userType', 'cobrador');
            setUser(userData);
            setUserType('cobrador');
        }
        
        return response;
    };

    const loginAdmin = async (email, password) => {
        const response = await api.loginAdmin(email, password);
        
        if (response.user) {
            const userData = { ...response.user, type: 'admin' };
            await SecureStore.setItemAsync('user', JSON.stringify(userData));
            await SecureStore.setItemAsync('userType', 'admin');
            setUser(userData);
            setUserType('admin');
        }
        
        return response;
    };

    const loginCliente = async (documento, pin) => {
        const response = await api.loginCliente(documento, pin);
        
        if (response.cliente) {
            const userData = { ...response.cliente, type: 'cliente' };
            await SecureStore.setItemAsync('user', JSON.stringify(userData));
            await SecureStore.setItemAsync('userType', 'cliente');
            setUser(userData);
            setUserType('cliente');
        }
        
        return response;
    };

    const logout = async () => {
        await api.logout();
        await SecureStore.deleteItemAsync('user');
        await SecureStore.deleteItemAsync('userType');
        setUser(null);
        setUserType(null);
    };

    return (
        <AuthContext.Provider value={{ user, userType, loading, login, loginAdmin, loginCliente, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
