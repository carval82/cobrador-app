import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { endpoints } from '../config/api';

export default function AdminClientesScreen({ navigation }) {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    const loadClientes = async (searchTerm = '') => {
        try {
            const url = searchTerm 
                ? `${endpoints.adminClientes}?search=${encodeURIComponent(searchTerm)}`
                : endpoints.adminClientes;
            const response = await api.request(url);
            if (response.success) {
                setClientes(response.clientes);
            }
        } catch (error) {
            console.error('Error loading clientes:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadClientes();
    }, []);

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            if (search.length >= 2 || search.length === 0) {
                loadClientes(search);
            }
        }, 500);
        return () => clearTimeout(delaySearch);
    }, [search]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadClientes(search);
    }, [search]);

    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'activo': return '#10b981';
            case 'suspendido': return '#f59e0b';
            case 'retirado': return '#ef4444';
            default: return '#64748b';
        }
    };

    const renderCliente = ({ item }) => (
        <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('AdminClienteForm', { cliente: item, mode: 'edit' })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.nombre.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{item.nombre}</Text>
                    <Text style={styles.cardCode}>{item.codigo} • {item.documento}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getEstadoColor(item.estado) + '20' }]}>
                    <Text style={[styles.statusText, { color: getEstadoColor(item.estado) }]}>
                        {item.estado?.toUpperCase()}
                    </Text>
                </View>
            </View>
            <View style={styles.cardDetails}>
                {item.celular && (
                    <View style={styles.detailRow}>
                        <Ionicons name="call-outline" size={14} color="#64748b" />
                        <Text style={styles.detailText}>{item.celular}</Text>
                    </View>
                )}
                {item.direccion && (
                    <View style={styles.detailRow}>
                        <Ionicons name="location-outline" size={14} color="#64748b" />
                        <Text style={styles.detailText} numberOfLines={1}>{item.direccion}</Text>
                    </View>
                )}
                <View style={styles.cardFooter}>
                    {item.proyecto && (
                        <View style={styles.tag}>
                            <Ionicons name="business-outline" size={12} color="#f59e0b" />
                            <Text style={styles.tagText}>{item.proyecto}</Text>
                        </View>
                    )}
                    {item.cobrador && (
                        <View style={styles.tag}>
                            <Ionicons name="person-outline" size={12} color="#3b82f6" />
                            <Text style={styles.tagText}>{item.cobrador}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.cardActions}>
                    <TouchableOpacity 
                        style={styles.actionBtn}
                        onPress={(e) => {
                            e.stopPropagation();
                            navigation.navigate('AdminClienteServicios', { cliente: item });
                        }}
                    >
                        <Ionicons name="wifi" size={16} color="#8b5cf6" />
                        <Text style={styles.actionBtnText}>Servicios</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.actionBtn}
                        onPress={(e) => {
                            e.stopPropagation();
                            navigation.navigate('AdminClienteForm', { cliente: item, mode: 'edit' });
                        }}
                    >
                        <Ionicons name="create-outline" size={16} color="#3b82f6" />
                        <Text style={[styles.actionBtnText, { color: '#3b82f6' }]}>Editar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
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
                <Text style={styles.headerTitle}>Clientes</Text>
                <TouchableOpacity 
                    onPress={() => navigation.navigate('AdminClienteForm', { mode: 'create' })}
                    style={styles.addButton}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color="#64748b" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por nombre, documento o código..."
                    placeholderTextColor="#64748b"
                    value={search}
                    onChangeText={setSearch}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={20} color="#64748b" />
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={clientes}
                renderItem={renderCliente}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={60} color="#64748b" />
                        <Text style={styles.emptyText}>
                            {search ? 'No se encontraron clientes' : 'No hay clientes'}
                        </Text>
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        margin: 15,
        marginTop: 10,
        paddingHorizontal: 15,
        borderRadius: 12,
    },
    searchInput: {
        flex: 1,
        height: 45,
        color: '#fff',
        marginLeft: 10,
    },
    list: {
        padding: 15,
        paddingTop: 5,
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
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    cardInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    cardCode: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
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
        flex: 1,
    },
    cardFooter: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginRight: 8,
        marginBottom: 4,
    },
    tagText: {
        color: '#94a3b8',
        fontSize: 11,
        marginLeft: 4,
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
    addButton: {
        backgroundColor: '#3b82f6',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
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
        color: '#8b5cf6',
        fontSize: 13,
        fontWeight: '500',
        marginLeft: 6,
    },
});
