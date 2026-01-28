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

export default function AdminCobradorFormScreen({ navigation, route }) {
    const { cobrador, mode } = route.params || {};
    const isEdit = mode === 'edit';
    
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [proyectos, setProyectos] = useState([]);
    const [selectedProyectos, setSelectedProyectos] = useState(cobrador?.proyectos_ids || []);
    
    const [form, setForm] = useState({
        nombre: cobrador?.nombre || '',
        documento: cobrador?.documento || '',
        pin: '',
        celular: cobrador?.celular || '',
        comision_porcentaje: cobrador?.comision_porcentaje?.toString() || '0',
        estado: cobrador?.estado || 'activo',
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

    const toggleProyecto = (proyectoId) => {
        setSelectedProyectos(prev => {
            if (prev.includes(proyectoId)) {
                return prev.filter(id => id !== proyectoId);
            } else {
                return [...prev, proyectoId];
            }
        });
    };

    const handleSave = async () => {
        if (!form.nombre || !form.documento) {
            Alert.alert('Error', 'Nombre y documento son requeridos');
            return;
        }
        if (!isEdit && !form.pin) {
            Alert.alert('Error', 'El PIN es requerido para nuevos cobradores');
            return;
        }

        setSaving(true);
        try {
            const url = isEdit 
                ? `${endpoints.adminCobradores}/${cobrador.id}`
                : endpoints.adminCobradores;
            
            const data = {
                ...form,
                comision_porcentaje: parseFloat(form.comision_porcentaje) || 0,
                proyectos: selectedProyectos,
            };
            
            if (!data.pin) delete data.pin;

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
            Alert.alert('Error', error.message || 'No se pudo guardar el cobrador');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Confirmar eliminación',
            '¿Está seguro de eliminar este cobrador?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: confirmDelete }
            ]
        );
    };

    const confirmDelete = async () => {
        setSaving(true);
        try {
            const response = await api.request(`${endpoints.adminCobradores}/${cobrador.id}`, {
                method: 'DELETE',
            });
            if (response.success) {
                Alert.alert('Éxito', 'Cobrador eliminado', [
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
                <ActivityIndicator size="large" color="#10b981" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEdit ? 'Editar Cobrador' : 'Nuevo Cobrador'}</Text>
                {isEdit && (
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
                    <Text style={styles.label}>{isEdit ? 'Nuevo PIN (dejar vacío para no cambiar)' : 'PIN *'}</Text>
                    <TextInput
                        style={styles.input}
                        value={form.pin}
                        onChangeText={(text) => setForm({...form, pin: text})}
                        placeholder="PIN de acceso (mínimo 4 dígitos)"
                        placeholderTextColor="#64748b"
                        keyboardType="numeric"
                        secureTextEntry
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
                    <Text style={styles.label}>Comisión (%)</Text>
                    <TextInput
                        style={styles.input}
                        value={form.comision_porcentaje}
                        onChangeText={(text) => setForm({...form, comision_porcentaje: text})}
                        placeholder="Porcentaje de comisión"
                        placeholderTextColor="#64748b"
                        keyboardType="decimal-pad"
                    />
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
                                <Picker.Item label="Inactivo" value="inactivo" />
                            </Picker>
                        </View>
                    </View>
                )}

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Proyectos asignados</Text>
                    <View style={styles.proyectosContainer}>
                        {proyectos.map(p => (
                            <TouchableOpacity
                                key={p.id}
                                style={[
                                    styles.proyectoChip,
                                    selectedProyectos.includes(p.id) && styles.proyectoChipSelected
                                ]}
                                onPress={() => toggleProyecto(p.id)}
                            >
                                <Ionicons 
                                    name={selectedProyectos.includes(p.id) ? "checkbox" : "square-outline"} 
                                    size={20} 
                                    color={selectedProyectos.includes(p.id) ? "#10b981" : "#64748b"} 
                                />
                                <Text style={[
                                    styles.proyectoChipText,
                                    selectedProyectos.includes(p.id) && styles.proyectoChipTextSelected
                                ]}>
                                    {p.nombre}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
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
                                {isEdit ? 'Guardar Cambios' : 'Crear Cobrador'}
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
    proyectosContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    proyectoChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        marginRight: 10,
        marginBottom: 10,
    },
    proyectoChipSelected: {
        backgroundColor: '#10b98120',
        borderWidth: 1,
        borderColor: '#10b981',
    },
    proyectoChipText: {
        color: '#64748b',
        marginLeft: 8,
    },
    proyectoChipTextSelected: {
        color: '#10b981',
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
