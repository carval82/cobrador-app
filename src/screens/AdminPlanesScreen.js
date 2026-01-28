import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { endpoints } from '../config/api';

export default function AdminPlanesScreen({ navigation }) {
    const [planes, setPlanes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadPlanes = async () => {
        try {
            const response = await api.request(endpoints.adminPlanes);
            if (response.success) {
                setPlanes(response.planes);
            }
        } catch (error) {
            console.error('Error loading planes:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadPlanes();
        const unsubscribe = navigation.addListener('focus', loadPlanes);
        return unsubscribe;
    }, [navigation]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadPlanes();
    }, []);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
        }).format(value || 0);
    };

    const renderPlan = ({ item }) => (
        <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('AdminPlanForm', { plan: item, mode: 'edit' })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <Ionicons name="wifi" size={24} color="#f59e0b" />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{item.nombre}</Text>
                    <Text style={styles.cardSubtitle}>{item.proyecto}</Text>
                </View>
                <View style={[styles.statusBadge, item.activo ? styles.statusActive : styles.statusInactive]}>
                    <Text style={[styles.statusText, { color: item.activo ? '#10b981' : '#ef4444' }]}>
                        {item.activo ? 'Activo' : 'Inactivo'}
                    </Text>
                </View>
            </View>
            <View style={styles.cardDetails}>
                <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Precio mensual</Text>
                    <Text style={styles.priceValue}>{formatCurrency(item.precio)}</Text>
                </View>
                {(item.velocidad_bajada || item.velocidad_subida) && (
                    <View style={styles.speedContainer}>
                        <Ionicons name="speedometer-outline" size={16} color="#64748b" />
                        <Text style={styles.speedText}>
                            {item.velocidad_bajada || 0} / {item.velocidad_subida || 0} Mbps
                        </Text>
                    </View>
                )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748b" style={styles.chevron} />
        </TouchableOpacity>
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
                <Text style={styles.headerTitle}>Planes de Servicio</Text>
                <TouchableOpacity 
                    onPress={() => navigation.navigate('AdminPlanForm', { mode: 'create' })}
                    style={styles.addButton}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={planes}
                renderItem={renderPlan}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="wifi-outline" size={60} color="#64748b" />
                        <Text style={styles.emptyText}>No hay planes</Text>
                        <TouchableOpacity 
                            style={styles.emptyButton}
                            onPress={() => navigation.navigate('AdminPlanForm', { mode: 'create' })}
                        >
                            <Text style={styles.emptyButtonText}>Crear primer plan</Text>
                        </TouchableOpacity>
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
    addButton: {
        backgroundColor: '#f59e0b',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 15,
    },
    card: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 45,
        height: 45,
        borderRadius: 22,
        backgroundColor: '#f59e0b20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    cardSubtitle: {
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
    },
    cardDetails: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#334155',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceContainer: {},
    priceLabel: {
        color: '#64748b',
        fontSize: 12,
    },
    priceValue: {
        color: '#f59e0b',
        fontSize: 18,
        fontWeight: 'bold',
    },
    speedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    speedText: {
        color: '#94a3b8',
        marginLeft: 6,
    },
    chevron: {
        position: 'absolute',
        right: 15,
        top: '50%',
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
    emptyButton: {
        marginTop: 20,
        backgroundColor: '#f59e0b',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    emptyButtonText: {
        color: '#000',
        fontWeight: '600',
    },
});
