import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    TextInput,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function AdminParticipacionesScreen({ navigation, route }) {
    const { proyecto } = route.params;
    const [participaciones, setParticipaciones] = useState([]);
    const [totalPorcentaje, setTotalPorcentaje] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingParticipacion, setEditingParticipacion] = useState(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        socio_nombre: '',
        socio_documento: '',
        socio_telefono: '',
        porcentaje: '',
    });

    const loadParticipaciones = async () => {
        try {
            const response = await api.request(`/admin/proyectos/${proyecto.id}/participaciones`);
            if (response.success) {
                setParticipaciones(response.participaciones);
                setTotalPorcentaje(response.total_porcentaje);
            }
        } catch (error) {
            console.error('Error loading participaciones:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadParticipaciones();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadParticipaciones();
    }, []);

    const openModal = (participacion = null) => {
        if (participacion) {
            setEditingParticipacion(participacion);
            setForm({
                socio_nombre: participacion.socio_nombre,
                socio_documento: participacion.socio_documento || '',
                socio_telefono: participacion.socio_telefono || '',
                porcentaje: participacion.porcentaje.toString(),
            });
        } else {
            setEditingParticipacion(null);
            setForm({
                socio_nombre: '',
                socio_documento: '',
                socio_telefono: '',
                porcentaje: '',
            });
        }
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingParticipacion(null);
    };

    const handleSave = async () => {
        if (!form.socio_nombre || !form.porcentaje) {
            Alert.alert('Error', 'Nombre y porcentaje son requeridos');
            return;
        }

        const porcentaje = parseFloat(form.porcentaje);
        if (isNaN(porcentaje) || porcentaje <= 0 || porcentaje > 100) {
            Alert.alert('Error', 'El porcentaje debe ser entre 0 y 100');
            return;
        }

        setSaving(true);
        try {
            const data = {
                proyecto_id: proyecto.id,
                socio_nombre: form.socio_nombre,
                socio_documento: form.socio_documento,
                socio_telefono: form.socio_telefono,
                porcentaje: porcentaje,
            };

            const url = editingParticipacion 
                ? `/admin/participaciones/${editingParticipacion.id}`
                : '/admin/participaciones';

            const response = await api.request(url, {
                method: editingParticipacion ? 'PUT' : 'POST',
                body: JSON.stringify(data),
            });

            if (response.success) {
                Alert.alert('Éxito', response.message);
                closeModal();
                loadParticipaciones();
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (participacion) => {
        Alert.alert(
            'Eliminar Participación',
            `¿Está seguro de eliminar a "${participacion.socio_nombre}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: () => confirmDelete(participacion.id) }
            ]
        );
    };

    const confirmDelete = async (id) => {
        try {
            const response = await api.request(`/admin/participaciones/${id}`, {
                method: 'DELETE',
            });
            if (response.success) {
                Alert.alert('Éxito', 'Participación eliminada');
                loadParticipaciones();
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const renderParticipacion = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
            <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{item.socio_nombre}</Text>
                    {item.socio_documento && (
                        <Text style={styles.cardSubtitle}>{item.socio_documento}</Text>
                    )}
                </View>
                <View style={styles.porcentajeBadge}>
                    <Text style={styles.porcentajeText}>{item.porcentaje}%</Text>
                </View>
            </View>
            {item.socio_telefono && (
                <View style={styles.cardDetails}>
                    <Ionicons name="call-outline" size={14} color="#64748b" />
                    <Text style={styles.detailText}>{item.socio_telefono}</Text>
                </View>
            )}
            <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openModal(item)}>
                    <Ionicons name="create-outline" size={18} color="#3b82f6" />
                    <Text style={[styles.actionBtnText, { color: '#3b82f6' }]}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Eliminar</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8b5cf6" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>Participaciones</Text>
                    <Text style={styles.headerSubtitle}>{proyecto.nombre}</Text>
                </View>
                <TouchableOpacity onPress={() => openModal()} style={styles.addButton}>
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total Participación</Text>
                <Text style={[
                    styles.totalValue,
                    { color: totalPorcentaje === 100 ? '#10b981' : '#f59e0b' }
                ]}>
                    {totalPorcentaje}%
                </Text>
                {totalPorcentaje !== 100 && (
                    <Text style={styles.totalWarning}>
                        {totalPorcentaje < 100 
                            ? `Falta ${100 - totalPorcentaje}% por asignar`
                            : `Excede en ${totalPorcentaje - 100}%`
                        }
                    </Text>
                )}
            </View>

            <FlatList
                data={participaciones}
                renderItem={renderParticipacion}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={60} color="#64748b" />
                        <Text style={styles.emptyText}>Sin participaciones configuradas</Text>
                        <TouchableOpacity style={styles.emptyButton} onPress={() => openModal()}>
                            <Ionicons name="add" size={20} color="#fff" />
                            <Text style={styles.emptyButtonText}>Agregar Socio</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingParticipacion ? 'Editar Participación' : 'Nueva Participación'}
                            </Text>
                            <TouchableOpacity onPress={closeModal}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Nombre del Socio *</Text>
                            <TextInput
                                style={styles.input}
                                value={form.socio_nombre}
                                onChangeText={(text) => setForm({...form, socio_nombre: text})}
                                placeholder="Nombre completo"
                                placeholderTextColor="#64748b"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Documento</Text>
                            <TextInput
                                style={styles.input}
                                value={form.socio_documento}
                                onChangeText={(text) => setForm({...form, socio_documento: text})}
                                placeholder="Cédula o NIT"
                                placeholderTextColor="#64748b"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Teléfono</Text>
                            <TextInput
                                style={styles.input}
                                value={form.socio_telefono}
                                onChangeText={(text) => setForm({...form, socio_telefono: text})}
                                placeholder="Número de contacto"
                                placeholderTextColor="#64748b"
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Porcentaje de Participación *</Text>
                            <TextInput
                                style={styles.input}
                                value={form.porcentaje}
                                onChangeText={(text) => setForm({...form, porcentaje: text})}
                                placeholder="Ej: 50"
                                placeholderTextColor="#64748b"
                                keyboardType="numeric"
                            />
                        </View>

                        <TouchableOpacity 
                            style={[styles.saveButton, saving && styles.buttonDisabled]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark" size={24} color="#fff" />
                                    <Text style={styles.saveButtonText}>Guardar</Text>
                                </>
                            )}
                        </TouchableOpacity>
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
        paddingTop: 50,
        backgroundColor: '#1e293b',
    },
    backButton: {
        marginRight: 15,
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 2,
    },
    addButton: {
        backgroundColor: '#8b5cf6',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    totalContainer: {
        backgroundColor: '#1e293b',
        margin: 15,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    totalLabel: {
        color: '#94a3b8',
        fontSize: 14,
    },
    totalValue: {
        fontSize: 36,
        fontWeight: 'bold',
        marginTop: 5,
    },
    totalWarning: {
        color: '#f59e0b',
        fontSize: 12,
        marginTop: 5,
    },
    list: {
        padding: 15,
        paddingTop: 0,
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
    cardInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    porcentajeBadge: {
        backgroundColor: '#8b5cf620',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    porcentajeText: {
        color: '#8b5cf6',
        fontSize: 18,
        fontWeight: 'bold',
    },
    cardDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    detailText: {
        color: '#94a3b8',
        fontSize: 13,
        marginLeft: 8,
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
        marginRight: 20,
    },
    actionBtnText: {
        marginLeft: 6,
        fontSize: 14,
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
    emptyButton: {
        marginTop: 20,
        backgroundColor: '#8b5cf6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    emptyButtonText: {
        color: '#fff',
        fontWeight: '600',
        marginLeft: 8,
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
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    formGroup: {
        marginBottom: 15,
    },
    label: {
        color: '#94a3b8',
        fontSize: 14,
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#0f172a',
        borderRadius: 12,
        padding: 15,
        color: '#fff',
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: '#8b5cf6',
        borderRadius: 12,
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 10,
    },
});
