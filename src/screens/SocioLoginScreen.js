import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { API_URL, endpoints } from '../config/api';

export default function SocioLoginScreen({ navigation }) {
    const [documento, setDocumento] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPin, setShowPin] = useState(false);

    const handleLogin = async () => {
        if (!documento.trim()) {
            Alert.alert('Error', 'Ingrese su número de documento');
            return;
        }
        if (!pin || pin.length !== 4) {
            Alert.alert('Error', 'Ingrese su PIN de 4 dígitos');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}${endpoints.loginSocio}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ documento: documento.trim(), pin }),
            });

            const data = await response.json();

            if (data.success) {
                await SecureStore.setItemAsync('socio_token', data.token);
                await SecureStore.setItemAsync('socio_data', JSON.stringify(data.socio));
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'SocioProyectos' }],
                });
            } else {
                Alert.alert('Error', data.message || 'Credenciales incorrectas');
            }
        } catch (error) {
            console.error('Login error:', error);
            Alert.alert('Error', 'Error de conexión. Intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="people" size={80} color="#10b981" />
                </View>

                <Text style={styles.title}>Portal de Socios</Text>
                <Text style={styles.subtitle}>Acceda a sus proyectos y liquidaciones</Text>

                <View style={styles.inputContainer}>
                    <Ionicons name="card-outline" size={24} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Número de Documento"
                        placeholderTextColor="#64748b"
                        value={documento}
                        onChangeText={setDocumento}
                        keyboardType="numeric"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Ionicons name="key-outline" size={24} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="PIN (4 dígitos)"
                        placeholderTextColor="#64748b"
                        value={pin}
                        onChangeText={(text) => setPin(text.replace(/[^0-9]/g, '').slice(0, 4))}
                        keyboardType="numeric"
                        secureTextEntry={!showPin}
                        maxLength={4}
                    />
                    <TouchableOpacity onPress={() => setShowPin(!showPin)}>
                        <Ionicons name={showPin ? 'eye-off' : 'eye'} size={24} color="#64748b" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="log-in-outline" size={24} color="#fff" />
                            <Text style={styles.buttonText}>Ingresar</Text>
                        </>
                    )}
                </TouchableOpacity>

                <Text style={styles.hint}>
                    <Ionicons name="information-circle-outline" size={14} color="#64748b" />
                    {' '}Tu PIN son los últimos 4 dígitos de tu documento
                </Text>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={20} color="#64748b" />
                    <Text style={styles.backButtonText}>Volver</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: '#1e293b',
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignSelf: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 32,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 56,
        color: '#fff',
        fontSize: 16,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10b981',
        borderRadius: 12,
        height: 56,
        marginTop: 8,
        gap: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    hint: {
        color: '#64748b',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 16,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        gap: 8,
    },
    backButtonText: {
        color: '#64748b',
        fontSize: 16,
    },
});
