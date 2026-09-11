import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { endpoints } from '../config/api';

const FAQS = {
    cobrador: [
        { q: '¿Cómo sincronizo?', a: 'En la pantalla del proyecto usa Sincronizar Datos. Así bajas clientes y facturas pendientes, y subes los pagos que hayas registrado.' },
        { q: '¿Cómo registro un pago?', a: 'Entra a Facturas o Clientes, elige la factura y registra el pago. Si no hay señal, queda pendiente y se envía al sincronizar.' },
        { q: '¿Qué clientes me tocan?', a: 'Cada cobrador cobra a los clientes que le asignaron. En la web el admin ve la proyección del mes según esa cartera.' },
        { q: 'Hablar con soporte', a: 'Si tienes un problema técnico o de cobro, el admin lo atiende en Tickets. Describe el caso y el proyecto.' },
    ],
    cliente: [
        { q: '¿Cómo veo mi factura?', a: 'En Inicio aparecen tu plan, el saldo y las facturas. Si hay saldo, es lo que falta por pagar este período.' },
        { q: 'Reportar un daño', a: 'Elige tipo Daño, cuéntanos qué pasa (sin internet, lento, equipo dañado) y lo atendemos.' },
        { q: 'Pedir un cobro', a: 'Si quieres que pase el cobrador, crea un reporte tipo Cobro con tu dirección y horario.' },
        { q: 'Soporte general', a: 'Para cambio de plan, configuración o dudas, crea un reporte tipo Soporte.' },
    ],
    socio: [
        { q: '¿Qué es mi participación?', a: 'Es tu porcentaje sobre la utilidad del proyecto: ingresos cobrados menos gastos del mes.' },
        { q: '¿Dónde veo los gastos?', a: 'Entra al proyecto. Ahí ves ingresos, cada gasto del mes y cuánto te corresponde ganar.' },
        { q: '¿Cuándo se liquida?', a: 'El informe se arma con lo cobrado y gastado del mes, aunque no se haya cumplido toda la meta de recaudo.' },
    ],
    admin: [
        { q: 'Tickets de clientes', a: 'Los reportes de clientes llegan a Tickets. Respóndelos para que el usuario vea la ayuda en su app.' },
        { q: 'Informe de cobradores', a: 'En Liquidaciones > Proyección e informe ves cuánto debe cobrar cada cobrador según su cartera y puedes liquidar el mes.' },
    ],
};

const TIPOS = [
    { id: 'daño', label: 'Daño', color: '#ef4444' },
    { id: 'cobro', label: 'Cobro', color: '#3b82f6' },
    { id: 'soporte', label: 'Soporte', color: '#8b5cf6' },
    { id: 'otro', label: 'Otro', color: '#64748b' },
];

export default function AyudaBotScreen({ navigation }) {
    const { userType } = useAuth();
    const role = userType || 'cobrador';
    const faqs = FAQS[role] || FAQS.cobrador;
    const canTicket = role === 'cliente';

    const [messages, setMessages] = useState([
        { from: 'bot', text: 'Hola, soy el asistente de INTERVEREDANET. Elige una pregunta o escribe tu caso.' },
    ]);
    const [tickets, setTickets] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [tipo, setTipo] = useState('soporte');
    const [asunto, setAsunto] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [sending, setSending] = useState(false);
    const [loadingTickets, setLoadingTickets] = useState(canTicket);

    useEffect(() => {
        if (canTicket) {
            loadTickets();
        }
    }, [canTicket]);

    const loadTickets = async () => {
        try {
            const response = await api.request(endpoints.clienteTickets);
            const list = response.data || response.tickets || [];
            setTickets(list);
        } catch (error) {
            console.error('Error loading tickets:', error);
        } finally {
            setLoadingTickets(false);
        }
    };

    const addBot = (text) => setMessages((prev) => [...prev, { from: 'bot', text }]);
    const addUser = (text) => setMessages((prev) => [...prev, { from: 'user', text }]);

    const handleFaq = (item) => {
        addUser(item.q);
        addBot(item.a);
        if (canTicket && (item.q.startsWith('Reportar') || item.q.startsWith('Pedir') || item.q.startsWith('Soporte'))) {
            setShowForm(true);
            if (item.q.includes('daño') || item.q.includes('Daño')) setTipo('daño');
            else if (item.q.includes('cobro') || item.q.includes('Cobro')) setTipo('cobro');
            else setTipo('soporte');
        }
    };

    const handleSendTicket = async () => {
        if (!asunto.trim() || !descripcion.trim()) {
            Alert.alert('Error', 'Asunto y descripción son requeridos');
            return;
        }
        setSending(true);
        try {
            const response = await api.request(endpoints.clienteTickets, {
                method: 'POST',
                body: JSON.stringify({
                    tipo,
                    asunto: asunto.trim(),
                    descripcion: descripcion.trim(),
                }),
            });
            if (response.success) {
                addUser(asunto.trim());
                addBot(response.message || 'Reporte enviado. El equipo te responderá aquí.');
                setAsunto('');
                setDescripcion('');
                setShowForm(false);
                loadTickets();
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'No se pudo enviar el reporte');
        } finally {
            setSending(false);
        }
    };

    const estadoColor = (estado) => {
        switch (estado) {
            case 'abierto': return '#f59e0b';
            case 'en_proceso': return '#3b82f6';
            case 'resuelto': return '#10b981';
            default: return '#64748b';
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerBot}>
                    <View style={styles.botAvatar}>
                        <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Ayuda</Text>
                        <Text style={styles.headerSubtitle}>Asistente INTERVEREDANET</Text>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.chat} contentContainerStyle={styles.chatContent}>
                {messages.map((msg, index) => (
                    <View
                        key={index}
                        style={[styles.bubble, msg.from === 'bot' ? styles.bubbleBot : styles.bubbleUser]}
                    >
                        <Text style={msg.from === 'bot' ? styles.bubbleBotText : styles.bubbleUserText}>{msg.text}</Text>
                    </View>
                ))}

                <View style={styles.faqWrap}>
                    {faqs.map((item) => (
                        <TouchableOpacity key={item.q} style={styles.faqChip} onPress={() => handleFaq(item)}>
                            <Text style={styles.faqChipText}>{item.q}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {canTicket && (
                    <>
                        <TouchableOpacity style={styles.reportBtn} onPress={() => setShowForm(!showForm)}>
                            <Ionicons name="create-outline" size={18} color="#fff" />
                            <Text style={styles.reportBtnText}>{showForm ? 'Cerrar formulario' : 'Enviar un reporte'}</Text>
                        </TouchableOpacity>

                        {showForm && (
                            <View style={styles.form}>
                                <Text style={styles.label}>Tipo</Text>
                                <View style={styles.tipos}>
                                    {TIPOS.map((t) => (
                                        <TouchableOpacity
                                            key={t.id}
                                            style={[styles.tipoChip, tipo === t.id && { borderColor: t.color, backgroundColor: t.color + '22' }]}
                                            onPress={() => setTipo(t.id)}
                                        >
                                            <Text style={[styles.tipoText, tipo === t.id && { color: t.color }]}>{t.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <Text style={styles.label}>Asunto</Text>
                                <TextInput
                                    style={styles.input}
                                    value={asunto}
                                    onChangeText={setAsunto}
                                    placeholder="Ej: Sin servicio de internet"
                                    placeholderTextColor="#64748b"
                                />
                                <Text style={styles.label}>Descripción</Text>
                                <TextInput
                                    style={[styles.input, styles.textarea]}
                                    value={descripcion}
                                    onChangeText={setDescripcion}
                                    placeholder="Cuéntanos qué necesitas"
                                    placeholderTextColor="#64748b"
                                    multiline
                                />
                                <TouchableOpacity style={styles.sendBtn} onPress={handleSendTicket} disabled={sending}>
                                    {sending ? <ActivityIndicator color="#fff" /> : (
                                        <>
                                            <Ionicons name="send" size={18} color="#fff" />
                                            <Text style={styles.sendBtnText}>Enviar reporte</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}

                        <Text style={styles.sectionTitle}>Mis reportes</Text>
                        {loadingTickets ? (
                            <ActivityIndicator color="#8b5cf6" />
                        ) : tickets.length === 0 ? (
                            <Text style={styles.empty}>Aún no has enviado reportes.</Text>
                        ) : (
                            tickets.map((ticket) => (
                                <View key={ticket.id} style={styles.ticket}>
                                    <View style={styles.ticketHead}>
                                        <Text style={styles.ticketAsunto}>{ticket.asunto}</Text>
                                        <Text style={[styles.ticketEstado, { color: estadoColor(ticket.estado) }]}>
                                            {(ticket.estado || '').replace('_', ' ')}
                                        </Text>
                                    </View>
                                    <Text style={styles.ticketMeta}>{ticket.tipo} · {ticket.created_at}</Text>
                                    <Text style={styles.ticketDesc}>{ticket.descripcion}</Text>
                                    {ticket.respuesta ? (
                                        <View style={styles.respuesta}>
                                            <Text style={styles.respuestaLabel}>Respuesta</Text>
                                            <Text style={styles.respuestaText}>{ticket.respuesta}</Text>
                                        </View>
                                    ) : null}
                                </View>
                            ))
                        )}
                    </>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50,
        backgroundColor: '#1e293b',
    },
    backButton: { marginRight: 12 },
    headerBot: { flexDirection: 'row', alignItems: 'center' },
    botAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#8b5cf6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    headerSubtitle: { color: '#94a3b8', fontSize: 12 },
    chat: { flex: 1 },
    chatContent: { padding: 16, paddingBottom: 40 },
    bubble: { maxWidth: '88%', borderRadius: 14, padding: 12, marginBottom: 10 },
    bubbleBot: { backgroundColor: '#1e293b', alignSelf: 'flex-start' },
    bubbleUser: { backgroundColor: '#8b5cf6', alignSelf: 'flex-end' },
    bubbleBotText: { color: '#e2e8f0', fontSize: 14, lineHeight: 20 },
    bubbleUserText: { color: '#fff', fontSize: 14, lineHeight: 20 },
    faqWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
    faqChip: {
        backgroundColor: '#1e293b',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#334155',
    },
    faqChipText: { color: '#cbd5e1', fontSize: 13 },
    reportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#8b5cf6',
        borderRadius: 12,
        padding: 12,
        justifyContent: 'center',
        marginTop: 12,
        marginBottom: 8,
        gap: 8,
    },
    reportBtnText: { color: '#fff', fontWeight: '600' },
    form: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 16 },
    label: { color: '#94a3b8', marginBottom: 6, marginTop: 8, fontSize: 13 },
    tipos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tipoChip: {
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    tipoText: { color: '#94a3b8', fontSize: 13 },
    input: {
        backgroundColor: '#0f172a',
        borderRadius: 10,
        padding: 12,
        color: '#fff',
    },
    textarea: { minHeight: 90, textAlignVertical: 'top' },
    sendBtn: {
        marginTop: 12,
        backgroundColor: '#10b981',
        borderRadius: 10,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    sendBtnText: { color: '#fff', fontWeight: '600' },
    sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 8, marginBottom: 10 },
    empty: { color: '#64748b' },
    ticket: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
    },
    ticketHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    ticketAsunto: { color: '#fff', fontWeight: '600', flex: 1 },
    ticketEstado: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
    ticketMeta: { color: '#64748b', fontSize: 12, marginTop: 4 },
    ticketDesc: { color: '#94a3b8', marginTop: 8 },
    respuesta: {
        marginTop: 10,
        backgroundColor: '#0f172a',
        borderRadius: 8,
        padding: 10,
    },
    respuestaLabel: { color: '#10b981', fontSize: 12, fontWeight: '700', marginBottom: 4 },
    respuestaText: { color: '#e2e8f0' },
});
