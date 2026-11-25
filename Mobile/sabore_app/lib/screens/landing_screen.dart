import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';
import '../widgets/institutional_modals.dart';

/// Tela Inicial Pública (Landing Page + Fale Conosco `/contato` + Estatísticas `/estatisticas/publicas`
/// + FAQ Oficial + Sobre Nós + Termos de Uso, Privacidade, Cookies e LGPD)
class LandingScreen extends StatefulWidget {
  final VoidCallback onNavigateToLogin;
  final VoidCallback onNavigateToRegister;

  const LandingScreen({
    super.key,
    required this.onNavigateToLogin,
    required this.onNavigateToRegister,
  });

  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen> {
  final ApiService _api = ApiService.instance;

  @override
  void initState() {
    super.initState();
    _api.fetchPublicStats();
  }

  void _openContactModal() {
    final nomeCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    final msgCtrl = TextEditingController();
    // Valores exatos validados por Back-End/src/controllers/contato.controllers.js:
    // ['suporte', 'conta', 'planos', 'parceria', 'sugestao', 'outro']
    String assunto = 'suporte';
    bool sending = false;
    String? errorMsg;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.dark,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 22,
                right: 22,
                top: 20,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
              ),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.mail_outline_rounded,
                            color: AppColors.accent),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text('Fale Conosco — Saboré',
                              style: AppTextStyles.headingMd),
                        ),
                        IconButton(
                          onPressed: () => Navigator.of(ctx).pop(),
                          icon: const Icon(Icons.close_rounded),
                        ),
                      ],
                    ),
                    Text(
                      'Envie sua dúvida, sugestão ou feedback diretamente para nossa equipe.',
                      style: AppTextStyles.bodyMuted,
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: nomeCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Seu Nome',
                        prefixIcon: Icon(Icons.person_outline_rounded),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(
                        labelText: 'Seu E-mail',
                        prefixIcon: Icon(Icons.alternate_email_rounded),
                      ),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: assunto,
                      dropdownColor: AppColors.darkCard,
                      decoration: const InputDecoration(
                        labelText: 'Assunto',
                        prefixIcon: Icon(Icons.topic_outlined),
                      ),
                      items: const [
                        DropdownMenuItem(
                            value: 'suporte', child: Text('Suporte Técnico')),
                        DropdownMenuItem(
                            value: 'conta',
                            child: Text('Minha Conta & Acesso')),
                        DropdownMenuItem(
                            value: 'planos',
                            child: Text('Ranking PRO & Planos')),
                        DropdownMenuItem(
                            value: 'sugestao',
                            child: Text('Sugestão de Recurso')),
                        DropdownMenuItem(
                            value: 'parceria',
                            child: Text('Parcerias Comerciais')),
                        DropdownMenuItem(
                            value: 'outro', child: Text('Outro Assunto')),
                      ],
                      onChanged: (v) =>
                          setModalState(() => assunto = v ?? 'suporte'),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: msgCtrl,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        labelText: 'Mensagem (mínimo 10 caracteres)',
                        alignLabelWithHint: true,
                      ),
                    ),
                    if (errorMsg != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        errorMsg!,
                        style: const TextStyle(
                            color: AppColors.danger, fontSize: 12.5),
                      ),
                    ],
                    const SizedBox(height: 18),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: sending
                            ? null
                            : () async {
                                if (nomeCtrl.text.trim().length < 2) {
                                  setModalState(() =>
                                      errorMsg = 'Informe seu nome completo.');
                                  return;
                                }
                                if (!emailCtrl.text.contains('@')) {
                                  setModalState(() =>
                                      errorMsg = 'Informe um e-mail válido.');
                                  return;
                                }
                                if (msgCtrl.text.trim().length < 10) {
                                  setModalState(
                                    () => errorMsg =
                                        'Sua mensagem deve ter pelo menos 10 caracteres.',
                                  );
                                  return;
                                }
                                setModalState(() {
                                  sending = true;
                                  errorMsg = null;
                                });
                                final res = await _api.sendContactMessage(
                                  nome: nomeCtrl.text,
                                  email: emailCtrl.text,
                                  assunto: assunto,
                                  mensagem: msgCtrl.text,
                                );
                                if (ctx.mounted) {
                                  setModalState(() => sending = false);
                                  if (res.ok) {
                                    Navigator.of(ctx).pop();
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text(res.message)),
                                    );
                                  } else {
                                    setModalState(() => errorMsg = res.message);
                                  }
                                }
                              },
                        icon: sending
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Icon(Icons.send_rounded, size: 18),
                        label:
                            Text(sending ? 'Enviando...' : 'Enviar Mensagem'),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _api,
      builder: (context, _) {
        final stats = _api.publicStats;
        final receitasCount = stats['receitas'] ?? stats['totalReceitas'];
        final usuariosCount = stats['usuarios'] ?? stats['totalUsuarios'];
        final avalCount = stats['totalAvaliacoes'];
        final mediaAval = stats['avaliacaoMedia'] ?? stats['mediaSatisfacao'];
        final statsAvailable = _api.publicStatsLoaded;

        return Scaffold(
          body: Container(
            decoration:
                const BoxDecoration(gradient: AppColors.darkBackgroundGradient),
            child: SafeArea(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 14, 20, 40),
                children: [
                  // Top Navbar
                  Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.asset(
                          'assets/images/logo_sabore.png',
                          width: 42,
                          height: 42,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            width: 42,
                            height: 42,
                            decoration: const BoxDecoration(
                              gradient: AppColors.accentGradient,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.restaurant_menu_rounded,
                                color: Colors.white),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Saboré', style: AppTextStyles.headingMd),
                            Text(
                              'Saboreie novas possibilidades',
                              style: AppTextStyles.bodyMuted
                                  .copyWith(fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                      TextButton(
                        onPressed: () => showAboutSaboreModal(context),
                        child: const Text('Sobre',
                            style: TextStyle(color: AppColors.secondary)),
                      ),
                      TextButton(
                        onPressed: _openContactModal,
                        child: const Text('Contato',
                            style: TextStyle(color: AppColors.secondary)),
                      ),
                      const SizedBox(width: 4),
                      OutlinedButton(
                        onPressed: widget.onNavigateToLogin,
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 10),
                        ),
                        child: const Text('Entrar'),
                      ),
                    ],
                  ),

                  const SizedBox(height: 32),

                  // Badge Superior
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.accent.withValues(alpha: 0.14),
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(color: AppColors.accentBorder),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.auto_awesome_rounded,
                              color: AppColors.accent, size: 15),
                          SizedBox(width: 6),
                          Text(
                            'GASTRONOMIA INTELIGENTE COM IA',
                            style: TextStyle(
                              color: AppColors.secondary,
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Hero Title
                  Text(
                    'Transforme ingredientes em experiências inesquecíveis.',
                    style: AppTextStyles.headingXL.copyWith(fontSize: 32),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    'Organize seus livros de receitas, gere pratos personalizados com o Chef IA, identifique ingredientes por foto, importe vídeos do YouTube e dispute o Ranking PRO na comunidade Saboré.',
                    style: AppTextStyles.bodyLg
                        .copyWith(color: AppColors.textMuted),
                  ),
                  const SizedBox(height: 24),

                  // Botões CTA Principais
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: widget.onNavigateToRegister,
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                          icon:
                              const Icon(Icons.rocket_launch_rounded, size: 18),
                          label: const Text('Começar Gratuitamente'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: widget.onNavigateToLogin,
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                          icon: const Icon(Icons.login_rounded, size: 18),
                          label: const Text('Já tenho conta'),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 28),

                  // Estatísticas Reais da Plataforma (/estatisticas/publicas)
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      gradient: AppColors.cardGradient,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.glassBorder),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _statColumn(
                          statsAvailable && receitasCount != null
                              ? '$receitasCount+'
                              : '—',
                          'Receitas',
                        ),
                        _statColumn(
                          statsAvailable && usuariosCount != null
                              ? '$usuariosCount+'
                              : '—',
                          'Chefs Ativos',
                        ),
                        _statColumn(
                          statsAvailable && avalCount != null
                              ? '$avalCount+'
                              : '—',
                          'Avaliações',
                        ),
                        _statColumn(
                          statsAvailable && mediaAval != null
                              ? '$mediaAval ★'
                              : '—',
                          'Satisfação',
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 30),
                  Text('Tudo o que sua cozinha precisa',
                      style: AppTextStyles.headingLg),
                  const SizedBox(height: 14),

                  _featureCard(
                    icon: Icons.smart_toy_rounded,
                    title: 'Chef IA & Geladeira Inteligente',
                    description:
                        'Informe os ingredientes disponíveis na sua despensa e receba receitas completas adaptadas ao seu tempo e restrições alimentares.',
                  ),
                  _featureCard(
                    icon: Icons.camera_enhance_rounded,
                    title: 'Scanner de Pratos por Foto',
                    description:
                        'Fotografe qualquer prato ou ingrediente para identificar a receita e o percentual de confiança de cada item.',
                  ),
                  _featureCard(
                    icon: Icons.ondemand_video_rounded,
                    title: 'Importador de Vídeos Culinários',
                    description:
                        'Cole o link de um vídeo do YouTube e extraia automaticamente a lista de ingredientes e o passo a passo estruturado.',
                  ),
                  _featureCard(
                    icon: Icons.emoji_events_rounded,
                    title: 'Desafios Semanais & Ranking PRO',
                    description:
                        'Participe dos desafios gastronômicos, acumule pontos por mérito e conquiste 30 dias de Saboré PRO ficando no Top 5 mensal!',
                  ),
                  _featureCard(
                    icon: Icons.menu_book_rounded,
                    title: 'Livros Digitais & Modo Passo a Passo',
                    description:
                        'Colecione suas receitas favoritas em livros personalizados e cozinhe sem distrações no Modo Passo a Passo.',
                  ),

                  const SizedBox(height: 28),

                  // Seção Oficial de Perguntas Frequentes (FAQ da Landing Page Web)
                  Text('Perguntas Frequentes (FAQ)',
                      style: AppTextStyles.headingLg),
                  const SizedBox(height: 12),
                  ...kSaboreFaqItems.map(
                    (item) => Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      decoration: BoxDecoration(
                        color: AppColors.darkCard,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.glassBorder),
                      ),
                      child: ExpansionTile(
                        iconColor: AppColors.accent,
                        collapsedIconColor: AppColors.secondary,
                        title: Text(
                          item.q,
                          style: AppTextStyles.body
                              .copyWith(fontWeight: FontWeight.w700),
                        ),
                        childrenPadding:
                            const EdgeInsets.fromLTRB(16, 0, 16, 14),
                        children: [
                          Text(item.a,
                              style: AppTextStyles.bodyMuted
                                  .copyWith(height: 1.5)),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 22),
                  Container(
                    padding: const EdgeInsets.all(22),
                    decoration: BoxDecoration(
                      color: AppColors.darkCard,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.accentBorder),
                    ),
                    child: Column(
                      children: [
                        Text(
                          'Ficou com alguma dúvida?',
                          style: AppTextStyles.headingMd,
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Fale diretamente com a equipe Saboré ou crie sua conta gratuita agora mesmo.',
                          textAlign: TextAlign.center,
                          style: AppTextStyles.bodyMuted,
                        ),
                        const SizedBox(height: 16),
                        Wrap(
                          spacing: 12,
                          runSpacing: 10,
                          alignment: WrapAlignment.center,
                          children: [
                            OutlinedButton.icon(
                              onPressed: _openContactModal,
                              icon: const Icon(Icons.mail_outline_rounded,
                                  size: 18),
                              label: const Text('Enviar Mensagem'),
                            ),
                            ElevatedButton(
                              onPressed: widget.onNavigateToRegister,
                              child: const Text('Criar Conta Grátis'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),
                  const Divider(color: AppColors.glassBorder),
                  const SizedBox(height: 12),

                  // Rodapé Institucional & Legal (Sobre Nós, Termos, Privacidade, Cookies, LGPD)
                  Wrap(
                    alignment: WrapAlignment.center,
                    spacing: 14,
                    runSpacing: 6,
                    children: [
                      TextButton(
                        onPressed: () => showAboutSaboreModal(context),
                        child: const Text('Sobre Nós',
                            style: TextStyle(fontSize: 12)),
                      ),
                      TextButton(
                        onPressed: () =>
                            showLegalDocsModal(context, initialTab: 0),
                        child: const Text('Termos de Uso',
                            style: TextStyle(fontSize: 12)),
                      ),
                      TextButton(
                        onPressed: () =>
                            showLegalDocsModal(context, initialTab: 1),
                        child: const Text('Privacidade',
                            style: TextStyle(fontSize: 12)),
                      ),
                      TextButton(
                        onPressed: () =>
                            showLegalDocsModal(context, initialTab: 2),
                        child: const Text('Política de Cookies',
                            style: TextStyle(fontSize: 12)),
                      ),
                      TextButton(
                        onPressed: () =>
                            showLegalDocsModal(context, initialTab: 3),
                        child:
                            const Text('LGPD', style: TextStyle(fontSize: 12)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '© 2026 Saboré — Todos os direitos reservados.',
                    textAlign: TextAlign.center,
                    style: AppTextStyles.bodyMuted.copyWith(fontSize: 11.5),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _statColumn(String number, String label) {
    return Column(
      children: [
        Text(
          number,
          style: AppTextStyles.monoLg
              .copyWith(color: AppColors.accent, fontSize: 20),
        ),
        const SizedBox(height: 4),
        Text(label, style: AppTextStyles.bodyMuted.copyWith(fontSize: 11.5)),
      ],
    );
  }

  Widget _featureCard({
    required IconData icon,
    required String title,
    required String description,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.glassBorder),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.accent.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: AppColors.accent, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: AppTextStyles.headingSm.copyWith(fontSize: 16)),
                const SizedBox(height: 4),
                Text(description, style: AppTextStyles.bodyMuted),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
