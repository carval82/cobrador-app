import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { API_URL, endpoints } from '../config/api';

export default function SocioProyectosScreen({ navigation }) {
    const [proyectos, setProyectos] = useState([]);
    const [socio, setSocio] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const socioData = await SecureStore.getItemAsync('socio_data');
            if (socioData) {
                setSocio(JSON.parse(socioData));
            }
            await fetchProyectos();
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const fetchProyectos = async () => {
        try {
            const token = await SecureStore.getItemAsync('socio_token');
            const response = await fetch(`${API_URL}${endpoints.socioProyectos}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();
            if (data.success) {
                setProyectos(data.data);
            } else {
                Alert.alert('Error', data.message || 'Error al cargar proyectos');
            }
        } catch (error) {
            console.error('Error fetching proyectos:', error);
            Alert.alert('Error', 'Error de conexión');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Está seguro que desea salir?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Salir',
                    style: 'destructive',
                    onPress: async () => {
                        await SecureStore.deleteItemAsync('socio_token');
                        await SecureStore.deleteItemAsync('socio_data');
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                        });
                    },
                },
            ]
        );
    };

    const renderProyecto = ({ item }) => (
        <TouchableOpacity
            style={styles.proyectoCard}
            onPress={() => navigation.navigate('SocioLiquidacion', { proyecto: item })}
        >
            <View style={styles.proyectoIcon}>
                <Ionicons name="business" size={32} color="#10b981" />
            </View>
            <View style={styles.proyectoInfo}>
                <Text style={styles.proyectoNombre}>{item.nombre}</Text>
                <Text style={styles.proyectoPorcentaje}>
                    Participación: {item.porcentaje}%
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#64748b" />
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
                <View>
                    <Text style={styles.greeting}>Bienvenido,</Text>
                    <Text style={styles.nombre}>{socio?.nombre || 'Socio'}</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Mis Proyectos</Text>

            {proyectos.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="folder-open-outline" size={64} color="#64748b" />
                    <Text style={styles.emptyText}>No tiene proyectos asignados</Text>
                </View>
            ) : (
                <FlatList
                    data={proyectos}
                    renderItem={renderProyecto}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                fetchProyectos();
                            }}
                            tintColor="#10b981"
                        />
                    }
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
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0f172a',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#1e293b',
    },
    greeting: {
        fontSize: 14,
        color: '#64748b',
    },
    nombre: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    logoutButton: {
        padding: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        padding: 20,
        paddingBottom: 10,
    },
    listContainer: {
        padding: 16,
    },
    proyectoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    proyectoIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
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
    proyectoPorcentaje: {
        fontSize: 14,
        color: '#10b981',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#64748b',
        marginTop: 16,
    },
});
