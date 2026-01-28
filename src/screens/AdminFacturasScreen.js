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

export default function AdminFacturasScreen({ navigation }) {
    const [facturas, setFacturas] = useState([]);
    const [totales, setTotales] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadFacturas = async () => {
        try {
            const response = await api.request('/admin/facturas');
            if (response.success) {
                setFacturas(response.facturas);
                setTotales(response.totales);
            }
        } catch (error) {
            console.error('Error loading facturas:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadFacturas();
        const unsubscribe = navigation.addListener('focus', loadFacturas);
        return unsubscribe;
    }, [navigation]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadFacturas();
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
            case 'parcial': return '#f59e0b';
            case 'pendiente': return '#ef4444';
            case 'vencida': return '#dc2626';
            default: return '#64748b';
        }
    };

    const getEstadoIcon = (estado) => {
        switch (estado) {
            case 'pagada': return 'checkmark-circle';
            case 'parcial': return 'time';
            case 'pendiente': return 'alert-circle';
            case 'vencida': return 'warning';
            default: return 'document';
        }
    };

    const renderFactura = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: getEstadoColor(item.estado) + '20' }]}>
                    <Ionicons name={getEstadoIcon(item.estado)} size={24} color={getEstadoColor(item.estado)} />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{item.cliente}</Text>
                    <Text style={styles.cardSubtitle}>{item.periodo}</Text>
                </View>
                <View style={styles.cardAmounts}>
                    <Text style={styles.cardTotal}>{formatCurrency(item.total)}</Text>
                    {item.saldo > 0 && (
                        <Text style={styles.cardSaldo}>Debe: {formatCurrency(item.saldo)}</Text>
                    )}
                </View>
            </View>

            <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                    <Ionicons name="business-outline" size={14} color="#64748b" />
                    <Text style={styles.detailText}>{item.proyecto}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="wifi-outline" size={14} color="#64748b" />
                    <Text style={styles.detailText}>{item.plan}</Text>
                </View>
                {item.fecha_vencimiento && (
                    <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={14} color="#64748b" />
                        <Text style={styles.detailText}>Vence: {item.fecha_vencimiento}</Text>
                    </View>
                )}
            </View>

            <View style={styles.cardFooter}>
                <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(item.estado) + '20' }]}>
                    <Text style={[styles.estadoText, { color: getEstadoColor(item.estado) }]}>
                        {item.estado?.toUpperCase()}
                    </Text>
                </View>
            </View>
        </View>
    );

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
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Facturas</Text>
                <View style={styles.headerRight}>
                    <Text style={styles.totalCount}>{facturas.length}</Text>
                </View>
            </View>

            <View style={styles.summaryContainer}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Facturado</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(totales.total_facturado)}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Pagado</Text>
                    <Text style={[styles.summaryValue, { color: '#10b981' }]}>{formatCurrency(totales.total_pagado)}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Pendiente</Text>
                    <Text style={[styles.summaryValue, { color: '#ef4444' }]}>{formatCurrency(totales.total_pendiente)}</Text>
                </View>
            </View>

            <FlatList
                data={facturas}
                renderItem={renderFactura}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={60} color="#64748b" />
                        <Text style={styles.emptyText}>No hay facturas</Text>
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
        backgroundColor: '#3b82f6',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    totalCount: {
        color: '#fff',
        fontWeight: 'bold',
    },
    summaryContainer: {
        flexDirection: 'row',
        backgroundColor: '#1e293b',
        margin: 15,
        padding: 15,
        borderRadius: 12,
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryLabel: {
        color: '#64748b',
        fontSize: 12,
    },
    summaryValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 4,
    },
    summaryDivider: {
        width: 1,
        backgroundColor: '#334155',
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
    cardSubtitle: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    cardAmounts: {
        alignItems: 'flex-end',
    },
    cardTotal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    cardSaldo: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 2,
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
    cardFooter: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#334155',
        flexDirection: 'row',
    },
    estadoBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    estadoText: {
        fontSize: 12,
        fontWeight: '600',
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
