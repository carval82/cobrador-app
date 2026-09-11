import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/formatters.dart';
import '../../state/auth_controller.dart';
import '../../theme/app_theme.dart';
import '../ayuda_screen.dart';
import '../widgets.dart';

class ClienteHomeScreen extends StatefulWidget {
  const ClienteHomeScreen({super.key});

  @override
  State<ClienteHomeScreen> createState() => _ClienteHomeScreenState();
}

class _ClienteHomeScreenState extends State<ClienteHomeScreen> {
  Map<String, dynamic>? cuenta;
  List facturas = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => loading = true);
    try {
      final api = context.read<ApiClient>();
      final results = await Future.wait([
        api.get('/cliente/cuenta'),
        api.get('/cliente/facturas'),
      ]);
      setState(() {
        cuenta = Map<String, dynamic>.from(results[0]['cuenta'] as Map? ?? {});
        facturas = results[1]['facturas'] as List? ?? [];
      });
    } catch (e) {
      if (mounted) await showAppMessage(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Color _estadoColor(String estado) {
    switch (estado) {
      case 'pagada':
        return AppColors.forest;
      case 'pendiente':
        return AppColors.amber;
      case 'vencida':
        return AppColors.rose;
      case 'parcial':
        return AppColors.sky;
      default:
        return AppColors.muted;
    }
  }

  @override
  Widget build(BuildContext context) {
    final cliente = Map<String, dynamic>.from(cuenta?['cliente'] as Map? ?? {});
    final servicio = cuenta?['servicio'] is Map ? Map<String, dynamic>.from(cuenta!['servicio'] as Map) : null;
    final saldo = (cuenta?['saldo_pendiente'] as num?) ?? 0;
    final name = cliente['nombre']?.toString() ?? context.watch<AuthController>().user?.name ?? 'Cliente';

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Hola, $name', style: const TextStyle(fontSize: 16)),
            Text('Código: ${cliente['codigo'] ?? '—'}', style: const TextStyle(fontSize: 12, color: AppColors.muted, fontWeight: FontWeight.w500)),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AyudaScreen())),
            icon: const Icon(Icons.chat_bubble_outline, color: AppColors.violet),
          ),
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
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                children: [
                  SoftCard(
                    child: Column(
                      children: [
                        if ((cliente['direccion'] ?? '').toString().isNotEmpty)
                          _info(Icons.location_on_outlined, '${cliente['direccion']}'),
                        if ((cliente['barrio'] ?? '').toString().isNotEmpty)
                          _info(Icons.home_outlined, '${cliente['barrio']}'),
                        if ((cliente['proyecto'] ?? '').toString().isNotEmpty)
                          _info(Icons.apartment_outlined, '${cliente['proyecto']}'),
                      ],
                    ),
                  ),
                  if (servicio != null) ...[
                    const SizedBox(height: 16),
                    const Text('Mi plan', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 8),
                    SoftCard(
                      child: Row(
                        children: [
                          const Icon(Icons.wifi, color: AppColors.amber, size: 32),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('${servicio['plan']}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                                Text(
                                  '${servicio['estado'] ?? ''}'.toUpperCase(),
                                  style: TextStyle(
                                    color: servicio['estado'] == 'activo' ? AppColors.forest : AppColors.rose,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Text(money(servicio['precio']), style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.amber)),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  const Text('Saldo pendiente', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  SoftCard(
                    color: saldo > 0 ? AppColors.roseSoft : const Color(0xFFE4F6EE),
                    child: Column(
                      children: [
                        Icon(saldo > 0 ? Icons.warning_amber_rounded : Icons.check_circle_outline, color: saldo > 0 ? AppColors.rose : AppColors.forest, size: 36),
                        const SizedBox(height: 8),
                        Text(money(saldo), style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: saldo > 0 ? AppColors.rose : AppColors.forest)),
                        Text(saldo > 0 ? 'Por pagar' : 'Al día', style: const TextStyle(color: AppColors.muted)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text('Mis facturas', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  if (facturas.isEmpty)
                    const EmptyState(icon: Icons.receipt_long_outlined, title: 'No hay facturas')
                  else
                    ...facturas.map((raw) {
                      final f = Map<String, dynamic>.from(raw as Map);
                      final estado = (f['estado'] ?? '').toString();
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: SoftCard(
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('${f['periodo'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.w800)),
                                    Text('#${f['numero'] ?? ''}', style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(money(f['total']), style: const TextStyle(fontWeight: FontWeight.w800)),
                                  if (((f['saldo'] as num?) ?? 0) > 0)
                                    Text('Saldo ${money(f['saldo'])}', style: const TextStyle(color: AppColors.rose, fontSize: 12)),
                                ],
                              ),
                              const SizedBox(width: 10),
                              StatusPill(label: estado, color: _estadoColor(estado)),
                            ],
                          ),
                        ),
                      );
                    }),
                  const SizedBox(height: 8),
                  SoftCard(
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ClientePagosScreen())),
                    child: const Row(
                      children: [
                        Icon(Icons.receipt_outlined, color: AppColors.amber),
                        SizedBox(width: 12),
                        Expanded(child: Text('Ver historial de pagos', style: TextStyle(fontWeight: FontWeight.w700))),
                        Icon(Icons.chevron_right, color: AppColors.muted),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  SoftCard(
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AyudaScreen())),
                    child: const Row(
                      children: [
                        Icon(Icons.chat_bubble_outline, color: AppColors.violet),
                        SizedBox(width: 12),
                        Expanded(child: Text('Ayuda y reportes', style: TextStyle(fontWeight: FontWeight.w700))),
                        Icon(Icons.chevron_right, color: AppColors.muted),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _info(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, color: AppColors.muted, size: 20),
          const SizedBox(width: 10),
          Expanded(child: Text(text)),
        ],
      ),
    );
  }
}

class ClientePagosScreen extends StatefulWidget {
  const ClientePagosScreen({super.key});

  @override
  State<ClientePagosScreen> createState() => _ClientePagosScreenState();
}

class _ClientePagosScreenState extends State<ClientePagosScreen> {
  List pagos = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => loading = true);
    try {
      final res = await context.read<ApiClient>().get('/cliente/pagos');
      setState(() => pagos = res['pagos'] as List? ?? []);
    } catch (e) {
      if (mounted) await showAppMessage(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Historial de pagos')),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: pagos.isEmpty
                  ? ListView(children: const [SizedBox(height: 80), EmptyState(icon: Icons.payments_outlined, title: 'Sin pagos registrados')])
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: pagos.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, i) {
                        final p = Map<String, dynamic>.from(pagos[i] as Map);
                        return SoftCard(
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('${p['factura_periodo'] ?? 'Pago'}', style: const TextStyle(fontWeight: FontWeight.w800)),
                                    Text('${p['metodo_pago'] ?? ''} · ${p['fecha_pago'] ?? ''}', style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                                  ],
                                ),
                              ),
                              Text(money(p['monto']), style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.forest)),
                            ],
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}
