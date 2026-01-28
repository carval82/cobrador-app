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
import { API_URL } from '../config/api';

export default function AdminClienteServiciosScreen({ navigation, route }) {
    const { cliente } = route.params;
    const [servicios, setServicios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadServicios = async () => {
        try {
            const response = await api.request(`/admin/clientes/${cliente.id}/servicios`);
            if (response.success) {
                setServicios(response.servicios);
            }
        } catch (error) {
            console.error('Error loading servicios:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadServicios();
        const unsubscribe = navigation.addListener('focus', loadServicios);
        return unsubscribe;
    }, [navigation]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadServicios();
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
            case 'activo': return '#10b981';
            case 'suspendido': return '#f59e0b';
            case 'cancelado': return '#ef4444';
            default: return '#64748b';
        }
    };

    const handleDelete = (servicio) => {
        Alert.alert(
            'Eliminar Servicio',
            `¿Está seguro de eliminar el servicio "${servicio.plan_nombre}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: () => confirmDelete(servicio.id) }
            ]
        );
    };

    const confirmDelete = async (id) => {
        try {
            const response = await api.request(`/admin/servicios/${id}`, {
                method: 'DELETE',
            });
            if (response.success) {
                Alert.alert('Éxito', 'Servicio eliminado');
                loadServicios();
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const renderServicio = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <Ionicons name="wifi" size={24} color="#8b5cf6" />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{item.plan_nombre}</Text>
                    <Text style={styles.cardPrice}>{formatCurrency(item.precio_mensual)}/mes</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getEstadoColor(item.estado) + '20' }]}>
                    <Text style={[styles.statusText, { color: getEstadoColor(item.estado) }]}>
                        {item.estado?.toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.cardDetails}>
                {item.ip_asignada && (
                    <View style={styles.detailRow}>
                        <Ionicons name="globe-outline" size={14} color="#64748b" />
                        <Text style={styles.detailText}>IP: {item.ip_asignada}</Text>
                    </View>
                )}
                {item.mac_address && (
                    <View style={styles.detailRow}>
                        <Ionicons name="hardware-chip-outline" size={14} color="#64748b" />
                        <Text style={styles.detailText}>MAC: {item.mac_address}</Text>
                    </View>
                )}
                <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={14} color="#64748b" />
                    <Text style={styles.detailText}>
                        Corte día {item.dia_corte} • Límite pago día {item.dia_pago_limite}
                    </Text>
                </View>
                {item.precio_especial && (
                    <View style={styles.detailRow}>
                        <Ionicons name="pricetag-outline" size={14} color="#f59e0b" />
                        <Text style={[styles.detailText, { color: '#f59e0b' }]}>
                            Precio especial: {formatCurrency(item.precio_especial)}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.cardActions}>
                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('AdminServicioForm', { 
                        servicio: item, 
                        cliente: cliente,
                        mode: 'edit' 
                    })}
                >
                    <Ionicons name="create-outline" size={20} color="#3b82f6" />
                    <Text style={[styles.actionText, { color: '#3b82f6' }]}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleDelete(item)}
                >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    <Text style={[styles.actionText, { color: '#ef4444' }]}>Eliminar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

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
                    <Text style={styles.headerTitle}>Servicios</Text>
                    <Text style={styles.headerSubtitle}>{cliente.nombre}</Text>
                </View>
                <TouchableOpacity 
                    onPress={() => navigation.navigate('AdminServicioForm', { 
                        cliente: cliente,
                        mode: 'create' 
                    })}
                    style={styles.addButton}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={servicios}
                renderItem={renderServicio}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="wifi-outline" size={60} color="#64748b" />
                        <Text style={styles.emptyText}>Sin servicios asignados</Text>
                        <TouchableOpacity 
                            style={styles.emptyButton}
                            onPress={() => navigation.navigate('AdminServicioForm', { 
                                cliente: cliente,
                                mode: 'create' 
                            })}
                        >
                            <Ionicons name="add" size={20} color="#000" />
                            <Text style={styles.emptyButtonText}>Asignar Plan</Text>
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
    addButton: {
        backgroundColor: '#8b5cf6',
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
        backgroundColor: '#8b5cf620',
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
    cardPrice: {
        fontSize: 14,
        color: '#10b981',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
    },
    cardDetails: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#334155',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    detailText: {
        color: '#94a3b8',
        fontSize: 13,
        marginLeft: 8,
    },
    cardActions: {
        flexDirection: 'row',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#334155',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    actionText: {
        marginLeft: 6,
        fontSize: 14,
        fontWeight: '500',
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
        backgroundColor: '#8b5cf6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    emptyButtonText: {
        color: '#fff',
        fontWeight: '600',
        marginLeft: 8,
    },
});
