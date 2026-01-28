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

export default function AdminPagosScreen({ navigation }) {
    const [pagos, setPagos] = useState([]);
    const [totalRecaudado, setTotalRecaudado] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadPagos = async () => {
        try {
            const response = await api.request(endpoints.adminPagos);
            if (response.success) {
                setPagos(response.pagos);
                setTotalRecaudado(response.total_recaudado);
            }
        } catch (error) {
            console.error('Error loading pagos:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadPagos();
        const unsubscribe = navigation.addListener('focus', loadPagos);
        return unsubscribe;
    }, [navigation]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadPagos();
    }, []);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
        }).format(value || 0);
    };

    const getMetodoIcon = (metodo) => {
        switch (metodo) {
            case 'efectivo': return 'cash-outline';
            case 'transferencia': return 'swap-horizontal-outline';
            case 'nequi': return 'phone-portrait-outline';
            case 'daviplata': return 'phone-portrait-outline';
            default: return 'card-outline';
        }
    };

    const handleAnular = (pago) => {
        Alert.alert(
            'Anular Pago',
            `¿Está seguro de anular el pago de ${formatCurrency(pago.monto)} de ${pago.cliente}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Anular', style: 'destructive', onPress: () => confirmAnular(pago.id) }
            ]
        );
    };

    const confirmAnular = async (id) => {
        try {
            const response = await api.request(`${endpoints.adminPagos}/${id}`, {
                method: 'DELETE',
            });
            if (response.success) {
                Alert.alert('Éxito', 'Pago anulado');
                loadPagos();
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const renderPago = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <Ionicons name={getMetodoIcon(item.metodo_pago)} size={24} color="#10b981" />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{item.cliente}</Text>
                    <Text style={styles.cardSubtitle}>{item.factura_periodo}</Text>
                </View>
                <Text style={styles.cardMonto}>{formatCurrency(item.monto)}</Text>
            </View>

            <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={14} color="#64748b" />
                    <Text style={styles.detailText}>{item.fecha_pago}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={14} color="#64748b" />
                    <Text style={styles.detailText}>Cobrador: {item.cobrador || 'N/A'}</Text>
                </View>
                {item.metodo_pago && (
                    <View style={styles.detailRow}>
                        <Ionicons name="card-outline" size={14} color="#64748b" />
                        <Text style={styles.detailText}>{item.metodo_pago?.toUpperCase()}</Text>
                    </View>
                )}
                {item.referencia && (
                    <View style={styles.detailRow}>
                        <Ionicons name="document-text-outline" size={14} color="#64748b" />
                        <Text style={styles.detailText}>Ref: {item.referencia}</Text>
                    </View>
                )}
            </View>

            <View style={styles.cardActions}>
                <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={() => handleAnular(item)}
                >
                    <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
                    <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Anular</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pagos Recibidos</Text>
                <View style={styles.headerRight}>
                    <Text style={styles.totalCount}>{pagos.length}</Text>
                </View>
            </View>

            <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total Recaudado</Text>
                <Text style={styles.totalValue}>{formatCurrency(totalRecaudado)}</Text>
            </View>

            <FlatList
                data={pagos}
                renderItem={renderPago}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="receipt-outline" size={60} color="#64748b" />
                        <Text style={styles.emptyText}>No hay pagos registrados</Text>
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
        backgroundColor: '#10b981',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    totalCount: {
        color: '#fff',
        fontWeight: 'bold',
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
        color: '#10b981',
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
        backgroundColor: '#10b98120',
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
    cardSubtitle: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    cardMonto: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#10b981',
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
});
