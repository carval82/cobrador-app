import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import db from '../services/database';
import NetInfo from '@react-native-community/netinfo';

export default function HomeScreen({ navigation, route }) {
    const { user, logout } = useAuth();
    const proyecto = route.params?.proyecto;
    const [stats, setStats] = useState({
        clientes: 0,
        facturasPendientes: 0,
        cobrosHoy: 0,
        totalHoy: 0,
        pendingSync: 0,
    });
    const [refreshing, setRefreshing] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsOnline(state.isConnected);
        });
        // Sincronizar al entrar con el proyecto seleccionado
        if (proyecto) {
            handleSync();
        }
        return () => unsubscribe();
    }, [proyecto]);

    const loadStats = async () => {
        try {
            const clientes = await db.getClientes(proyecto?.id);
            const facturas = await db.getFacturas(proyecto?.id);
            const pendingCount = await db.getPendingCount();
            const summary = await db.getConfig('dailySummary');

            setStats({
                clientes: clientes.length,
                facturasPendientes: facturas.length,
                cobrosHoy: summary?.cobros_count || 0,
                totalHoy: summary?.total_cobrado || 0,
                pendingSync: pendingCount,
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const handleSync = async () => {
        if (!isOnline) {
            Alert.alert('Sin conexión', 'No hay conexión a internet para sincronizar');
            return;
        }

        setRefreshing(true);
        try {
            // Usar syncProyecto si hay proyecto seleccionado
            let response;
            if (proyecto?.id) {
                response = await api.syncProyecto(proyecto.id);
            } else {
                response = await api.sync();
            }
            
            console.log('Sync response:', JSON.stringify(response));
            const data = response.data || response;
            console.log('Data to save:', JSON.stringify(data));
            
            if (data.clientes) {
                console.log('Saving clientes:', data.clientes.length);
                await db.saveClientes(data.clientes);
            }
            if (data.facturas_pendientes) {
                console.log('Saving facturas:', data.facturas_pendientes.length);
                await db.saveFacturas(data.facturas_pendientes);
            }
            if (data.planes) await db.savePlanes(data.planes);
            if (data.resumen_dia) {
                console.log('Saving resumen_dia:', data.resumen_dia);
                await db.saveConfig('dailySummary', data.resumen_dia);
            }
            
            // Sync pending operations
            const pendingOps = await db.getPendingOps();
            for (const op of pendingOps) {
                try {
                    const opData = JSON.parse(op.data);
                    if (op.type === 'payment') {
                        await api.registerPayment(opData);
                    } else if (op.type === 'client') {
                        await api.registerClient(opData);
                    }
                    await db.removePendingOp(op.id);
                } catch (e) {
                    console.error('Error syncing op:', e);
                }
            }

            await loadStats();
        } catch (error) {
            console.error('Sync error:', error);
            Alert.alert('Error', 'Error al sincronizar: ' + (error.message || error.toString() || 'Error desconocido'));
        } finally {
            setRefreshing(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Está seguro que desea cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sí', onPress: logout },
            ]
        );
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
        }).format(value);
    };

    return (
        <ScrollView 
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleSync} />
            }
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.navigate('Proyectos')} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.greeting}>Hola, {user?.nombre || 'Cobrador'}</Text>
                        <Text style={styles.proyectoName}>{proyecto?.nombre || 'Sin proyecto'}</Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <View style={[styles.statusBadge, isOnline ? styles.online : styles.offline]}>
                        <Ionicons name={isOnline ? "wifi" : "wifi-outline"} size={14} color="#fff" />
                        <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                        <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Pending Sync Alert */}
            {stats.pendingSync > 0 && (
                <TouchableOpacity style={styles.syncAlert} onPress={handleSync}>
                    <Ionicons name="cloud-upload-outline" size={24} color="#f59e0b" />
                    <Text style={styles.syncAlertText}>
                        {stats.pendingSync} operación(es) pendiente(s) de sincronizar
                    </Text>
                </TouchableOpacity>
            )}

            {/* Stats Cards */}
            <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: '#1e40af' }]}>
                    <Ionicons name="people-outline" size={32} color="#fff" />
                    <Text style={styles.statValue}>{stats.clientes}</Text>
                    <Text style={styles.statLabel}>Clientes</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#b45309' }]}>
                    <Ionicons name="document-text-outline" size={32} color="#fff" />
                    <Text style={styles.statValue}>{stats.facturasPendientes}</Text>
                    <Text style={styles.statLabel}>Pendientes</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#047857' }]}>
                    <Ionicons name="cash-outline" size={32} color="#fff" />
                    <Text style={styles.statValue}>{stats.cobrosHoy}</Text>
                    <Text style={styles.statLabel}>Cobros Hoy</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#7c3aed' }]}>
                    <Ionicons name="wallet-outline" size={32} color="#fff" />
                    <Text style={styles.statValue}>{formatCurrency(stats.totalHoy)}</Text>
                    <Text style={styles.statLabel}>Total Hoy</Text>
                </View>
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
            <View style={styles.actionsGrid}>
                <TouchableOpacity 
                    style={styles.actionCard}
                    onPress={() => navigation.navigate('Clients', { proyecto })}
                >
                    <View style={[styles.actionIcon, { backgroundColor: '#1e40af' }]}>
                        <Ionicons name="people" size={28} color="#fff" />
                    </View>
                    <Text style={styles.actionText}>Ver Clientes</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.actionCard}
                    onPress={() => navigation.navigate('Invoices', { proyecto })}
                >
                    <View style={[styles.actionIcon, { backgroundColor: '#b45309' }]}>
                        <Ionicons name="receipt" size={28} color="#fff" />
                    </View>
                    <Text style={styles.actionText}>Facturas</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.actionCard}
                    onPress={() => navigation.navigate('NewPayment')}
                >
                    <View style={[styles.actionIcon, { backgroundColor: '#047857' }]}>
                        <Ionicons name="add-circle" size={28} color="#fff" />
                    </View>
                    <Text style={styles.actionText}>Nuevo Pago</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.actionCard}
                    onPress={() => navigation.navigate('NewClient')}
                >
                    <View style={[styles.actionIcon, { backgroundColor: '#7c3aed' }]}>
                        <Ionicons name="person-add" size={28} color="#fff" />
                    </View>
                    <Text style={styles.actionText}>Nuevo Cliente</Text>
                </TouchableOpacity>
            </View>

            {/* Sync Button */}
            <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
                <Ionicons name="sync" size={24} color="#fff" />
                <Text style={styles.syncButtonText}>Sincronizar Datos</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        marginRight: 12,
        padding: 4,
    },
    greeting: {
        fontSize: 14,
        color: '#64748b',
    },
    proyectoName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        marginRight: 10,
    },
    online: {
        backgroundColor: '#047857',
    },
    offline: {
        backgroundColor: '#dc2626',
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        marginLeft: 5,
    },
    logoutBtn: {
        padding: 5,
    },
    syncAlert: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#78350f',
        marginHorizontal: 20,
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
    },
    syncAlertText: {
        color: '#fbbf24',
        marginLeft: 10,
        flex: 1,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 15,
        justifyContent: 'space-between',
    },
    statCard: {
        width: '48%',
        padding: 20,
        borderRadius: 16,
        marginBottom: 15,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 10,
    },
    statLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginLeft: 20,
        marginTop: 10,
        marginBottom: 15,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 15,
        justifyContent: 'space-between',
    },
    actionCard: {
        width: '48%',
        backgroundColor: '#1e293b',
        padding: 20,
        borderRadius: 16,
        marginBottom: 15,
        alignItems: 'center',
    },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    actionText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '500',
    },
    syncButton: {
        flexDirection: 'row',
        backgroundColor: '#10b981',
        marginHorizontal: 20,
        marginVertical: 20,
        padding: 15,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    syncButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
});
