import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/formatters.dart';
import '../../state/auth_controller.dart';
import '../../state/cobrador_controller.dart';
import '../../theme/app_theme.dart';
import '../widgets.dart';
import 'clients_screen.dart';
import 'invoices_screen.dart';
import 'new_client_screen.dart';

class CobradorHomeScreen extends StatefulWidget {
  const CobradorHomeScreen({super.key});

  @override
  State<CobradorHomeScreen> createState() => _CobradorHomeScreenState();
}

class _CobradorHomeScreenState extends State<CobradorHomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CobradorController>().sync();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final c = context.watch<CobradorController>();

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: c.sync,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
          children: [
            SafeArea(
              bottom: false,
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.arrow_back_rounded),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(auth.user?.name ?? 'Cobrador', style: const TextStyle(color: AppColors.muted, fontSize: 13)),
                        Text(c.proyecto?.nombre ?? 'Proyecto', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                      ],
                    ),
                  ),
                  StatusPill(
                    label: c.online ? 'En línea' : 'Sin red',
                    color: c.online ? AppColors.forest : AppColors.rose,
                    soft: c.online ? const Color(0xFFE4F6EE) : AppColors.roseSoft,
                  ),
                ],
              ),
            ),
            if (c.pendingSync > 0) ...[
              const SizedBox(height: 12),
              SoftCard(
                color: AppColors.amberSoft,
                onTap: c.sync,
                child: Row(
                  children: [
                    const Icon(Icons.cloud_upload_outlined, color: AppColors.amber),
                    const SizedBox(width: 10),
                    Expanded(child: Text('${c.pendingSync} operaciones por sincronizar')),
                  ],
                ),
              ),
            ],
            if (c.error != null) ...[
              const SizedBox(height: 12),
              SoftCard(
                color: AppColors.roseSoft,
                child: Text(c.error!, style: const TextStyle(color: AppColors.rose)),
              ),
            ],
            const SizedBox(height: 16),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.15,
              children: [
                _StatTile(title: 'Clientes', value: '${c.clientes.length}', color: AppColors.sky, icon: Icons.people_alt_outlined),
                _StatTile(title: 'Pendientes', value: '${c.facturas.length}', color: AppColors.amber, icon: Icons.receipt_long_outlined),
                _StatTile(title: 'Cobros hoy', value: '${c.resumen.cobrosCount}', color: AppColors.forest, icon: Icons.payments_outlined),
                _StatTile(title: 'Recaudado', value: money(c.resumen.totalCobrado), color: AppColors.violet, icon: Icons.account_balance_wallet_outlined),
              ],
            ),
            const SizedBox(height: 22),
            const Text('Hoy en ruta', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 12),
            _ActionTile(
              title: 'Clientes',
              subtitle: 'Buscar, ver saldo y cobrar',
              icon: Icons.groups_2_outlined,
              color: AppColors.sky,
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ClientsScreen())),
            ),
            const SizedBox(height: 10),
            _ActionTile(
              title: 'Facturas pendientes',
              subtitle: 'Agrupadas por cliente',
              icon: Icons.receipt_outlined,
              color: AppColors.amber,
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const InvoicesScreen())),
            ),
            const SizedBox(height: 10),
            _ActionTile(
              title: 'Nuevo cliente',
              subtitle: 'Alta nueva o antigua, con mes libre',
              icon: Icons.person_add_alt_1_outlined,
              color: AppColors.violet,
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NewClientScreen())),
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: c.syncing ? null : c.sync,
              icon: c.syncing
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.sync_rounded),
              label: Text(c.syncing ? 'Sincronizando…' : 'Sincronizar ruta'),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({required this.title, required this.value, required this.color, required this.icon});
  final String title;
  final String value;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return SoftCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color),
          const Spacer(),
          Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
          Text(title, style: const TextStyle(color: AppColors.muted, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  const _ActionTile({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SoftCard(
      onTap: onTap,
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(14)),
            child: Icon(icon, color: color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                Text(subtitle, style: const TextStyle(color: AppColors.muted)),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
        ],
      ),
    );
  }
}
