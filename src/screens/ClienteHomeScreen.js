import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { endpoints } from '../config/api';

export default function ClienteHomeScreen({ navigation }) {
    const { user, logout } = useAuth();
    const [cuenta, setCuenta] = useState(null);
    const [facturas, setFacturas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        try {
            const [cuentaRes, facturasRes] = await Promise.all([
                api.request(endpoints.clienteCuenta),
                api.request(endpoints.clienteFacturas),
            ]);
            
            if (cuentaRes.success) {
                setCuenta(cuentaRes.cuenta);
            }
            if (facturasRes.success) {
                setFacturas(facturasRes.facturas);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, []);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
        }).format(value || 0);
    };

    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'pagada': return '#10b981';
            case 'pendiente': return '#f59e0b';
            case 'vencida': return '#ef4444';
            case 'parcial': return '#3b82f6';
            default: return '#64748b';
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
                <View>
                    <Text style={styles.greeting}>Hola, {cuenta?.cliente?.nombre}</Text>
                    <Text style={styles.subtitle}>Código: {cuenta?.cliente?.codigo}</Text>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                    <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />
                }
            >
                {/* Información del cliente */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={20} color="#64748b" />
                        <Text style={styles.infoText}>{cuenta?.cliente?.direccion}</Text>
                    </View>
                    {cuenta?.cliente?.barrio && (
                        <View style={styles.infoRow}>
                            <Ionicons name="home-outline" size={20} color="#64748b" />
                            <Text style={styles.infoText}>{cuenta?.cliente?.barrio}</Text>
                        </View>
                    )}
                    {cuenta?.cliente?.proyecto && (
                        <View style={styles.infoRow}>
                            <Ionicons name="business-outline" size={20} color="#64748b" />
                            <Text style={styles.infoText}>{cuenta?.cliente?.proyecto}</Text>
                        </View>
                    )}
                </View>

                {/* Plan de servicio */}
                {cuenta?.servicio && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Mi Plan</Text>
                        <View style={styles.planCard}>
                            <View style={styles.planHeader}>
                                <Ionicons name="wifi" size={32} color="#f59e0b" />
                                <View style={styles.planInfo}>
                                    <Text style={styles.planName}>{cuenta.servicio.plan}</Text>
                                    <Text style={[styles.planStatus, { color: cuenta.servicio.estado === 'activo' ? '#10b981' : '#ef4444' }]}>
                                        {cuenta.servicio.estado.toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.planPrice}>
                                <Text style={styles.priceLabel}>Mensualidad</Text>
                                <Text style={styles.priceValue}>{formatCurrency(cuenta.servicio.precio)}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Saldo pendiente */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Saldo Pendiente</Text>
                    <View style={[styles.balanceCard, cuenta?.saldo_pendiente > 0 ? styles.balanceWarning : styles.balanceOk]}>
                        <Ionicons 
                            name={cuenta?.saldo_pendiente > 0 ? "alert-circle" : "checkmark-circle"} 
                            size={40} 
                            color={cuenta?.saldo_pendiente > 0 ? "#ef4444" : "#10b981"} 
                        />
                        <Text style={[styles.balanceValue, { color: cuenta?.saldo_pendiente > 0 ? "#ef4444" : "#10b981" }]}>
                            {formatCurrency(cuenta?.saldo_pendiente)}
                        </Text>
                        <Text style={styles.balanceLabel}>
                            {cuenta?.saldo_pendiente > 0 ? "Por pagar" : "Al día"}
                        </Text>
                    </View>
                </View>

                {/* Últimas facturas */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mis Facturas</Text>
                    {facturas.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Ionicons name="document-text-outline" size={40} color="#64748b" />
                            <Text style={styles.emptyText}>No hay facturas</Text>
                        </View>
                    ) : (
                        facturas.map((factura) => (
                            <View key={factura.id} style={styles.facturaCard}>
                                <View style={styles.facturaInfo}>
                                    <Text style={styles.facturaPeriodo}>{factura.periodo}</Text>
                                    <Text style={styles.facturaNumero}>#{factura.numero}</Text>
                                </View>
                                <View style={styles.facturaAmounts}>
                                    <Text style={styles.facturaTotal}>{formatCurrency(factura.total)}</Text>
                                    {factura.saldo > 0 && (
                                        <Text style={styles.facturaSaldo}>Saldo: {formatCurrency(factura.saldo)}</Text>
                                    )}
                                </View>
                                <View style={[styles.facturaEstado, { backgroundColor: getEstadoColor(factura.estado) + '20' }]}>
                                    <Text style={[styles.facturaEstadoText, { color: getEstadoColor(factura.estado) }]}>
                                        {factura.estado.toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* Historial de pagos */}
                <TouchableOpacity 
                    style={styles.historyButton}
                    onPress={() => navigation.navigate('ClientePagos')}
                >
                    <Ionicons name="receipt-outline" size={24} color="#f59e0b" />
                    <Text style={styles.historyButtonText}>Ver Historial de Pagos</Text>
                    <Ionicons name="chevron-forward" size={24} color="#64748b" />
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50,
        backgroundColor: '#1e293b',
    },
    greeting: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 14,
        color: '#f59e0b',
        marginTop: 2,
    },
    logoutButton: {
        padding: 10,
    },
    content: {
        flex: 1,
        padding: 15,
    },
    infoCard: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    infoText: {
        color: '#fff',
        marginLeft: 10,
        fontSize: 14,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 12,
    },
    planCard: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 15,
    },
    planHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    planInfo: {
        marginLeft: 15,
    },
    planName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    planStatus: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    planPrice: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#334155',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceLabel: {
        color: '#94a3b8',
        fontSize: 14,
    },
    priceValue: {
        color: '#f59e0b',
        fontSize: 20,
        fontWeight: 'bold',
    },
    balanceCard: {
        borderRadius: 12,
        padding: 25,
        alignItems: 'center',
    },
    balanceWarning: {
        backgroundColor: '#ef444420',
    },
    balanceOk: {
        backgroundColor: '#10b98120',
    },
    balanceValue: {
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 10,
    },
    balanceLabel: {
        color: '#94a3b8',
        fontSize: 14,
        marginTop: 5,
    },
    emptyCard: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 30,
        alignItems: 'center',
    },
    emptyText: {
        color: '#64748b',
        marginTop: 10,
    },
    facturaCard: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    facturaInfo: {
        flex: 1,
    },
    facturaPeriodo: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    facturaNumero: {
        color: '#64748b',
        fontSize: 12,
        marginTop: 2,
    },
    facturaAmounts: {
        alignItems: 'flex-end',
        marginRight: 15,
    },
    facturaTotal: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    facturaSaldo: {
        color: '#ef4444',
        fontSize: 12,
        marginTop: 2,
    },
    facturaEstado: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    facturaEstadoText: {
        fontSize: 10,
        fontWeight: '600',
    },
    historyButton: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    historyButtonText: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        marginLeft: 10,
    },
});
