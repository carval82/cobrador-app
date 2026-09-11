import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/formatters.dart';
import '../../state/auth_controller.dart';
import '../../theme/app_theme.dart';
import '../widgets.dart';

class AdminPerfilScreen extends StatefulWidget {
  const AdminPerfilScreen({super.key});

  @override
  State<AdminPerfilScreen> createState() => _AdminPerfilScreenState();
}

class _AdminPerfilScreenState extends State<AdminPerfilScreen> {
  final name = TextEditingController();
  final email = TextEditingController();
  final passwordActual = TextEditingController();
  final password = TextEditingController();
  final passwordConfirm = TextEditingController();
  bool loading = true;
  bool saving = false;
  bool savingPassword = false;
  bool obscure = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    name.dispose();
    email.dispose();
    passwordActual.dispose();
    password.dispose();
    passwordConfirm.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => loading = true);
    try {
      final res = await context.read<ApiClient>().get('/admin/perfil');
      final user = Map<String, dynamic>.from(res['user'] as Map? ?? {});
      name.text = '${user['name'] ?? user['nombre'] ?? ''}';
      email.text = '${user['email'] ?? ''}';
      if (!mounted) return;
      await context.read<AuthController>().updateUser(user);
    } catch (e) {
      if (mounted) await showAppMessage(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> _savePerfil() async {
    if (name.text.trim().isEmpty || email.text.trim().isEmpty) {
      await showAppMessage(context, 'Nombre y correo son requeridos.', error: true);
      return;
    }
    setState(() => saving = true);
    try {
      final res = await context.read<ApiClient>().put('/admin/perfil', data: {
        'name': name.text.trim(),
        'email': email.text.trim(),
      });
      final user = Map<String, dynamic>.from(res['user'] as Map? ?? {});
      if (!mounted) return;
      await context.read<AuthController>().updateUser(user);
      if (mounted) await showAppMessage(context, res['message']?.toString() ?? 'Perfil actualizado.');
    } catch (e) {
      if (mounted) await showAppMessage(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  Future<void> _savePassword() async {
    if (passwordActual.text.isEmpty || password.text.isEmpty) {
      await showAppMessage(context, 'Ingrese la contraseña actual y la nueva.', error: true);
      return;
    }
    if (password.text.length < 6) {
      await showAppMessage(context, 'La nueva contraseña debe tener al menos 6 caracteres.', error: true);
      return;
    }
    if (password.text != passwordConfirm.text) {
      await showAppMessage(context, 'Las contraseñas nuevas no coinciden.', error: true);
      return;
    }
    setState(() => savingPassword = true);
    try {
      final res = await context.read<ApiClient>().put('/admin/perfil', data: {
        'password_actual': passwordActual.text,
        'password': password.text,
      });
      passwordActual.clear();
      password.clear();
      passwordConfirm.clear();
      if (mounted) await showAppMessage(context, res['message']?.toString() ?? 'Contraseña actualizada.');
    } catch (e) {
      if (mounted) await showAppMessage(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => savingPassword = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mi perfil')),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                SoftCard(
                  child: Column(
                    children: [
                      CircleAvatar(
                        radius: 28,
                        backgroundColor: AppColors.skySoft,
                        child: Text(initials(name.text), style: const TextStyle(color: AppColors.sky, fontWeight: FontWeight.w800, fontSize: 20)),
                      ),
                      const SizedBox(height: 8),
                      Text(name.text, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
                      Text(email.text, style: const TextStyle(color: AppColors.muted)),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                const Text('Datos de la cuenta', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                SoftCard(
                  child: Column(
                    children: [
                      TextField(controller: name, decoration: const InputDecoration(labelText: 'Nombre')),
                      const SizedBox(height: 10),
                      TextField(controller: email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Correo')),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                FilledButton(onPressed: saving ? null : _savePerfil, child: Text(saving ? 'Guardando…' : 'Guardar perfil')),
                const SizedBox(height: 24),
                const Text('Cambiar contraseña', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                SoftCard(
                  child: Column(
                    children: [
                      TextField(controller: passwordActual, obscureText: obscure, decoration: const InputDecoration(labelText: 'Contraseña actual')),
                      const SizedBox(height: 10),
                      TextField(
                        controller: password,
                        obscureText: obscure,
                        decoration: InputDecoration(
                          labelText: 'Nueva contraseña',
                          suffixIcon: IconButton(
                            onPressed: () => setState(() => obscure = !obscure),
                            icon: Icon(obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      TextField(controller: passwordConfirm, obscureText: obscure, decoration: const InputDecoration(labelText: 'Confirmar contraseña')),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                FilledButton(onPressed: savingPassword ? null : _savePassword, child: Text(savingPassword ? 'Guardando…' : 'Actualizar contraseña')),
              ],
            ),
    );
  }
}

class AdminUsuariosScreen extends StatefulWidget {
  const AdminUsuariosScreen({super.key});

  @override
  State<AdminUsuariosScreen> createState() => _AdminUsuariosScreenState();
}

class _AdminUsuariosScreenState extends State<AdminUsuariosScreen> {
  List items = [];
  bool loading = true;

  Future<void> _load() async {
    setState(() => loading = true);
    try {
      final res = await context.read<ApiClient>().get('/admin/usuarios');
      setState(() => items = res['usuarios'] as List? ?? []);
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
    final me = context.watch<AuthController>().user;
    return Scaffold(
      appBar: AppBar(title: const Text('Usuarios')),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.forest,
        onPressed: () async {
          await Navigator.push(context, MaterialPageRoute(builder: (_) => const AdminUsuarioFormScreen()));
          _load();
        },
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 88),
                itemCount: items.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, i) {
                  final u = Map<String, dynamic>.from(items[i] as Map);
                  final isMe = u['id'] == me?.id;
                  return SoftCard(
                    onTap: () async {
                      await Navigator.push(context, MaterialPageRoute(builder: (_) => AdminUsuarioFormScreen(usuario: u)));
                      _load();
                    },
                    child: Row(
                      children: [
                        CircleAvatar(
                          backgroundColor: AppColors.skySoft,
                          child: Text(initials(u['name']?.toString()), style: const TextStyle(color: AppColors.sky, fontWeight: FontWeight.w800)),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('${u['name'] ?? u['nombre'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.w800)),
                              Text('${u['email'] ?? ''}', style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                            ],
                          ),
                        ),
                        if (isMe) const StatusPill(label: 'TÚ', color: AppColors.forest),
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

class AdminUsuarioFormScreen extends StatefulWidget {
  const AdminUsuarioFormScreen({super.key, this.usuario});
  final Map<String, dynamic>? usuario;

  @override
  State<AdminUsuarioFormScreen> createState() => _AdminUsuarioFormScreenState();
}

class _AdminUsuarioFormScreenState extends State<AdminUsuarioFormScreen> {
  final name = TextEditingController();
  final email = TextEditingController();
  final password = TextEditingController();
  final passwordConfirm = TextEditingController();
  bool busy = false;
  bool obscure = true;
  bool get isEdit => widget.usuario != null;
  bool get isSelf => isEdit && widget.usuario!['id'] == context.read<AuthController>().user?.id;

  @override
  void initState() {
    super.initState();
    final u = widget.usuario;
    if (u != null) {
      name.text = '${u['name'] ?? u['nombre'] ?? ''}';
      email.text = '${u['email'] ?? ''}';
    }
  }

  @override
  void dispose() {
    name.dispose();
    email.dispose();
    password.dispose();
    passwordConfirm.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (name.text.trim().isEmpty || email.text.trim().isEmpty) {
      await showAppMessage(context, 'Nombre y correo son requeridos.', error: true);
      return;
    }
    if (!isEdit && password.text.isEmpty) {
      await showAppMessage(context, 'La contraseña es requerida para nuevos usuarios.', error: true);
      return;
    }
    if (password.text.isNotEmpty) {
      if (password.text.length < 6) {
        await showAppMessage(context, 'La contraseña debe tener al menos 6 caracteres.', error: true);
        return;
      }
      if (password.text != passwordConfirm.text) {
        await showAppMessage(context, 'Las contraseñas no coinciden.', error: true);
        return;
      }
    }
    setState(() => busy = true);
    try {
      final api = context.read<ApiClient>();
      final data = {
        'name': name.text.trim(),
        'email': email.text.trim(),
        if (password.text.isNotEmpty) 'password': password.text,
      };
      final res = isEdit
          ? await api.put('/admin/usuarios/${widget.usuario!['id']}', data: data)
          : await api.post('/admin/usuarios', data: data);
      if (isSelf && res['usuario'] is Map) {
        if (!mounted) return;
        await context.read<AuthController>().updateUser(Map<String, dynamic>.from(res['usuario'] as Map));
      }
      if (!mounted) return;
      await showAppMessage(context, res['message']?.toString() ?? 'Usuario guardado.');
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) await showAppMessage(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> _delete() async {
    if (isSelf) {
      await showAppMessage(context, 'No puede eliminar su propio usuario.', error: true);
      return;
    }
    if (!await confirm(context, 'Eliminar usuario', '¿Eliminar a ${widget.usuario?['name']}?')) return;
    if (!mounted) return;
    setState(() => busy = true);
    try {
      final res = await context.read<ApiClient>().delete('/admin/usuarios/${widget.usuario!['id']}');
      if (!mounted) return;
      await showAppMessage(context, res['message']?.toString() ?? 'Usuario eliminado.');
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
      appBar: AppBar(
        title: Text(isEdit ? 'Editar usuario' : 'Nuevo usuario'),
        actions: [
          if (isEdit && !isSelf)
            IconButton(
              onPressed: busy ? null : _delete,
              icon: const Icon(Icons.delete_outline, color: AppColors.rose),
            ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SoftCard(
            child: Column(
              children: [
                TextField(controller: name, decoration: const InputDecoration(labelText: 'Nombre')),
                const SizedBox(height: 10),
                TextField(controller: email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Correo')),
                const SizedBox(height: 10),
                TextField(
                  controller: password,
                  obscureText: obscure,
                  decoration: InputDecoration(
                    labelText: isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña',
                    suffixIcon: IconButton(
                      onPressed: () => setState(() => obscure = !obscure),
                      icon: Icon(obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                TextField(controller: passwordConfirm, obscureText: obscure, decoration: const InputDecoration(labelText: 'Confirmar contraseña')),
              ],
            ),
          ),
          const SizedBox(height: 16),
          FilledButton(onPressed: busy ? null : _save, child: Text(busy ? 'Guardando…' : 'Guardar')),
        ],
      ),
    );
  }
}
