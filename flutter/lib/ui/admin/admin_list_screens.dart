import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/formatters.dart';
import '../../theme/app_theme.dart';
import '../widgets.dart';

class AdminClientesScreen extends StatefulWidget {
  const AdminClientesScreen({super.key});

  @override
  State<AdminClientesScreen> createState() => _AdminClientesScreenState();
}

class _AdminClientesScreenState extends State<AdminClientesScreen> {
  List items = [];
  bool loading = true;
  String search = '';

  Future<void> _load() async {
    setState(() => loading = true);
    try {
      final res = await context.read<ApiClient>().get('/admin/clientes', query: {
        if (search.trim().length >= 2) 'search': search.trim(),
      });
      setState(() => items = res['clientes'] as List? ?? []);
    } catch (e) {
      if (mounted) await showAppMessage(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Clientes')),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.forest,
        onPressed: () async {
          await Navigator.push(context, MaterialPageRoute(builder: (_) => const AdminClienteFormScreen()));
          _load();
        },
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: TextField(
              decoration: const InputDecoration(hintText: 'Buscar cliente', prefixIcon: Icon(Icons.search)),
              onChanged: (v) {
                search = v;
                if (v.length >= 2 || v.isEmpty) _load();
              },
            ),
          ),
          Expanded(
            child: loading
                ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: _load,
                    child: ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 88),
                      itemCount: items.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, i) {
                        final c = Map<String, dynamic>.from(items[i] as Map);
                        return SoftCard(
                          child: Row(
                            children: [
                              CircleAvatar(
                                backgroundColor: AppColors.skySoft,
                                child: Text(initials(c['nombre']?.toString()), style: const TextStyle(color: AppColors.sky, fontWeight: FontWeight.w800)),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('${c['nombre']}', style: const TextStyle(fontWeight: FontWeight.w800)),
                                    Text('${c['codigo'] ?? ''} · ${c['documento'] ?? ''}', style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                                  ],
                                ),
                              ),
                              StatusPill(
                                label: '${c['estado'] ?? ''}',
                                color: c['estado'] == 'activo' ? AppColors.forest : AppColors.amber,
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class AdminClienteFormScreen extends StatefulWidget {
  const AdminClienteFormScreen({super.key});

  @override
  State<AdminClienteFormScreen> createState() => _AdminClienteFormScreenState();
}

class _AdminClienteFormScreenState extends State<AdminClienteFormScreen> {
  final nombre = TextEditingController();
  final documento = TextEditingController();
  final celular = TextEditingController();
  final direccion = TextEditingController();
  String tipoAlta = 'nuevo';
  int? proyectoId;
  int? planId;
  List proyectos = [];
  List planes = [];
  bool busy = false;

  @override
  void initState() {
    super.initState();
    _loadForms();
  }

  Future<void> _loadForms() async {
    try {
      final res = await context.read<ApiClient>().get('/admin/datos-formularios');
      setState(() {
        proyectos = res['proyectos'] as List? ?? [];
        planes = res['planes'] as List? ?? [];
      });
    } catch (_) {}
  }

  @override
  void dispose() {
    nombre.dispose();
    documento.dispose();
    celular.dispose();
    direccion.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (nombre.text.trim().isEmpty || documento.text.trim().isEmpty || proyectoId == null) {
      await showAppMessage(context, 'Nombre, documento y proyecto son obligatorios.', error: true);
      return;
    }
    setState(() => busy = true);
    try {
      final res = await context.read<ApiClient>().post('/admin/clientes', data: {
        'nombre': nombre.text.trim(),
        'documento': documento.text.trim(),
        'celular': celular.text.trim(),
        'direccion': direccion.text.trim(),
        'proyecto_id': proyectoId,
        'tipo_alta': tipoAlta,
        'plan_servicio_id': planId,
      });
      if (!mounted) return;
      await showAppMessage(context, res['message']?.toString() ?? 'Cliente creado.');
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) await showAppMessage(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Nuevo cliente')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SoftCard(
            child: Column(
              children: [
                SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(value: 'nuevo', label: Text('Nuevo')),
                    ButtonSegment(value: 'antiguo', label: Text('Antiguo')),
                  ],
                  selected: {tipoAlta},
                  onSelectionChanged: (s) => setState(() => tipoAlta = s.first),
                ),
                const SizedBox(height: 10),
                Text(
                  tipoAlta == 'nuevo'
                      ? 'Mes libre. Primera factura: ${firstInvoiceHint(DateTime.now())}.'
                      : 'Se genera la factura del mes en curso si asignas un plan.',
                  style: const TextStyle(color: AppColors.muted),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          SoftCard(
            child: Column(
              children: [
                TextField(controller: nombre, decoration: const InputDecoration(labelText: 'Nombre')),
                const SizedBox(height: 10),
                TextField(controller: documento, decoration: const InputDecoration(labelText: 'Documento')),
                const SizedBox(height: 10),
                TextField(controller: celular, decoration: const InputDecoration(labelText: 'Celular')),
                const SizedBox(height: 10),
                TextField(controller: direccion, decoration: const InputDecoration(labelText: 'Dirección')),
                const SizedBox(height: 10),
                DropdownButtonFormField<int>(
                  value: proyectoId,
                  decoration: const InputDecoration(labelText: 'Proyecto'),
                  items: proyectos
                      .map((p) => DropdownMenuItem(value: (p['id'] as num).toInt(), child: Text('${p['nombre']}')))
                      .toList(),
                  onChanged: (v) => setState(() => proyectoId = v),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<int?>(
                  value: planId,
                  decoration: const InputDecoration(labelText: 'Plan (opcional)'),
                  items: [
                    const DropdownMenuItem(value: null, child: Text('Asignar después')),
                    ...planes.map((p) => DropdownMenuItem(value: (p['id'] as num).toInt(), child: Text('${p['nombre']}'))),
                  ],
                  onChanged: (v) => setState(() => planId = v),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          FilledButton(onPressed: busy ? null : _save, child: Text(busy ? 'Guardando…' : 'Crear cliente')),
        ],
      ),
    );
  }
}

class AdminPagosScreen extends StatefulWidget {
  const AdminPagosScreen({super.key});
  @override
  State<AdminPagosScreen> createState() => _AdminPagosScreenState();
}

class _AdminPagosScreenState extends State<AdminPagosScreen> {
  List items = [];
  num total = 0;
  bool loading = true;

  Future<void> _load() async {
    setState(() => loading = true);
    try {
      final res = await context.read<ApiClient>().get('/admin/pagos');
      setState(() {
        items = res['pagos'] as List? ?? [];
        total = res['total_recaudado'] as num? ?? 0;
      });
    } catch (e) {
      if (mounted) await showAppMessage(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pagos')),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  SoftCard(child: Text('Recaudado: ${money(total)}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800))),
                  const SizedBox(height: 12),
                  ...items.map((raw) {
                    final p = Map<String, dynamic>.from(raw as Map);
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: SoftCard(
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('${p['cliente'] ?? p['cliente_nombre'] ?? 'Cliente'}', style: const TextStyle(fontWeight: FontWeight.w800)),
                                  Text('${p['metodo_pago'] ?? ''} · ${p['fecha_pago'] ?? ''}', style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                                ],
                              ),
                            ),
                            Text(money(p['monto']), style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.forest)),
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
}

class AdminFacturasScreen extends StatefulWidget {
  const AdminFacturasScreen({super.key});
  @override
  State<AdminFacturasScreen> createState() => _AdminFacturasScreenState();
}

class _AdminFacturasScreenState extends State<AdminFacturasScreen> {
  List items = [];
  bool loading = true;

  Future<void> _load() async {
    setState(() => loading = true);
    try {
      final res = await context.read<ApiClient>().get('/admin/facturas');
      setState(() => items = res['facturas'] as List? ?? []);
    } catch (e) {
      if (mounted) await showAppMessage(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Facturas')),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: items.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, i) {
                  final f = Map<String, dynamic>.from(items[i] as Map);
                  return SoftCard(
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('${f['cliente'] ?? f['cliente_nombre'] ?? 'Cliente'}', style: const TextStyle(fontWeight: FontWeight.w800)),
                              Text('${f['mes']}/${f['anio']} · ${f['estado']}', style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                            ],
                          ),
                        ),
                        Text(money(f['saldo'] ?? f['total']), style: const TextStyle(fontWeight: FontWeight.w800)),
                      ],
                    ),
                  );
                },
              ),
            ),
    );
  }
}

class AdminProyectosScreen extends StatefulWidget {
  const AdminProyectosScreen({super.key});
  @override
  State<AdminProyectosScreen> createState() => _AdminProyectosScreenState();
}

class _AdminProyectosScreenState extends State<AdminProyectosScreen> {
  List items = [];
  bool loading = true;

  Future<void> _load() async {
    setState(() => loading = true);
    try {
      final res = await context.read<ApiClient>().get('/admin/proyectos');
      setState(() => items = res['proyectos'] as List? ?? []);
    } catch (e) {
      if (mounted) await showAppMessage(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Proyectos')),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: items.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, i) {
                  final p = Map<String, dynamic>.from(items[i] as Map);
                  return SoftCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('${p['nombre']}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                        Text('${p['clientes_count'] ?? 0} clientes · ${p['cobradores_count'] ?? 0} cobradores', style: const TextStyle(color: AppColors.muted)),
                      ],
                    ),
                  );
                },
              ),
            ),
    );
  }
}

class AdminCobradoresScreen extends StatefulWidget {
  const AdminCobradoresScreen({super.key});
  @override
  State<AdminCobradoresScreen> createState() => _AdminCobradoresScreenState();
}

class _AdminCobradoresScreenState extends State<AdminCobradoresScreen> {
  List items = [];
  bool loading = true;

  Future<void> _load() async {
    setState(() => loading = true);
    try {
      final res = await context.read<ApiClient>().get('/admin/cobradores');
      setState(() => items = res['cobradores'] as List? ?? []);
    } catch (e) {
      if (mounted) await showAppMessage(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Cobradores')),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: items.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, i) {
                  final c = Map<String, dynamic>.from(items[i] as Map);
                  return SoftCard(
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('${c['nombre']}', style: const TextStyle(fontWeight: FontWeight.w800)),
                              Text('${c['documento'] ?? ''}', style: const TextStyle(color: AppColors.muted)),
                            ],
                          ),
                        ),
                        StatusPill(label: '${c['estado'] ?? ''}', color: AppColors.forest),
                      ],
                    ),
                  );
                },
              ),
            ),
    );
  }
}

class AdminPlanesScreen extends StatefulWidget {
  const AdminPlanesScreen({super.key});
  @override
  State<AdminPlanesScreen> createState() => _AdminPlanesScreenState();
}

class _AdminPlanesScreenState extends State<AdminPlanesScreen> {
  List items = [];
  bool loading = true;

  Future<void> _load() async {
    setState(() => loading = true);
    try {
      final res = await context.read<ApiClient>().get('/admin/planes');
      setState(() => items = res['planes'] as List? ?? []);
    } catch (e) {
      if (mounted) await showAppMessage(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Planes')),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: items.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, i) {
                  final p = Map<String, dynamic>.from(items[i] as Map);
                  return SoftCard(
                    child: Row(
                      children: [
                        Expanded(child: Text('${p['nombre']}', style: const TextStyle(fontWeight: FontWeight.w800))),
                        Text(money(p['precio']), style: const TextStyle(color: AppColors.forest, fontWeight: FontWeight.w800)),
                      ],
                    ),
                  );
                },
              ),
            ),
    );
  }
}

class AdminTicketsScreen extends StatefulWidget {
  const AdminTicketsScreen({super.key});
  @override
  State<AdminTicketsScreen> createState() => _AdminTicketsScreenState();
}

class _AdminTicketsScreenState extends State<AdminTicketsScreen> {
  List items = [];
  bool loading = true;

  Future<void> _load() async {
    setState(() => loading = true);
    try {
      final res = await context.read<ApiClient>().get('/admin/tickets');
      setState(() => items = res['tickets'] as List? ?? []);
    } catch (e) {
      if (mounted) await showAppMessage(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _reply(Map<String, dynamic> ticket) async {
    final text = TextEditingController();
    String estado = 'en_proceso';
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Ticket #${ticket['id']}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('${ticket['asunto'] ?? ticket['mensaje'] ?? ''}'),
            const SizedBox(height: 10),
            TextField(controller: text, maxLines: 3, decoration: const InputDecoration(labelText: 'Respuesta')),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: estado,
              items: const [
                DropdownMenuItem(value: 'en_proceso', child: Text('En proceso')),
                DropdownMenuItem(value: 'cerrado', child: Text('Cerrado')),
                DropdownMenuItem(value: 'abierto', child: Text('Abierto')),
              ],
              onChanged: (v) => estado = v ?? estado,
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Enviar')),
        ],
      ),
    );
    if (ok != true || text.text.trim().isEmpty || !mounted) return;
    final api = context.read<ApiClient>();
    try {
      await api.put('/admin/tickets/${ticket['id']}/responder', data: {
        'respuesta': text.text.trim(),
        'estado': estado,
      });
      _load();
    } catch (e) {
      if (mounted) await showAppMessage(context, e.toString(), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Tickets')),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: items.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, i) {
                  final t = Map<String, dynamic>.from(items[i] as Map);
                  return SoftCard(
                    onTap: () => _reply(t),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(child: Text('${t['asunto'] ?? 'Ticket'}', style: const TextStyle(fontWeight: FontWeight.w800))),
                            StatusPill(label: '${t['estado'] ?? ''}', color: AppColors.amber),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text('${t['cliente'] ?? t['cliente_nombre'] ?? ''}', style: const TextStyle(color: AppColors.muted)),
                      ],
                    ),
                  );
                },
              ),
            ),
    );
  }
}
