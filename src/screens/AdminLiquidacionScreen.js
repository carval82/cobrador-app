import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function AdminLiquidacionScreen({ navigation, route }) {
    const { proyecto } = route.params;
    const [liquidacion, setLiquidacion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mes, setMes] = useState(new Date().getMonth() + 1);
    const [anio, setAnio] = useState(new Date().getFullYear());

    const loadLiquidacion = async () => {
        setLoading(true);
        try {
            const response = await api.request(
                `/admin/proyectos/${proyecto.id}/liquidacion?mes=${mes}&anio=${anio}`
            );
            if (response.success) {
                setLiquidacion(response);
            }
        } catch (error) {
            console.error('Error loading liquidacion:', error);
            Alert.alert('Error', 'No se pudo cargar la liquidación');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLiquidacion();
    }, [mes, anio]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
        }).format(value || 0);
    };

    const cambiarMes = (direccion) => {
        let nuevoMes = mes + direccion;
        let nuevoAnio = anio;
        
        if (nuevoMes > 12) {
            nuevoMes = 1;
            nuevoAnio++;
        } else if (nuevoMes < 1) {
            nuevoMes = 12;
            nuevoAnio--;
        }
        
        setMes(nuevoMes);
        setAnio(nuevoAnio);
    };

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
                    <Text style={styles.headerTitle}>Liquidación</Text>
                    <Text style={styles.headerSubtitle}>{proyecto.nombre}</Text>
                </View>
                <TouchableOpacity 
                    onPress={() => navigation.navigate('AdminParticipaciones', { proyecto })}
                    style={styles.configButton}
                >
                    <Ionicons name="settings-outline" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.periodoSelector}>
                <TouchableOpacity onPress={() => cambiarMes(-1)} style={styles.periodoBtn}>
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.periodoText}>
                    {liquidacion?.periodo?.nombre_mes} {liquidacion?.periodo?.anio}
                </Text>
                <TouchableOpacity onPress={() => cambiarMes(1)} style={styles.periodoBtn}>
                    <Ionicons name="chevron-forward" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* Resumen General */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Resumen General</Text>
                    <View style={styles.resumenCard}>
                        <View style={styles.resumenRow}>
                            <Text style={styles.resumenLabel}>Ingresos</Text>
                            <Text style={[styles.resumenValue, { color: '#10b981' }]}>
                                {formatCurrency(liquidacion?.resumen?.total_ingresos)}
                            </Text>
                        </View>
                        <View style={styles.resumenRow}>
                            <Text style={styles.resumenLabel}>(-) Gastos</Text>
                            <Text style={[styles.resumenValue, { color: '#ef4444' }]}>
                                {formatCurrency(liquidacion?.resumen?.total_gastos)}
                            </Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.resumenRow}>
                            <Text style={styles.resumenLabel}>Utilidad Bruta</Text>
                            <Text style={styles.resumenValue}>
                                {formatCurrency(liquidacion?.resumen?.utilidad_bruta)}
                            </Text>
                        </View>
                        <View style={styles.resumenRow}>
                            <Text style={styles.resumenLabel}>(-) Comisiones</Text>
                            <Text style={[styles.resumenValue, { color: '#f59e0b' }]}>
                                {formatCurrency(liquidacion?.resumen?.total_comisiones)}
                            </Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.resumenRow}>
                            <Text style={[styles.resumenLabel, { fontWeight: 'bold' }]}>UTILIDAD NETA</Text>
                            <Text style={[styles.resumenValue, { color: '#8b5cf6', fontSize: 20 }]}>
                                {formatCurrency(liquidacion?.resumen?.utilidad_neta)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Detalle de Gastos */}
                {liquidacion?.detalle_gastos?.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Detalle de Gastos</Text>
                        {liquidacion.detalle_gastos.map((cat, index) => (
                            <View key={index} style={styles.gastoCategoria}>
                                <View style={styles.gastoCategoriaHeader}>
                                    <Text style={styles.gastoCategoriaName}>{cat.nombre}</Text>
                                    <Text style={styles.gastoCategoriaTotal}>{formatCurrency(cat.total)}</Text>
                                </View>
                                {cat.items.map((item, idx) => (
                                    <View key={idx} style={styles.gastoItem}>
                                        <Text style={styles.gastoItemDesc}>{item.descripcion}</Text>
                                        <Text style={styles.gastoItemMonto}>{formatCurrency(item.monto)}</Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>
                )}

                {/* Comisiones de Cobradores */}
                {liquidacion?.detalle_comisiones?.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Comisiones Cobradores</Text>
                        {liquidacion.detalle_comisiones.map((com, index) => (
                            <View key={index} style={styles.comisionCard}>
                                <View style={styles.comisionHeader}>
                                    <Text style={styles.comisionNombre}>{com.cobrador}</Text>
                                    <Text style={styles.comisionPorcentaje}>{com.porcentaje_comision}%</Text>
                                </View>
                                <View style={styles.comisionDetails}>
                                    <Text style={styles.comisionRecaudado}>
                                        Recaudado: {formatCurrency(com.recaudado)}
                                    </Text>
                                    <Text style={styles.comisionMonto}>
                                        Comisión: {formatCurrency(com.comision)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Distribución por Socio */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Distribución por Socio</Text>
                    {liquidacion?.distribucion_socios?.length > 0 ? (
                        liquidacion.distribucion_socios.map((socio, index) => (
                            <View key={index} style={styles.socioCard}>
                                <View style={styles.socioHeader}>
                                    <View style={styles.socioInfo}>
                                        <Text style={styles.socioNombre}>{socio.socio}</Text>
                                        {socio.documento && (
                                            <Text style={styles.socioDoc}>{socio.documento}</Text>
                                        )}
                                    </View>
                                    <View style={styles.socioPorcentaje}>
                                        <Text style={styles.socioPorcentajeText}>{socio.porcentaje}%</Text>
                                    </View>
                                </View>
                                <View style={styles.socioDesglose}>
                                    <View style={styles.socioDesgloseRow}>
                                        <Text style={styles.socioDesgloseLabel}>Gastos proporcional:</Text>
                                        <Text style={[styles.socioDesgloseValue, { color: '#ef4444' }]}>
                                            {formatCurrency(socio.gastos_proporcional)}
                                        </Text>
                                    </View>
                                    <View style={styles.socioDesgloseRow}>
                                        <Text style={styles.socioDesgloseLabel}>Comisiones proporcional:</Text>
                                        <Text style={[styles.socioDesgloseValue, { color: '#f59e0b' }]}>
                                            {formatCurrency(socio.comisiones_proporcional)}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.socioTotal}>
                                    <Text style={styles.socioTotalLabel}>A PAGAR:</Text>
                                    <Text style={styles.socioTotalValue}>{formatCurrency(socio.utilidad)}</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.noSocios}>
                            <Ionicons name="people-outline" size={40} color="#64748b" />
                            <Text style={styles.noSociosText}>No hay socios configurados</Text>
                            <TouchableOpacity 
                                style={styles.noSociosBtn}
                                onPress={() => navigation.navigate('AdminParticipaciones', { proyecto })}
                            >
                                <Text style={styles.noSociosBtnText}>Configurar Participaciones</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <View style={{ height: 30 }} />
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
    configButton: {
        backgroundColor: '#334155',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    periodoSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1e293b',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    periodoBtn: {
        padding: 8,
    },
    periodoText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginHorizontal: 20,
        textTransform: 'capitalize',
    },
    content: {
        flex: 1,
        padding: 15,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    resumenCard: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 15,
    },
    resumenRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    resumenLabel: {
        color: '#94a3b8',
        fontSize: 14,
    },
    resumenValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#334155',
        marginVertical: 8,
    },
    gastoCategoria: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
    },
    gastoCategoriaHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    gastoCategoriaName: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    gastoCategoriaTotal: {
        color: '#ef4444',
        fontSize: 15,
        fontWeight: '600',
    },
    gastoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        paddingLeft: 10,
        borderLeftWidth: 2,
        borderLeftColor: '#334155',
        marginLeft: 5,
    },
    gastoItemDesc: {
        color: '#94a3b8',
        fontSize: 13,
        flex: 1,
    },
    gastoItemMonto: {
        color: '#94a3b8',
        fontSize: 13,
    },
    comisionCard: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
    },
    comisionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    comisionNombre: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    comisionPorcentaje: {
        color: '#f59e0b',
        fontSize: 14,
        fontWeight: '600',
    },
    comisionDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    comisionRecaudado: {
        color: '#94a3b8',
        fontSize: 13,
    },
    comisionMonto: {
        color: '#f59e0b',
        fontSize: 13,
        fontWeight: '500',
    },
    socioCard: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#8b5cf6',
    },
    socioHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    socioInfo: {
        flex: 1,
    },
    socioNombre: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    socioDoc: {
        color: '#64748b',
        fontSize: 12,
        marginTop: 2,
    },
    socioPorcentaje: {
        backgroundColor: '#8b5cf620',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    socioPorcentajeText: {
        color: '#8b5cf6',
        fontSize: 16,
        fontWeight: 'bold',
    },
    socioDesglose: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#334155',
    },
    socioDesgloseRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    socioDesgloseLabel: {
        color: '#64748b',
        fontSize: 13,
    },
    socioDesgloseValue: {
        fontSize: 13,
        fontWeight: '500',
    },
    socioTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#334155',
    },
    socioTotalLabel: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    socioTotalValue: {
        color: '#10b981',
        fontSize: 20,
        fontWeight: 'bold',
    },
    noSocios: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 30,
        alignItems: 'center',
    },
    noSociosText: {
        color: '#64748b',
        marginTop: 10,
        marginBottom: 15,
    },
    noSociosBtn: {
        backgroundColor: '#8b5cf6',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    noSociosBtnText: {
        color: '#fff',
        fontWeight: '600',
    },
});
