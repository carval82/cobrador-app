import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { endpoints } from '../config/api';

export default function AdminProyectosScreen({ navigation }) {
    const [proyectos, setProyectos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadProyectos = async () => {
        try {
            const response = await api.request(endpoints.adminProyectos);
            if (response.success) {
                setProyectos(response.proyectos);
            }
        } catch (error) {
            console.error('Error loading proyectos:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadProyectos();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadProyectos();
    }, []);

    const renderProyecto = ({ item }) => (
        <View style={[styles.card, { borderLeftColor: item.color || '#3b82f6' }]}>
            <View style={styles.cardHeader}>
                <View style={[styles.colorDot, { backgroundColor: item.color || '#3b82f6' }]} />
                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{item.nombre}</Text>
                    <Text style={styles.cardCode}>{item.codigo}</Text>
                </View>
                <View style={[styles.statusBadge, item.activo ? styles.statusActive : styles.statusInactive]}>
                    <Text style={styles.statusText}>{item.activo ? 'Activo' : 'Inactivo'}</Text>
                </View>
            </View>
            <View style={styles.cardStats}>
                <View style={styles.stat}>
                    <Ionicons name="people-outline" size={18} color="#3b82f6" />
                    <Text style={styles.statValue}>{item.clientes_count}</Text>
                    <Text style={styles.statLabel}>Clientes</Text>
                </View>
                <View style={styles.stat}>
                    <Ionicons name="wallet-outline" size={18} color="#10b981" />
                    <Text style={styles.statValue}>{item.cobradores_count}</Text>
                    <Text style={styles.statLabel}>Cobradores</Text>
                </View>
            </View>
            <View style={styles.cardActions}>
                <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('AdminProyectoGastos', { proyecto: item })}
                >
                    <Ionicons name="receipt-outline" size={18} color="#ef4444" />
                    <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Gastos</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('AdminLiquidacion', { proyecto: item })}
                >
                    <Ionicons name="calculator-outline" size={18} color="#8b5cf6" />
                    <Text style={[styles.actionBtnText, { color: '#8b5cf6' }]}>Liquidación</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

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
                <Text style={styles.headerTitle}>Proyectos</Text>
                <View style={styles.headerRight}>
                    <Text style={styles.totalCount}>{proyectos.length}</Text>
                </View>
            </View>

            <FlatList
                data={proyectos}
                renderItem={renderProyecto}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="business-outline" size={60} color="#64748b" />
                        <Text style={styles.emptyText}>No hay proyectos</Text>
                    </View>
                }
            />
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
    headerRight: {
        backgroundColor: '#f59e0b',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    totalCount: {
        color: '#000',
        fontWeight: 'bold',
    },
    list: {
        padding: 15,
    },
    card: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        borderLeftWidth: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    colorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 10,
    },
    cardInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    cardCode: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusActive: {
        backgroundColor: '#10b98120',
    },
    statusInactive: {
        backgroundColor: '#ef444420',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#10b981',
    },
    cardStats: {
        flexDirection: 'row',
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#334155',
    },
    stat: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statValue: {
        color: '#fff',
        fontWeight: '600',
        marginLeft: 6,
        marginRight: 4,
    },
    statLabel: {
        color: '#64748b',
        fontSize: 12,
    },
    cardActions: {
        flexDirection: 'row',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#334155',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 10,
    },
    actionBtnText: {
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 6,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyText: {
        color: '#64748b',
        marginTop: 15,
        fontSize: 16,
    },
});
