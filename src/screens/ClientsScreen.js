import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import db from '../services/database';

export default function ClientsScreen({ navigation }) {
    const [clientes, setClientes] = useState([]);
    const [filteredClientes, setFilteredClientes] = useState([]);
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadClientes();
    }, []);

    useEffect(() => {
        if (search.trim()) {
            const filtered = clientes.filter(c => 
                c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
                c.documento?.includes(search) ||
                c.direccion?.toLowerCase().includes(search.toLowerCase())
            );
            setFilteredClientes(filtered);
        } else {
            setFilteredClientes(clientes);
        }
    }, [search, clientes]);

    const loadClientes = async () => {
        setRefreshing(true);
        try {
            const data = await db.getClientes();
            setClientes(data);
            setFilteredClientes(data);
        } catch (error) {
            console.error('Error loading clientes:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const renderCliente = ({ item }) => (
        <TouchableOpacity 
            style={styles.clientCard}
            onPress={() => navigation.navigate('ClientDetail', { cliente: item })}
        >
            <View style={styles.clientAvatar}>
                <Text style={styles.avatarText}>
                    {item.nombre?.charAt(0).toUpperCase() || '?'}
                </Text>
            </View>
            <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{item.nombre}</Text>
                <Text style={styles.clientDoc}>CC: {item.documento}</Text>
                <Text style={styles.clientAddress} numberOfLines={1}>
                    <Ionicons name="location-outline" size={12} color="#64748b" /> {item.direccion || 'Sin dirección'}
                </Text>
            </View>
            <View style={[styles.statusBadge, item.estado === 'activo' ? styles.active : styles.inactive]}>
                <Text style={styles.statusText}>{item.estado}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#64748b" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar cliente..."
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
                data={filteredClientes}
                renderItem={renderCliente}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={loadClientes} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={64} color="#64748b" />
                        <Text style={styles.emptyText}>No hay clientes</Text>
                        <Text style={styles.emptySubtext}>Sincroniza para cargar los datos</Text>
                    </View>
                }
            />

            <TouchableOpacity 
                style={styles.fab}
                onPress={() => navigation.navigate('NewClient')}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        margin: 15,
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
        paddingTop: 0,
    },
    clientCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
    },
    clientAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    clientInfo: {
        flex: 1,
        marginLeft: 15,
    },
    clientName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    clientDoc: {
        fontSize: 13,
        color: '#94a3b8',
        marginTop: 2,
    },
    clientAddress: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    active: {
        backgroundColor: '#065f46',
    },
    inactive: {
        backgroundColor: '#7f1d1d',
    },
    statusText: {
        fontSize: 11,
        color: '#fff',
        textTransform: 'capitalize',
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
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
});
