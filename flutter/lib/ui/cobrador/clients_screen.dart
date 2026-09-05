import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/formatters.dart';
import '../../data/models.dart';
import '../../state/cobrador_controller.dart';
import '../../theme/app_theme.dart';
import '../widgets.dart';
import 'client_detail_screen.dart';
import 'new_client_screen.dart';

class ClientsScreen extends StatefulWidget {
  const ClientsScreen({super.key});

  @override
  State<ClientsScreen> createState() => _ClientsScreenState();
}

class _ClientsScreenState extends State<ClientsScreen> {
  String query = '';

  @override
  Widget build(BuildContext context) {
    final c = context.watch<CobradorController>();
    final filtered = c.clientes.where((cliente) {
      if (query.trim().isEmpty) return true;
      final q = query.toLowerCase();
      return cliente.nombre.toLowerCase().contains(q) ||
          (cliente.documento ?? '').contains(q) ||
          (cliente.direccion ?? '').toLowerCase().contains(q);
    }).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Clientes')),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.forest,
        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NewClientScreen())),
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: TextField(
              onChanged: (v) => setState(() => query = v),
              decoration: const InputDecoration(
                hintText: 'Buscar por nombre, cédula o dirección',
                prefixIcon: Icon(Icons.search),
              ),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: c.refreshLocal,
              child: filtered.isEmpty
                  ? ListView(
                      children: const [
                        SizedBox(height: 80),
                        EmptyState(
                          icon: Icons.people_outline,
                          title: 'No hay clientes',
                          subtitle: 'Sincroniza la ruta o crea un alta nueva.',
                        ),
                      ],
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 88),
                      itemCount: filtered.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, i) => _ClientTile(cliente: filtered[i]),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ClientTile extends StatelessWidget {
  const _ClientTile({required this.cliente});
  final Cliente cliente;

  @override
  Widget build(BuildContext context) {
    final facturas = context.select<CobradorController, int>(
      (c) => c.facturas.where((f) => f.clienteId == cliente.id).length,
    );
    return SoftCard(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => ClientDetailScreen(cliente: cliente)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: AppColors.forest.withOpacity(0.12),
            child: Text(initials(cliente.nombre), style: const TextStyle(color: AppColors.forest, fontWeight: FontWeight.w800)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(cliente.nombre, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                Text('CC ${cliente.documento ?? '—'}', style: const TextStyle(color: AppColors.muted)),
                Text(cliente.direccion ?? 'Sin dirección', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.muted, fontSize: 12)),
              ],
            ),
          ),
          if (facturas > 0)
            StatusPill(label: '$facturas', color: AppColors.amber, soft: AppColors.amberSoft)
          else
            const StatusPill(label: 'Al día', color: AppColors.forest),
        ],
      ),
    );
  }
}
