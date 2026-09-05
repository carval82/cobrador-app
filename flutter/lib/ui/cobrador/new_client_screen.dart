import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';

import '../../core/formatters.dart';
import '../../state/cobrador_controller.dart';
import '../../theme/app_theme.dart';
import '../widgets.dart';

class NewClientScreen extends StatefulWidget {
  const NewClientScreen({super.key});

  @override
  State<NewClientScreen> createState() => _NewClientScreenState();
}

class _NewClientScreenState extends State<NewClientScreen> {
  final nombre = TextEditingController();
  final documento = TextEditingController();
  final direccion = TextEditingController();
  final barrio = TextEditingController();
  final celular = TextEditingController();
  String tipoAlta = 'nuevo';
  int? planId;
  Position? location;
  bool busy = false;

  @override
  void initState() {
    super.initState();
    _locate();
  }

  Future<void> _locate() async {
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.deniedForever || permission == LocationPermission.denied) return;
      final pos = await Geolocator.getCurrentPosition();
      if (mounted) setState(() => location = pos);
    } catch (_) {}
  }

  @override
  void dispose() {
    nombre.dispose();
    documento.dispose();
    direccion.dispose();
    barrio.dispose();
    celular.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (nombre.text.trim().isEmpty || documento.text.trim().isEmpty) {
      await showAppMessage(context, 'Nombre y documento son obligatorios.', error: true);
      return;
    }
    setState(() => busy = true);
    try {
      final cobrador = context.read<CobradorController>();
      final message = await cobrador.registerClient({
        'nombre': nombre.text.trim(),
        'documento': documento.text.trim(),
        'direccion': direccion.text.trim(),
        'barrio': barrio.text.trim(),
        'celular': celular.text.trim(),
        'tipo_alta': tipoAlta,
        'plan_id': planId,
        'proyecto_id': cobrador.proyecto?.id,
        'latitud': location?.latitude,
        'longitud': location?.longitude,
        'offline_id': offlineId('cli'),
      });
      if (!mounted) return;
      await showAppMessage(context, message);
      if (mounted) Navigator.pop(context);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final planes = context.watch<CobradorController>().planes;
    final hint = tipoAlta == 'nuevo'
        ? 'Mes libre. Primera factura: ${firstInvoiceHint(DateTime.now())}.'
        : 'Cliente antiguo: se genera ya la factura del mes en curso.';

    return Scaffold(
      appBar: AppBar(title: const Text('Nuevo cliente')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
        children: [
          SoftCard(
            child: Column(
              children: [
                _TipoCard(
                  title: 'Cliente nuevo',
                  subtitle: 'Queda un mes libre. Si entra el 1-15 paga el mes siguiente; si entra después del 15, se corre un mes más.',
                  selected: tipoAlta == 'nuevo',
                  color: AppColors.forest,
                  onTap: () => setState(() => tipoAlta = 'nuevo'),
                ),
                const SizedBox(height: 10),
                _TipoCard(
                  title: 'Cliente antiguo',
                  subtitle: 'Ya venía del servicio. Al asignar plan se crea la factura de este mes.',
                  selected: tipoAlta == 'antiguo',
                  color: AppColors.sky,
                  onTap: () => setState(() => tipoAlta = 'antiguo'),
                ),
                const SizedBox(height: 10),
                Text(hint, style: const TextStyle(color: AppColors.muted)),
              ],
            ),
          ),
          const SizedBox(height: 14),
          SoftCard(
            child: Column(
              children: [
                TextField(controller: nombre, decoration: const InputDecoration(labelText: 'Nombre completo')),
                const SizedBox(height: 12),
                TextField(controller: documento, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Documento')),
                const SizedBox(height: 12),
                TextField(controller: direccion, decoration: const InputDecoration(labelText: 'Dirección')),
                const SizedBox(height: 12),
                TextField(controller: barrio, decoration: const InputDecoration(labelText: 'Barrio / vereda')),
                const SizedBox(height: 12),
                TextField(controller: celular, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Celular')),
                const SizedBox(height: 12),
                DropdownButtonFormField<int?>(
                  value: planId,
                  decoration: const InputDecoration(labelText: 'Plan (opcional)'),
                  items: [
                    const DropdownMenuItem(value: null, child: Text('Asignar después')),
                    ...planes.map((p) => DropdownMenuItem(value: p.id, child: Text('${p.nombre} · ${money(p.precio)}'))),
                  ],
                  onChanged: (v) => setState(() => planId = v),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          FilledButton(
            onPressed: busy ? null : _submit,
            child: Text(busy ? 'Guardando…' : 'Registrar cliente'),
          ),
        ],
      ),
    );
  }
}

class _TipoCard extends StatelessWidget {
  const _TipoCard({
    required this.title,
    required this.subtitle,
    required this.selected,
    required this.color,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final bool selected;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected ? color.withOpacity(0.08) : AppColors.cream,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: selected ? color : AppColors.line, width: selected ? 1.6 : 1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: TextStyle(fontWeight: FontWeight.w800, color: selected ? color : AppColors.ink)),
            const SizedBox(height: 4),
            Text(subtitle, style: const TextStyle(color: AppColors.muted, fontSize: 12, height: 1.35)),
          ],
        ),
      ),
    );
  }
}
