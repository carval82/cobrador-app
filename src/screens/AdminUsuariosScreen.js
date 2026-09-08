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
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { endpoints } from '../config/api';

export default function AdminUsuariosScreen({ navigation }) {
    const { user } = useAuth();
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadUsuarios = async () => {
        try {
            const response = await api.request(endpoints.adminUsuarios);
            if (response.success) {
                setUsuarios(response.usuarios || []);
            }
        } catch (error) {
            console.error('Error loading usuarios:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadUsuarios();
        const unsubscribe = navigation.addListener('focus', loadUsuarios);
        return unsubscribe;
    }, [navigation]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadUsuarios();
    }, []);

    const renderUsuario = ({ item }) => {
        const isCurrent = item.id === user?.id;
        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('AdminUsuarioForm', { usuario: item, mode: 'edit' })}
            >
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(item.name || 'U').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardEmail}>{item.email}</Text>
                </View>
                {isCurrent && (
                    <View style={styles.youBadge}>
                        <Text style={styles.youBadgeText}>TÚ</Text>
                    </View>
                )}
                <Ionicons name="chevron-forward" size={20} color="#64748b" />
            </TouchableOpacity>
        );
    };

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
                <Text style={styles.headerTitle}>Usuarios</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('AdminUsuarioForm', { mode: 'create' })}
                    style={styles.addButton}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={usuarios}
                renderItem={renderUsuario}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={60} color="#64748b" />
                        <Text style={styles.emptyText}>No hay usuarios</Text>
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
    addButton: {
        backgroundColor: '#3b82f6',
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
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 45,
        height: 45,
        borderRadius: 22,
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
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    cardEmail: {
        fontSize: 13,
        color: '#94a3b8',
        marginTop: 2,
    },
    youBadge: {
        backgroundColor: '#3b82f620',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 8,
    },
    youBadgeText: {
        color: '#3b82f6',
        fontSize: 11,
        fontWeight: '700',
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
