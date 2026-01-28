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

export default function AdminDashboardScreen({ navigation }) {
    const { user, logout } = useAuth();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadDashboard = async () => {
        try {
            const response = await api.request(endpoints.adminDashboard);
            if (response.success) {
                setDashboard(response.dashboard);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadDashboard();
    }, []);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
        }).format(value || 0);
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
                <View>
                    <Text style={styles.greeting}>Hola, {user?.name}</Text>
                    <Text style={styles.subtitle}>Panel de Administración</Text>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                    <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
                }
            >
                {/* Estadísticas principales */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: '#3b82f620' }]}>
                        <Ionicons name="people-outline" size={32} color="#3b82f6" />
                        <Text style={styles.statValue}>{dashboard?.total_clientes || 0}</Text>
                        <Text style={styles.statLabel}>Clientes</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#10b98120' }]}>
                        <Ionicons name="wallet-outline" size={32} color="#10b981" />
                        <Text style={styles.statValue}>{dashboard?.total_cobradores || 0}</Text>
                        <Text style={styles.statLabel}>Cobradores</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#f59e0b20' }]}>
                        <Ionicons name="business-outline" size={32} color="#f59e0b" />
                        <Text style={styles.statValue}>{dashboard?.total_proyectos || 0}</Text>
                        <Text style={styles.statLabel}>Proyectos</Text>
                    </View>
                </View>

                {/* Resumen del mes */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Resumen del Mes</Text>
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Facturado</Text>
                            <Text style={[styles.summaryValue, { color: '#3b82f6' }]}>
                                {formatCurrency(dashboard?.facturado_mes)}
                            </Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Recaudado</Text>
                            <Text style={[styles.summaryValue, { color: '#10b981' }]}>
                                {formatCurrency(dashboard?.recaudado_mes)}
                            </Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Pendiente</Text>
                            <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
                                {formatCurrency(dashboard?.pendiente_mes)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Pagos de hoy */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pagos de Hoy</Text>
                    <View style={styles.todayCard}>
                        <View style={styles.todayItem}>
                            <Text style={styles.todayValue}>{dashboard?.pagos_hoy?.cantidad || 0}</Text>
                            <Text style={styles.todayLabel}>Pagos</Text>
                        </View>
                        <View style={styles.todayDivider} />
                        <View style={styles.todayItem}>
                            <Text style={styles.todayValue}>{formatCurrency(dashboard?.pagos_hoy?.total)}</Text>
                            <Text style={styles.todayLabel}>Total</Text>
                        </View>
                    </View>
                </View>

                {/* Accesos rápidos */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Gestión</Text>
                    <View style={styles.quickActions}>
                        <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('AdminProyectos')}>
                            <Ionicons name="business-outline" size={28} color="#f59e0b" />
                            <Text style={styles.quickActionText}>Proyectos</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('AdminClientes')}>
                            <Ionicons name="people-outline" size={28} color="#3b82f6" />
                            <Text style={styles.quickActionText}>Clientes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('AdminCobradores')}>
                            <Ionicons name="wallet-outline" size={28} color="#10b981" />
                            <Text style={styles.quickActionText}>Cobradores</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.quickActions, { marginTop: 10 }]}>
                        <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('AdminPlanes')}>
                            <Ionicons name="wifi-outline" size={28} color="#8b5cf6" />
                            <Text style={styles.quickActionText}>Planes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('AdminPagos')}>
                            <Ionicons name="receipt-outline" size={28} color="#10b981" />
                            <Text style={styles.quickActionText}>Pagos</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('AdminFacturas')}>
                            <Ionicons name="document-text-outline" size={28} color="#3b82f6" />
                            <Text style={styles.quickActionText}>Facturas</Text>
                        </TouchableOpacity>
                    </View>
                </View>
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
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 2,
    },
    logoutButton: {
        padding: 10,
    },
    content: {
        flex: 1,
        padding: 15,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        marginHorizontal: 5,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 4,
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
    summaryCard: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 15,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    summaryLabel: {
        fontSize: 16,
        color: '#94a3b8',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    todayCard: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    todayItem: {
        flex: 1,
        alignItems: 'center',
    },
    todayValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#10b981',
    },
    todayLabel: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 4,
    },
    todayDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#334155',
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    quickAction: {
        flex: 1,
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    quickActionText: {
        color: '#fff',
        marginTop: 8,
        fontSize: 12,
    },
});
