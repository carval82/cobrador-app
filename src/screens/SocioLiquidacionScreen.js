import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Alert,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { API_URL, endpoints } from '../config/api';

export default function SocioLiquidacionScreen({ route, navigation }) {
    const { proyecto } = route.params;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchLiquidacion();
    }, []);

    const fetchLiquidacion = async () => {
        try {
            const token = await SecureStore.getItemAsync('socio_token');
            const response = await fetch(`${API_URL}${endpoints.socioLiquidacion}/${proyecto.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            const result = await response.json();
            if (result.success) {
                setData(result.data);
            } else {
                Alert.alert('Error', result.message || 'Error al cargar liquidación');
            }
        } catch (error) {
            console.error('Error fetching liquidacion:', error);
            Alert.alert('Error', 'Error de conexión');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

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
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>{data?.proyecto?.nombre}</Text>
                    <Text style={styles.headerSubtitle}>
                        Participación: {data?.socio?.porcentaje}%
                    </Text>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            fetchLiquidacion();
                        }}
                        tintColor="#10b981"
                    />
                }
            >
                <Text style={styles.sectionTitle}>Resumen del Mes Actual</Text>

                <View style={styles.summaryContainer}>
                    <View style={styles.summaryCard}>
                        <View style={[styles.summaryIcon, { backgroundColor: '#10b98120' }]}>
                            <Ionicons name="trending-up" size={24} color="#10b981" />
                        </View>
                        <Text style={styles.summaryLabel}>Ingresos</Text>
                        <Text style={[styles.summaryValue, { color: '#10b981' }]}>
                            {formatCurrency(data?.resumen?.ingresos)}
                        </Text>
                    </View>

                    <View style={styles.summaryCard}>
                        <View style={[styles.summaryIcon, { backgroundColor: '#ef444420' }]}>
                            <Ionicons name="trending-down" size={24} color="#ef4444" />
                        </View>
                        <Text style={styles.summaryLabel}>Gastos</Text>
                        <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
                            {formatCurrency(data?.resumen?.gastos)}
                        </Text>
                    </View>
                </View>

                <View style={styles.utilidadContainer}>
                    <View style={styles.utilidadRow}>
                        <Text style={styles.utilidadLabel}>Utilidad Total</Text>
                        <Text style={[
                            styles.utilidadValue,
                            { color: data?.resumen?.utilidad >= 0 ? '#10b981' : '#ef4444' }
                        ]}>
                            {formatCurrency(data?.resumen?.utilidad)}
                        </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.utilidadRow}>
                        <Text style={styles.miParticipacionLabel}>
                            Mi Participación ({data?.socio?.porcentaje}%)
                        </Text>
                        <Text style={styles.miParticipacionValue}>
                            {formatCurrency(data?.resumen?.mi_participacion)}
                        </Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Historial de Liquidaciones</Text>

                {data?.historial?.map((item, index) => (
                    <View key={index} style={styles.historialCard}>
                        <View style={styles.historialHeader}>
                            <Text style={styles.historialMes}>{item.mes}</Text>
                            <Text style={[
                                styles.historialParticipacion,
                                { color: item.mi_participacion >= 0 ? '#10b981' : '#ef4444' }
                            ]}>
                                {formatCurrency(item.mi_participacion)}
                            </Text>
                        </View>
                        <View style={styles.historialDetails}>
                            <View style={styles.historialItem}>
                                <Text style={styles.historialItemLabel}>Ingresos</Text>
                                <Text style={styles.historialItemValue}>
                                    {formatCurrency(item.ingresos)}
                                </Text>
                            </View>
                            <View style={styles.historialItem}>
                                <Text style={styles.historialItemLabel}>Gastos</Text>
                                <Text style={styles.historialItemValue}>
                                    {formatCurrency(item.gastos)}
                                </Text>
                            </View>
                            <View style={styles.historialItem}>
                                <Text style={styles.historialItemLabel}>Utilidad</Text>
                                <Text style={[
                                    styles.historialItemValue,
                                    { color: item.utilidad >= 0 ? '#10b981' : '#ef4444' }
                                ]}>
                                    {formatCurrency(item.utilidad)}
                                </Text>
                            </View>
                        </View>
                    </View>
                ))}

                <View style={{ height: 40 }} />
            </ScrollView>
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
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#10b981',
        marginTop: 4,
    },
    content: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#94a3b8',
        padding: 20,
        paddingBottom: 12,
    },
    summaryContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    summaryIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    utilidadContainer: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        margin: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    utilidadRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    utilidadLabel: {
        fontSize: 16,
        color: '#94a3b8',
    },
    utilidadValue: {
        fontSize: 18,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#334155',
        marginVertical: 8,
    },
    miParticipacionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    miParticipacionValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#10b981',
    },
    historialCard: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    historialHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    historialMes: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    historialParticipacion: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    historialDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    historialItem: {
        alignItems: 'center',
    },
    historialItemLabel: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 4,
    },
    historialItemValue: {
        fontSize: 14,
        color: '#94a3b8',
    },
});
