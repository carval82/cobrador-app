import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../state/auth_controller.dart';
import '../theme/app_theme.dart';
import 'widgets.dart';

const _faqs = {
  'cobrador': [
    _Faq('¿Cómo sincronizo?', 'En la pantalla del proyecto usa Sincronizar ruta. Así bajas clientes y facturas pendientes, y subes los pagos que hayas registrado.'),
    _Faq('¿Cómo registro un pago?', 'Entra a Facturas o Clientes, elige la factura y registra el pago. Si no hay señal, queda pendiente y se envía al sincronizar.'),
    _Faq('¿Qué clientes me tocan?', 'Cada cobrador cobra a los clientes que le asignaron. En la web el admin ve la proyección del mes según esa cartera.'),
    _Faq('Hablar con soporte', 'Si tienes un problema técnico o de cobro, el admin lo atiende en Tickets. Describe el caso y el proyecto.'),
  ],
  'cliente': [
    _Faq('¿Cómo veo mi factura?', 'En Inicio aparecen tu plan, el saldo y las facturas. Si hay saldo, es lo que falta por pagar este período.'),
    _Faq('Reportar un daño', 'Elige tipo Daño, cuéntanos qué pasa (sin internet, lento, equipo dañado) y lo atendemos.'),
    _Faq('Pedir un cobro', 'Si quieres que pase el cobrador, crea un reporte tipo Cobro con tu dirección y horario.'),
    _Faq('Soporte general', 'Para cambio de plan, configuración o dudas, crea un reporte tipo Soporte.'),
  ],
  'socio': [
    _Faq('¿Qué es mi participación?', 'Es tu porcentaje sobre la utilidad del proyecto: ingresos cobrados menos gastos del mes.'),
    _Faq('¿Dónde veo los gastos?', 'Entra al proyecto. Ahí ves ingresos, cada gasto del mes y cuánto te corresponde ganar.'),
    _Faq('¿Cuándo se liquida?', 'El informe se arma con lo cobrado y gastado del mes, aunque no se haya cumplido toda la meta de recaudo.'),
  ],
  'admin': [
    _Faq('Tickets de clientes', 'Los reportes de clientes llegan a Tickets. Respóndelos para que el usuario vea la ayuda en su app.'),
    _Faq('Informe de cobradores', 'En Liquidaciones > Proyección e informe ves cuánto debe cobrar cada cobrador según su cartera y puedes liquidar el mes.'),
    _Faq('Usuarios de la app', 'En Usuarios puedes crear o editar administradores. En Mi perfil cambias tu nombre, correo y contraseña.'),
  ],
};

const _tipos = [
  _Tipo('daño', 'Daño', AppColors.rose),
  _Tipo('cobro', 'Cobro', AppColors.sky),
  _Tipo('soporte', 'Soporte', AppColors.violet),
  _Tipo('otro', 'Otro', AppColors.muted),
];

class _Faq {
  const _Faq(this.q, this.a);
  final String q;
  final String a;
}

class _Tipo {
  const _Tipo(this.id, this.label, this.color);
  final String id;
  final String label;
  final Color color;
}

class _Msg {
  const _Msg(this.from, this.text);
  final String from;
  final String text;
}

class AyudaScreen extends StatefulWidget {
  const AyudaScreen({super.key});

  @override
  State<AyudaScreen> createState() => _AyudaScreenState();
}

class _AyudaScreenState extends State<AyudaScreen> {
  final asunto = TextEditingController();
  final descripcion = TextEditingController();
  final messages = <_Msg>[
    const _Msg('bot', 'Hola, soy el asistente de INTERVEREDANET. Elige una pregunta o escribe tu caso.'),
  ];
  List tickets = [];
  String tipo = 'soporte';
  bool showForm = false;
  bool sending = false;
  bool loadingTickets = false;

  bool get canTicket => context.read<AuthController>().user?.type == 'cliente';

  List<_Faq> get faqs {
    final role = context.read<AuthController>().user?.type ?? 'cobrador';
    return _faqs[role] ?? _faqs['cobrador']!;
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (canTicket) _loadTickets();
    });
  }

  @override
  void dispose() {
    asunto.dispose();
    descripcion.dispose();
    super.dispose();
  }

  Future<void> _loadTickets() async {
    setState(() => loadingTickets = true);
    try {
      final res = await context.read<ApiClient>().get('/cliente/tickets');
      setState(() => tickets = res['data'] as List? ?? res['tickets'] as List? ?? []);
    } catch (_) {
    } finally {
      if (mounted) setState(() => loadingTickets = false);
    }
  }

  void _handleFaq(_Faq item) {
    setState(() {
      messages.add(_Msg('user', item.q));
      messages.add(_Msg('bot', item.a));
      if (canTicket && (item.q.startsWith('Reportar') || item.q.startsWith('Pedir') || item.q.startsWith('Soporte'))) {
        showForm = true;
        if (item.q.toLowerCase().contains('daño')) {
          tipo = 'daño';
        } else if (item.q.toLowerCase().contains('cobro')) {
          tipo = 'cobro';
        } else {
          tipo = 'soporte';
        }
      }
    });
  }

  Future<void> _sendTicket() async {
    if (asunto.text.trim().isEmpty || descripcion.text.trim().isEmpty) {
      await showAppMessage(context, 'Asunto y descripción son requeridos.', error: true);
      return;
    }
    setState(() => sending = true);
    try {
      final res = await context.read<ApiClient>().post('/cliente/tickets', data: {
        'tipo': tipo,
        'asunto': asunto.text.trim(),
        'descripcion': descripcion.text.trim(),
      });
      setState(() {
        messages.add(_Msg('user', asunto.text.trim()));
        messages.add(_Msg('bot', res['message']?.toString() ?? 'Reporte enviado. El equipo te responderá aquí.'));
        asunto.clear();
        descripcion.clear();
        showForm = false;
      });
      await _loadTickets();
    } catch (e) {
      if (mounted) await showAppMessage(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => sending = false);
    }
  }

  Color _estadoColor(String estado) {
    switch (estado) {
      case 'abierto':
        return AppColors.amber;
      case 'en_proceso':
        return AppColors.sky;
      case 'resuelto':
        return AppColors.forest;
      default:
        return AppColors.muted;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Ayuda'),
            Text('Asistente INTERVEREDANET', style: TextStyle(fontSize: 12, color: AppColors.muted, fontWeight: FontWeight.w500)),
          ],
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: [
          ...messages.map((msg) {
            final bot = msg.from == 'bot';
            return Align(
              alignment: bot ? Alignment.centerLeft : Alignment.centerRight,
              child: Container(
                margin: const EdgeInsets.only(bottom: 10),
                constraints: const BoxConstraints(maxWidth: 340),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: bot ? AppColors.paper : AppColors.violet,
                  borderRadius: BorderRadius.circular(16),
                  border: bot ? Border.all(color: AppColors.line) : null,
                ),
                child: Text(
                  msg.text,
                  style: TextStyle(
                    color: bot ? AppColors.ink : Colors.white,
                    height: 1.4,
                  ),
                ),
              ),
            );
          }),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: faqs
                .map(
                  (item) => ActionChip(
                    label: Text(item.q),
                    onPressed: () => _handleFaq(item),
                  ),
                )
                .toList(),
          ),
          if (canTicket) ...[
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () => setState(() => showForm = !showForm),
              icon: const Icon(Icons.edit_outlined),
              label: Text(showForm ? 'Cerrar formulario' : 'Enviar un reporte'),
            ),
            if (showForm) ...[
              const SizedBox(height: 12),
              SoftCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Tipo', style: TextStyle(color: AppColors.muted, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: _tipos.map((t) {
                        final selected = tipo == t.id;
                        return ChoiceChip(
                          label: Text(t.label),
                          selected: selected,
                          selectedColor: t.color.withOpacity(0.16),
                          onSelected: (_) => setState(() => tipo = t.id),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: asunto,
                      decoration: const InputDecoration(labelText: 'Asunto', hintText: 'Ej: Sin servicio de internet'),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: descripcion,
                      minLines: 3,
                      maxLines: 5,
                      decoration: const InputDecoration(labelText: 'Descripción', hintText: 'Cuéntanos qué necesitas'),
                    ),
                    const SizedBox(height: 12),
                    FilledButton.icon(
                      onPressed: sending ? null : _sendTicket,
                      icon: sending
                          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.send_rounded),
                      label: Text(sending ? 'Enviando…' : 'Enviar reporte'),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 20),
            const Text('Mis reportes', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            if (loadingTickets)
              const Padding(padding: EdgeInsets.all(16), child: Center(child: CircularProgressIndicator()))
            else if (tickets.isEmpty)
              const Text('Aún no has enviado reportes.', style: TextStyle(color: AppColors.muted))
            else
              ...tickets.map((raw) {
                final t = Map<String, dynamic>.from(raw as Map);
                final estado = (t['estado'] ?? '').toString();
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: SoftCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(child: Text('${t['asunto'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.w800))),
                            Text(estado.replaceAll('_', ' '), style: TextStyle(color: _estadoColor(estado), fontWeight: FontWeight.w700)),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text('${t['tipo'] ?? ''} · ${t['created_at'] ?? ''}', style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                        if ((t['descripcion'] ?? '').toString().isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Text('${t['descripcion']}'),
                        ],
                        if ((t['respuesta'] ?? '').toString().isNotEmpty) ...[
                          const SizedBox(height: 10),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(color: AppColors.cream, borderRadius: BorderRadius.circular(12)),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Respuesta', style: TextStyle(color: AppColors.forest, fontWeight: FontWeight.w700, fontSize: 12)),
                                const SizedBox(height: 4),
                                Text('${t['respuesta']}'),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              }),
          ],
        ],
      ),
    );
  }
}
