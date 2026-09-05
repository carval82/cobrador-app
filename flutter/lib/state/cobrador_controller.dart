import 'dart:convert';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';

import '../core/api_client.dart';
import '../data/local_db.dart';
import '../data/models.dart';

class CobradorController extends ChangeNotifier {
  CobradorController(this._api, this._db);

  final ApiClient _api;
  final LocalDb _db;

  Proyecto? proyecto;
  List<Cliente> clientes = [];
  List<Factura> facturas = [];
  List<PlanServicio> planes = [];
  ResumenDia resumen = const ResumenDia();
  int pendingSync = 0;
  bool online = true;
  bool syncing = false;
  String? error;

  Future<void> setProyecto(Proyecto next) async {
    proyecto = next;
    await refreshLocal();
    notifyListeners();
  }

  Future<void> refreshLocal() async {
    clientes = await _db.getClientes(proyecto?.id);
    facturas = await _db.getFacturas(proyecto?.id);
    planes = await _db.getPlanes();
    pendingSync = await _db.getPendingCount();
    resumen = ResumenDia.fromJson(await _db.getConfig('dailySummary'));
    notifyListeners();
  }

  Future<List<Factura>> facturasDe(int clienteId) {
    return _db.getFacturasCliente(clienteId);
  }

  Future<void> checkConnectivity() async {
    final result = await Connectivity().checkConnectivity();
    online = result.any((r) => r != ConnectivityResult.none);
    notifyListeners();
  }

  Future<void> sync() async {
    await checkConnectivity();
    if (!online) {
      error = 'Sin conexión para sincronizar';
      notifyListeners();
      return;
    }

    syncing = true;
    error = null;
    notifyListeners();

    try {
      final path = proyecto == null
          ? '/cobrador/sync'
          : '/cobrador/sync/${proyecto!.id}';
      final res = await _api.get(path);
      final data = Map<String, dynamic>.from((res['data'] ?? res) as Map);

      final rawClientes = (data['clientes'] as List? ?? [])
          .map((e) => Cliente.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
      final rawFacturas = (data['facturas_pendientes'] as List? ?? [])
          .map((e) => Factura.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
      final rawPlanes = (data['planes'] as List? ?? [])
          .map((e) => PlanServicio.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();

      await _db.saveClientes(rawClientes);
      await _db.saveFacturas(rawFacturas);
      await _db.savePlanes(rawPlanes);
      if (data['resumen_dia'] is Map) {
        await _db.setConfig(
          'dailySummary',
          Map<String, dynamic>.from(data['resumen_dia'] as Map),
        );
      }

      await _flushPending();
      await refreshLocal();
    } catch (e) {
      error = e.toString();
    } finally {
      syncing = false;
      notifyListeners();
    }
  }

  Future<void> _flushPending() async {
    final ops = await _db.getPendingOps();
    for (final op in ops) {
      try {
        final data = jsonDecode(op['data'] as String) as Map<String, dynamic>;
        if (op['type'] == 'payment') {
          await _api.post('/cobrador/pago', data: data);
        } else if (op['type'] == 'client') {
          await _api.post('/cobrador/cliente', data: data);
        }
        await _db.removePendingOp(op['id'] as int);
      } catch (_) {}
    }
  }

  Future<String> registerPayment(Map<String, dynamic> payment) async {
    await checkConnectivity();
    if (online) {
      try {
        final res = await _api.post('/cobrador/pago', data: payment);
        await _db.updateFacturaAfterPayment(
          payment['factura_id'] as int,
          (payment['monto'] as num).toDouble(),
        );
        await refreshLocal();
        if (res['duplicado'] == true) {
          return 'Este pago ya estaba registrado.';
        }
        return res['message']?.toString() ?? 'Pago registrado.';
      } catch (_) {
        await _db.addPendingOp('payment', payment);
        await _db.updateFacturaAfterPayment(
          payment['factura_id'] as int,
          (payment['monto'] as num).toDouble(),
        );
        await refreshLocal();
        return 'Sin red. El pago quedó guardado y se enviará al sincronizar.';
      }
    }

    await _db.addPendingOp('payment', payment);
    await _db.updateFacturaAfterPayment(
      payment['factura_id'] as int,
      (payment['monto'] as num).toDouble(),
    );
    await refreshLocal();
    return 'Sin red. El pago quedó guardado y se enviará al sincronizar.';
  }

  Future<String> registerClient(Map<String, dynamic> client) async {
    await checkConnectivity();
    if (online) {
      try {
        final res = await _api.post('/cobrador/cliente', data: client);
        await sync();
        return res['message']?.toString() ?? 'Cliente registrado.';
      } catch (_) {
        await _db.addPendingOp('client', client);
        await refreshLocal();
        return 'Sin red. El cliente quedó guardado y se enviará al sincronizar.';
      }
    }
    await _db.addPendingOp('client', client);
    await refreshLocal();
    return 'Sin red. El cliente quedó guardado y se enviará al sincronizar.';
  }
}
