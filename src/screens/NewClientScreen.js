import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import api from '../services/api';
import db from '../services/database';
import NetInfo from '@react-native-community/netinfo';

export default function NewClientScreen({ navigation }) {
    const [formData, setFormData] = useState({
        nombre: '',
        documento: '',
        direccion: '',
        barrio: '',
        telefono: '',
        celular: '',
        email: '',
        plan_id: '',
    });
    const [planes, setPlanes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState(null);

    useEffect(() => {
        loadPlanes();
        getLocation();
    }, []);

    const loadPlanes = async () => {
        const data = await db.getPlanes();
        setPlanes(data);
    };

    const getLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                setLocation(loc.coords);
            }
        } catch (error) {
            console.error('Error getting location:', error);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.nombre.trim() || !formData.documento.trim()) {
            Alert.alert('Error', 'Nombre y documento son obligatorios');
            return;
        }

        setLoading(true);

        const clientData = {
            ...formData,
            latitud: location?.latitude || null,
            longitud: location?.longitude || null,
            offline_id: `cli_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };

        try {
            const netInfo = await NetInfo.fetch();
            
            if (netInfo.isConnected) {
                await api.registerClient(clientData);
                Alert.alert('Éxito', 'Cliente registrado correctamente', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                await db.addPendingOp('client', clientData);
                Alert.alert(
                    'Guardado Offline', 
                    'El cliente se guardó localmente y se sincronizará cuando haya conexión',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            }
        } catch (error) {
            await db.addPendingOp('client', clientData);
            Alert.alert(
                'Guardado Offline', 
                'Error de conexión. El cliente se guardó localmente.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.formCard}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nombre Completo *</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.nombre}
                        onChangeText={(v) => handleChange('nombre', v)}
                        placeholder="Nombre del cliente"
                        placeholderTextColor="#64748b"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Documento (Cédula) *</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.documento}
                        onChangeText={(v) => handleChange('documento', v)}
                        placeholder="Número de documento"
                        placeholderTextColor="#64748b"
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Dirección</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.direccion}
                        onChangeText={(v) => handleChange('direccion', v)}
                        placeholder="Dirección de instalación"
                        placeholderTextColor="#64748b"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Barrio/Vereda</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.barrio}
                        onChangeText={(v) => handleChange('barrio', v)}
                        placeholder="Barrio o vereda"
                        placeholderTextColor="#64748b"
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.label}>Teléfono</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.telefono}
                            onChangeText={(v) => handleChange('telefono', v)}
                            placeholder="Teléfono fijo"
                            placeholderTextColor="#64748b"
                            keyboardType="phone-pad"
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Celular</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.celular}
                            onChangeText={(v) => handleChange('celular', v)}
                            placeholder="Celular"
                            placeholderTextColor="#64748b"
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.email}
                        onChangeText={(v) => handleChange('email', v)}
                        placeholder="correo@ejemplo.com"
                        placeholderTextColor="#64748b"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Plan de Servicio</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={formData.plan_id}
                            onValueChange={(v) => handleChange('plan_id', v)}
                            style={styles.picker}
                            dropdownIconColor="#fff"
                        >
                            <Picker.Item label="Seleccione un plan" value="" />
                            {planes.map(plan => (
                                <Picker.Item 
                                    key={plan.id} 
                                    label={`${plan.nombre} - $${plan.precio}`} 
                                    value={plan.id} 
                                />
                            ))}
                        </Picker>
                    </View>
                </View>

                <View style={styles.locationInfo}>
                    <Ionicons 
                        name={location ? "location" : "location-outline"} 
                        size={20} 
                        color={location ? "#10b981" : "#64748b"} 
                    />
                    <Text style={[styles.locationText, location && styles.locationActive]}>
                        {location ? 'Ubicación capturada' : 'Obteniendo ubicación...'}
                    </Text>
                </View>
            </View>

            <TouchableOpacity 
                style={[styles.submitButton, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                        <Ionicons name="person-add" size={24} color="#fff" />
                        <Text style={styles.submitButtonText}>Registrar Cliente</Text>
                    </>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
        padding: 15,
    },
    formCard: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 15,
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        color: '#94a3b8',
        fontSize: 14,
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#0f172a',
        borderRadius: 10,
        padding: 12,
        color: '#fff',
        fontSize: 15,
    },
    row: {
        flexDirection: 'row',
    },
    pickerContainer: {
        backgroundColor: '#0f172a',
        borderRadius: 10,
        overflow: 'hidden',
    },
    picker: {
        color: '#fff',
        height: 50,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 10,
    },
    locationText: {
        color: '#64748b',
        marginLeft: 8,
        fontSize: 13,
    },
    locationActive: {
        color: '#10b981',
    },
    submitButton: {
        flexDirection: 'row',
        backgroundColor: '#10b981',
        padding: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 10,
    },
});
