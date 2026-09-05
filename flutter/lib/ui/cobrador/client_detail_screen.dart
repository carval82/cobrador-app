import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/formatters.dart';
import '../../data/models.dart';
import '../../state/cobrador_controller.dart';
import '../../theme/app_theme.dart';
import '../widgets.dart';
import 'payment_screen.dart';

class ClientDetailScreen extends StatelessWidget {
  const ClientDetailScreen({super.key, required this.cliente});
  final Cliente cliente;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(cliente.nombre)),
      body: FutureBuilder<List<Factura>>(
        future: context.read<CobradorController>().facturasDe(cliente.id),
        builder: (context, snap) {
          final facturas = snap.data ?? [];
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
            children: [
              SoftCard(
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 34,
                      backgroundColor: AppColors.forest.withOpacity(0.12),
                      child: Text(initials(cliente.nombre), style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.forest)),
                    ),
                    const SizedBox(height: 10),
                    Text(cliente.nombre, textAlign: TextAlign.center, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 6),
                    StatusPill(
                      label: cliente.estado,
                      color: cliente.estado == 'activo' ? AppColors.forest : AppColors.rose,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              SoftCard(
                child: Column(
                  children: [
                    _row('Documento', cliente.documento),
                    _row('Celular', cliente.celular ?? cliente.telefono),
                    _row('Dirección', cliente.direccion),
                    _row('Barrio', cliente.barrio),
                    if (cliente.servicio != null)
                      _row('Plan', '${cliente.servicio!['plan_nombre'] ?? ''} · ${money(cliente.servicio!['precio'])}'),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              Text('Pendiente (${facturas.length})', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
              const SizedBox(height: 10),
              if (facturas.isEmpty)
                const SoftCard(child: Text('Este cliente no tiene facturas pendientes.'))
              else
                ...facturas.map((f) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: SoftCard(
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => PaymentScreen(factura: f, cliente: cliente)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 52,
                              height: 52,
                              decoration: BoxDecoration(color: AppColors.skySoft, borderRadius: BorderRadius.circular(14)),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(monthShort[f.mes.clamp(1, 12)], style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.sky)),
                                  Text('${f.anio}', style: const TextStyle(fontSize: 11, color: AppColors.sky)),
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Factura ${f.numero ?? '#${f.id}'}', style: const TextStyle(fontWeight: FontWeight.w700)),
                                  Text('Vence ${f.fechaVencimiento ?? '—'}', style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                                ],
                              ),
                            ),
                            Text(money(f.saldo), style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.forest)),
                          ],
                        ),
                      ),
                    )),
            ],
          );
        },
      ),
    );
  }

  Widget _row(String label, String? value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          SizedBox(width: 96, child: Text(label, style: const TextStyle(color: AppColors.muted))),
          Expanded(child: Text(value?.isNotEmpty == true ? value! : '—', style: const TextStyle(fontWeight: FontWeight.w600))),
        ],
      ),
    );
  }
}
