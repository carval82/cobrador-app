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

export default function AdminProyectoGastosScreen({ navigation, route }) {
    const { proyecto } = route.params;
    const [gastos, setGastos] = useState([]);
    const [totalGastos, setTotalGastos] = useState(0);
    const [categorias, setCategorias] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadGastos = async () => {
        try {
            const response = await api.request(`/admin/proyectos/${proyecto.id}/gastos`);
            if (response.success) {
                setGastos(response.gastos);
                setTotalGastos(response.total_gastos);
                setCategorias(response.categorias);
            }
        } catch (error) {
            console.error('Error loading gastos:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadGastos();
        const unsubscribe = navigation.addListener('focus', loadGastos);
        return unsubscribe;
    }, [navigation]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadGastos();
    }, []);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
        }).format(value || 0);
    };

    const getCategoriaIcon = (categoria) => {
        switch (categoria) {
            case 'internet': return 'globe-outline';
            case 'equipos': return 'hardware-chip-outline';
            case 'mantenimiento': return 'construct-outline';
            case 'transporte': return 'car-outline';
            default: return 'receipt-outline';
        }
    };

    const getCategoriaColor = (categoria) => {
        switch (categoria) {
            case 'internet': return '#3b82f6';
            case 'equipos': return '#8b5cf6';
            case 'mantenimiento': return '#f59e0b';
            case 'transporte': return '#10b981';
            default: return '#64748b';
        }
    };

    const handleDelete = (gasto) => {
        Alert.alert(
            'Eliminar Gasto',
            `¿Está seguro de eliminar "${gasto.descripcion}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: () => confirmDelete(gasto.id) }
            ]
        );
    };

    const confirmDelete = async (id) => {
        try {
            const response = await api.request(`/admin/gastos/${id}`, {
                method: 'DELETE',
            });
            if (response.success) {
                Alert.alert('Éxito', 'Gasto eliminado');
                loadGastos();
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const renderGasto = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: getCategoriaColor(item.categoria) + '20' }]}>
                    <Ionicons name={getCategoriaIcon(item.categoria)} size={24} color={getCategoriaColor(item.categoria)} />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{item.descripcion}</Text>
                    <Text style={styles.cardCategoria}>{item.categoria_nombre}</Text>
                </View>
                <Text style={styles.cardMonto}>{formatCurrency(item.monto)}</Text>
            </View>

            <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={14} color="#64748b" />
                    <Text style={styles.detailText}>{item.fecha}</Text>
                </View>
                {item.proveedor && (
                    <View style={styles.detailRow}>
                        <Ionicons name="storefront-outline" size={14} color="#64748b" />
                        <Text style={styles.detailText}>{item.proveedor}</Text>
                    </View>
                )}
                {item.factura_numero && (
                    <View style={styles.detailRow}>
                        <Ionicons name="document-text-outline" size={14} color="#64748b" />
                        <Text style={styles.detailText}>Factura: {item.factura_numero}</Text>
                    </View>
                )}
            </View>

            <View style={styles.cardActions}>
                <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('AdminGastoForm', { 
                        gasto: item, 
                        proyecto: proyecto,
                        categorias: categorias,
                        mode: 'edit' 
                    })}
                >
                    <Ionicons name="create-outline" size={18} color="#3b82f6" />
                    <Text style={[styles.actionBtnText, { color: '#3b82f6' }]}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={() => handleDelete(item)}
                >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Eliminar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ef4444" />
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
                    <Text style={styles.headerTitle}>Gastos</Text>
                    <Text style={styles.headerSubtitle}>{proyecto.nombre}</Text>
                </View>
                <TouchableOpacity 
                    onPress={() => navigation.navigate('AdminGastoForm', { 
                        proyecto: proyecto,
                        categorias: categorias,
                        mode: 'create' 
                    })}
                    style={styles.addButton}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total Gastos</Text>
                <Text style={styles.totalValue}>{formatCurrency(totalGastos)}</Text>
            </View>

            <FlatList
                data={gastos}
                renderItem={renderGasto}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ef4444" />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="receipt-outline" size={60} color="#64748b" />
                        <Text style={styles.emptyText}>Sin gastos registrados</Text>
                        <TouchableOpacity 
                            style={styles.emptyButton}
                            onPress={() => navigation.navigate('AdminGastoForm', { 
                                proyecto: proyecto,
                                categorias: categorias,
                                mode: 'create' 
                            })}
                        >
                            <Ionicons name="add" size={20} color="#fff" />
                            <Text style={styles.emptyButtonText}>Registrar Gasto</Text>
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
        backgroundColor: '#ef4444',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    totalContainer: {
        backgroundColor: '#1e293b',
        margin: 15,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    totalLabel: {
        color: '#94a3b8',
        fontSize: 14,
    },
    totalValue: {
        color: '#ef4444',
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 5,
    },
    list: {
        padding: 15,
        paddingTop: 0,
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
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    cardCategoria: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    cardMonto: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ef4444',
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
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    actionBtnText: {
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
        backgroundColor: '#ef4444',
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
