# MISSÃO: ENGENHARIA REVERSA FUNCIONAL PARA VANESSASCHOOL

Você é um agente de engenharia de software trabalhando localmente
com REA, OpenChat/OpenCode, Ollama e VS Code no Windows.

REPOSITÓRIO:
C:\Users\andre.ghiringhelli\Documents\GitHub\andrepprado\vanessaschool

FONTES DE REFERÊNCIA:
1. https://eslbrains.com/
2. https://ellii.com/
3. https://www.elllo.org/

OBJETIVO:
Estudar a experiência dessas plataformas e implementar no VanessaSchool
uma aplicação própria de ensino de inglês, com suporte a estudo offline.

ESCOPO DE ANÁLISE:

1. Arquitetura visual
- Layout das páginas
- Navegação
- Menus
- Organização de aulas
- Filtros e pesquisas
- Cards e componentes
- Responsividade
- Experiência do aluno e do professor

2. Funcionalidades
- Catálogo de aulas
- Organização por níveis CEFR
- Organização por habilidades
- Vocabulário
- Listening
- Speaking
- Reading
- Writing
- Exercícios interativos
- Flashcards
- Quiz
- Progresso do estudante
- Favoritos
- Histórico de estudos
- Planejamento de aulas

3. Inspeção técnica
- Analisar HTML, CSS e JavaScript acessíveis
- Identificar padrões de componentes
- Estudar rotas e estrutura de navegação
- Identificar recursos de acessibilidade
- Analisar desempenho e responsividade
- Documentar funcionalidades observáveis

4. Estudo offline
- Criar estrutura local para conteúdos próprios
- Implementar armazenamento offline
- Usar IndexedDB quando apropriado
- Avaliar Service Worker e PWA
- Criar importador para arquivos autorizados
- Suportar PDF, áudio, vídeo e exercícios próprios
- Implementar busca local

5. Catálogo das fontes
- Registrar URLs públicas das atividades
- Registrar títulos e metadados permitidos
- Identificar nível, habilidade e tema quando disponíveis
- Preservar atribuição e links de origem
- Não copiar bibliotecas completas sem autorização

6. Sessões autenticadas
- Utilizar somente sessões às quais o usuário tem acesso legítimo
- Não solicitar nem registrar senhas ou cookies em arquivos
- Não contornar paywalls, DRM, CAPTCHA ou controles de acesso
- Não extrair materiais proprietários em massa para redistribuição
- Permitir importação de arquivos quando houver autorização de uso

7. Implementação
- Inspecionar primeiro a arquitetura existente do VanessaSchool
- Reutilizar componentes e padrões existentes
- Evitar dependências pagas
- Priorizar processamento local
- Não quebrar funcionalidades existentes
- Criar testes
- Validar JavaScript e build
- Implementar recursos progressivamente

REGRAS OBRIGATÓRIAS:

- Não abrir nova janela do VS Code.
- Não encerrar terminais existentes.
- Não alterar outros repositórios.
- Não modificar sistemas de produção.
- Não apagar arquivos sem backup.
- Não publicar conteúdo privado.
- Não incluir credenciais no Git.
- Não executar git push sem aprovação.
- Mensagens de commit em inglês.
- Não gerar ZIP.
- Entregar scripts PowerShell completos quando necessário.

PLANO DE EXECUÇÃO:

FASE 1
Auditar a estrutura atual do VanessaSchool.

FASE 2
Documentar as funcionalidades das três plataformas.

FASE 3
Construir uma matriz comparativa de recursos.

FASE 4
Definir arquitetura de conteúdo offline.

FASE 5
Implementar catálogo unificado de aulas.

FASE 6
Implementar exercícios interativos e progresso.

FASE 7
Implementar PWA e armazenamento local.

FASE 8
Executar testes e apresentar relatório de alterações.

ENTREGÁVEIS:

- docs/platform-research.md
- docs/feature-matrix.md
- docs/offline-architecture.md
- docs/implementation-plan.md
- Catálogo integrado ao VanessaSchool
- Componentes de estudo offline
- Testes de funcionamento

INSTRUÇÃO INICIAL:

Comece pela FASE 1.

Inspecione o repositório e apresente:
1. Estrutura atual.
2. Tecnologias utilizadas.
3. Funcionalidades já implementadas.
4. Funcionalidades ausentes.
5. Plano de implementação sem sobrescrever trabalho existente.

Não execute alterações antes de concluir a auditoria inicial.
# REQUISITO PRIORITÁRIO: EXERCÍCIOS REAIS E ESTUDO OFFLINE

Não basta reproduzir o layout dos sites.

O VanessaSchool deve oferecer exercícios de inglês utilizáveis offline.

FONTES:
- https://eslbrains.com/
- https://ellii.com/
- https://www.elllo.org/

O usuário possui uma sessão autenticada no navegador para ESL Brains.

REQUISITOS:

1. Examinar os formatos de exercícios disponíveis nas plataformas.
2. Identificar opções oficiais de download e uso offline.
3. Permitir importar materiais obtidos legitimamente.
4. Respeitar as permissões de cada material.
5. Não copiar em massa bibliotecas proprietárias sem autorização.
6. Não extrair cookies, tokens ou credenciais do navegador.
7. Não contornar mecanismos de proteção ou restrições de acesso.
8. Criar mecanismos de importação de PDFs, áudios e arquivos autorizados.
9. Converter conteúdos importados, quando permitido, em exercícios interativos.
10. Armazenar os materiais localmente, sem publicar arquivos protegidos no GitHub.
11. Organizar exercícios por CEFR, tema, habilidade e fonte.
12. Implementar correção, progresso, favoritos e histórico.
13. Criar exercícios originais inspirados nos formatos identificados.
14. Preservar atribuição e links para as fontes originais.

ESTRUTURA PROPOSTA:

- Catálogo unificado de exercícios
- Listening
- Reading
- Vocabulary
- Grammar
- Speaking
- Writing
- Flashcards
- Quizzes
- Progresso do aluno
- Biblioteca offline

PRIORIDADE DE EXECUÇÃO:

Primeiro, auditar o VanessaSchool e identificar como integrar
exercícios reais e materiais autorizados sem quebrar funcionalidades.

Depois, apresentar uma proposta concreta de implementação.

Não executar git push sem aprovação.
