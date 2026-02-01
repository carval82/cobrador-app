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
import * as Location from 'expo-location';
import api from '../services/api';
import db from '../services/database';
import NetInfo from '@react-native-community/netinfo';

export default function NewPaymentScreen({ route, navigation }) {
    const { factura } = route.params || {};
    const [monto, setMonto] = useState(factura?.saldo?.toString() || factura?.total?.toString() || '');
    const [metodoPago, setMetodoPago] = useState('efectivo');
    const [observaciones, setObservaciones] = useState('');
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState(null);

    const metodosPago = [
        { id: 'efectivo', label: 'Efectivo', icon: 'cash-outline' },
        { id: 'transferencia', label: 'Transferencia', icon: 'swap-horizontal-outline' },
        { id: 'nequi', label: 'Nequi', icon: 'phone-portrait-outline' },
        { id: 'daviplata', label: 'Daviplata', icon: 'phone-portrait-outline' },
    ];

    useEffect(() => {
        getLocation();
    }, []);

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

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const handleSubmit = async () => {
        if (!monto || parseFloat(monto) <= 0) {
            Alert.alert('Error', 'Ingrese un monto válido');
            return;
        }

        if (!factura) {
            Alert.alert('Error', 'No se ha seleccionado una factura');
            return;
        }

        setLoading(true);

        const paymentData = {
            factura_id: factura.id,
            monto: parseFloat(monto),
            metodo_pago: metodoPago,
            fecha_pago: new Date().toISOString().split('T')[0],
            observaciones,
            latitud: location?.latitude || null,
            longitud: location?.longitude || null,
            offline_id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };

        try {
            const netInfo = await NetInfo.fetch();
            
            if (netInfo.isConnected) {
                const response = await api.registerPayment(paymentData);
                
                // Verificar si es duplicado
                if (response.duplicado) {
                    Alert.alert('Aviso', 'Este pago ya fue registrado anteriormente', [
                        { text: 'OK', onPress: () => navigation.goBack() }
                    ]);
                } else {
                    // Actualizar factura localmente
                    await db.updateFacturaAfterPayment(factura.id, parseFloat(monto));
                    Alert.alert('Éxito', 'Pago registrado correctamente', [
                        { text: 'OK', onPress: () => navigation.goBack() }
                    ]);
                }
            } else {
                await db.addPendingOp('payment', paymentData);
                // Actualizar factura localmente para evitar doble pago
                await db.updateFacturaAfterPayment(factura.id, parseFloat(monto));
                Alert.alert(
                    'Guardado Offline', 
                    'El pago se guardó localmente y se sincronizará cuando haya conexión',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            }
        } catch (error) {
            console.error('Error registrando pago:', error);
            // Si falla online, guardar offline
            await db.addPendingOp('payment', paymentData);
            // Actualizar factura localmente para evitar doble pago
            await db.updateFacturaAfterPayment(factura.id, parseFloat(monto));
            Alert.alert(
                'Guardado Offline', 
                'Error de conexión. El pago se guardó localmente.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            {factura && (
                <View style={styles.facturaInfo}>
                    <Text style={styles.sectionTitle}>Factura Seleccionada</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Cliente:</Text>
                            <Text style={styles.infoValue}>{factura.cliente_nombre || factura.cliente?.nombre}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Factura:</Text>
                            <Text style={styles.infoValue}>#{factura.numero}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Período:</Text>
                            <Text style={styles.infoValue}>{factura.mes}/{factura.anio}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Total:</Text>
                            <Text style={[styles.infoValue, styles.totalValue]}>
                                {formatCurrency(factura.total)}
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            <Text style={styles.sectionTitle}>Datos del Pago</Text>
            <View style={styles.formCard}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Monto a Pagar *</Text>
                    <View style={styles.montoContainer}>
                        <Text style={styles.currencySymbol}>$</Text>
                        <TextInput
                            style={styles.montoInput}
                            value={monto}
                            onChangeText={setMonto}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#64748b"
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Método de Pago *</Text>
                    <View style={styles.metodosContainer}>
                        {metodosPago.map((metodo) => (
                            <TouchableOpacity
                                key={metodo.id}
                                style={[
                                    styles.metodoBtn,
                                    metodoPago === metodo.id && styles.metodoBtnActive
                                ]}
                                onPress={() => setMetodoPago(metodo.id)}
                            >
                                <Ionicons 
                                    name={metodo.icon} 
                                    size={20} 
                                    color={metodoPago === metodo.id ? '#fff' : '#64748b'} 
                                />
                                <Text style={[
                                    styles.metodoText,
                                    metodoPago === metodo.id && styles.metodoTextActive
                                ]}>
                                    {metodo.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Observaciones</Text>
                    <TextInput
                        style={styles.textArea}
                        value={observaciones}
                        onChangeText={setObservaciones}
                        placeholder="Notas adicionales..."
                        placeholderTextColor="#64748b"
                        multiline
                        numberOfLines={3}
                    />
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
                        <Ionicons name="checkmark-circle" size={24} color="#fff" />
                        <Text style={styles.submitButtonText}>Registrar Pago</Text>
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
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 10,
        marginTop: 10,
    },
    facturaInfo: {
        marginBottom: 10,
    },
    infoCard: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 15,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    infoLabel: {
        color: '#94a3b8',
        fontSize: 14,
    },
    infoValue: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    totalValue: {
        color: '#10b981',
        fontWeight: 'bold',
        fontSize: 16,
    },
    formCard: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 15,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        color: '#94a3b8',
        fontSize: 14,
        marginBottom: 8,
    },
    montoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        borderRadius: 10,
        paddingHorizontal: 15,
    },
    currencySymbol: {
        color: '#10b981',
        fontSize: 24,
        fontWeight: 'bold',
    },
    montoInput: {
        flex: 1,
        height: 50,
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    textArea: {
        backgroundColor: '#0f172a',
        borderRadius: 10,
        padding: 15,
        color: '#fff',
        fontSize: 14,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    metodosContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    metodoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#334155',
    },
    metodoBtnActive: {
        backgroundColor: '#10b981',
        borderColor: '#10b981',
    },
    metodoText: {
        color: '#64748b',
        marginLeft: 6,
        fontSize: 13,
    },
    metodoTextActive: {
        color: '#fff',
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
