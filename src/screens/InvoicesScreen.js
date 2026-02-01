import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import db from '../services/database';

export default function InvoicesScreen({ navigation, route }) {
    const proyecto = route.params?.proyecto;
    const [clientesAgrupados, setClientesAgrupados] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        loadFacturas();
    }, [proyecto]);

    const loadFacturas = async () => {
        setRefreshing(true);
        try {
            const facturas = await db.getFacturas(proyecto?.id);
            // Agrupar facturas por cliente
            const agrupado = {};
            facturas.forEach(f => {
                const clienteId = f.cliente_id;
                if (!agrupado[clienteId]) {
                    agrupado[clienteId] = {
                        cliente_id: clienteId,
                        cliente_nombre: f.cliente_nombre || f.cliente?.nombre || 'Cliente',
                        facturas: [],
                        total: 0,
                        saldo: 0,
                    };
                }
                agrupado[clienteId].facturas.push(f);
                agrupado[clienteId].total += parseFloat(f.total) || 0;
                agrupado[clienteId].saldo += parseFloat(f.saldo) || parseFloat(f.total) || 0;
            });
            // Convertir a array y ordenar por nombre
            const lista = Object.values(agrupado).sort((a, b) => 
                a.cliente_nombre.localeCompare(b.cliente_nombre)
            );
            setClientesAgrupados(lista);
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

    const openDetalleFacturas = (cliente) => {
        setSelectedCliente(cliente);
        setModalVisible(true);
    };

    const renderCliente = ({ item }) => (
        <TouchableOpacity 
            style={styles.clienteCard}
            onPress={() => openDetalleFacturas(item)}
        >
            <View style={styles.clienteLeft}>
                <View style={[styles.avatarContainer, item.facturas.length > 1 && styles.avatarWarning]}>
                    <Text style={styles.avatarText}>{item.facturas.length}</Text>
                </View>
            </View>
            <View style={styles.clienteInfo}>
                <Text style={styles.clienteNombre}>{item.cliente_nombre}</Text>
                <Text style={styles.facturasCount}>
                    {item.facturas.length} factura{item.facturas.length > 1 ? 's' : ''} pendiente{item.facturas.length > 1 ? 's' : ''}
                </Text>
                <Text style={styles.mesesPendientes}>
                    {item.facturas.map(f => getMesNombre(f.mes)).join(', ')}
                </Text>
            </View>
            <View style={styles.clienteRight}>
                <Text style={styles.totalText}>{formatCurrency(item.saldo)}</Text>
                <TouchableOpacity 
                    style={styles.verButton}
                    onPress={() => openDetalleFacturas(item)}
                >
                    <Ionicons name="eye-outline" size={16} color="#fff" />
                    <Text style={styles.verButtonText}>Ver</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const renderFacturaDetalle = ({ item }) => (
        <TouchableOpacity 
            style={styles.facturaDetalleCard}
            onPress={() => {
                setModalVisible(false);
                navigation.navigate('NewPayment', { factura: item });
            }}
        >
            <View style={styles.facturaDetalleLeft}>
                <View style={styles.mesContainer}>
                    <Text style={styles.mesText}>{getMesNombre(item.mes)}</Text>
                    <Text style={styles.anioText}>{item.anio}</Text>
                </View>
            </View>
            <View style={styles.facturaDetalleInfo}>
                <Text style={styles.facturaNumero}>Factura #{item.numero}</Text>
                <Text style={styles.vencimiento}>Vence: {item.fecha_vencimiento}</Text>
            </View>
            <View style={styles.facturaDetalleRight}>
                <Text style={styles.facturaTotal}>{formatCurrency(item.saldo || item.total)}</Text>
                <TouchableOpacity style={styles.payButtonSmall}>
                    <Ionicons name="cash-outline" size={14} color="#fff" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const totalGeneral = clientesAgrupados.reduce((sum, c) => sum + c.saldo, 0);
    const totalFacturas = clientesAgrupados.reduce((sum, c) => sum + c.facturas.length, 0);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Facturas Pendientes</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{totalFacturas}</Text>
                </View>
            </View>

            {/* Resumen total */}
            <View style={styles.resumenContainer}>
                <View style={styles.resumenItem}>
                    <Text style={styles.resumenLabel}>Clientes</Text>
                    <Text style={styles.resumenValue}>{clientesAgrupados.length}</Text>
                </View>
                <View style={styles.resumenDivider} />
                <View style={styles.resumenItem}>
                    <Text style={styles.resumenLabel}>Total a cobrar</Text>
                    <Text style={styles.resumenTotal}>{formatCurrency(totalGeneral)}</Text>
                </View>
            </View>

            <FlatList
                data={clientesAgrupados}
                renderItem={renderCliente}
                keyExtractor={item => item.cliente_id.toString()}
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

            {/* Modal detalle de facturas */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{selectedCliente?.cliente_nombre}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalTotalRow}>
                            <Text style={styles.modalTotalLabel}>Total pendiente:</Text>
                            <Text style={styles.modalTotalValue}>{formatCurrency(selectedCliente?.saldo || 0)}</Text>
                        </View>
                        <FlatList
                            data={selectedCliente?.facturas || []}
                            renderItem={renderFacturaDetalle}
                            keyExtractor={item => item.id.toString()}
                            style={styles.modalList}
                        />
                    </View>
                </View>
            </Modal>
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
    resumenContainer: {
        flexDirection: 'row',
        backgroundColor: '#1e293b',
        marginHorizontal: 15,
        marginBottom: 15,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    resumenItem: {
        flex: 1,
        alignItems: 'center',
    },
    resumenLabel: {
        fontSize: 12,
        color: '#94a3b8',
    },
    resumenValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 4,
    },
    resumenTotal: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#10b981',
        marginTop: 4,
    },
    resumenDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#334155',
    },
    list: {
        padding: 15,
        paddingTop: 0,
    },
    clienteCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
    },
    clienteLeft: {
        marginRight: 15,
    },
    avatarContainer: {
        backgroundColor: '#3b82f6',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarWarning: {
        backgroundColor: '#f59e0b',
    },
    avatarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    clienteInfo: {
        flex: 1,
    },
    clienteNombre: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    facturasCount: {
        fontSize: 13,
        color: '#94a3b8',
        marginTop: 2,
    },
    mesesPendientes: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    clienteRight: {
        alignItems: 'flex-end',
    },
    totalText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#10b981',
        marginBottom: 8,
    },
    verButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3b82f6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    verButtonText: {
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
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1e293b',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    modalTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#0f172a',
    },
    modalTotalLabel: {
        fontSize: 14,
        color: '#94a3b8',
    },
    modalTotalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#10b981',
    },
    modalList: {
        padding: 15,
    },
    facturaDetalleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
    },
    facturaDetalleLeft: {
        marginRight: 12,
    },
    mesContainer: {
        backgroundColor: '#3b82f6',
        width: 45,
        height: 45,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mesText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    anioText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
    },
    facturaDetalleInfo: {
        flex: 1,
    },
    facturaNumero: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    vencimiento: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    facturaDetalleRight: {
        alignItems: 'flex-end',
    },
    facturaTotal: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#10b981',
        marginBottom: 6,
    },
    payButtonSmall: {
        backgroundColor: '#10b981',
        padding: 8,
        borderRadius: 6,
    },
});
