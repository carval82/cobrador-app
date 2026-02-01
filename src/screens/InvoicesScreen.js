import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import db from '../services/database';

export default function InvoicesScreen({ navigation, route }) {
    const proyecto = route.params?.proyecto;
    const [facturas, setFacturas] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadFacturas();
    }, [proyecto]);

    const loadFacturas = async () => {
        setRefreshing(true);
        try {
            const data = await db.getFacturas(proyecto?.id);
            setFacturas(data);
        } catch (error) {
            console.error('Error loading facturas:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const getMesNombre = (mes) => {
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return meses[mes - 1] || '';
    };

    const renderFactura = ({ item }) => (
        <TouchableOpacity 
            style={styles.facturaCard}
            onPress={() => navigation.navigate('NewPayment', { factura: item })}
        >
            <View style={styles.facturaLeft}>
                <View style={styles.mesContainer}>
                    <Text style={styles.mesText}>{getMesNombre(item.mes)}</Text>
                    <Text style={styles.anioText}>{item.anio}</Text>
                </View>
            </View>
            <View style={styles.facturaInfo}>
                <Text style={styles.clienteNombre}>{item.cliente_nombre || item.cliente?.nombre || 'Cliente'}</Text>
                <Text style={styles.facturaNumero}>Factura #{item.numero}</Text>
                <Text style={styles.vencimiento}>
                    <Ionicons name="calendar-outline" size={12} color="#64748b" /> 
                    Vence: {item.fecha_vencimiento}
                </Text>
            </View>
            <View style={styles.facturaRight}>
                <Text style={styles.totalText}>{formatCurrency(item.total)}</Text>
                <TouchableOpacity 
                    style={styles.payButton}
                    onPress={() => navigation.navigate('NewPayment', { factura: item })}
                >
                    <Ionicons name="cash-outline" size={16} color="#fff" />
                    <Text style={styles.payButtonText}>Pagar</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Facturas Pendientes</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{facturas.length}</Text>
                </View>
            </View>

            <FlatList
                data={facturas}
                renderItem={renderFactura}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={loadFacturas} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={64} color="#64748b" />
                        <Text style={styles.emptyText}>No hay facturas pendientes</Text>
                        <Text style={styles.emptySubtext}>Sincroniza para cargar los datos</Text>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    badge: {
        backgroundColor: '#dc2626',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 10,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    list: {
        padding: 15,
        paddingTop: 0,
    },
    facturaCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
    },
    facturaLeft: {
        marginRight: 15,
    },
    mesContainer: {
        backgroundColor: '#3b82f6',
        width: 50,
        height: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mesText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    anioText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 11,
    },
    facturaInfo: {
        flex: 1,
    },
    clienteNombre: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    facturaNumero: {
        fontSize: 13,
        color: '#94a3b8',
        marginTop: 2,
    },
    vencimiento: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    facturaRight: {
        alignItems: 'flex-end',
    },
    totalText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#10b981',
        marginBottom: 8,
    },
    payButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10b981',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    payButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 18,
        color: '#fff',
        marginTop: 15,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 5,
    },
});
