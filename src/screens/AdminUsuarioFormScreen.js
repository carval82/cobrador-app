import React, { useState } from 'react';
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

export default function AdminUsuarioFormScreen({ navigation, route }) {
    const { usuario, mode } = route.params || {};
    const isEdit = mode === 'edit';
    const { user, updateUser } = useAuth();
    const isSelf = isEdit && usuario?.id === user?.id;

    const [saving, setSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({
        name: usuario?.name || '',
        email: usuario?.email || '',
        password: '',
        password_confirmation: '',
    });

    const handleSave = async () => {
        if (!form.name.trim() || !form.email.trim()) {
            Alert.alert('Error', 'Nombre y correo son requeridos');
            return;
        }
        if (!isEdit && !form.password) {
            Alert.alert('Error', 'La contraseña es requerida para nuevos usuarios');
            return;
        }
        if (form.password) {
            if (form.password.length < 6) {
                Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
                return;
            }
            if (form.password !== form.password_confirmation) {
                Alert.alert('Error', 'Las contraseñas no coinciden');
                return;
            }
        }

        setSaving(true);
        try {
            const url = isEdit
                ? `${endpoints.adminUsuarios}/${usuario.id}`
                : endpoints.adminUsuarios;

            const data = {
                name: form.name.trim(),
                email: form.email.trim(),
            };
            if (form.password) {
                data.password = form.password;
            }

            const response = await api.request(url, {
                method: isEdit ? 'PUT' : 'POST',
                body: JSON.stringify(data),
            });

            if (response.success) {
                if (isSelf && response.usuario) {
                    await updateUser(response.usuario);
                }
                Alert.alert('Éxito', response.message, [
                    { text: 'OK', onPress: () => navigation.goBack() },
                ]);
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'No se pudo guardar el usuario');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        if (isSelf) {
            Alert.alert('Error', 'No puede eliminar su propio usuario');
            return;
        }
        Alert.alert(
            'Confirmar eliminación',
            `¿Eliminar el usuario ${usuario?.name}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: confirmDelete },
            ]
        );
    };

    const confirmDelete = async () => {
        setSaving(true);
        try {
            const response = await api.request(`${endpoints.adminUsuarios}/${usuario.id}`, {
                method: 'DELETE',
            });
            if (response.success) {
                Alert.alert('Éxito', 'Usuario eliminado', [
                    { text: 'OK', onPress: () => navigation.goBack() },
                ]);
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'No se pudo eliminar el usuario');
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEdit ? 'Editar usuario' : 'Nuevo usuario'}</Text>
                {isEdit && !isSelf && (
                    <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                        <Ionicons name="trash-outline" size={24} color="#ef4444" />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView style={styles.content}>
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

                <View style={styles.formGroup}>
                    <Text style={styles.label}>
                        {isEdit ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
                    </Text>
                    <View style={styles.passwordRow}>
                        <TextInput
                            style={[styles.input, styles.passwordInput]}
                            value={form.password}
                            onChangeText={(text) => setForm({ ...form, password: text })}
                            placeholder="Mínimo 6 caracteres"
                            placeholderTextColor="#64748b"
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Confirmar contraseña</Text>
                    <TextInput
                        style={styles.input}
                        value={form.password_confirmation}
                        onChangeText={(text) => setForm({ ...form, password_confirmation: text })}
                        placeholder="Repita la contraseña"
                        placeholderTextColor="#64748b"
                        secureTextEntry={!showPassword}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.buttonDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="checkmark" size={24} color="#fff" />
                            <Text style={styles.saveButtonText}>
                                {isEdit ? 'Guardar cambios' : 'Crear usuario'}
                            </Text>
                        </>
                    )}
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
    deleteButton: {
        padding: 5,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    formGroup: {
        marginBottom: 20,
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
        marginTop: 10,
        marginBottom: 30,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 10,
    },
});
