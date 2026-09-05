import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../data/models.dart';
import '../../state/auth_controller.dart';
import '../../state/cobrador_controller.dart';
import '../../theme/app_theme.dart';
import '../widgets.dart';
import 'home_screen.dart';

class ProyectosScreen extends StatefulWidget {
  const ProyectosScreen({super.key});

  @override
  State<ProyectosScreen> createState() => _ProyectosScreenState();
}

class _ProyectosScreenState extends State<ProyectosScreen> {
  List<Proyecto> proyectos = [];
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
      final res = await api.get('/cobrador/proyectos');
      final list = (res['proyectos'] as List? ?? [])
          .map((e) => Proyecto.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
      setState(() => proyectos = list);
    } catch (e) {
      if (mounted) await showAppMessage(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> _open(Proyecto proyecto) async {
    await context.read<CobradorController>().setProyecto(proyecto);
    if (!mounted) return;
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const CobradorHomeScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthController>().user;
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Hola, ${user?.name.split(' ').first ?? ''}', style: const TextStyle(fontSize: 14, color: AppColors.muted, fontWeight: FontWeight.w500)),
            const Text('Tus proyectos'),
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
              child: proyectos.isEmpty
                  ? ListView(
                      children: const [
                        SizedBox(height: 80),
                        EmptyState(
                          icon: Icons.folder_open_outlined,
                          title: 'Sin proyectos asignados',
                          subtitle: 'Pide a administración que te asigne una ruta.',
                        ),
                      ],
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                      itemCount: proyectos.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (context, i) {
                        final p = proyectos[i];
                        return SoftCard(
                          onTap: () => _open(p),
                          child: Row(
                            children: [
                              Container(
                                width: 8,
                                height: 58,
                                decoration: BoxDecoration(
                                  color: _parseColor(p.color),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(p.nombre, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
                                    if ((p.ubicacion ?? '').isNotEmpty)
                                      Text(p.ubicacion!, style: const TextStyle(color: AppColors.muted)),
                                    const SizedBox(height: 8),
                                    Wrap(
                                      spacing: 8,
                                      children: [
                                        StatusPill(label: '${p.clientesAsignados} clientes', color: AppColors.forest),
                                        StatusPill(label: '${p.facturasPendientes} pendientes', color: AppColors.amber, soft: AppColors.amberSoft),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
                            ],
                          ),
                        );
                      },
                    ),
            ),
    );
  }

  Color _parseColor(String? hex) {
    if (hex == null || hex.isEmpty) return AppColors.forest;
    var value = hex.replaceAll('#', '');
    if (value.length == 6) value = 'FF$value';
    return Color(int.tryParse(value, radix: 16) ?? 0xFF0B6B4F);
  }
}
