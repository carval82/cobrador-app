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

export default function AdminServicioFormScreen({ navigation, route }) {
    const { servicio, cliente, mode } = route.params || {};
    const isEdit = mode === 'edit';
    
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [planes, setPlanes] = useState([]);
    
    const [form, setForm] = useState({
        cliente_id: cliente?.id,
        plan_servicio_id: servicio?.plan_id || '',
        ip_asignada: servicio?.ip_asignada || '',
        mac_address: servicio?.mac_address || '',
        dia_corte: servicio?.dia_corte?.toString() || '1',
        dia_pago_limite: servicio?.dia_pago_limite?.toString() || '10',
        precio_especial: servicio?.precio_especial?.toString() || '',
        estado: servicio?.estado || 'activo',
    });

    useEffect(() => {
        loadPlanes();
    }, []);

    const loadPlanes = async () => {
        setLoading(true);
        try {
            const response = await api.request(endpoints.adminPlanes);
            if (response.success) {
                setPlanes(response.planes);
            }
        } catch (error) {
            console.error('Error loading planes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!form.plan_servicio_id) {
            Alert.alert('Error', 'Debe seleccionar un plan');
            return;
        }

        setSaving(true);
        try {
            const url = isEdit 
                ? `/admin/servicios/${servicio.id}`
                : '/admin/servicios';
            
            const data = {
                ...form,
                dia_corte: parseInt(form.dia_corte) || 1,
                dia_pago_limite: parseInt(form.dia_pago_limite) || 10,
                precio_especial: form.precio_especial ? parseFloat(form.precio_especial) : null,
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
            Alert.alert('Error', error.message || 'No se pudo guardar el servicio');
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
        }).format(value || 0);
    };

    const selectedPlan = planes.find(p => p.id === form.plan_servicio_id);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8b5cf6" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>{isEdit ? 'Editar Servicio' : 'Asignar Plan'}</Text>
                    <Text style={styles.headerSubtitle}>{cliente?.nombre}</Text>
                </View>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Plan de Servicio *</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={form.plan_servicio_id}
                            onValueChange={(value) => setForm({...form, plan_servicio_id: value})}
                            style={styles.picker}
                            dropdownIconColor="#fff"
                        >
                            <Picker.Item label="Seleccionar plan..." value="" />
                            {planes.map(p => (
                                <Picker.Item 
                                    key={p.id} 
                                    label={`${p.nombre} - ${formatCurrency(p.precio)}`} 
                                    value={p.id} 
                                />
                            ))}
                        </Picker>
                    </View>
                    {selectedPlan && (
                        <View style={styles.planInfo}>
                            <Text style={styles.planInfoText}>
                                Precio base: {formatCurrency(selectedPlan.precio)}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Precio Especial (opcional)</Text>
                    <TextInput
                        style={styles.input}
                        value={form.precio_especial}
                        onChangeText={(text) => setForm({...form, precio_especial: text})}
                        placeholder="Dejar vacío para usar precio del plan"
                        placeholderTextColor="#64748b"
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.label}>Día de Corte</Text>
                        <TextInput
                            style={styles.input}
                            value={form.dia_corte}
                            onChangeText={(text) => setForm({...form, dia_corte: text})}
                            placeholder="1"
                            placeholderTextColor="#64748b"
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Límite de Pago</Text>
                        <TextInput
                            style={styles.input}
                            value={form.dia_pago_limite}
                            onChangeText={(text) => setForm({...form, dia_pago_limite: text})}
                            placeholder="10"
                            placeholderTextColor="#64748b"
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>IP Asignada</Text>
                    <TextInput
                        style={styles.input}
                        value={form.ip_asignada}
                        onChangeText={(text) => setForm({...form, ip_asignada: text})}
                        placeholder="192.168.1.100"
                        placeholderTextColor="#64748b"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>MAC Address</Text>
                    <TextInput
                        style={styles.input}
                        value={form.mac_address}
                        onChangeText={(text) => setForm({...form, mac_address: text})}
                        placeholder="AA:BB:CC:DD:EE:FF"
                        placeholderTextColor="#64748b"
                        autoCapitalize="characters"
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
                                <Picker.Item label="Suspendido" value="suspendido" />
                                <Picker.Item label="Cancelado" value="cancelado" />
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
                                {isEdit ? 'Guardar Cambios' : 'Asignar Plan'}
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
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 2,
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
    planInfo: {
        marginTop: 8,
        padding: 10,
        backgroundColor: '#8b5cf620',
        borderRadius: 8,
    },
    planInfoText: {
        color: '#8b5cf6',
        fontSize: 14,
    },
    row: {
        flexDirection: 'row',
    },
    saveButton: {
        backgroundColor: '#8b5cf6',
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
