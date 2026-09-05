import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:provider/provider.dart';

import 'core/api_client.dart';
import 'data/local_db.dart';
import 'state/auth_controller.dart';
import 'state/cobrador_controller.dart';
import 'theme/app_theme.dart';
import 'ui/admin/admin_home.dart';
import 'ui/cobrador/proyectos_screen.dart';
import 'ui/login_screen.dart';
import 'ui/socio/socio_screens.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  const storage = FlutterSecureStorage();
  final api = ApiClient(storage);
  final db = LocalDb();
  await db.database;
  final auth = AuthController(api, storage);
  await auth.restore();

  runApp(
    MultiProvider(
      providers: [
        Provider.value(value: api),
        Provider.value(value: db),
        ChangeNotifierProvider.value(value: auth),
        ChangeNotifierProvider(create: (_) => CobradorController(api, db)),
      ],
      child: const InterveredanetApp(),
    ),
  );
}

class InterveredanetApp extends StatelessWidget {
  const InterveredanetApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'INTERVEREDANET',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: const AuthGate(),
    );
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    if (auth.loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }
    switch (auth.user?.type) {
      case 'admin':
        return const AdminHomeScreen();
      case 'socio':
        return const SocioHomeScreen();
      case 'cobrador':
        return const ProyectosScreen();
      default:
        return const LoginScreen();
    }
  }
}
