import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { endpoints } from '../config/api';

export default function AdminPerfilScreen({ navigation }) {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [form, setForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
    });
    const [passwords, setPasswords] = useState({
        password_actual: '',
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        loadPerfil();
    }, []);

    const loadPerfil = async () => {
        try {
            const response = await api.request(endpoints.adminPerfil);
            if (response.success && response.user) {
                setForm({
                    name: response.user.name || '',
                    email: response.user.email || '',
                });
                await updateUser(response.user);
            }
        } catch (error) {
            console.error('Error loading perfil:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSavePerfil = async () => {
        if (!form.name.trim() || !form.email.trim()) {
            Alert.alert('Error', 'Nombre y correo son requeridos');
            return;
        }

        setSaving(true);
        try {
            const response = await api.request(endpoints.adminPerfil, {
                method: 'PUT',
                body: JSON.stringify({
                    name: form.name.trim(),
                    email: form.email.trim(),
                }),
            });

            if (response.success) {
                await updateUser(response.user);
                Alert.alert('Éxito', response.message || 'Perfil actualizado');
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'No se pudo actualizar el perfil');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!passwords.password_actual || !passwords.password) {
            Alert.alert('Error', 'Ingrese la contraseña actual y la nueva');
            return;
        }
        if (passwords.password.length < 6) {
            Alert.alert('Error', 'La nueva contraseña debe tener al menos 6 caracteres');
            return;
        }
        if (passwords.password !== passwords.password_confirmation) {
            Alert.alert('Error', 'Las contraseñas nuevas no coinciden');
            return;
        }

        setSavingPassword(true);
        try {
            const response = await api.request(endpoints.adminPerfil, {
                method: 'PUT',
                body: JSON.stringify({
                    password_actual: passwords.password_actual,
                    password: passwords.password,
                }),
            });

            if (response.success) {
                setPasswords({
                    password_actual: '',
                    password: '',
                    password_confirmation: '',
                });
                Alert.alert('Éxito', 'Contraseña actualizada');
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'No se pudo cambiar la contraseña');
        } finally {
            setSavingPassword(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mi perfil</Text>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.avatarCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {(form.name || 'A').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <Text style={styles.avatarName}>{form.name}</Text>
                    <Text style={styles.avatarEmail}>{form.email}</Text>
                </View>

                <Text style={styles.sectionTitle}>Datos de la cuenta</Text>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Nombre *</Text>
                    <TextInput
                        style={styles.input}
                        value={form.name}
                        onChangeText={(text) => setForm({ ...form, name: text })}
                        placeholder="Nombre completo"
                        placeholderTextColor="#64748b"
                    />
                </View>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Correo *</Text>
                    <TextInput
                        style={styles.input}
                        value={form.email}
                        onChangeText={(text) => setForm({ ...form, email: text })}
                        placeholder="correo@ejemplo.com"
                        placeholderTextColor="#64748b"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>
                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.buttonDisabled]}
                    onPress={handleSavePerfil}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="checkmark" size={22} color="#fff" />
                            <Text style={styles.saveButtonText}>Guardar perfil</Text>
                        </>
                    )}
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>Cambiar contraseña</Text>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Contraseña actual *</Text>
                    <View style={styles.passwordRow}>
                        <TextInput
                            style={[styles.input, styles.passwordInput]}
                            value={passwords.password_actual}
                            onChangeText={(text) => setPasswords({ ...passwords, password_actual: text })}
                            placeholder="Contraseña actual"
                            placeholderTextColor="#64748b"
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Nueva contraseña *</Text>
                    <TextInput
                        style={styles.input}
                        value={passwords.password}
                        onChangeText={(text) => setPasswords({ ...passwords, password: text })}
                        placeholder="Mínimo 6 caracteres"
                        placeholderTextColor="#64748b"
                        secureTextEntry={!showPassword}
                    />
                </View>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Confirmar nueva contraseña *</Text>
                    <TextInput
                        style={styles.input}
                        value={passwords.password_confirmation}
                        onChangeText={(text) => setPasswords({ ...passwords, password_confirmation: text })}
                        placeholder="Repita la nueva contraseña"
                        placeholderTextColor="#64748b"
                        secureTextEntry={!showPassword}
                    />
                </View>
                <TouchableOpacity
                    style={[styles.passwordButton, savingPassword && styles.buttonDisabled]}
                    onPress={handleChangePassword}
                    disabled={savingPassword}
                >
                    {savingPassword ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="key-outline" size={22} color="#fff" />
                            <Text style={styles.saveButtonText}>Actualizar contraseña</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.usersLink}
                    onPress={() => navigation.navigate('AdminUsuarios')}
                >
                    <Ionicons name="people-outline" size={22} color="#3b82f6" />
                    <Text style={styles.usersLinkText}>Ver y editar usuarios</Text>
                    <Ionicons name="chevron-forward" size={20} color="#64748b" />
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0f172a',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50,
        backgroundColor: '#1e293b',
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    avatarCard: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        marginBottom: 24,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
    },
    avatarName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    avatarEmail: {
        color: '#94a3b8',
        fontSize: 14,
        marginTop: 4,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        color: '#94a3b8',
        fontSize: 14,
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 15,
        color: '#fff',
        fontSize: 16,
    },
    passwordRow: {
        position: 'relative',
    },
    passwordInput: {
        paddingRight: 48,
    },
    eyeButton: {
        position: 'absolute',
        right: 14,
        top: 15,
    },
    saveButton: {
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 28,
    },
    passwordButton: {
        backgroundColor: '#8b5cf6',
        borderRadius: 12,
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    usersLink: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 16,
        marginBottom: 30,
    },
    usersLinkText: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        marginLeft: 10,
    },
});
