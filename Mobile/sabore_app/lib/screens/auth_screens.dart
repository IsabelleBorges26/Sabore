import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';

/// Tela Unificada de Autenticação (Login, Cadastro com Medidor de Força de Senha,
/// Recuperação de Senha e Seletor de Servidor API) idêntica a `Front-End/login/index.html`
class AuthScreen extends StatefulWidget {
  final bool startOnRegister;
  final VoidCallback onBackToLanding;
  final VoidCallback onAuthenticated;

  const AuthScreen({
    super.key,
    this.startOnRegister = false,
    required this.onBackToLanding,
    required this.onAuthenticated,
  });

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final ApiService _api = ApiService.instance;
  late bool _isRegisterTab;

  // Controllers Login
  final _loginEmailCtrl = TextEditingController();
  final _loginPassCtrl = TextEditingController();
  bool _obscureLoginPass = true;
  bool _rememberMe = true;

  // Controllers Cadastro
  final _regNameCtrl = TextEditingController();
  final _regEmailCtrl = TextEditingController();
  final _regPassCtrl = TextEditingController();
  final _regConfirmPassCtrl = TextEditingController();
  bool _obscureRegPass = true;
  bool _acceptTerms = true;

  String? _feedbackMessage;
  bool _isFeedbackError = false;

  @override
  void initState() {
    super.initState();
    _isRegisterTab = widget.startOnRegister;
  }

  @override
  void dispose() {
    _loginEmailCtrl.dispose();
    _loginPassCtrl.dispose();
    _regNameCtrl.dispose();
    _regEmailCtrl.dispose();
    _regPassCtrl.dispose();
    _regConfirmPassCtrl.dispose();
    super.dispose();
  }

  int _calculatePasswordStrength(String pass) {
    if (pass.isEmpty) return 0;
    int score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 8 && RegExp(r'[A-Z]').hasMatch(pass)) score++;
    if (RegExp(r'[0-9]').hasMatch(pass)) score++;
    if (RegExp(r'[^A-Za-z0-9]').hasMatch(pass) || pass.length >= 12) score++;
    return score.clamp(1, 4);
  }

  Future<void> _handleLogin() async {
    final email = _loginEmailCtrl.text.trim();
    final pass = _loginPassCtrl.text;
    if (email.isEmpty || !email.contains('@')) {
      setState(() {
        _feedbackMessage = 'Por favor, informe um e-mail válido.';
        _isFeedbackError = true;
      });
      return;
    }
    if (pass.isEmpty) {
      setState(() {
        _feedbackMessage = 'Por favor, digite sua senha.';
        _isFeedbackError = true;
      });
      return;
    }

    setState(() => _feedbackMessage = null);
    final res = await _api.login(email, pass);
    if (!mounted) return;
    if (res.ok) {
      widget.onAuthenticated();
    } else {
      setState(() {
        _feedbackMessage = res.message;
        _isFeedbackError = true;
      });
    }
  }

  Future<void> _handleRegister() async {
    final nome = _regNameCtrl.text.trim();
    final email = _regEmailCtrl.text.trim();
    final pass = _regPassCtrl.text;
    final confirm = _regConfirmPassCtrl.text;

    if (nome.length < 2) {
      setState(() {
        _feedbackMessage = 'Informe seu nome completo.';
        _isFeedbackError = true;
      });
      return;
    }
    if (!email.contains('@')) {
      setState(() {
        _feedbackMessage = 'Informe um endereço de e-mail válido.';
        _isFeedbackError = true;
      });
      return;
    }
    if (pass.length < 6) {
      setState(() {
        _feedbackMessage = 'A senha deve ter pelo menos 6 caracteres.';
        _isFeedbackError = true;
      });
      return;
    }
    if (pass != confirm) {
      setState(() {
        _feedbackMessage = 'As senhas digitadas não coincidem.';
        _isFeedbackError = true;
      });
      return;
    }
    if (!_acceptTerms) {
      setState(() {
        _feedbackMessage = 'Você precisa aceitar os Termos de Uso do Saboré.';
        _isFeedbackError = true;
      });
      return;
    }

    setState(() => _feedbackMessage = null);
    final res = await _api.register(nome: nome, email: email, password: pass);
    if (!mounted) return;
    if (res.ok && _api.isAuthenticated) {
      widget.onAuthenticated();
    } else {
      setState(() {
        _feedbackMessage = res.message;
        _isFeedbackError = !res.ok;
        if (res.ok) _isRegisterTab = false;
      });
    }
  }

  Future<void> _handleSocialLogin(String provider) async {
    setState(() => _feedbackMessage = null);
    final res = await _api.loginWithSocialProvider(provider);
    if (!mounted) return;
    if (res.ok && _api.isAuthenticated) {
      widget.onAuthenticated();
    } else if (!res.ok) {
      setState(() {
        _feedbackMessage = res.message;
        _isFeedbackError = true;
      });
    }
  }

  Widget _buildSocialLoginSection({required bool isRegister}) {
    final dividerLabel = isRegister ? 'ou cadastre-se com' : 'ou continue com';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              child: Divider(
                color: Colors.white.withValues(alpha: 0.12),
                thickness: 1,
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text(
                dividerLabel,
                style: AppTextStyles.bodyMuted.copyWith(fontSize: 12.5),
              ),
            ),
            Expanded(
              child: Divider(
                color: Colors.white.withValues(alpha: 0.12),
                thickness: 1,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: _api.isLoading ? null : () => _handleSocialLogin('google'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 12),
                  backgroundColor: Colors.white.withValues(alpha: 0.04),
                  side: BorderSide(color: Colors.white.withValues(alpha: 0.14)),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Image.asset(
                      'assets/images/logo_google.png',
                      width: 20,
                      height: 20,
                      errorBuilder: (_, __, ___) => const Icon(
                        Icons.g_mobiledata_rounded,
                        size: 24,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(width: 10),
                    const Text(
                      'Google',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton(
                onPressed: _api.isLoading ? null : () => _handleSocialLogin('facebook'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 12),
                  backgroundColor: Colors.white.withValues(alpha: 0.04),
                  side: BorderSide(color: Colors.white.withValues(alpha: 0.14)),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.facebook_rounded,
                      size: 21,
                      color: Color(0xFF1877F2),
                    ),
                    SizedBox(width: 9),
                    Text(
                      'Facebook',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  void _openForgotPasswordDialog() {
    final emailCtrl = TextEditingController(text: _loginEmailCtrl.text.trim());
    bool sending = false;

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setDialogState) {
            return AlertDialog(
              title: Text('Recuperar Senha', style: AppTextStyles.headingSm),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Digite seu e-mail cadastrado. Enviaremos um link de redefinição de senha.',
                    style: AppTextStyles.bodyMuted,
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      labelText: 'E-mail cadastrado',
                      prefixIcon: Icon(Icons.email_outlined),
                    ),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(ctx).pop(),
                  child: const Text('Cancelar'),
                ),
                ElevatedButton(
                  onPressed: sending
                      ? null
                      : () async {
                          if (!emailCtrl.text.contains('@')) return;
                          setDialogState(() => sending = true);
                          final res = await _api.resetPassword(emailCtrl.text);
                          if (ctx.mounted) {
                            Navigator.of(ctx).pop();
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(res.message)),
                            );
                          }
                        },
                  child: Text(sending ? 'Enviando...' : 'Enviar Link'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _openServerConfigDialog() {
    final urlCtrl = TextEditingController(text: _api.baseUrl);
    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: Text('Conexão com a API Saboré', style: AppTextStyles.headingSm),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'O aplicativo conecta-se automaticamente à API de produção ou ao seu servidor local.',
                style: AppTextStyles.bodyMuted,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: urlCtrl,
                decoration: const InputDecoration(
                  labelText: 'URL da API Saboré',
                  prefixIcon: Icon(Icons.dns_outlined),
                ),
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  ActionChip(
                    label: const Text('Vercel (Produção)', style: TextStyle(fontSize: 11.5)),
                    onPressed: () => urlCtrl.text = ApiService.vercelApiUrl,
                  ),
                  ActionChip(
                    label: const Text('Localhost (3000)', style: TextStyle(fontSize: 11.5)),
                    onPressed: () => urlCtrl.text = 'http://localhost:3000',
                  ),
                  ActionChip(
                    label: const Text('Android Emulador (10.0.2.2)', style: TextStyle(fontSize: 11.5)),
                    onPressed: () => urlCtrl.text = 'http://10.0.2.2:3000',
                  ),
                ],
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cancelar'),
            ),
            ElevatedButton(
              onPressed: () async {
                await _api.setBaseUrl(urlCtrl.text);
                if (ctx.mounted) {
                  Navigator.of(ctx).pop();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Servidor atualizado para: ${_api.baseUrl}')),
                  );
                }
              },
              child: const Text('Salvar'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _api,
      builder: (context, _) {
        final strength = _calculatePasswordStrength(_regPassCtrl.text);
        final strengthLabels = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'];
        final strengthColors = [
          Colors.transparent,
          AppColors.danger,
          AppColors.warning,
          AppColors.info,
          AppColors.success,
        ];

        return Scaffold(
          body: Container(
            decoration: const BoxDecoration(gradient: AppColors.darkBackgroundGradient),
            child: SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 20),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 460),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            TextButton.icon(
                              onPressed: widget.onBackToLanding,
                              icon: const Icon(Icons.arrow_back_rounded, size: 18, color: AppColors.secondary),
                              label: const Text(
                                'Voltar ao Início',
                                style: TextStyle(color: AppColors.secondary),
                              ),
                            ),
                            IconButton(
                              tooltip: 'Configurar Servidor API',
                              onPressed: _openServerConfigDialog,
                              icon: const Icon(Icons.settings_ethernet_rounded, color: AppColors.textMuted),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        // Cabeçalho com Logo Saboré
                        Center(
                          child: Column(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(18),
                                child: Image.asset(
                                  'assets/images/logo_sabore.png',
                                  width: 68,
                                  height: 68,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => Container(
                                    width: 68,
                                    height: 68,
                                    decoration: const BoxDecoration(
                                      gradient: AppColors.accentGradient,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(Icons.restaurant_menu_rounded, color: Colors.white, size: 32),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 12),
                              Text('Saboré', style: AppTextStyles.headingXL),
                              const SizedBox(height: 4),
                              Text(
                                'Saboreie novas possibilidades',
                                style: AppTextStyles.subtitle.copyWith(fontSize: 13.5),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Card Principal de Autenticação
                        Container(
                          padding: const EdgeInsets.all(22),
                          decoration: BoxDecoration(
                            color: AppColors.darkCard,
                            borderRadius: BorderRadius.circular(22),
                            border: Border.all(color: AppColors.glassBorder),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.35),
                                blurRadius: 24,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              // Seletor de Abas Entrar / Criar Conta
                              Container(
                                padding: const EdgeInsets.all(4),
                                decoration: BoxDecoration(
                                  color: AppColors.darkDeep,
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: GestureDetector(
                                        onTap: () => setState(() {
                                          _isRegisterTab = false;
                                          _feedbackMessage = null;
                                        }),
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(vertical: 11),
                                          decoration: BoxDecoration(
                                            gradient: !_isRegisterTab ? AppColors.accentGradient : null,
                                            borderRadius: BorderRadius.circular(10),
                                          ),
                                          alignment: Alignment.center,
                                          child: Text(
                                            'Entrar',
                                            style: TextStyle(
                                              fontWeight: FontWeight.w700,
                                              color: !_isRegisterTab ? Colors.white : AppColors.textMuted,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                    Expanded(
                                      child: GestureDetector(
                                        onTap: () => setState(() {
                                          _isRegisterTab = true;
                                          _feedbackMessage = null;
                                        }),
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(vertical: 11),
                                          decoration: BoxDecoration(
                                            gradient: _isRegisterTab ? AppColors.accentGradient : null,
                                            borderRadius: BorderRadius.circular(10),
                                          ),
                                          alignment: Alignment.center,
                                          child: Text(
                                            'Criar Conta',
                                            style: TextStyle(
                                              fontWeight: FontWeight.w700,
                                              color: _isRegisterTab ? Colors.white : AppColors.textMuted,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 20),

                              if (_feedbackMessage != null) ...[
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  margin: const EdgeInsets.only(bottom: 16),
                                  decoration: BoxDecoration(
                                    color: (_isFeedbackError ? AppColors.danger : AppColors.success)
                                        .withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: _isFeedbackError ? AppColors.danger : AppColors.success,
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(
                                        _isFeedbackError ? Icons.error_outline : Icons.check_circle_outline,
                                        color: _isFeedbackError ? AppColors.danger : AppColors.success,
                                        size: 20,
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Text(
                                          _feedbackMessage!,
                                          style: const TextStyle(fontSize: 13),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],

                              if (!_isRegisterTab) ...[
                                // FORMULÁRIO DE LOGIN
                                TextField(
                                  controller: _loginEmailCtrl,
                                  keyboardType: TextInputType.emailAddress,
                                  decoration: const InputDecoration(
                                    labelText: 'E-mail',
                                    hintText: 'seu@email.com',
                                    prefixIcon: Icon(Icons.email_outlined),
                                  ),
                                ),
                                const SizedBox(height: 14),
                                TextField(
                                  controller: _loginPassCtrl,
                                  obscureText: _obscureLoginPass,
                                  onSubmitted: (_) => _handleLogin(),
                                  decoration: InputDecoration(
                                    labelText: 'Senha',
                                    hintText: '••••••••',
                                    prefixIcon: const Icon(Icons.lock_outline_rounded),
                                    suffixIcon: IconButton(
                                      onPressed: () => setState(() => _obscureLoginPass = !_obscureLoginPass),
                                      icon: Icon(
                                        _obscureLoginPass
                                            ? Icons.visibility_outlined
                                            : Icons.visibility_off_outlined,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    Checkbox(
                                      visualDensity: VisualDensity.compact,
                                      value: _rememberMe,
                                      onChanged: (v) => setState(() => _rememberMe = v ?? true),
                                    ),
                                    const Expanded(
                                      child: Text(
                                        'Lembrar de mim',
                                        style: TextStyle(fontSize: 12.5),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    TextButton(
                                      onPressed: _openForgotPasswordDialog,
                                      style: TextButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(horizontal: 6),
                                      ),
                                      child: const Text(
                                        'Esqueceu a senha?',
                                        style: TextStyle(color: AppColors.secondary, fontSize: 12.5),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                ElevatedButton(
                                  onPressed: _api.isLoading ? null : _handleLogin,
                                  style: ElevatedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(vertical: 15),
                                  ),
                                  child: _api.isLoading
                                      ? const SizedBox(
                                          width: 20,
                                          height: 20,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2.2,
                                            color: Colors.white,
                                          ),
                                        )
                                      : const Text('Entrar na Minha Cozinha'),
                                ),
                                _buildSocialLoginSection(isRegister: false),
                              ] else ...[
                                // FORMULÁRIO DE CADASTRO
                                TextField(
                                  controller: _regNameCtrl,
                                  decoration: const InputDecoration(
                                    labelText: 'Nome Completo',
                                    hintText: 'Ex: Chef Ana Clara',
                                    prefixIcon: Icon(Icons.person_outline_rounded),
                                  ),
                                ),
                                const SizedBox(height: 12),
                                TextField(
                                  controller: _regEmailCtrl,
                                  keyboardType: TextInputType.emailAddress,
                                  decoration: const InputDecoration(
                                    labelText: 'E-mail',
                                    hintText: 'seu@email.com',
                                    prefixIcon: Icon(Icons.email_outlined),
                                  ),
                                ),
                                const SizedBox(height: 12),
                                TextField(
                                  controller: _regPassCtrl,
                                  obscureText: _obscureRegPass,
                                  onChanged: (_) => setState(() {}),
                                  decoration: InputDecoration(
                                    labelText: 'Senha (mínimo 6 caracteres)',
                                    prefixIcon: const Icon(Icons.lock_outline_rounded),
                                    suffixIcon: IconButton(
                                      onPressed: () => setState(() => _obscureRegPass = !_obscureRegPass),
                                      icon: Icon(
                                        _obscureRegPass
                                            ? Icons.visibility_outlined
                                            : Icons.visibility_off_outlined,
                                      ),
                                    ),
                                  ),
                                ),
                                if (_regPassCtrl.text.isNotEmpty) ...[
                                  const SizedBox(height: 8),
                                  Row(
                                    children: List.generate(4, (idx) {
                                      final active = idx < strength;
                                      return Expanded(
                                        child: Container(
                                          height: 4,
                                          margin: const EdgeInsets.only(right: 4),
                                          decoration: BoxDecoration(
                                            color: active ? strengthColors[strength] : AppColors.darkDeep,
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                        ),
                                      );
                                    }),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Força da senha: ${strengthLabels[strength]}',
                                    style: TextStyle(
                                      fontSize: 11.5,
                                      color: strengthColors[strength],
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                                const SizedBox(height: 12),
                                TextField(
                                  controller: _regConfirmPassCtrl,
                                  obscureText: _obscureRegPass,
                                  decoration: const InputDecoration(
                                    labelText: 'Confirmar Senha',
                                    prefixIcon: Icon(Icons.verified_user_outlined),
                                  ),
                                ),
                                const SizedBox(height: 10),
                                Row(
                                  children: [
                                    Checkbox(
                                      value: _acceptTerms,
                                      onChanged: (v) => setState(() => _acceptTerms = v ?? false),
                                    ),
                                    Expanded(
                                      child: Text(
                                        'Concordo com os Termos de Uso e Política de Privacidade do Saboré.',
                                        style: AppTextStyles.bodyMuted.copyWith(fontSize: 12),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                ElevatedButton(
                                  onPressed: _api.isLoading ? null : _handleRegister,
                                  style: ElevatedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(vertical: 15),
                                  ),
                                  child: _api.isLoading
                                      ? const SizedBox(
                                          width: 20,
                                          height: 20,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2.2,
                                            color: Colors.white,
                                          ),
                                        )
                                      : const Text('Criar Minha Conta Gratuita'),
                                ),
                                _buildSocialLoginSection(isRegister: true),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

