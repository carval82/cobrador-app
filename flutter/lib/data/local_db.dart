import 'dart:convert';

import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';

import 'models.dart';

class LocalDb {
  Database? _db;

  Future<Database> get database async {
    if (_db != null) return _db!;
    final dir = await getDatabasesPath();
    _db = await openDatabase(
      p.join(dir, 'interveredanet.db'),
      version: 1,
      onCreate: (db, _) async {
        await db.execute('''
          CREATE TABLE clientes (
            id INTEGER PRIMARY KEY,
            proyecto_id INTEGER,
            data TEXT
          )
        ''');
        await db.execute('''
          CREATE TABLE facturas (
            id INTEGER PRIMARY KEY,
            cliente_id INTEGER,
            estado TEXT,
            data TEXT
          )
        ''');
        await db.execute('''
          CREATE TABLE planes (
            id INTEGER PRIMARY KEY,
            data TEXT
          )
        ''');
        await db.execute('''
          CREATE TABLE pending_ops (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT,
            data TEXT,
            created_at TEXT
          )
        ''');
        await db.execute('''
          CREATE TABLE config (
            key TEXT PRIMARY KEY,
            value TEXT
          )
        ''');
      },
    );
    return _db!;
  }

  Future<void> saveClientes(List<Cliente> clientes) async {
    final db = await database;
    await db.delete('clientes');
    final batch = db.batch();
    for (final c in clientes) {
      batch.insert('clientes', {
        'id': c.id,
        'proyecto_id': c.proyectoId,
        'data': jsonEncode(c.toJson()),
      });
    }
    await batch.commit(noResult: true);
  }

  Future<List<Cliente>> getClientes(int? proyectoId) async {
    final db = await database;
    final rows = proyectoId == null
        ? await db.query('clientes', orderBy: 'id')
        : await db.query(
            'clientes',
            where: 'proyecto_id = ?',
            whereArgs: [proyectoId],
          );
    final list = rows
        .map((r) => Cliente.fromJson(jsonDecode(r['data'] as String)))
        .toList();
    list.sort((a, b) => a.nombre.compareTo(b.nombre));
    return list;
  }

  Future<void> saveFacturas(List<Factura> facturas) async {
    final db = await database;
    await db.delete('facturas');
    final batch = db.batch();
    for (final f in facturas) {
      batch.insert('facturas', {
        'id': f.id,
        'cliente_id': f.clienteId,
        'estado': f.estado,
        'data': jsonEncode(f.toJson()),
      });
    }
    await batch.commit(noResult: true);
  }

  Future<List<Factura>> getFacturas(int? proyectoId) async {
    final clientes = await getClientes(proyectoId);
    final ids = clientes.map((c) => c.id).toSet();
    final db = await database;
    final rows = await db.query(
      'facturas',
      where: "estado IN ('pendiente','parcial','vencida')",
    );
    return rows
        .map((r) => Factura.fromJson(jsonDecode(r['data'] as String)))
        .where((f) => proyectoId == null || ids.contains(f.clienteId))
        .toList();
  }

  Future<List<Factura>> getFacturasCliente(int clienteId) async {
    final db = await database;
    final rows = await db.query(
      'facturas',
      where: "cliente_id = ? AND estado IN ('pendiente','parcial','vencida')",
      whereArgs: [clienteId],
    );
    return rows
        .map((r) => Factura.fromJson(jsonDecode(r['data'] as String)))
        .toList();
  }

  Future<void> updateFacturaAfterPayment(int facturaId, double monto) async {
    final db = await database;
    final rows = await db.query('facturas', where: 'id = ?', whereArgs: [facturaId]);
    if (rows.isEmpty) return;
    var factura = Factura.fromJson(jsonDecode(rows.first['data'] as String));
    final saldo = (factura.saldo - monto).clamp(0, double.infinity).toDouble();
    final estado = saldo <= 0 ? 'pagada' : (saldo < factura.total ? 'parcial' : factura.estado);
    factura = factura.copyWith(saldo: saldo, estado: estado);
    await db.update(
      'facturas',
      {'estado': estado, 'data': jsonEncode(factura.toJson())},
      where: 'id = ?',
      whereArgs: [facturaId],
    );
  }

  Future<void> savePlanes(List<PlanServicio> planes) async {
    final db = await database;
    await db.delete('planes');
    final batch = db.batch();
    for (final p in planes) {
      batch.insert('planes', {'id': p.id, 'data': jsonEncode(p.toJson())});
    }
    await batch.commit(noResult: true);
  }

  Future<List<PlanServicio>> getPlanes() async {
    final db = await database;
    final rows = await db.query('planes');
    return rows
        .map((r) => PlanServicio.fromJson(jsonDecode(r['data'] as String)))
        .toList();
  }

  Future<void> addPendingOp(String type, Map<String, dynamic> data) async {
    final db = await database;
    await db.insert('pending_ops', {
      'type': type,
      'data': jsonEncode(data),
      'created_at': DateTime.now().toIso8601String(),
    });
  }

  Future<List<Map<String, dynamic>>> getPendingOps() async {
    final db = await database;
    return db.query('pending_ops', orderBy: 'id');
  }

  Future<int> getPendingCount() async {
    final db = await database;
    final result = await db.rawQuery('SELECT COUNT(*) as c FROM pending_ops');
    return (result.first['c'] as int?) ?? 0;
  }

  Future<void> removePendingOp(int id) async {
    final db = await database;
    await db.delete('pending_ops', where: 'id = ?', whereArgs: [id]);
  }

  Future<void> setConfig(String key, Map<String, dynamic> value) async {
    final db = await database;
    await db.insert(
      'config',
      {'key': key, 'value': jsonEncode(value)},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<Map<String, dynamic>?> getConfig(String key) async {
    final db = await database;
    final rows = await db.query('config', where: 'key = ?', whereArgs: [key]);
    if (rows.isEmpty) return null;
    return jsonDecode(rows.first['value'] as String) as Map<String, dynamic>;
  }
}
