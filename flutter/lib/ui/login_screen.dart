import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../state/auth_controller.dart';
import '../theme/app_theme.dart';
import 'widgets.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  String role = 'cobrador';
  final documento = TextEditingController();
  final pin = TextEditingController();
  final email = TextEditingController();
  final password = TextEditingController();
  bool obscure = true;
  bool busy = false;

  @override
  void dispose() {
    documento.dispose();
    pin.dispose();
    email.dispose();
    password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final auth = context.read<AuthController>();
    setState(() => busy = true);
    try {
      if (role == 'admin') {
        if (email.text.trim().isEmpty || password.text.isEmpty) {
          await showAppMessage(context, 'Escribe correo y contraseña.', error: true);
          return;
        }
        await auth.loginAdmin(email.text.trim(), password.text);
      } else if (role == 'socio') {
        if (documento.text.trim().isEmpty || pin.text.isEmpty) {
          await showAppMessage(context, 'Escribe documento y PIN.', error: true);
          return;
        }
        await auth.loginSocio(documento.text.trim(), pin.text);
      } else {
        if (documento.text.trim().isEmpty || pin.text.isEmpty) {
          await showAppMessage(context, 'Escribe documento y PIN.', error: true);
          return;
        }
        await auth.loginCobrador(documento.text.trim(), pin.text);
      }
    } on ApiException catch (e) {
      if (mounted) await showAppMessage(context, e.message, error: true);
    } catch (e) {
      if (mounted) await showAppMessage(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 28, 20, 24),
          children: [
            Center(
              child: Image.asset(
                'assets/logo-app.png',
                height: 168,
                fit: BoxFit.contain,
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'INTERVEREDANET',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, letterSpacing: -0.6),
            ),
            const SizedBox(height: 6),
            const Text(
              'Cobros, clientes y liquidaciones en un solo lugar.',
              style: TextStyle(color: AppColors.muted, fontSize: 15, height: 1.4),
            ),
            const SizedBox(height: 28),
            Row(
              children: [
                _RoleChip(
                  label: 'Cobrador',
                  selected: role == 'cobrador',
                  color: AppColors.forest,
                  onTap: () => setState(() => role = 'cobrador'),
                ),
                const SizedBox(width: 8),
                _RoleChip(
                  label: 'Admin',
                  selected: role == 'admin',
                  color: AppColors.sky,
                  onTap: () => setState(() => role = 'admin'),
                ),
                const SizedBox(width: 8),
                _RoleChip(
                  label: 'Socio',
                  selected: role == 'socio',
                  color: AppColors.violet,
                  onTap: () => setState(() => role = 'socio'),
                ),
              ],
            ),
            const SizedBox(height: 20),
            SoftCard(
              padding: const EdgeInsets.all(18),
              child: Column(
                children: [
                  if (role == 'admin') ...[
                    TextField(
                      controller: email,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(
                        labelText: 'Correo',
                        prefixIcon: Icon(Icons.mail_outline),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: password,
                      obscureText: obscure,
                      decoration: InputDecoration(
                        labelText: 'Contraseña',
                        prefixIcon: const Icon(Icons.lock_outline),
                        suffixIcon: IconButton(
                          onPressed: () => setState(() => obscure = !obscure),
                          icon: Icon(obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                        ),
                      ),
                    ),
                  ] else ...[
                    TextField(
                      controller: documento,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Documento',
                        prefixIcon: Icon(Icons.badge_outlined),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: pin,
                      obscureText: obscure,
                      keyboardType: TextInputType.number,
                      maxLength: 6,
                      decoration: InputDecoration(
                        labelText: 'PIN',
                        counterText: '',
                        prefixIcon: const Icon(Icons.lock_outline),
                        suffixIcon: IconButton(
                          onPressed: () => setState(() => obscure = !obscure),
                          icon: Icon(obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: busy ? null : _submit,
                    child: busy
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('Entrar'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const Text('v3.0 Flutter', textAlign: TextAlign.center, style: TextStyle(color: AppColors.muted)),
          ],
        ),
      ),
    );
  }
}

class _RoleChip extends StatelessWidget {
  const _RoleChip({
    required this.label,
    required this.selected,
    required this.color,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: selected ? color.withOpacity(0.12) : AppColors.paper,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: selected ? color : AppColors.line, width: selected ? 1.6 : 1),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: selected ? color : AppColors.muted,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ),
    );
  }
}
