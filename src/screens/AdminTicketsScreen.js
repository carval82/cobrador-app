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
    Modal,
    TextInput,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { API_URL, endpoints } from '../config/api';
import * as SecureStore from 'expo-secure-store';

export default function AdminTicketsScreen({ navigation }) {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filtroEstado, setFiltroEstado] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [respuesta, setRespuesta] = useState('');
    const [nuevoEstado, setNuevoEstado] = useState('en_proceso');
    const [respondiendo, setRespondiendo] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, [filtroEstado]);

    const fetchTickets = async () => {
        try {
            const token = await SecureStore.getItemAsync('token');
            let url = `${API_URL}${endpoints.adminTickets}`;
            if (filtroEstado) {
                url += `?estado=${filtroEstado}`;
            }
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });
            const data = await response.json();
            if (data.success) {
                setTickets(data.tickets);
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
            Alert.alert('Error', 'No se pudieron cargar los tickets');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleResponder = async () => {
        if (!respuesta.trim()) {
            Alert.alert('Error', 'Ingrese una respuesta');
            return;
        }

        setRespondiendo(true);
        try {
            const token = await SecureStore.getItemAsync('token');
            const response = await fetch(`${API_URL}${endpoints.adminResponderTicket}/${selectedTicket.id}/responder`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    respuesta: respuesta,
                    estado: nuevoEstado,
                }),
            });

            const data = await response.json();
            if (data.success) {
                Alert.alert('Éxito', 'Ticket actualizado correctamente');
                setModalVisible(false);
                setRespuesta('');
                setSelectedTicket(null);
                fetchTickets();
            } else {
                Alert.alert('Error', data.message || 'Error al responder');
            }
        } catch (error) {
            console.error('Error responding:', error);
            Alert.alert('Error', 'Error de conexión');
        } finally {
            setRespondiendo(false);
        }
    };

    const openTicket = (ticket) => {
        setSelectedTicket(ticket);
        setRespuesta(ticket.respuesta || '');
        setNuevoEstado(ticket.estado === 'abierto' ? 'en_proceso' : ticket.estado);
        setModalVisible(true);
    };

    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'abierto': return '#f59e0b';
            case 'en_proceso': return '#3b82f6';
            case 'resuelto': return '#10b981';
            case 'cerrado': return '#64748b';
            default: return '#64748b';
        }
    };

    const getTipoIcon = (tipo) => {
        switch (tipo) {
            case 'daño': return 'warning';
            case 'cobro': return 'cash';
            case 'soporte': return 'help-circle';
            default: return 'chatbubble';
        }
    };

    const renderTicket = ({ item }) => (
        <TouchableOpacity style={styles.ticketCard} onPress={() => openTicket(item)}>
            <View style={styles.ticketHeader}>
                <View style={[styles.tipoIcon, { backgroundColor: getEstadoColor(item.estado) + '20' }]}>
                    <Ionicons name={getTipoIcon(item.tipo)} size={24} color={getEstadoColor(item.estado)} />
                </View>
                <View style={styles.ticketInfo}>
                    <Text style={styles.ticketAsunto}>{item.asunto}</Text>
                    <Text style={styles.ticketCliente}>
                        {item.cliente?.nombre || 'Sin cliente'} • {item.proyecto?.nombre || 'Sin proyecto'}
                    </Text>
                </View>
                <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(item.estado) }]}>
                    <Text style={styles.estadoText}>{item.estado}</Text>
                </View>
            </View>
            <Text style={styles.ticketDescripcion} numberOfLines={2}>{item.descripcion}</Text>
            <Text style={styles.ticketFecha}>{item.created_at}</Text>
        </TouchableOpacity>
    );

    const filtros = [
        { id: '', label: 'Todos' },
        { id: 'abierto', label: 'Abiertos' },
        { id: 'en_proceso', label: 'En Proceso' },
        { id: 'resuelto', label: 'Resueltos' },
    ];

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
            </View>
        );
    }

    const ticketsPendientes = tickets.filter(t => t.estado === 'abierto' || t.estado === 'en_proceso').length;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>Tickets / Reportes</Text>
                    {ticketsPendientes > 0 && (
                        <View style={styles.badgeContainer}>
                            <Text style={styles.badgeText}>{ticketsPendientes} pendientes</Text>
                        </View>
                    )}
                </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtrosContainer}>
                {filtros.map((f) => (
                    <TouchableOpacity
                        key={f.id}
                        style={[styles.filtroButton, filtroEstado === f.id && styles.filtroButtonActive]}
                        onPress={() => setFiltroEstado(f.id)}
                    >
                        <Text style={[styles.filtroText, filtroEstado === f.id && styles.filtroTextActive]}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {tickets.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubbles-outline" size={64} color="#64748b" />
                    <Text style={styles.emptyText}>No hay tickets</Text>
                </View>
            ) : (
                <FlatList
                    data={tickets}
                    renderItem={renderTicket}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                fetchTickets();
                            }}
                            tintColor="#10b981"
                        />
                    }
                />
            )}

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Responder Ticket</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {selectedTicket && (
                            <ScrollView style={styles.modalBody}>
                                <Text style={styles.modalLabel}>Asunto</Text>
                                <Text style={styles.modalValue}>{selectedTicket.asunto}</Text>

                                <Text style={styles.modalLabel}>Cliente</Text>
                                <Text style={styles.modalValue}>{selectedTicket.cliente?.nombre}</Text>

                                <Text style={styles.modalLabel}>Descripción</Text>
                                <Text style={styles.modalValue}>{selectedTicket.descripcion}</Text>

                                <Text style={styles.modalLabel}>Estado</Text>
                                <View style={styles.estadoButtons}>
                                    {['en_proceso', 'resuelto', 'cerrado'].map((e) => (
                                        <TouchableOpacity
                                            key={e}
                                            style={[
                                                styles.estadoButton,
                                                nuevoEstado === e && { backgroundColor: getEstadoColor(e) }
                                            ]}
                                            onPress={() => setNuevoEstado(e)}
                                        >
                                            <Text style={[
                                                styles.estadoButtonText,
                                                nuevoEstado === e && { color: '#fff' }
                                            ]}>
                                                {e.replace('_', ' ')}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={styles.modalLabel}>Respuesta</Text>
                                <TextInput
                                    style={styles.textArea}
                                    value={respuesta}
                                    onChangeText={setRespuesta}
                                    placeholder="Escriba su respuesta..."
                                    placeholderTextColor="#64748b"
                                    multiline
                                    numberOfLines={4}
                                />

                                <TouchableOpacity
                                    style={[styles.submitButton, respondiendo && styles.buttonDisabled]}
                                    onPress={handleResponder}
                                    disabled={respondiendo}
                                >
                                    {respondiendo ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.submitButtonText}>Guardar Respuesta</Text>
                                    )}
                                </TouchableOpacity>
                            </ScrollView>
                        )}
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
        paddingTop: 60,
        backgroundColor: '#1e293b',
    },
    backButton: {
        marginRight: 16,
    },
    headerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    badgeContainer: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 12,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    filtrosContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        maxHeight: 60,
    },
    filtroButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#1e293b',
        marginRight: 8,
    },
    filtroButtonActive: {
        backgroundColor: '#10b981',
    },
    filtroText: {
        color: '#64748b',
        fontSize: 14,
    },
    filtroTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    listContainer: {
        padding: 16,
    },
    ticketCard: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    ticketHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    tipoIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    ticketInfo: {
        flex: 1,
    },
    ticketAsunto: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    ticketCliente: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    estadoBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    estadoText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    ticketDescripcion: {
        fontSize: 14,
        color: '#94a3b8',
        marginBottom: 8,
    },
    ticketFecha: {
        fontSize: 12,
        color: '#64748b',
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1e293b',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '85%',
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
    modalBody: {
        padding: 20,
    },
    modalLabel: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 6,
        marginTop: 12,
    },
    modalValue: {
        fontSize: 16,
        color: '#fff',
    },
    estadoButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    estadoButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#0f172a',
        alignItems: 'center',
    },
    estadoButtonText: {
        color: '#64748b',
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    textArea: {
        backgroundColor: '#0f172a',
        borderRadius: 12,
        padding: 16,
        color: '#fff',
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: '#10b981',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
