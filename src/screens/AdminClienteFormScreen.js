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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import api from '../services/api';
import { endpoints } from '../config/api';

export default function AdminClienteFormScreen({ navigation, route }) {
    const { cliente, mode } = route.params || {};
    const isEdit = mode === 'edit';
    
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [proyectos, setProyectos] = useState([]);
    const [cobradores, setCobradores] = useState([]);
    
    const [form, setForm] = useState({
        proyecto_id: cliente?.proyecto_id || '',
        nombre: cliente?.nombre || '',
        documento: cliente?.documento || '',
        celular: cliente?.celular || '',
        direccion: cliente?.direccion || '',
        barrio: cliente?.barrio || '',
        estado: cliente?.estado || 'activo',
        cobrador_id: cliente?.cobrador_id || '',
    });

    useEffect(() => {
        loadDatosFormularios();
    }, []);

    const loadDatosFormularios = async () => {
        setLoading(true);
        try {
            const response = await api.request(endpoints.adminDatosFormularios);
            if (response.success) {
                setProyectos(response.proyectos);
                setCobradores(response.cobradores);
            }
        } catch (error) {
            console.error('Error loading datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!form.proyecto_id || !form.nombre || !form.documento) {
            Alert.alert('Error', 'Proyecto, nombre y documento son requeridos');
            return;
        }

        setSaving(true);
        try {
            const url = isEdit 
                ? `${endpoints.adminClientes}/${cliente.id}`
                : endpoints.adminClientes;
            
            const response = await api.request(url, {
                method: isEdit ? 'PUT' : 'POST',
                body: JSON.stringify(form),
            });

            if (response.success) {
                Alert.alert('Éxito', response.message, [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'No se pudo guardar el cliente');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Confirmar eliminación',
            '¿Está seguro de eliminar este cliente?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: confirmDelete }
            ]
        );
    };

    const confirmDelete = async () => {
        setSaving(true);
        try {
            const response = await api.request(`${endpoints.adminClientes}/${cliente.id}`, {
                method: 'DELETE',
            });
            if (response.success) {
                Alert.alert('Éxito', 'Cliente eliminado', [
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
                <Text style={styles.headerTitle}>{isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}</Text>
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
                    <Text style={styles.label}>Nombre *</Text>
                    <TextInput
                        style={styles.input}
                        value={form.nombre}
                        onChangeText={(text) => setForm({...form, nombre: text})}
                        placeholder="Nombre completo"
                        placeholderTextColor="#64748b"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Documento *</Text>
                    <TextInput
                        style={styles.input}
                        value={form.documento}
                        onChangeText={(text) => setForm({...form, documento: text})}
                        placeholder="Número de documento"
                        placeholderTextColor="#64748b"
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Celular</Text>
                    <TextInput
                        style={styles.input}
                        value={form.celular}
                        onChangeText={(text) => setForm({...form, celular: text})}
                        placeholder="Número de celular"
                        placeholderTextColor="#64748b"
                        keyboardType="phone-pad"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Dirección</Text>
                    <TextInput
                        style={styles.input}
                        value={form.direccion}
                        onChangeText={(text) => setForm({...form, direccion: text})}
                        placeholder="Dirección"
                        placeholderTextColor="#64748b"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Barrio</Text>
                    <TextInput
                        style={styles.input}
                        value={form.barrio}
                        onChangeText={(text) => setForm({...form, barrio: text})}
                        placeholder="Barrio"
                        placeholderTextColor="#64748b"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Cobrador asignado</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={form.cobrador_id}
                            onValueChange={(value) => setForm({...form, cobrador_id: value})}
                            style={styles.picker}
                            dropdownIconColor="#fff"
                        >
                            <Picker.Item label="Sin asignar" value="" />
                            {cobradores.map(c => (
                                <Picker.Item key={c.id} label={c.nombre} value={c.id} />
                            ))}
                        </Picker>
                    </View>
                </View>

                {isEdit && (
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Estado</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={form.estado}
                                onValueChange={(value) => setForm({...form, estado: value})}
                                style={styles.picker}
                                dropdownIconColor="#fff"
                            >
                                <Picker.Item label="Activo" value="activo" />
                                <Picker.Item label="Suspendido" value="suspendido" />
                                <Picker.Item label="Retirado" value="retirado" />
                            </Picker>
                        </View>
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
                                {isEdit ? 'Guardar Cambios' : 'Crear Cliente'}
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
    pickerContainer: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        overflow: 'hidden',
    },
    picker: {
        color: '#fff',
        height: 50,
    },
    saveButton: {
        backgroundColor: '#10b981',
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
