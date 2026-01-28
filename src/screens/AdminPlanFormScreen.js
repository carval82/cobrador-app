import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import api from '../services/api';
import { endpoints } from '../config/api';

export default function AdminPlanFormScreen({ navigation, route }) {
    const { plan, mode } = route.params || {};
    const isEdit = mode === 'edit';
    
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [proyectos, setProyectos] = useState([]);
    
    const [form, setForm] = useState({
        proyecto_id: plan?.proyecto_id || '',
        nombre: plan?.nombre || '',
        descripcion: plan?.descripcion || '',
        precio: plan?.precio?.toString() || '',
        velocidad_bajada: plan?.velocidad_bajada?.toString() || '',
        velocidad_subida: plan?.velocidad_subida?.toString() || '',
        activo: plan?.activo ?? true,
    });

    useEffect(() => {
        loadProyectos();
    }, []);

    const loadProyectos = async () => {
        setLoading(true);
        try {
            const response = await api.request(endpoints.adminDatosFormularios);
            if (response.success) {
                setProyectos(response.proyectos);
            }
        } catch (error) {
            console.error('Error loading proyectos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!form.proyecto_id || !form.nombre || !form.precio) {
            Alert.alert('Error', 'Proyecto, nombre y precio son requeridos');
            return;
        }

        setSaving(true);
        try {
            const url = isEdit 
                ? `${endpoints.adminPlanes}/${plan.id}`
                : endpoints.adminPlanes;
            
            const data = {
                ...form,
                precio: parseFloat(form.precio) || 0,
                velocidad_bajada: parseInt(form.velocidad_bajada) || null,
                velocidad_subida: parseInt(form.velocidad_subida) || null,
            };

            const response = await api.request(url, {
                method: isEdit ? 'PUT' : 'POST',
                body: JSON.stringify(data),
            });

            if (response.success) {
                Alert.alert('Éxito', response.message, [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'No se pudo guardar el plan');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Confirmar eliminación',
            '¿Está seguro de eliminar este plan?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: confirmDelete }
            ]
        );
    };

    const confirmDelete = async () => {
        setSaving(true);
        try {
            const response = await api.request(`${endpoints.adminPlanes}/${plan.id}`, {
                method: 'DELETE',
            });
            if (response.success) {
                Alert.alert('Éxito', 'Plan eliminado', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#f59e0b" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEdit ? 'Editar Plan' : 'Nuevo Plan'}</Text>
                {isEdit && (
                    <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                        <Ionicons name="trash-outline" size={24} color="#ef4444" />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Proyecto *</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={form.proyecto_id}
                            onValueChange={(value) => setForm({...form, proyecto_id: value})}
                            style={styles.picker}
                            dropdownIconColor="#fff"
                        >
                            <Picker.Item label="Seleccionar proyecto..." value="" />
                            {proyectos.map(p => (
                                <Picker.Item key={p.id} label={p.nombre} value={p.id} />
                            ))}
                        </Picker>
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Nombre del plan *</Text>
                    <TextInput
                        style={styles.input}
                        value={form.nombre}
                        onChangeText={(text) => setForm({...form, nombre: text})}
                        placeholder="Ej: Plan Básico 10 Mbps"
                        placeholderTextColor="#64748b"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Precio mensual (COP) *</Text>
                    <TextInput
                        style={styles.input}
                        value={form.precio}
                        onChangeText={(text) => setForm({...form, precio: text})}
                        placeholder="Ej: 35000"
                        placeholderTextColor="#64748b"
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.label}>Vel. Bajada (Mbps)</Text>
                        <TextInput
                            style={styles.input}
                            value={form.velocidad_bajada}
                            onChangeText={(text) => setForm({...form, velocidad_bajada: text})}
                            placeholder="10"
                            placeholderTextColor="#64748b"
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Vel. Subida (Mbps)</Text>
                        <TextInput
                            style={styles.input}
                            value={form.velocidad_subida}
                            onChangeText={(text) => setForm({...form, velocidad_subida: text})}
                            placeholder="5"
                            placeholderTextColor="#64748b"
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Descripción</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={form.descripcion}
                        onChangeText={(text) => setForm({...form, descripcion: text})}
                        placeholder="Descripción del plan..."
                        placeholderTextColor="#64748b"
                        multiline
                        numberOfLines={3}
                    />
                </View>

                {isEdit && (
                    <View style={styles.switchContainer}>
                        <Text style={styles.label}>Plan activo</Text>
                        <Switch
                            value={form.activo}
                            onValueChange={(value) => setForm({...form, activo: value})}
                            trackColor={{ false: '#334155', true: '#10b98150' }}
                            thumbColor={form.activo ? '#10b981' : '#64748b'}
                        />
                    </View>
                )}

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
                                {isEdit ? 'Guardar Cambios' : 'Crear Plan'}
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
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        overflow: 'hidden',
    },
    picker: {
        color: '#fff',
        height: 50,
    },
    row: {
        flexDirection: 'row',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
    },
    saveButton: {
        backgroundColor: '#f59e0b',
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
        color: '#000',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 10,
    },
});
