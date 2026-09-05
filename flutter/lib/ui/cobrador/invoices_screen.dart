import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/formatters.dart';
import '../../data/models.dart';
import '../../state/cobrador_controller.dart';
import '../../theme/app_theme.dart';
import '../widgets.dart';
import 'payment_screen.dart';

class InvoicesScreen extends StatelessWidget {
  const InvoicesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = context.watch<CobradorController>();
    final grouped = <int, _Group>{};
    for (final f in c.facturas) {
      grouped.putIfAbsent(
        f.clienteId,
        () => _Group(clienteId: f.clienteId, nombre: f.clienteNombre ?? 'Cliente'),
      );
      grouped[f.clienteId]!.facturas.add(f);
      grouped[f.clienteId]!.saldo += f.saldo;
    }
    final items = grouped.values.toList()
      ..sort((a, b) => a.nombre.compareTo(b.nombre));
    final total = items.fold<double>(0, (s, e) => s + e.saldo);

    return Scaffold(
      appBar: AppBar(title: const Text('Por cobrar')),
      body: RefreshIndicator(
        onRefresh: c.refreshLocal,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          children: [
            SoftCard(
              child: Row(
                children: [
                  MoneyChip(label: 'Clientes', value: '${items.length}', color: AppColors.sky),
                  const SizedBox(width: 10),
                  MoneyChip(label: 'Total a cobrar', value: money(total), color: AppColors.forest),
                ],
              ),
            ),
            const SizedBox(height: 14),
            if (items.isEmpty)
              const EmptyState(icon: Icons.task_alt_rounded, title: 'Nada pendiente', subtitle: 'Esta ruta está al día.')
            else
              ...items.map((g) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: SoftCard(
                      onTap: () => _open(context, g),
                      child: Row(
                        children: [
                          CircleAvatar(
                            backgroundColor: g.facturas.length > 1 ? AppColors.amberSoft : AppColors.skySoft,
                            child: Text('${g.facturas.length}', style: TextStyle(color: g.facturas.length > 1 ? AppColors.amber : AppColors.sky, fontWeight: FontWeight.w800)),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(g.nombre, style: const TextStyle(fontWeight: FontWeight.w800)),
                                Text(
                                  g.facturas.map((f) => monthShort[f.mes.clamp(1, 12)]).join(', '),
                                  style: const TextStyle(color: AppColors.muted, fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                          Text(money(g.saldo), style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.forest)),
                        ],
                      ),
                    ),
                  )),
          ],
        ),
      ),
    );
  }

  Future<void> _open(BuildContext context, _Group group) async {
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      backgroundColor: AppColors.paper,
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(group.nombre, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
              Text('Pendiente ${money(group.saldo)}', style: const TextStyle(color: AppColors.muted)),
              const SizedBox(height: 12),
              ...group.facturas.map((f) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text('Factura ${f.numero ?? '#${f.id}'}'),
                    subtitle: Text('${monthLabel(f.mes, f.anio)} · vence ${f.fechaVencimiento ?? '—'}'),
                    trailing: Text(money(f.saldo), style: const TextStyle(fontWeight: FontWeight.w800)),
                    onTap: () {
                      Navigator.pop(ctx);
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => PaymentScreen(factura: f)),
                      );
                    },
                  )),
            ],
          ),
        );
      },
    );
  }
}

class _Group {
  _Group({required this.clienteId, required this.nombre});
  final int clienteId;
  final String nombre;
  final List<Factura> facturas = [];
  double saldo = 0;
}
