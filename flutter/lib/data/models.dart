class AppUser {
  final int id;
  final String name;
  final String? documento;
  final String? email;
  final String type;

  const AppUser({
    required this.id,
    required this.name,
    required this.type,
    this.documento,
    this.email,
  });

  factory AppUser.fromJson(Map<String, dynamic> json, String type) {
    return AppUser(
      id: _asInt(json['id']),
      name: (json['nombre'] ?? json['name'] ?? '').toString(),
      documento: json['documento']?.toString(),
      email: json['email']?.toString(),
      type: type,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'nombre': name,
        'name': name,
        'documento': documento,
        'email': email,
        'type': type,
      };
}

class Proyecto {
  final int id;
  final String nombre;
  final String? color;
  final String? ubicacion;
  final int clientesAsignados;
  final int facturasPendientes;
  final bool activo;

  const Proyecto({
    required this.id,
    required this.nombre,
    this.color,
    this.ubicacion,
    this.clientesAsignados = 0,
    this.facturasPendientes = 0,
    this.activo = true,
  });

  factory Proyecto.fromJson(Map<String, dynamic> json) {
    return Proyecto(
      id: _asInt(json['id']),
      nombre: (json['nombre'] ?? '').toString(),
      color: json['color']?.toString(),
      ubicacion: json['ubicacion']?.toString(),
      clientesAsignados: _asInt(json['clientes_asignados'] ?? json['clientes_count']),
      facturasPendientes: _asInt(json['facturas_pendientes']),
      activo: json['activo'] != false,
    );
  }
}

class Cliente {
  final int id;
  final String? codigo;
  final String nombre;
  final String? documento;
  final String? celular;
  final String? telefono;
  final String? email;
  final String? direccion;
  final String? barrio;
  final String estado;
  final int? proyectoId;
  final String? proyectoNombre;
  final Map<String, dynamic>? servicio;

  const Cliente({
    required this.id,
    required this.nombre,
    this.codigo,
    this.documento,
    this.celular,
    this.telefono,
    this.email,
    this.direccion,
    this.barrio,
    this.estado = 'activo',
    this.proyectoId,
    this.proyectoNombre,
    this.servicio,
  });

  factory Cliente.fromJson(Map<String, dynamic> json) {
    return Cliente(
      id: _asInt(json['id']),
      codigo: json['codigo']?.toString(),
      nombre: (json['nombre'] ?? '').toString(),
      documento: json['documento']?.toString(),
      celular: json['celular']?.toString(),
      telefono: json['telefono']?.toString(),
      email: json['email']?.toString(),
      direccion: json['direccion']?.toString(),
      barrio: json['barrio']?.toString(),
      estado: (json['estado'] ?? 'activo').toString(),
      proyectoId: json['proyecto_id'] == null ? null : _asInt(json['proyecto_id']),
      proyectoNombre: (json['proyecto_nombre'] ?? json['proyecto'])?.toString(),
      servicio: json['servicio'] is Map
          ? Map<String, dynamic>.from(json['servicio'] as Map)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'codigo': codigo,
        'nombre': nombre,
        'documento': documento,
        'celular': celular,
        'telefono': telefono,
        'email': email,
        'direccion': direccion,
        'barrio': barrio,
        'estado': estado,
        'proyecto_id': proyectoId,
        'proyecto_nombre': proyectoNombre,
        'servicio': servicio,
      };
}

class Factura {
  final int id;
  final int clienteId;
  final String? numero;
  final String? clienteNombre;
  final int mes;
  final int anio;
  final String? periodo;
  final double total;
  final double saldo;
  final String estado;
  final String? fechaVencimiento;

  const Factura({
    required this.id,
    required this.clienteId,
    required this.mes,
    required this.anio,
    required this.total,
    required this.saldo,
    required this.estado,
    this.numero,
    this.clienteNombre,
    this.periodo,
    this.fechaVencimiento,
  });

  factory Factura.fromJson(Map<String, dynamic> json) {
    final total = _asDouble(json['total']);
    return Factura(
      id: _asInt(json['id']),
      clienteId: _asInt(json['cliente_id']),
      numero: json['numero']?.toString(),
      clienteNombre: json['cliente_nombre']?.toString(),
      mes: _asInt(json['mes']),
      anio: _asInt(json['anio']),
      periodo: json['periodo']?.toString(),
      total: total,
      saldo: json['saldo'] == null ? total : _asDouble(json['saldo']),
      estado: (json['estado'] ?? 'pendiente').toString(),
      fechaVencimiento: json['fecha_vencimiento']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'cliente_id': clienteId,
        'numero': numero,
        'cliente_nombre': clienteNombre,
        'mes': mes,
        'anio': anio,
        'periodo': periodo,
        'total': total,
        'saldo': saldo,
        'estado': estado,
        'fecha_vencimiento': fechaVencimiento,
      };

  Factura copyWith({double? saldo, String? estado}) {
    return Factura(
      id: id,
      clienteId: clienteId,
      numero: numero,
      clienteNombre: clienteNombre,
      mes: mes,
      anio: anio,
      periodo: periodo,
      total: total,
      saldo: saldo ?? this.saldo,
      estado: estado ?? this.estado,
      fechaVencimiento: fechaVencimiento,
    );
  }
}

class PlanServicio {
  final int id;
  final String nombre;
  final double precio;

  const PlanServicio({
    required this.id,
    required this.nombre,
    required this.precio,
  });

  factory PlanServicio.fromJson(Map<String, dynamic> json) {
    return PlanServicio(
      id: _asInt(json['id']),
      nombre: (json['nombre'] ?? '').toString(),
      precio: _asDouble(json['precio']),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'nombre': nombre,
        'precio': precio,
      };
}

class ResumenDia {
  final int cobrosCount;
  final double totalCobrado;

  const ResumenDia({this.cobrosCount = 0, this.totalCobrado = 0});

  factory ResumenDia.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const ResumenDia();
    return ResumenDia(
      cobrosCount: _asInt(json['cobros_count']),
      totalCobrado: _asDouble(json['total_cobrado']),
    );
  }

  Map<String, dynamic> toJson() => {
        'cobros_count': cobrosCount,
        'total_cobrado': totalCobrado,
      };
}

int _asInt(dynamic value) {
  if (value is int) return value;
  return int.tryParse(value?.toString() ?? '') ?? 0;
}

double _asDouble(dynamic value) {
  if (value is num) return value.toDouble();
  return double.tryParse(value?.toString() ?? '') ?? 0;
}
