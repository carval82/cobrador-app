import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/formatters.dart';
import '../../state/auth_controller.dart';
import '../../theme/app_theme.dart';
import '../widgets.dart';

class SocioHomeScreen extends StatefulWidget {
  const SocioHomeScreen({super.key});

  @override
  State<SocioHomeScreen> createState() => _SocioHomeScreenState();
}

class _SocioHomeScreenState extends State<SocioHomeScreen> {
  List proyectos = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => loading = true);
    try {
      final res = await context.read<ApiClient>().get('/socio/proyectos');
      setState(() => proyectos = (res['data'] ?? res['proyectos'] ?? []) as List);
    } catch (e) {
      if (mounted) await showAppMessage(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthController>().user;
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(user?.name ?? 'Socio', style: const TextStyle(fontSize: 14, color: AppColors.muted, fontWeight: FontWeight.w500)),
            const Text('Participaciones'),
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
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: proyectos.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, i) {
                  final p = Map<String, dynamic>.from(proyectos[i] as Map);
                  return SoftCard(
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => SocioLiquidacionScreen(proyecto: p)),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('${p['nombre']}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                              Text('Participación ${p['porcentaje'] ?? p['participacion'] ?? '—'}%', style: const TextStyle(color: AppColors.muted)),
                            ],
                          ),
                        ),
                        const Icon(Icons.chevron_right, color: AppColors.muted),
                      ],
                    ),
                  );
                },
              ),
            ),
    );
  }
}

class SocioLiquidacionScreen extends StatefulWidget {
  const SocioLiquidacionScreen({super.key, required this.proyecto});
  final Map<String, dynamic> proyecto;

  @override
  State<SocioLiquidacionScreen> createState() => _SocioLiquidacionScreenState();
}

class _SocioLiquidacionScreenState extends State<SocioLiquidacionScreen> {
  Map<String, dynamic>? data;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => loading = true);
    try {
      final res = await context.read<ApiClient>().get('/socio/liquidacion/${widget.proyecto['id']}');
      setState(() => data = Map<String, dynamic>.from((res['data'] ?? res) as Map));
    } catch (e) {
      if (mounted) await showAppMessage(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final resumen = Map<String, dynamic>.from(data?['resumen'] as Map? ?? {});
    final socio = Map<String, dynamic>.from(data?['socio'] as Map? ?? {});
    final historial = data?['historial'] as List? ?? [];

    return Scaffold(
      appBar: AppBar(title: Text('${widget.proyecto['nombre']}')),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  SoftCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Participación ${socio['porcentaje'] ?? widget.proyecto['porcentaje'] ?? '—'}%', style: const TextStyle(color: AppColors.muted)),
                        const SizedBox(height: 10),
                        _kv('Ingresos', money(resumen['ingresos']), AppColors.forest),
                        _kv('Gastos', money(resumen['gastos']), AppColors.rose),
                        _kv('Utilidad', money(resumen['utilidad']), AppColors.sky),
                        const Divider(),
                        _kv('Tu parte', money(resumen['mi_participacion']), AppColors.forest),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text('Historial', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  ...historial.map((raw) {
                    final h = Map<String, dynamic>.from(raw as Map);
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: SoftCard(
                        child: Row(
                          children: [
                            Expanded(child: Text('${h['mes']}', style: const TextStyle(fontWeight: FontWeight.w700))),
                            Text(money(h['mi_participacion']), style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.forest)),
                          ],
                        ),
                      ),
                    );
                  }),
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
