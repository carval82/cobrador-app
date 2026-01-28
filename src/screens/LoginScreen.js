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
    Image,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const USER_TYPES = [
    { id: 'cobrador', label: 'Cobrador', icon: 'wallet-outline', color: '#10b981' },
    { id: 'admin', label: 'Administrador', icon: 'shield-checkmark-outline', color: '#3b82f6' },
    { id: 'cliente', label: 'Cliente', icon: 'person-outline', color: '#f59e0b' },
];

export default function LoginScreen() {
    const [userType, setUserType] = useState('cobrador');
    const [documento, setDocumento] = useState('');
    const [pin, setPin] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login, loginAdmin, loginCliente } = useAuth();

    const handleLogin = async () => {
        setLoading(true);
        try {
            if (userType === 'cobrador') {
                if (!documento.trim() || !pin.trim()) {
                    Alert.alert('Error', 'Por favor ingrese documento y PIN');
                    setLoading(false);
                    return;
                }
                await login(documento, pin);
            } else if (userType === 'admin') {
                if (!email.trim() || !password.trim()) {
                    Alert.alert('Error', 'Por favor ingrese email y contraseña');
                    setLoading(false);
                    return;
                }
                await loginAdmin(email, password);
            } else if (userType === 'cliente') {
                if (!documento.trim() || !pin.trim()) {
                    Alert.alert('Error', 'Por favor ingrese documento y PIN');
                    setLoading(false);
                    return;
                }
                await loginCliente(documento, pin);
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    const selectedType = USER_TYPES.find(t => t.id === userType);

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.logoContainer}>
                    <Image 
                        source={require('../../assets/splash-icon.png')} 
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.title}>INTERVEREDANET</Text>
                    <Text style={styles.subtitle}>Sistema de Gestión</Text>
                </View>

                {/* Selector de tipo de usuario */}
                <View style={styles.userTypeContainer}>
                    {USER_TYPES.map((type) => (
                        <TouchableOpacity
                            key={type.id}
                            style={[
                                styles.userTypeButton,
                                userType === type.id && { backgroundColor: type.color + '20', borderColor: type.color }
                            ]}
                            onPress={() => setUserType(type.id)}
                        >
                            <Ionicons 
                                name={type.icon} 
                                size={24} 
                                color={userType === type.id ? type.color : '#64748b'} 
                            />
                            <Text style={[
                                styles.userTypeText,
                                userType === type.id && { color: type.color }
                            ]}>
                                {type.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.formContainer}>
                    {userType === 'admin' ? (
                        <>
                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={24} color="#64748b" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Correo electrónico"
                                    placeholderTextColor="#64748b"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={24} color="#64748b" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Contraseña"
                                    placeholderTextColor="#64748b"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={24} color="#64748b" />
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <>
                            <View style={styles.inputContainer}>
                                <Ionicons name="card-outline" size={24} color="#64748b" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder={userType === 'cliente' ? "Número de documento" : "Número de documento"}
                                    placeholderTextColor="#64748b"
                                    value={documento}
                                    onChangeText={setDocumento}
                                    keyboardType="numeric"
                                    autoCapitalize="none"
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={24} color="#64748b" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="PIN"
                                    placeholderTextColor="#64748b"
                                    value={pin}
                                    onChangeText={setPin}
                                    secureTextEntry={!showPassword}
                                    keyboardType="numeric"
                                    maxLength={6}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={24} color="#64748b" />
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    <TouchableOpacity 
                        style={[styles.button, { backgroundColor: selectedType.color }, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="log-in-outline" size={24} color="#fff" />
                                <Text style={styles.buttonText}>Iniciar Sesión</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={styles.version}>v2.0.0</Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 15,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        marginTop: 5,
    },
    userTypeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    userTypeButton: {
        flex: 1,
        alignItems: 'center',
        padding: 12,
        marginHorizontal: 4,
        borderRadius: 12,
        backgroundColor: '#1e293b',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    userTypeText: {
        color: '#64748b',
        fontSize: 11,
        marginTop: 4,
        fontWeight: '600',
    },
    formContainer: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        borderRadius: 12,
        marginBottom: 15,
        paddingHorizontal: 15,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 50,
        color: '#fff',
        fontSize: 16,
    },
    eyeIcon: {
        padding: 5,
    },
    button: {
        flexDirection: 'row',
        backgroundColor: '#10b981',
        borderRadius: 12,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 10,
    },
    version: {
        textAlign: 'center',
        color: '#64748b',
        marginTop: 30,
    },
});
