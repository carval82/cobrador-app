import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';

import '../../core/formatters.dart';
import '../../data/models.dart';
import '../../state/cobrador_controller.dart';
import '../../theme/app_theme.dart';
import '../widgets.dart';

class PaymentScreen extends StatefulWidget {
  const PaymentScreen({super.key, required this.factura, this.cliente});
  final Factura factura;
  final Cliente? cliente;

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  late final monto = TextEditingController(text: widget.factura.saldo.toStringAsFixed(0));
  final notas = TextEditingController();
  String metodo = 'efectivo';
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
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        return;
      }
      final pos = await Geolocator.getCurrentPosition();
      if (mounted) setState(() => location = pos);
    } catch (_) {}
  }

  @override
  void dispose() {
    monto.dispose();
    notas.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final value = double.tryParse(monto.text.replaceAll(',', '.')) ?? 0;
    if (value <= 0) {
      await showAppMessage(context, 'Escribe un monto válido.', error: true);
      return;
    }
    setState(() => busy = true);
    try {
      final message = await context.read<CobradorController>().registerPayment({
        'factura_id': widget.factura.id,
        'monto': value,
        'metodo_pago': metodo,
        'fecha_pago': DateTime.now().toIso8601String().split('T').first,
        'observaciones': notas.text.trim(),
        'latitud': location?.latitude,
        'longitud': location?.longitude,
        'offline_id': offlineId('pay'),
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
    final factura = widget.factura;
    final nombre = widget.cliente?.nombre ?? factura.clienteNombre ?? 'Cliente';

    return Scaffold(
      appBar: AppBar(title: const Text('Registrar cobro')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
        children: [
          SoftCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(nombre, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                const SizedBox(height: 6),
                Text('Factura ${factura.numero ?? '#${factura.id}'} · ${monthLabel(factura.mes, factura.anio)}'),
                const SizedBox(height: 10),
                Text(money(factura.saldo), style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: AppColors.forest)),
                const Text('Saldo pendiente', style: TextStyle(color: AppColors.muted)),
              ],
            ),
          ),
          const SizedBox(height: 14),
          SoftCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: monto,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800),
                  decoration: const InputDecoration(labelText: 'Monto', prefixText: r'$ '),
                ),
                const SizedBox(height: 16),
                const Text('Método', style: TextStyle(fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final item in const [
                      ('efectivo', 'Efectivo'),
                      ('transferencia', 'Transferencia'),
                      ('nequi', 'Nequi'),
                      ('daviplata', 'Daviplata'),
                    ])
                      ChoiceChip(
                        label: Text(item.$2),
                        selected: metodo == item.$1,
                        selectedColor: AppColors.forest.withOpacity(0.16),
                        onSelected: (_) => setState(() => metodo = item.$1),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: notas,
                  maxLines: 3,
                  decoration: const InputDecoration(labelText: 'Observaciones'),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(location == null ? Icons.location_searching : Icons.location_on, color: location == null ? AppColors.muted : AppColors.forest, size: 18),
                    const SizedBox(width: 6),
                    Text(location == null ? 'Buscando ubicación…' : 'Ubicación capturada', style: TextStyle(color: location == null ? AppColors.muted : AppColors.forest)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          FilledButton(
            onPressed: busy ? null : _submit,
            child: Text(busy ? 'Guardando…' : 'Registrar pago'),
          ),
        ],
      ),
    );
  }
}
