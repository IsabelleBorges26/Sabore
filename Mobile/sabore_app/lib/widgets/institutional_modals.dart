import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';

/// Modais institucionais completos do Saboré (Sobre Nós, FAQ e Documentos Legais:
/// Termos de Uso, Política de Privacidade, Política de Cookies e LGPD).

const List<({String q, String a})> kSaboreFaqItems = [
  (
    q: 'O Saboré é gratuito?',
    a: 'Sim! O plano FREE do Saboré é 100% gratuito e inclui criação de livros de receitas, geladeira inteligente, participação na comunidade, desafios semanais, eventos especiais e créditos mensais gratuitos para o Chef IA (5 gerações/mês), Scanner IA por Foto (2/mês) e Importador de Vídeos (2/mês).',
  ),
  (
    q: 'Como funciona a IA de receitas?',
    a: 'Nosso Chef IA utiliza modelos avançados de inteligência artificial gastronômica integrados à sua Geladeira/Despensa e às suas restrições alimentares (Vegano, Sem Glúten, Sem Lactose, Low Carb, Keto) para criar receitas completas com ingredientes medidos e modo de preparo passo a passo.',
  ),
  (
    q: 'Como conquistar o Saboré PRO gratuitamente?',
    a: 'No Saboré, o plano PRO é conquistado por mérito! Ao publicar receitas (+10 pts), participar do Desafio da Semana (+30 pts), comentar (+3 pts) e avaliar (+2 pts), você soma pontos no Ranking PRO Mensal. Os 5 primeiros colocados (G-5) no fechamento do mês ganham 30 dias de Saboré PRO com IA ilimitada!',
  ),
  (
    q: 'Como funciona a importação de vídeos?',
    a: 'Basta colar o link de qualquer vídeo culinário do YouTube na aba "Importar Vídeo". O Saboré analisa os metadados e a transcrição do vídeo para extrair automaticamente o título, tempo de preparo, lista de ingredientes e todas as etapas numeradas.',
  ),
  (
    q: 'Meus dados e receitas estão seguros?',
    a: 'Totalmente! Utilizamos autenticação criptografada via Supabase Auth (E-mail/Senha, Google e Facebook OAuth) e banco de dados PostgreSQL em conformidade com a LGPD (Lei Geral de Proteção de Dados). Você controla quais receitas são privadas nos seus livros e quais são públicas na comunidade.',
  ),
  (
    q: 'Como funcionam os Desafios Semanais e Eventos Especiais?',
    a: 'Toda semana lançamos um novo tema gastronômico valendo +30 pontos no Ranking PRO. Além disso, realizamos Eventos Especiais sazonais (como Natal Saboré e Réveillon) com inscrição oficial de receitas, votação aberta da comunidade e premiação com Emblemas Exclusivos, Molduras Comemorativas e 30 dias de PRO!',
  ),
];

Future<void> showAboutSaboreModal(BuildContext context) async {
  await showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.dark,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (ctx) {
      return DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.85,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (_, scrollCtrl) {
          return ListView(
            controller: scrollCtrl,
            padding: const EdgeInsets.fromLTRB(22, 16, 22, 36),
            children: [
              Row(
                children: [
                  const Icon(Icons.restaurant_menu_rounded, color: AppColors.accent),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text('Sobre o Saboré', style: AppTextStyles.headingLg),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(ctx).pop(),
                    icon: const Icon(Icons.close_rounded),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Saboreie novas possibilidades na sua cozinha inteligente.',
                style: AppTextStyles.subtitle.copyWith(color: AppColors.secondary),
              ),
              const SizedBox(height: 16),
              _sectionCard(
                icon: Icons.flag_rounded,
                title: 'Nossa Missão',
                body:
                    'Democratizar a alta gastronomia caseira unindo Inteligência Artificial generativa, visão computacional e uma comunidade vibrante de apaixonados por culinária, ajudando a reduzir o desperdício de alimentos e transformar ingredientes do dia a dia em pratos memoráveis.',
              ),
              _sectionCard(
                icon: Icons.visibility_rounded,
                title: 'Nossa Visão',
                body:
                    'Ser o ecossistema gastronômico digital referência na América Latina, onde tecnologia e criatividade culinária caminham juntas em experiências Web e Mobile integradas.',
              ),
              _sectionCard(
                icon: Icons.auto_awesome_rounded,
                title: 'Pilares Tecnológicos',
                body:
                    '• Chef IA Personalizado: Geração de receitas adaptadas à sua geladeira, tempo e dieta.\n'
                    '• Visão Computacional: Identificação de pratos e ingredientes por foto com grau de confiança.\n'
                    '• Extração Inteligente de Vídeos: Conversão de vídeos do YouTube em receitas estruturadas.\n'
                    '• Gamificação por Mérito: Ranking PRO mensal, Desafios Semanais, Eventos Sazonais, Emblemas e Molduras.',
              ),
              _sectionCard(
                icon: Icons.favorite_rounded,
                title: 'Nossos Valores',
                body:
                    '1. Criatividade sem desperdício\n'
                    '2. Comunidade colaborativa e meritocrática\n'
                    '3. Privacidade, segurança e transparência (LGPD)\n'
                    '4. Excelência visual e facilidade de uso em qualquer dispositivo',
              ),
            ],
          );
        },
      );
    },
  );
}

Future<void> showLegalDocsModal(BuildContext context, {int initialTab = 0}) async {
  int currentTab = initialTab;

  const tabs = [
    (
      title: 'Termos de Uso',
      content: '''1. ACEITAÇÃO DOS TERMOS
Ao acessar e utilizar a plataforma Saboré (Web e Mobile), você concorda integralmente com estes Termos de Uso.

2. CADASTRO E CONTA DO USUÁRIO
O acesso aos recursos do Dashboard é realizado mediante conta autenticada por e-mail/senha ou provedores sociais (Google e Facebook via Supabase Auth). O usuário é responsável pela veracidade das informações cadastradas.

3. PLANOS FREE, RANKING PRO E CRÉDITOS DE IA
• O Plano FREE concede mensalmente 5 créditos no Chef IA, 2 créditos no Scanner IA por Foto e 2 créditos no Importador de Vídeos.
• O Plano Saboré PRO libera uso ilimitado dessas ferramentas e pode ser conquistado gratuitamente por mérito ficando entre os 5 primeiros colocados (Top 5) no fechamento mensal do Ranking PRO ou vencendo Eventos Especiais oficiais.

4. CONTEÚDO PUBLICADO NA COMUNIDADE
Ao tornar uma receita pública ou participar dos Desafios Semanais e Eventos Especiais, o usuário declara ser o autor do conteúdo ou deter direitos sobre a imagem enviada, concedendo ao Saboré licença não exclusiva de exibição dentro da plataforma.

5. CONDUTA E MODERAÇÃO
Não é permitido publicar conteúdos ofensivos, fraudulentos ou fora do escopo gastronômico. A equipe administrativa pode moderar ou remover participações que violem as regras dos eventos.'''
    ),
    (
      title: 'Privacidade',
      content: '''1. COLETA DE DADOS
Coletamos apenas os dados essenciais para o funcionamento da sua cozinha inteligente: nome, e-mail, foto de perfil opcional, receitas cadastradas, ingredientes da despensa e interações sociais na comunidade.

2. USO DAS INFORMAÇÕES
Seus dados culinários (bio, restrições alimentares e ingredientes disponíveis) são utilizados exclusivamente para personalizar as sugestões do Chef IA e sincronizar seus livros entre o Saboré Web e o Saboré Mobile.

3. COMPARTILHAMENTO E SEGURANÇA
Não vendemos nem compartilhamos seus dados pessoais com terceiros para fins publicitários. Toda a comunicação utiliza conexões seguras e tokens JWT autenticados pelo Supabase.'''
    ),
    (
      title: 'Cookies & Armazenamento',
      content: '''1. ARMAZENAMENTO LOCAL
O Saboré utiliza armazenamento local seguro (LocalStorage no navegador e armazenamento criptografado/JSON no aplicativo Mobile) para:
• Manter sua sessão ativa com segurança (`sabore_token` e `sabore_user`);
• Preservar suas preferências padrão do Chef IA (dificuldade, porções e restrições alimentares);
• Salvar seu histórico de conversas com o Chef IA e estado de leitura de notificações.

2. CONTROLE DO USUÁRIO
Você pode limpar o cache e restaurar as preferências locais a qualquer momento na aba "Configurações" do aplicativo.'''
    ),
    (
      title: 'LGPD',
      content: '''1. SEUS DIREITOS SEGUNDO A LGPD (LEI Nº 13.709/2018)
Em total conformidade com a Lei Geral de Proteção de Dados Pessoais, o Saboré garante a você:
• Confirmação e acesso a todos os seus dados armazenados na aba Perfil e Configurações;
• Correção imediata de dados pessoais (nome, e-mail, foto, bio e preferências);
• Controle de visibilidade (alternar qualquer receita entre Pública e Privada a qualquer instante);
• Exclusão definitiva da conta e de todos os dados associados diretamente na aba Configurações ("Encerrar / Excluir Minha Conta").

2. CANAL DE ATENDIMENTO AO TITULAR
Para dúvidas ou solicitações adicionais relacionadas à proteção de dados, utilize o formulário oficial "Fale Conosco" na página inicial.'''
    ),
  ];

  await showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.dark,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (ctx) {
      return StatefulBuilder(
        builder: (ctx, setState) {
          final active = tabs[currentTab];
          return DraggableScrollableSheet(
            expand: false,
            initialChildSize: 0.85,
            minChildSize: 0.5,
            maxChildSize: 0.95,
            builder: (_, scrollCtrl) {
              return ListView(
                controller: scrollCtrl,
                padding: const EdgeInsets.fromLTRB(22, 16, 22, 36),
                children: [
                  Row(
                    children: [
                      const Icon(Icons.verified_user_rounded, color: AppColors.accent),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text('Central Legal & LGPD', style: AppTextStyles.headingMd),
                      ),
                      IconButton(
                        onPressed: () => Navigator.of(ctx).pop(),
                        icon: const Icon(Icons.close_rounded),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: List.generate(tabs.length, (i) {
                        final selected = i == currentTab;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text(tabs[i].title),
                            selected: selected,
                            selectedColor: AppColors.accent,
                            onSelected: (_) => setState(() => currentTab = i),
                          ),
                        );
                      }),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: AppColors.darkCard,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppColors.glassBorder),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(active.title, style: AppTextStyles.headingMd),
                        const SizedBox(height: 12),
                        Text(
                          active.content,
                          style: AppTextStyles.bodyLg.copyWith(height: 1.55),
                        ),
                      ],
                    ),
                  ),
                ],
              );
            },
          );
        },
      );
    },
  );
}

Widget _sectionCard({
  required IconData icon,
  required String title,
  required String body,
}) {
  return Container(
    margin: const EdgeInsets.only(bottom: 14),
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: AppColors.darkCard,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: AppColors.glassBorder),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: AppColors.accent, size: 20),
            const SizedBox(width: 8),
            Text(title, style: AppTextStyles.headingSm),
          ],
        ),
        const SizedBox(height: 8),
        Text(body, style: AppTextStyles.body.copyWith(height: 1.5)),
      ],
    ),
  );
}

