import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/formatters.dart';
import '../../state/auth_controller.dart';
import '../../theme/app_theme.dart';
import '../widgets.dart';
import 'admin_list_screens.dart';

class AdminHomeScreen extends StatefulWidget {
  const AdminHomeScreen({super.key});

  @override
  State<AdminHomeScreen> createState() => _AdminHomeScreenState();
}

class _AdminHomeScreenState extends State<AdminHomeScreen> {
  Map<String, dynamic>? dash;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => loading = true);
    try {
      final res = await context.read<ApiClient>().get('/admin/dashboard');
      setState(() => dash = Map<String, dynamic>.from(res['dashboard'] as Map));
    } catch (e) {
      if (mounted) await showAppMessage(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthController>().user;
    final d = dash ?? {};
    final pagosHoy = Map<String, dynamic>.from(d['pagos_hoy'] as Map? ?? {});

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(user?.name ?? 'Admin', style: const TextStyle(fontSize: 14, color: AppColors.muted, fontWeight: FontWeight.w500)),
            const Text('Administración'),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () async {
              if (await confirm(context, 'Salir', '¿Cerrar sesión?')) {
                if (context.mounted) context.read<AuthController>().logout();
              }
            },
            icon: const Icon(Icons.logout_rounded, color: AppColors.rose),
          ),
        ],
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
                children: [
                  Row(
                    children: [
                      MoneyChip(label: 'Clientes', value: '${d['total_clientes'] ?? 0}', color: AppColors.sky),
                      const SizedBox(width: 10),
                      MoneyChip(label: 'Cobradores', value: '${d['total_cobradores'] ?? 0}', color: AppColors.forest),
                    ],
                  ),
                  const SizedBox(height: 10),
                  SoftCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Este mes', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                        const SizedBox(height: 10),
                        _kv('Facturado', money(d['facturado_mes']), AppColors.sky),
                        _kv('Recaudado', money(d['recaudado_mes']), AppColors.forest),
                        _kv('Pendiente', money(d['pendiente_mes']), AppColors.rose),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                  SoftCard(
                    child: Row(
                      children: [
                        MoneyChip(label: 'Pagos hoy', value: '${pagosHoy['cantidad'] ?? 0}', color: AppColors.violet),
                        const SizedBox(width: 10),
                        MoneyChip(label: 'Total hoy', value: money(pagosHoy['total']), color: AppColors.forest),
                      ],
                    ),
                  ),
                  if ((d['tickets_pendientes'] ?? 0) > 0) ...[
                    const SizedBox(height: 10),
                    SoftCard(
                      color: AppColors.roseSoft,
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AdminTicketsScreen())),
                      child: Row(
                        children: [
                          const Icon(Icons.support_agent, color: AppColors.rose),
                          const SizedBox(width: 10),
                          Expanded(child: Text('${d['tickets_pendientes']} tickets por atender')),
                          const Icon(Icons.chevron_right),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 20),
                  const Text('Gestión', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 10),
                  ...[
                    ('Clientes', Icons.people_outline, AppColors.sky, () => const AdminClientesScreen()),
                    ('Pagos', Icons.payments_outlined, AppColors.forest, () => const AdminPagosScreen()),
                    ('Facturas', Icons.receipt_long_outlined, AppColors.amber, () => const AdminFacturasScreen()),
                    ('Proyectos', Icons.apartment_outlined, AppColors.violet, () => const AdminProyectosScreen()),
                    ('Cobradores', Icons.badge_outlined, AppColors.forest, () => const AdminCobradoresScreen()),
                    ('Planes', Icons.wifi_outlined, AppColors.sky, () => const AdminPlanesScreen()),
                    ('Tickets', Icons.chat_bubble_outline, AppColors.rose, () => const AdminTicketsScreen()),
                    ('Nuevo cliente', Icons.person_add_alt, AppColors.violet, () => const AdminClienteFormScreen()),
                  ].map((item) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: SoftCard(
                          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => item.$4())),
                          child: Row(
                            children: [
                              CircleAvatar(backgroundColor: item.$3.withOpacity(0.12), child: Icon(item.$2, color: item.$3)),
                              const SizedBox(width: 12),
                              Expanded(child: Text(item.$1, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16))),
                              const Icon(Icons.chevron_right, color: AppColors.muted),
                            ],
                          ),
                        ),
                      )),
                ],
              ),
            ),
    );
  }

  Widget _kv(String k, String v, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(child: Text(k, style: const TextStyle(color: AppColors.muted))),
          Text(v, style: TextStyle(color: color, fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }
}
