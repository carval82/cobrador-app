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
import { endpoints } from '../config/api';

export default function AdminCobradoresScreen({ navigation }) {
    const [cobradores, setCobradores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadCobradores = async () => {
        try {
            const response = await api.request(endpoints.adminCobradores);
            if (response.success) {
                setCobradores(response.cobradores);
            }
        } catch (error) {
            console.error('Error loading cobradores:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadCobradores();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadCobradores();
    }, []);

    const getEstadoColor = (estado) => {
        return estado === 'activo' ? '#10b981' : '#ef4444';
    };

    const renderCobrador = ({ item }) => (
        <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('AdminCobradorForm', { cobrador: item, mode: 'edit' })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                    <Ionicons name="wallet" size={24} color="#fff" />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{item.nombre}</Text>
                    <Text style={styles.cardCode}>{item.documento}</Text>
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
                <View style={styles.detailRow}>
                    <Ionicons name="trending-up-outline" size={14} color="#64748b" />
                    <Text style={styles.detailText}>Comisión: {item.comision_porcentaje}%</Text>
                </View>
            </View>

            <View style={styles.cardStats}>
                <View style={styles.stat}>
                    <Ionicons name="people-outline" size={20} color="#3b82f6" />
                    <Text style={styles.statValue}>{item.clientes_count}</Text>
                    <Text style={styles.statLabel}>Clientes</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                    <Ionicons name="business-outline" size={20} color="#f59e0b" />
                    <Text style={styles.statValue}>{item.proyectos?.length || 0}</Text>
                    <Text style={styles.statLabel}>Proyectos</Text>
                </View>
            </View>

            {item.proyectos && item.proyectos.length > 0 && (
                <View style={styles.proyectosContainer}>
                    {item.proyectos.map((proyecto, index) => (
                        <View key={index} style={styles.proyectoTag}>
                            <Text style={styles.proyectoTagText}>{proyecto}</Text>
                        </View>
                    ))}
                </View>
            )}
        </TouchableOpacity>
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
                <Text style={styles.headerTitle}>Cobradores</Text>
                <TouchableOpacity 
                    onPress={() => navigation.navigate('AdminCobradorForm', { mode: 'create' })}
                    style={styles.addButton}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={cobradores}
                renderItem={renderCobrador}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="wallet-outline" size={60} color="#64748b" />
                        <Text style={styles.emptyText}>No hay cobradores</Text>
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
    avatar: {
        width: 45,
        height: 45,
        borderRadius: 22,
        backgroundColor: '#10b981',
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
    cardCode: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
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
    cardStats: {
        flexDirection: 'row',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#334155',
    },
    stat: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 4,
    },
    statLabel: {
        color: '#64748b',
        fontSize: 12,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        backgroundColor: '#334155',
    },
    proyectosContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#334155',
    },
    proyectoTag: {
        backgroundColor: '#f59e0b20',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
        marginRight: 8,
        marginBottom: 6,
    },
    proyectoTagText: {
        color: '#f59e0b',
        fontSize: 12,
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
    addButton: {
        backgroundColor: '#10b981',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
