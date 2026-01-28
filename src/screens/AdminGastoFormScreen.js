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
import { Picker } from '@react-native-picker/picker';
import api from '../services/api';

export default function AdminGastoFormScreen({ navigation, route }) {
    const { gasto, proyecto, categorias, mode } = route.params || {};
    const isEdit = mode === 'edit';
    
    const [saving, setSaving] = useState(false);
    
    const [form, setForm] = useState({
        proyecto_id: proyecto?.id,
        categoria: gasto?.categoria || 'otros',
        descripcion: gasto?.descripcion || '',
        monto: gasto?.monto?.toString() || '',
        fecha: gasto?.fecha || new Date().toISOString().split('T')[0],
        proveedor: gasto?.proveedor || '',
        factura_numero: gasto?.factura_numero || '',
        notas: gasto?.notas || '',
    });

    const handleSave = async () => {
        if (!form.descripcion || !form.monto) {
            Alert.alert('Error', 'Descripción y monto son requeridos');
            return;
        }

        setSaving(true);
        try {
            const url = isEdit 
                ? `/admin/gastos/${gasto.id}`
                : '/admin/gastos';
            
            const data = {
                ...form,
                monto: parseFloat(form.monto) || 0,
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
            Alert.alert('Error', error.message || 'No se pudo guardar el gasto');
        } finally {
            setSaving(false);
        }
    };

    const categoriasArray = Object.entries(categorias || {}).map(([key, value]) => ({
        value: key,
        label: value,
    }));

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>{isEdit ? 'Editar Gasto' : 'Nuevo Gasto'}</Text>
                    <Text style={styles.headerSubtitle}>{proyecto?.nombre}</Text>
                </View>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Categoría *</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={form.categoria}
                            onValueChange={(value) => setForm({...form, categoria: value})}
                            style={styles.picker}
                            dropdownIconColor="#fff"
                        >
                            {categoriasArray.map(cat => (
                                <Picker.Item key={cat.value} label={cat.label} value={cat.value} />
                            ))}
                        </Picker>
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Descripción *</Text>
                    <TextInput
                        style={styles.input}
                        value={form.descripcion}
                        onChangeText={(text) => setForm({...form, descripcion: text})}
                        placeholder="Ej: Pago mensual de internet, Router TP-Link..."
                        placeholderTextColor="#64748b"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Monto (COP) *</Text>
                    <TextInput
                        style={styles.input}
                        value={form.monto}
                        onChangeText={(text) => setForm({...form, monto: text})}
                        placeholder="0"
                        placeholderTextColor="#64748b"
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Fecha *</Text>
                    <TextInput
                        style={styles.input}
                        value={form.fecha}
                        onChangeText={(text) => setForm({...form, fecha: text})}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#64748b"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Proveedor</Text>
                    <TextInput
                        style={styles.input}
                        value={form.proveedor}
                        onChangeText={(text) => setForm({...form, proveedor: text})}
                        placeholder="Nombre del proveedor"
                        placeholderTextColor="#64748b"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Número de Factura</Text>
                    <TextInput
                        style={styles.input}
                        value={form.factura_numero}
                        onChangeText={(text) => setForm({...form, factura_numero: text})}
                        placeholder="Número de factura o recibo"
                        placeholderTextColor="#64748b"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Notas</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={form.notas}
                        onChangeText={(text) => setForm({...form, notas: text})}
                        placeholder="Notas adicionales..."
                        placeholderTextColor="#64748b"
                        multiline
                        numberOfLines={3}
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
                                {isEdit ? 'Guardar Cambios' : 'Registrar Gasto'}
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
    saveButton: {
        backgroundColor: '#ef4444',
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
