import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import db from '../services/database';

export default function ClientDetailScreen({ route, navigation }) {
    const { cliente } = route.params;
    const [facturas, setFacturas] = useState([]);

    useEffect(() => {
        loadFacturas();
    }, []);

    const loadFacturas = async () => {
        const data = await db.getFacturasCliente(cliente.id);
        setFacturas(data);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
        }).format(value);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {cliente.nombre?.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.nombre}>{cliente.nombre}</Text>
                <View style={[styles.statusBadge, cliente.estado === 'activo' ? styles.active : styles.inactive]}>
                    <Text style={styles.statusText}>{cliente.estado}</Text>
                </View>
            </View>

            <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                    <Ionicons name="card-outline" size={20} color="#64748b" />
                    <Text style={styles.infoLabel}>Documento:</Text>
                    <Text style={styles.infoValue}>{cliente.documento}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={20} color="#64748b" />
                    <Text style={styles.infoLabel}>Dirección:</Text>
                    <Text style={styles.infoValue}>{cliente.direccion || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="home-outline" size={20} color="#64748b" />
                    <Text style={styles.infoLabel}>Barrio:</Text>
                    <Text style={styles.infoValue}>{cliente.barrio || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={20} color="#64748b" />
                    <Text style={styles.infoLabel}>Teléfono:</Text>
                    <Text style={styles.infoValue}>{cliente.telefono || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="phone-portrait-outline" size={20} color="#64748b" />
                    <Text style={styles.infoLabel}>Celular:</Text>
                    <Text style={styles.infoValue}>{cliente.celular || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="mail-outline" size={20} color="#64748b" />
                    <Text style={styles.infoLabel}>Email:</Text>
                    <Text style={styles.infoValue}>{cliente.email || 'N/A'}</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Facturas Pendientes ({facturas.length})</Text>
            
            {facturas.length > 0 ? (
                facturas.map(factura => (
                    <TouchableOpacity 
                        key={factura.id}
                        style={styles.facturaCard}
                        onPress={() => navigation.navigate('NewPayment', { factura: { ...factura, cliente } })}
                    >
                        <View style={styles.facturaInfo}>
                            <Text style={styles.facturaNumero}>Factura #{factura.numero}</Text>
                            <Text style={styles.facturaPeriodo}>{factura.mes}/{factura.anio}</Text>
                        </View>
                        <View style={styles.facturaRight}>
                            <Text style={styles.facturaTotal}>{formatCurrency(factura.total)}</Text>
                            <Ionicons name="chevron-forward" size={20} color="#64748b" />
                        </View>
                    </TouchableOpacity>
                ))
            ) : (
                <View style={styles.emptyContainer}>
                    <Ionicons name="checkmark-circle-outline" size={48} color="#10b981" />
                    <Text style={styles.emptyText}>Sin facturas pendientes</Text>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    header: {
        alignItems: 'center',
        padding: 20,
        paddingTop: 30,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    nombre: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    statusBadge: {
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 15,
        marginTop: 10,
    },
    active: {
        backgroundColor: '#065f46',
    },
    inactive: {
        backgroundColor: '#7f1d1d',
    },
    statusText: {
        color: '#fff',
        fontSize: 13,
        textTransform: 'capitalize',
    },
    infoCard: {
        backgroundColor: '#1e293b',
        margin: 15,
        borderRadius: 12,
        padding: 15,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    infoLabel: {
        color: '#94a3b8',
        fontSize: 14,
        marginLeft: 10,
        width: 80,
    },
    infoValue: {
        color: '#fff',
        fontSize: 14,
        flex: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginLeft: 15,
        marginTop: 10,
        marginBottom: 10,
    },
    facturaCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        marginHorizontal: 15,
        marginBottom: 10,
        padding: 15,
        borderRadius: 12,
    },
    facturaInfo: {
        flex: 1,
    },
    facturaNumero: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '500',
    },
    facturaPeriodo: {
        color: '#64748b',
        fontSize: 13,
        marginTop: 2,
    },
    facturaRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    facturaTotal: {
        color: '#10b981',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 10,
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 30,
    },
    emptyText: {
        color: '#10b981',
        fontSize: 16,
        marginTop: 10,
    },
});
