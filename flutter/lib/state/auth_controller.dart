import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../core/api_client.dart';
import '../data/models.dart';

class AuthController extends ChangeNotifier {
  AuthController(this._api, this._storage);

  final ApiClient _api;
  final FlutterSecureStorage _storage;

  AppUser? user;
  bool loading = true;

  Future<void> restore() async {
    try {
      final token = await _storage.read(key: 'token');
      final raw = await _storage.read(key: 'user');
      final type = await _storage.read(key: 'userType');
      if (token != null && raw != null && type != null) {
        user = AppUser.fromJson(jsonDecode(raw) as Map<String, dynamic>, type);
      }
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> loginCobrador(String documento, String pin) async {
    final res = await _api.post('/cobrador/login', data: {
      'documento': documento,
      'pin': pin,
    });
    final cobrador = Map<String, dynamic>.from(res['cobrador'] as Map);
    await _persist(res['token']?.toString(), AppUser.fromJson(cobrador, 'cobrador'));
  }

  Future<void> loginAdmin(String email, String password) async {
    final res = await _api.post('/admin/login', data: {
      'email': email,
      'password': password,
    });
    final admin = Map<String, dynamic>.from(res['user'] as Map);
    await _persist(res['token']?.toString(), AppUser.fromJson(admin, 'admin'));
  }

  Future<void> loginSocio(String documento, String pin) async {
    final res = await _api.post('/socio/login', data: {
      'documento': documento,
      'pin': pin,
    });
    final socio = Map<String, dynamic>.from((res['socio'] ?? res['user'] ?? {}) as Map);
    socio.putIfAbsent('id', () => 0);
    await _persist(res['token']?.toString(), AppUser.fromJson(socio, 'socio'));
  }

  Future<void> logout() async {
    user = null;
    await _storage.deleteAll();
    notifyListeners();
  }

  Future<void> _persist(String? token, AppUser next) async {
    if (token != null) await _storage.write(key: 'token', value: token);
    await _storage.write(key: 'user', value: jsonEncode(next.toJson()));
    await _storage.write(key: 'userType', value: next.type);
    user = next;
    notifyListeners();
  }
}
