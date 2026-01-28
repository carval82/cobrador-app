import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function ProyectosScreen({ navigation }) {
    const { user, logout } = useAuth();
    const [proyectos, setProyectos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProyectos();
    }, []);

    const loadProyectos = async () => {
        try {
            setLoading(true);
            const response = await api.getProyectos();
            if (response.success) {
                setProyectos(response.proyectos);
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudieron cargar los proyectos: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectProyecto = (proyecto) => {
        navigation.navigate('Home', { proyecto });
    };

    const handleLogout = () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Está seguro que desea cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sí', onPress: logout },
            ]
        );
    };

    const renderProyecto = ({ item }) => (
        <TouchableOpacity 
            style={[styles.proyectoCard, { borderLeftColor: item.color || '#10b981' }]}
            onPress={() => handleSelectProyecto(item)}
        >
            <View style={styles.proyectoInfo}>
                <Text style={styles.proyectoNombre}>{item.nombre}</Text>
                {item.ubicacion && (
                    <Text style={styles.proyectoUbicacion}>
                        <Ionicons name="location-outline" size={14} color="#64748b" /> {item.ubicacion}
                    </Text>
                )}
                <View style={styles.proyectoStats}>
                    <View style={styles.statItem}>
                        <Ionicons name="people-outline" size={16} color="#10b981" />
                        <Text style={styles.statText}>{item.clientes_asignados || 0} clientes</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="document-text-outline" size={16} color="#f59e0b" />
                        <Text style={styles.statText}>{item.facturas_pendientes || 0} pendientes</Text>
                    </View>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#64748b" />
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingText}>Cargando proyectos...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hola,</Text>
                    <Text style={styles.userName}>{user?.nombre || 'Cobrador'}</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                </TouchableOpacity>
            </View>

            {/* Title */}
            <Text style={styles.title}>Selecciona un Proyecto</Text>
            <Text style={styles.subtitle}>Elige el proyecto en el que deseas trabajar</Text>

            {/* Lista de Proyectos */}
            {proyectos.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="folder-open-outline" size={64} color="#64748b" />
                    <Text style={styles.emptyText}>No tienes proyectos asignados</Text>
                    <TouchableOpacity style={styles.refreshBtn} onPress={loadProyectos}>
                        <Ionicons name="refresh" size={20} color="#fff" />
                        <Text style={styles.refreshBtnText}>Recargar</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={proyectos}
                    renderItem={renderProyecto}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    refreshing={loading}
                    onRefresh={loadProyectos}
                />
            )}
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
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#64748b',
        marginTop: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50,
    },
    greeting: {
        fontSize: 16,
        color: '#64748b',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    logoutBtn: {
        padding: 5,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginHorizontal: 20,
        marginTop: 10,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        marginHorizontal: 20,
        marginBottom: 20,
    },
    listContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    proyectoCard: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 4,
    },
    proyectoInfo: {
        flex: 1,
    },
    proyectoNombre: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    proyectoUbicacion: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 8,
    },
    proyectoStats: {
        flexDirection: 'row',
        gap: 16,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 13,
        color: '#94a3b8',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        color: '#64748b',
        fontSize: 16,
        marginTop: 16,
        textAlign: 'center',
    },
    refreshBtn: {
        flexDirection: 'row',
        backgroundColor: '#10b981',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 20,
        alignItems: 'center',
        gap: 8,
    },
    refreshBtnText: {
        color: '#fff',
        fontWeight: '600',
    },
});
