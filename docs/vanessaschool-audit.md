# Auditoria técnica — VanessaSchool

Modelo local: qwen2.5-coder:3b
Arquivos analisados: 60

Observação: esta auditoria é baseada em amostras do código.
Funcionalidades não comprovadas devem ser verificadas antes da implementação.

## Lote 1

### Responsabilidade

O arquivo `package.json` é responsável por definir as dependências e configurações do projeto VanessaSchool. Ele é o arquivo de dependências do projeto, que contém todas as bibliotecas e ferramentas que o projeto utiliza.

### Funcionalidades comprovadas

1. **Integração com Supabase**: O projeto utiliza a biblioteca `@supabase/supabase-js` para interagir com o banco de dados Supabase. Isso, o projeto tem a capacidade de realizar operações de leitura, escrita e atualização no banco de dados.

2. **Integração com Firebase Admin**: O projeto utiliza a biblioteca `firebase-admin` para interagir com o Firebase Admin SDK. Isso, o projeto tem a capacidade de realizar operações de autenticação, administração de usuários e outras tarefas relacionadas ao Firebase.

3. **Integração com PostgreSQL**: O projeto utiliza a biblioteca `pg` para interagir com o banco de dados PostgreSQL. Isso, o projeto tem a capacidade de realizar operações de leitura, escrita e atualização no banco de dados PostgreSQL.

### Dependências relevantes

1. `@supabase/supabase-js`: Biblioteca para interagir com o banco de dados Supabase.
2. `firebase-admin`: Biblioteca para interagir com o Firebase Admin SDK.
3. `pg`: Biblioteca para interagir com o banco de dados PostgreSQL.

### Riscos ou lacunas

1. **Dependências antiga**: O projeto utiliza versões antigas das bibliotecas `@supabase/supabase-js`, `firebase-admin` e `pg`. Isso, existem riscos de incompatibilidade com versões mais recentes dessas bibliotecas.

2. **Segurança**: O projeto não tem nenhuma configuração de segurança definida, o que pode levar a vulnerabilidades de segurança.

3. **Desempenho**: O projeto não tem nenhuma configuração de otimização de desempenho definida, o que pode levar a lentidão no desempenho do aplicativo.

4. **Documentação**: O projeto não tem nenhuma documentação clara e completa, o que pode dificultar a manutenção e a escalabilidade do aplicativo.

### Pontos de integração offline

1. **Local Persistence**: O projeto utiliza o banco de dados Supabase para armazenar os dados do usuário, o que permite que o aplicativo funcione offline.

2. **Service Worker**: O projeto utiliza o Service Worker para armazenar os dados do usuário, o que permite que o aplicativo funcione offline.

3. **Vercel Deployment**: O projeto utiliza o Vercel para hospedar o aplicativo, o que permite que o aplicativo funcione offline.

## Lote 2

### Responsabilidade do arquivo `api\admin-students.js`

Este arquivo contém as funcionalidades relacionadas à administração de estudantes na aplicação VanessaSchool. Ele permite criar novos usuários de estudante, verificar permissões de administrador e gerenciar os dados dos estudantes.

### Funcionalidades comprovadas

1. **Verificação de permissões de administrador**: A função `requireAdmin` verifica se o usuário tem permissões de administrador antes de permitir a execução de operações administrativas.
2. **Criação de novos usuários de estudante**: A função `requireAdmin` cria novos usuários de estudante usando o Firebase Authentication.
3. **Normalização de dados**: As funções `normalizeLevel` e `normalizeEmail` normalizam os dados de entrada para garantir que os valores estejam corretos.
4. **Verificação de erros**: A função `errorResponse` retorna respostas de erro com status e mensagem adequadas.
5. **Obtenção de dados**: A função `getBody` obtém o corpo da requisição, normalizando o formato se necessário.
6. **Ordenação de estudantes**: A função `handler` ordena os estudantes por nome em ordem alfabética.

### Dependências relevantes

- `firebase-admin`: Para interação com o Firebase Authentication e Firestore.
- `express`: Para o servidor HTTP.

### Riscos ou lacunas

1. **Segurança**: A verificação de token JWT é feita, mas não há verificações adicionais para evitar ataques de força bruta ou token inválidos.
2. **Validação de dados**: A validação de dados é feita, mas não há verificações adicionais para garantir que os dados estejam dentro dos limites esperados.
3. **Erro de execução**: A função `handler` não trata erros de execução de forma adequada, o que pode levar a falhas inesperadas.

### Pontos de integração offline

1. **Backup de dados**: Não há implementação de backup de dados, o que pode levar a perda de dados em caso de falhas.
2. **Cache**: O cache é definido como `no-store`, o que pode levar a uma sobrecarga desnecessária de requisições ao servidor.
3. **Logs**: Não há implementação de logs, o que pode dificultar a depuração e a monitoração do sistema.

### Responsabilidade do arquivo `api\firebase-admin.js`

Este arquivo inicializa o Firebase Admin SDK para interação com o Firebase Authentication e Firestore.

### Funcionalidades comprovadas

1. **Inicialização do Firebase Admin**: A função `initializeFirebaseAdmin` inicializa o Firebase Admin SDK com as credenciais corretas.
2. **Autenticação**: A função `getAuth` retorna uma instância do Firebase Authentication.
3. **Firestore**: A função `getFirestore` retorna uma instância do Firestore.

### Dependências relevantes

- `firebase-admin`: Para interação com o Firebase Authentication e Firestore.

### Riscos ou lacunas

1. **Segurança**: A inicialização do Firebase Admin não verifica se as credenciais estão corretas, o que pode levar a acesso não autorizado.
2. **Dependência de variáveis de ambiente**: A inicialização do Firebase Admin depende da variável de ambiente `FIREBASE_SERVICE_ACCOUNT_JSON`, o que pode ser um risco se essa variável não estiver configurada corretamente.

### Pontos de integração offline

1. **Backup de dados**: Não há implementação de backup de dados, o que pode levar a perda de dados em caso de falhas.
2. **Cache**: O cache não é definido, o que pode levar a uma sobrecarga desnecessária de requisições ao servidor.
3. **Logs**: Não há implementação de logs, o que pode dificultar a depuração e a monitoração do sistema.

### Responsabilidade do arquivo `api\student-dashboard.js`

Este arquivo contém as funcionalidades relacionadas ao dashboard do estudante na aplicação VanessaSchool. Ele permite visualizar o perfil e o progresso do estudante.

### Funcionalidades comprovadas

1. **Verificação de permissões de estudante**: A função `requireAdmin` verifica se o usuário tem permissões de estudante antes de permitir a execução de operações de estudante.
2. **Verificação de dados**: A função `requireAdmin` verifica se o usuário tem permissões de estudante antes de permitir a execução de operações de estudante.
3. **Normalização de dados**: As funções `normalizeLevel` e `normalizeEmail` normalizam os dados de entrada para garantir que os valores estejam corretos.
4. **Verificação de erros**: A função `errorResponse` retorna respostas de erro com status e mensagem adequadas.
5. **Obtenção de dados**: A função `getBody` obtém o corpo da requisição, normalizando o formato se necessário.
6. **Ordenação de estudantes**: A função `handler` ordena os estudantes por nome em ordem alfabética.

### Dependências relevantes

- `firebase-admin`: Para interação com o Firebase Authentication e Firestore.
- `express`: Para o servidor HTTP.

### Riscos ou lacunas

1. **Segurança**: A verificação de token JWT é feita, mas não há verificações adicionais para evitar ataques de força bruta ou token inválidos.
2. **Validação de dados**: A validação de dados é feita, mas não há verificações adicionais para garantir que os dados estejam dentro dos limites esperados.
3. **Erro de execução**: A função `handler` não trata erros de execução de forma adequada, o que pode levar a falhas inesperadas.

### Pontos de integração offline

1. **Backup de dados**: Não há implementação de backup de dados, o que pode levar a perda de dados em caso de falhas.
2. **Cache**: O cache é definido como `private, no-store, max-age=0`, o que pode levar a uma sobrecarga desnecessária de requisições ao servidor.
3. **Logs**: Não há implementação de logs, o que pode dificultar a depuração e a monitoração do sistema.

### Responsabilidade do arquivo `css\auth-shell-final.css`

Este arquivo contém as estilizações específicas para o shell de autenticação da aplicação VanessaSchool.

### Funcionalidades comprovadas

1. **Estilização do sidebar-bottom**: Define as propriedades CSS para o sidebar-bottom, incluindo largura, direção de layout, espaçamento e bordas.
2. **Estilização dos elementos do sidebar-bottom**: Define as propriedades CSS para os elementos do sidebar-bottom, incluindo largura, min-width, max-width, bordas e cores.
3. **Estilização do botão de logout**: Define as propriedades CSS para o botão de logout, incluindo aparência, bordas, cores, fontes e transições.
4. **Estilização do card do professor**: Define as propriedades CSS para o card do professor, incluindo largura e bordas.
5. **Estilização do cabeçalho mobile**: Define as propried

## Lote 3

### Responsabilidade do Arquivo `css\lesson-feedback.css`

**Responsabilidade:**
O arquivo `css\lesson-feedback.css` é responsável por estilizar a seção de feedback das respostas dos alunos nas aulas. Ele define estilos para a área de feedback, incluindo cores, tamanhos de fonte, espaçamentos e layouts.

**Funcionalidades comprovadas:**
1. **Estilos para a seção de feedback:**
   - `max-height: 46vh;` e `overflow-y: auto;`: Define que a seção de feedback terá uma altura máxima de 46% da janela do navegador e será rolável se necessário.
   - `background` e `border-top-color` para estilos de cor e borda para respostas corretas e incorretas.

2. **Estilos para o conteúdo do feedback:**
   - `padding: 14px 0;`: Define um espaçamento de 14 pixels entre o topo e o fundo do conteúdo do feedback.
   - `min-width: 0;`: Define uma largura mínima de 0 para o feedback.

3. **Estilos para o ícone de status:**
   - `width` e `height`: Definem o tamanho do ícone de status.
   - `display: inline-flex; align-items: center; justify-content: center;`: Define o layout do ícone como um elemento flexível centralizado.
   - `border-radius`: Define o raio de borda para o ícone.
   - `font-family`, `font-size`, `font-weight`, e `line-height`: Definem o estilo da fonte do ícone.

4. **Estilos para o título do feedback:**
   - `display: block; margin: 0;`: Define o título como um bloco sem margem.
   - `font-family`, `font-size`, `font-weight`, e `line-height`: Definem o estilo da fonte do título.

5. **Estilos para o texto do feedback:**
   - `margin`, `color`, `font-size`, e `line-height`: Definem o estilo do texto do feedback.

6. **Estilos para o botão de explicação:**
   - `margin-top`, `padding`, `appearance`, `-webkit-appearance`, `color`, `background`, `border`, `font-family`, `font-size`, `font-weight`, `line-height`, `text-decoration`, `text-decoration-thickness`, e `text-underline-offset`: Definem o estilo do botão de explicação.

7. **Estilos para o painel de explicação:**
   - `max-width`, `margin-top`, `padding`, `color`, `background`, `border`, `border-radius`, e `box-shadow`: Definem o estilo do painel de explicação.

8. **Estilos para o botão "Continuar" (correto):**
   - `margin-top`: Define o espaçamento do botão "Continuar" acima do conteúdo do feedback.

**Dependências relevantes:**
- Nenhuma dependência externa específica.

**Riscos ou lacunas:**
- Não há riscos ou lacunas notáveis no código atual.

**Possíveis pontos de integração offline:**
- Não há pontos de integração offline necessários neste arquivo.

### Responsabilidade do Arquivo `firebase.json`

**Responsabilidade:**
O arquivo `firebase.json` é responsável por configurar o Firebase para o projeto VanessaSchool. Ele define as regras de segurança para o Firestore.

**Funcionalidades comprovadas:**
1. **Configuração de regras para Firestore:**
   - `"firestore": { "rules": "firestore.rules" }`: Define que as regras de Firestore estão definidas em um arquivo chamado `firestore.rules`.

**Dependências relevantes:**
- Nenhuma dependência externa específica.

**Riscos ou lacunas:**
- Não há riscos ou lacunas notáveis no código atual.

**Possíveis pontos de integração offline:**
- Não há pontos de integração offline necessários neste arquivo.

### Responsabilidade do Arquivo `js\admin-firebase-bridge.js`

**Responsabilidade:**
O arquivo `js\admin-firebase-bridge.js` é responsável por fornecer uma interface para autenticação e verificação de administração no projeto VanessaSchool.

**Funcionalidades comprovadas:**
1. **Importação de dependências:**
   - `import { auth } from "./firebase-config.js";`: Importa a instância de autenticação do Firebase.
   - `import { signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";`: Importa a função `signOut` do Firebase Auth.

2. **Definição de UID do administrador:**
   - `const ADMIN_UID = "jvkBb2WgRyezmlVCMSjRyCaR7d82";`: Define o UID do administrador.

3. **Função `getUser`:**
   - `async function getUser() { await auth.authStateReady(); return auth.currentUser; }`: Obtém o usuário atual do Firebase Auth.

4. **Função `verifyAdmin`:**
   - `async function verifyAdmin() { ... }`: Verifica se o usuário é um administrador, verificando o token e as regras de acesso.

5. **Funções `token` e `logout`:**
   - `async token() { ... }`: Obtém o token de autenticação do usuário.
   - `logout: () => signOut(auth)`: Desloga o usuário.

**Dependências relevantes:**
- `firebase-config.js`: Importa a instância de autenticação do Firebase.

**Riscos ou lacunas:**
- Não há riscos ou lacunas notáveis no código atual.

**Possíveis pontos de integração offline:**
- Não há pontos de integração offline necessários neste arquivo.

### Responsabilidade do Arquivo `js\auth-shell.js`

**Responsabilidade:**
O arquivo `js\auth-shell.js` é responsável por fornecer uma interface para autenticação e verificação de área protegida no projeto VanessaSchool.

**Funcionalidades comprovadas:**
1. **Importação de dependências:**
   - `import { studentAuth } from "./firebase-config.js";`: Importa a instância de autenticação do Firebase para o aluno.

2. **Função `EYTRequireAuthenticatedArea`:**
   - `async function EYTRequireAuthenticatedArea() { ... }`: Verifica se o usuário está autenticado e tem permissões para acessar a área protegida.

3. **Funções `getUser` e `logout`:**
   - `async getUser() { ... }`: Obtém o usuário atual do Firebase Auth.
   - `logout: () => signOut(studentAuth)`: Desloga o usuário.

**Dependências relevantes:**
- `firebase-config.js`: Importa a instância de autenticação do Firebase para o aluno.

**Riscos ou lacunas:**
- Não há riscos ou lacunas notáveis no código atual.

**Possíveis pontos de integração offline:**
- Não há pontos de integração offline necessários neste arquivo.

### Responsabilidade do Arquivo `js\firebase-config.js`

**Responsabilidade:**
O arquivo `js\firebase-config.js` é responsável

## Lote 4

### Responsabilidade do Arquivo `js\lesson-sounds.js`

**Responsabilidade:**
O arquivo `lesson-sounds.js` é responsável por gerenciar o sistema de sons de aulas no VanessaSchool. Ele é responsável por carregar e reproduzir sons de feedback, como corretas e incorretas respostas, e para o fim de aula.

**Funcionalidades Confirmadas:**
1. **Configuração Inicial:**
   - Define constantes de configuração como `enabled`, `volume`, e `files` para os sons.
   - Inicializa objetos `Map` para armazenar buffers de áudio e buffers pendentes.

2. **Função `getAudioContext`:**
   - Retorna o contexto de áudio se já existir, caso contrário, cria um novo contexto de áudio.

3. **Função `resumeContext`:**
   - Resume o contexto de áudio se estiver em estado de suspensão.

4. **Função `unlock`:**
   - Desbloqueia o contexto de áudio, permitindo que o áudio seja reproduzido.

5. **Função `loadBuffer`:**
   - Carrega um buffer de áudio a partir de um arquivo e o armazena em um mapa de buffers.

6. **Código de Erro:**
   - Captura e registra erros ao carregar ou decodificar áudio.

**Dependências Relevantes:**
- `window.AudioContext` ou `window.webkitAudioContext` para criar o contexto de áudio.
- `fetch` para fazer solicitações HTTP para carregar arquivos de áudio.
- `console.warn` para registrar mensagens de aviso.

**Riscos ou Lacunas:**
- Dependência de `window.AudioContext` ou `window.webkitAudioContext`, que pode não estar disponível em alguns navegadores.
- Erros de carregamento de arquivos de áudio podem não ser tratados adequadamente.
- Dependência de `fetch` para carregar arquivos de áudio, que pode não ser suportado em alguns navegadores.

**Pontos de Integração Offline:**
- Não há pontos de integração offline especificados no código fornecido.

### Responsabilidade do Arquivo `js\offline-register.js`

**Responsabilidade:**
O arquivo `offline-register.js` é responsável por inicializar o Service Worker no VanessaSchool. Ele é responsável por registrar o Service Worker, atualizar o Service Worker se necessário, e carregar arquivos de áudio para o cache offline.

**Funcionalidades Confirmadas:**
1. **Verificação de Suporte ao Service Worker:**
   - Verifica se o navegador suporta o Service Worker.

2. **Função `initialize`:**
   - Registra o Service Worker com o escopo raiz (`/`).
   - Verifica se há um novo Service Worker disponível e atualiza-o se necessário.
   - Envia uma mensagem para o Service Worker para solicitar que ele carregue os arquivos de áudio para o cache offline.
   - Registra um evento para ouvir mensagens do Service Worker.

3. **Eventos de Mensagem:**
   - Recebe mensagens do Service Worker para informar sobre o progresso do cache de áudio.

4. **Eventos de DOMContentLoaded:**
   - Inicializa o Service Worker se o DOM estiver carregado.

**Dependências Relevantes:**
- `navigator.serviceWorker` para registrar e gerenciar o Service Worker.
- `fetch` para fazer solicitações HTTP para carregar arquivos de áudio.
- `console.warn` para registrar mensagens de aviso.

**Riscos ou Lacunas:**
- Dependência de `navigator.serviceWorker` para registrar e gerenciar o Service Worker, que pode não estar disponível em alguns navegadores.
- Erros de comunicação com o Service Worker podem não ser tratados adequadamente.
- Dependência de `fetch` para carregar arquivos de áudio, que pode não ser suportado em alguns navegadores.

**Pontos de Integração Offline:**
- Registra o Service Worker para carregar arquivos de áudio para o cache offline.

### Responsabilidade do Arquivo `js\student-dashboard.js`

**Responsabilidade:**
O arquivo `student-dashboard.js` é responsável por carregar e exibir o dashboard do aluno no VanessaSchool. Ele é responsável por autenticar o aluno, obter informações do perfil e do progresso, e exibir o conteúdo do nível do aluno.

**Funcionalidades Confirmadas:**
1. **Função `escapeHTML`:**
   - Escapa caracteres especiais para evitar XSS.

2. **Função `icon`:**
   - Retorna uma tag HTML para um ícone Bootstrap.

3. **Autenticação do Aluno:**
   - Importa o `studentAuth` do arquivo `firebase-config.js`.
   - Espera que o estado do usuário esteja pronto.
   - Obtém o token de autenticação do usuário.

4. **Requisição ao Servidor:**
   - Faz uma solicitação GET para o endpoint `/api/student-dashboard` com o token de autenticação.
   - Obtém e processa os dados retornados pelo servidor.

5. **Validação de Dados:**
   - Verifica se o perfil do aluno é válido e ativo.
   - Obtém o conteúdo do nível do aluno.

6. **Exibição do Dashboard:**
   - Exibe o nível do aluno, as lições, o progresso e os ícones correspondentes.

7. **Funções de Status e Percentual:**
   - Calcula o status (completo, disponível ou bloqueado) de cada lição.
   - Calcula o percentual de progresso de cada lição.

8. **Função `nextLesson`:**
   - Encontra a próxima lição disponível para o aluno.

**Dependências Relevantes:**
- `firebase-config.js` para autenticação do aluno.
- `fetch` para fazer solicitações HTTP para o servidor.
- `console.warn` para registrar mensagens de aviso.

**Riscos ou Lacunas:**
- Dependência de `firebase-config.js` para autenticação do aluno, que pode não estar disponível ou configurado corretamente.
- Erros de comunicação com o servidor podem não ser tratados adequadamente.
- Dependência de `fetch` para fazer solicitações HTTP, que pode não ser suportado em alguns navegadores.

**Pontos de Integração Offline:**
- Não há pontos de integração offline especificados no código fornecido.

## Lote 5

### Responsabilidade do arquivo `js\student-lesson-bootstrap.js`

O arquivo `js\student-lesson-bootstrap.js` é responsável por inicializar o sistema de aprendizado do VanessaSchool. Ele realiza as seguintes tarefas:

1. **Normalização de Texto**: Define uma função `normalizeText` que normaliza o texto, removendo espaços, pontuação e convertendo para minúsculas.

2. **Escapamento de HTML**: Define uma função `escapeHTML` que escapia caracteres especiais em strings para evitar ataques XSS.

3. **Autenticação e Verificação de Perfil**: 
   - Obtém o cliente Supabase.
   - Obtém a sessão do usuário.
   - Verifica se o usuário está autenticado e redireciona para a página de acesso se não estiver.
   - Obtém o perfil do usuário e verifica se o usuário é um administrador ou se está ativo. Se não, redireciona para a página de acesso ou desloga o usuário, respectivamente.

4. **Configuração do Nível e Conteúdo**: 
   - Obtém o nível do usuário e o conteúdo correspondente.
   - Converte os exercícios do nível para o formato esperado pelo engine original de aulas.

5. **Recuperação de Progresso do Usuário**: 
   - Obtém o progresso do usuário do banco de dados Supabase e armazena os dados em um objeto `progress`.

6. **Riscos e Lacunas**:
   - Dependências: O arquivo depende do Supabase cliente (`EYTSupabase`), que precisa estar configurado corretamente.
   - Possíveis pontos de integração offline: O arquivo não tem implementações específicas para integração offline, mas pode ser facilmente adicionadas se necessário.

7. **Pontos de Integração Offline**:
   - Não há implementações específicas para integração offline no arquivo atual.

### Responsabilidade do arquivo `js\student-lesson-runner.js`

O arquivo `js\student-lesson-runner.js` é responsável por executar as aulas do VanessaSchool. Ele realiza as seguintes tarefas:

1. **Verificação de Autenticação**: 
   - Verifica se o usuário está autenticado e redireciona para a página de acesso se não estiver.

2. **Obtenção dos Parâmetros da URL**: 
   - Obtém o ID da aula da URL.

3. **Obtenção da Aula**: 
   - Obtém a aula correspondente a partir de uma lista de aulas.

4. **Verificação de Desbloqueio da Aula**: 
   - Verifica se a aula está desbloqueada e redireciona para a página de dashboard se não estiver.

5. **Configuração dos Elementos da Aula**: 
   - Obtém os elementos da aula do DOM.

6. **Configuração da Configuração**: 
   - Define as configurações padrão para a aula.

7. **Configuração do Estado**: 
   - Inicializa o índice do exercício, a resposta selecionada, o estado de verificação, as palavras ordenadas, o temporizador de inatividade, o temporizador de esconder o guia, o estado do guia mostrado, o uso de áudio e o uso de áudio.

8. **Funções Auxiliares**: 
   - `escapeAttribute`: Escapa atributos de string.
   - `speechAvailable`: Verifica se o suporte para fala está disponível.
   - `stopSpeech`: Para a fala se disponível.
   - `soundsAvailable`: Verifica se o suporte para sons está disponível.

9. **Sons**: 
   - Define as funções para gerenciar sons.

10. **Feedback**: 
    - Define as funções para gerenciar o feedback.

11. **Progresso**: 
    - Define as funções para gerenciar o progresso.

12. **Integração Offline**: 
    - Não há implementações específicas para integração offline no arquivo atual.

### Responsabilidade do arquivo `student-lesson.html`

O arquivo `student-lesson.html` é o arquivo HTML principal da aula do VanessaSchool. Ele define a estrutura da página, incluindo:

1. **Cabeçalho**: 
   - Botão de fechar a aula.
   - Barra de progresso da aula.
   - Pontuação da aula.

2. **Conteúdo da Aula**: 
   - Elemento onde o conteúdo da aula será exibido.

3. **Rodapé da Aula**: 
   - Botão de verificação.
   - Divisão para o feedback.

4. **Links de Dependência**: 
   - Links para os arquivos JavaScript e CSS necessários para o funcionamento da aula.

5. **Riscos e Lacunas**:
   - Dependências: O arquivo depende dos arquivos JavaScript e CSS necessários para o funcionamento da aula.
   - Possíveis pontos de integração offline: O arquivo não tem implementações específicas para integração offline, mas pode ser facilmente adicionadas se necessário.

6. **Pontos de Integração Offline**:
   - Não há implementações específicas para integração offline no arquivo atual.

## Lote 6

### Responsabilidade

O arquivo `.ai\reverse-engineering-learning-platforms.md` é responsável por documentar a missão, objetivos e planos de engenharia de software para a VanessaSchool. Ele fornece uma visão geral da tarefa de engenharia reversa e implementação de uma aplicação de ensino de inglês com suporte a estudo offline.

### Funcionalidades comprovadas

1. **Arquitetura visual**: O documento menciona a análise do layout das páginas, navegação, menus, organização de aulas, filtros e pesquisas, cards e componentes, responsividade e experiência do aluno e do professor.
2. **Funcionalidades**: O documento menciona a implementação de um catálogo de aulas, organização por níveis CEFR, habilidades, vocabulário, listening, speaking, reading, writing, exercícios interativos, flashcards, quiz, progresso do estudante, favoritos, histórico de estudos e planejamento de aulas.
3. **Inspeção técnica**: O documento menciona a análise de HTML, CSS e JavaScript, identificação de padrões de componentes, rotas e estrutura de navegação, recursos de acessibilidade, desempenho e responsividade, e documentação de funcionalidades observáveis.
4. **Estudo offline**: O documento menciona a criação de estrutura local para conteúdos próprios, implementação de armazenamento offline, uso de IndexedDB quando apropriado, avaliação de Service Worker e PWA, importador para arquivos autorizados, suporte a PDF, áudio, vídeo e exercícios próprios, e implementação de busca local.
5. **Catálogo das fontes**: O documento menciona a registro das URLs públicas das atividades, registro de títulos e metadados permitidos, identificação do nível, habilidade e tema quando disponíveis, preservação da atribuição e links de origem, e não copiar bibliotecas completas sem autorização.
6. **Sessões autenticadas**: O documento menciona a utilização de sessões às quais o usuário tem acesso legítimo, não solicitar nem registrar senhas ou cookies em arquivos, não contornar paywalls, DRM, CAPTCHA ou controles de acesso, não extrair materiais proprietários em massa para redistribuição, e permitir importação de arquivos quando houver autorização de uso.
7. **Implementação**: O documento menciona a inspeção da arquitetura existente do VanessaSchool, reutilização de componentes e padrões existentes, evitação de dependências pagas, priorização do processamento local, não quebrar funcionalidades existentes, criação de testes, validação de JavaScript e build, e implementação de recursos progressivamente.

### Dependências relevantes

1. **REACT (REA)**: O documento menciona a utilização de REA para desenvolver a aplicação.
2. **OpenChat/OpenCode**: O documento menciona a utilização de OpenChat/OpenCode para implementar a plataforma.
3. **Ollama**: O documento menciona a utilização de Ollama para implementar a plataforma.
4. **VS Code**: O documento menciona a utilização de VS Code para desenvolver a aplicação.

### Riscos ou lacunas

1. **Segurança**: O documento menciona a necessidade de utilizar somente sessões às quais o usuário tem acesso legítimo, não solicitar nem registrar senhas ou cookies em arquivos, não contornar paywalls, DRM, CAPTCHA ou controles de acesso, não extrair materiais proprietários em massa para redistribuição, e permitir importação de arquivos quando houver autorização de uso.
2. **Desempenho**: O documento menciona a necessidade de avaliar o desempenho e responsividade da aplicação.
3. **Acessibilidade**: O documento menciona a necessidade de identificar e corrigir recursos de acessibilidade na aplicação.
4. **Compatibilidade**: O documento menciona a necessidade de garantir a compatibilidade da aplicação com diferentes navegadores e dispositivos.

### Pontos de integração offline

1. **Armazenamento offline**: O documento menciona a criação de estrutura local para conteúdos próprios e implementação de armazenamento offline.
2. **IndexedDB**: O documento menciona a utilização de IndexedDB quando apropriado.
3. **Service Worker e PWA**: O documento menciona a avaliação de Service Worker e PWA.
4. **Importador de arquivos autorizados**: O documento menciona a criação de um importador para arquivos autorizados.
5. **Suporte a PDF, áudio, vídeo e exercícios próprios**: O documento menciona o suporte a PDF, áudio, vídeo e exercícios próprios.
6. **Busca local**: O documento menciona a implementação de busca local.

### Conclusão

O arquivo `.ai\reverse-engineering-learning-platforms.md` fornece uma visão geral da tarefa de engenharia reversa e implementação de uma aplicação de ensino de inglês com suporte a estudo offline. Ele menciona as responsabilidades, funcionalidades comprovadas, dependências relevantes, riscos ou lacunas e pontos de integração offline.

## Lote 7

### Responsabilidade do arquivo `admin-login.html`

**Responsabilidade:**
O arquivo `admin-login.html` é responsável por fornecer a interface de login para o administrador da plataforma. Ele contém o design visual e as funcionalidades necessárias para que o administrador possa se autenticar.

**Funcionalidades comprovadas:**
1. **Interface de Login:**
   - Exibe um logotipo da plataforma.
   - Exibe o título "Administração".
   - Exibe uma descrição sobre o ambiente exclusivo para gerenciamento de alunos, níveis e evolução.
   - Possui um botão "Voltar para o acesso" que redireciona o administrador para a página de login.

2. **Formulário de Login:**
   - Exibe campos de entrada para o e-mail e a senha do administrador.
   - Possui um botão "Entrar na administração" que envia as credenciais para o servidor.

3. **Mensagens de Autenticação:**
   - Exibe mensagens de erro e sucesso de autenticação no formulário.

4. **Estilos:**
   - Utiliza o Bootstrap para estilizar a interface de login.

**Dependências relevantes:**
- Bootstrap (via CDN)
- Arquivo CSS (`css/style.css?v=20261001-db1`)

**Riscos ou lacunas:**
- A falta de validação de e-mail e senha no lado do cliente pode permitir ataques de força bruta.
- A falta de validação de permissões no lado do servidor pode permitir acesso não autorizado.

**Pontos de integração offline:**
- Não há dependências específicas para integração offline.

### Responsabilidade do arquivo `api\admin-session.js`

**Responsabilidade:**
O arquivo `api\admin-session.js` é responsável por verificar a autenticação do administrador e fornecer informações sobre o perfil do administrador se a autenticação for bem-sucedida.

**Funcionalidades comprovadas:**
1. **Verificação de Token:**
   - Verifica o token de autenticação usando a função `adminAuth.verifyIdToken`.
   - A autenticação é restrita a tokens de administrador.

2. **Verificação de Permissões:**
   - Verifica se o usuário tem o papel de administrador (`role === "admin"`).
   - Verifica se a conta está ativa (`active === true`).
   - Verifica se o UID do usuário é igual ao UID do administrador (`user.uid === "jvkBb2WgRyezmlVCMSjRyCaR7d82"`).

3. **Resposta de Autenticação:**
   - Retorna um objeto JSON com informações sobre a autenticação e o perfil do administrador se tudo estiver correto.

4. **Tratamento de Erros:**
   - Retorna mensagens de erro para erros de autenticação, como token inválido ou expirado.
   - Retorna mensagens de erro para erros de permissões, como perfil inválido ou conta desativada.

5. **Logs de Erro:**
   - Registra erros de autenticação no console.

**Dependências relevantes:**
- `firebase-admin.js`
- `firebase-admin` SDK

**Riscos ou lacunas:**
- A falta de validação de token no lado do cliente pode permitir ataques de força bruta.
- A falta de validação de permissões no lado do servidor pode permitir acesso não autorizado.

**Pontos de integração offline:**
- Não há dependências específicas para integração offline.

### Responsabilidade do arquivo `api\public-config.js`

**Responsabilidade:**
O arquivo `api\public-config.js` é responsável por fornecer as configurações públicas da plataforma, como o URL e a chave de publicação do Supabase.

**Funcionalidades comprovadas:**
1. **Recuperação de Configurações:**
   - Recupera o URL e a chave de publicação do Supabase a partir de variáveis de ambiente.
   - Se as variáveis de ambiente não estiverem definidas, retorna um erro.

2. **Resposta de Configurações:**
   - Retorna um objeto JSON com o URL e a chave de publicação do Supabase.

3. **Tratamento de Erros:**
   - Retorna uma mensagem de erro se as configurações públicas não estiverem disponíveis.

4. **Logs de Erro:**
   - Registra erros de configuração no console.

**Dependências relevantes:**
- Nenhuma dependência externa.

**Riscos ou lacunas:**
- A falta de validação das variáveis de ambiente pode permitir acesso não autorizado.
- A falta de tratamento de erros pode permitir que o servidor retorne informações confidenciais.

**Pontos de integração offline:**
- Não há dependências específicas para integração offline.

### Responsabilidade do arquivo `api\session-profile.js`

**Responsabilidade:**
O arquivo `api\session-profile.js` é responsável por verificar a autenticação do usuário e fornecer informações sobre o perfil do usuário se a autenticação for bem-sucedida.

**Funcionalidades comprovadas:**
1. **Verificação de Token:**
   - Verifica o token de autenticação usando a função `adminAuth.verifyIdToken`.
   - A autenticação é restrita a tokens de administrador.

2. **Verificação de Permissões:**
   - Verifica se o usuário tem o papel de estudante (`role === "student"`) ou administrador (`role === "admin"`).
   - Verifica se a conta está ativa (`active === true`).
   - Verifica se o UID do usuário é igual ao UID do administrador (`user.uid === "jvkBb2WgRyezmlVCMSjRyCaR7d82"`).

3. **Resposta de Autenticação:**
   - Retorna um objeto JSON com informações sobre a autenticação e o perfil do usuário se tudo estiver correto.

4. **Tratamento de Erros:**
   - Retorna mensagens de erro para erros de autenticação, como token inválido ou expirado.
   - Retorna mensagens de erro para erros de permissões, como perfil inválido ou conta desativada.

5. **Logs de Erro:**
   - Registra erros de autenticação no console.

**Dependências relevantes:**
- `firebase-admin.js`
- `firebase-admin` SDK

**Riscos ou lacunas:**
- A falta de validação de token no lado do cliente pode permitir ataques de força bruta.
- A falta de validação de permissões no lado do servidor pode permitir acesso não autorizado.

**Pontos de integração offline:**
- Não há dependências específicas para integração offline.

### Responsabilidade do arquivo `audio\static\manifest.json`

**Responsabilidade:**
O arquivo `audio\static\manifest.json` é responsável por fornecer uma lista de áudios disponíveis para o sistema.

**Funcionalidades comprovadas:**
1. **Lista de Áudios:**
   - Contém uma lista de áudios com suas respectivas URLs.
   - Cada áudio é identificado

## Lote 8

### Responsabilidade do arquivo `audio\static\phrases.json`

**Responsabilidade:**
O arquivo `audio\static\phrases.json` contém uma lista de frases em inglês que VanessaSchool utiliza para o treinamento e avaliação do aprendizado do idioma. Essas frases são usadas para treinar o sistema de reconhecimento de voz e para avaliar a fluência do usuário.

**Funcionalidades comprovadas:**
- O arquivo contém uma lista de frases em inglês que são usadas para treinamento e avaliação do aprendizado do idioma.
- As frases são fornecidas em um formato JSON, que permite que o sistema de reconhecimento de voz possa interpretar e processar as palavras.

**Dependências relevantes:**
- O arquivo `audio\static\phrases.json` não depende de nenhum outro arquivo específico para funcionar.

**Riscos ou lacunas:**
- O arquivo `audio\static\phrases.json` não contém informações sobre o contexto ou a ordem das frases, o que pode levar a um treinamento menos eficaz.
- O arquivo não contém informações sobre a dificuldade das frases, o que pode levar a um treinamento mais ou menos desafiador para o usuário.

**Possíveis pontos de integração offline:**
- O arquivo `audio\static\phrases.json` pode ser integrado offline para permitir o treinamento e avaliação do aprendizado do idioma sem a necessidade de conexão à internet.

### Responsabilidade do arquivo `conquistas.html`

**Responsabilidade:**
O arquivo `conquistas.html` é a página que exibe as conquistas do usuário no aplicativo VanessaSchool. Ele mostra o progresso do usuário no aprendizado do idioma e permite que o usuário visualize suas conquistas.

**Funcionalidades comprovadas:**
- O arquivo exibe o progresso do usuário no aprendizado do idioma.
- O arquivo exibe as conquistas do usuário.
- O arquivo permite que o usuário visualize suas conquistas.

**Dependências relevantes:**
- O arquivo `conquistas.html` depende do arquivo `storage.js` para armazenar e recuperar as conquistas do usuário.
- O arquivo `conquistas.html` depende do arquivo `data.js` para recuperar as informações necessárias para exibir as conquistas.
- O arquivo `conquistas.html` depende do arquivo `app.js` para controlar o fluxo de navegação do aplicativo.
- O arquivo `conquistas.html` depende do arquivo `speech.js` para exibir o áudio das conquistas.
- O arquivo `conquistas.html` depende do arquivo `static-audio.js` para carregar o áudio das conquistas.
- O arquivo `conquistas.html` depende do arquivo `tts-preload.js` para pré-carregar o áudio das conquistas.
- O arquivo `conquistas.html` depende do arquivo `conquistas.js` para controlar o exibição das conquistas.

**Riscos ou lacunas:**
- O arquivo `conquistas.html` não contém informações sobre como as conquistas são calculadas ou geradas.
- O arquivo `conquistas.html` não contém informações sobre como as conquistas são armazenadas e recuperadas.
- O arquivo `conquistas.html` não contém informações sobre como as conquistas são exibidas.

**Possíveis pontos de integração offline:**
- O arquivo `conquistas.html` pode ser integrado offline para permitir que o usuário visualize suas conquistas sem a necessidade de conexão à internet.

### Responsabilidade do arquivo `css\speech.css`

**Responsabilidade:**
O arquivo `css\speech.css` contém os estilos para os componentes de áudio do aplicativo VanessaSchool. Ele define as propriedades CSS para os botões de áudio, os ícones SVG, os shells e os áudios de feedback.

**Funcionalidades comprovadas:**
- O arquivo define as propriedades CSS para os botões de áudio, os ícones SVG, os shells e os áudios de feedback.
- O arquivo define as cores, tamanhos e estilos para os botões de áudio.
- O arquivo define as cores, tamanhos e estilos para os ícones SVG.
- O arquivo define as cores, tamanhos e estilos para os shells e os áudios de feedback.

**Dependências relevantes:**
- O arquivo `css\speech.css` depende do arquivo `css/style.css` para definir as cores e estilos globais do aplicativo.

**Riscos ou lacunas:**
- O arquivo `css\speech.css` não contém informações sobre como os botões de áudio, os ícones SVG, os shells e os áudios de feedback são usados no aplicativo.
- O arquivo `css\speech.css` não contém informações sobre como os botões de áudio, os ícones SVG, os shells e os áudios de feedback são personalizados.

**Possíveis pontos de integração offline:**
- O arquivo `css\speech.css` pode ser integrado offline para permitir que o usuário visualize os botões de áudio, os ícones SVG, os shells e os áudios de feedback sem a necessidade de conexão à internet.

## Lote 9

### ARQUIVO: curso.html

**Responsabilidade:**
O arquivo `curso.html` é responsável por exibir a página de aprendizado do site VanessaSchool. Ele contém a estrutura principal da página, incluindo o menu lateral, cabeçalho, e conteúdo principal.

**Funcionalidades comprovadas:**
1. **Menu Lateral:**
   - Exibe o menu lateral com links para diferentes páginas do site, como Início, Aprender, Revisar, Conquistas, Teacher Vanessa e Perfil.
   - O link "Aprender" está marcado como ativo (classe `active`).

2. **Cabeçalho:**
   - Exibe o título "Aprender | English in Your Time".
   - Contém uma seção "START LEARNING" com o subtítulo "Construa seu inglês passo a passo".

3. **Conteúdo Principal:**
   - Exibe uma seção "Course Header Card" com informações sobre o curso "Fundamentos do Inglês".
   - Exibe uma barra de progresso para o curso.

4. **Seção de Unidades do Curso:**
   - Exibe uma seção vazia para as unidades do curso, indicando que ainda não foram carregadas.

**Dependências relevantes:**
- Arquivos CSS:
  - `css/style.css?v=20260930-no-question-audio-1`
  - `css/auth-shell-final.css?v=20261001-shell-final-3`
- Arquivos de ícones:
  - `https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/icons/book.svg`
  - `https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css`

**Riscos ou lacunas:**
- A seção de unidades do curso está vazia, o que pode levar a uma experiência de usuário menos interativa.
- A falta de funcionalidade para carregar e exibir as unidades do curso pode ser um ponto de integração offline.

**Possíveis pontos de integração offline:**
- Implementar uma funcionalidade que permita o armazenamento local das unidades do curso, permitindo que o usuário continue o aprendizado mesmo sem conexão à internet.

### ARQUIVO: dashboard.html

**Responsabilidade:**
O arquivo `dashboard.html` é responsável por exibir a página de dashboard do site VanessaSchool. Ele contém a estrutura principal da página, incluindo o menu lateral, cabeçalho, e conteúdo principal.

**Funcionalidades comprovadas:**
1. **Menu Lateral:**
   - Exibe o menu lateral com links para diferentes páginas do site, como Início, Aprender, Revisar, Conquistas, Teacher Vanessa e Perfil.
   - O link "Aprender" está marcado como ativo (classe `active`).

2. **Cabeçalho:**
   - Exibe o título "Início | English in Your Time".
   - Contém uma seção "YOUR JOURNEY" com o nome do usuário.

3. **Conteúdo Principal:**
   - Exibe uma seção vazia para o conteúdo principal do dashboard.

**Dependências relevantes:**
- Arquivos CSS:
  - `css/style.css?v=20261001-ui-repair-1`
  - `css/auth-shell-final.css?v=20261001-shell-final-3`
- Arquivos de ícones:
  - `https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/icons/book.svg`
  - `https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css`

**Riscos ou lacunas:**
- A seção de conteúdo principal do dashboard está vazia, o que pode levar a uma experiência de usuário menos interativa.
- A falta de funcionalidade para exibir o conteúdo do dashboard pode ser um ponto de integração offline.

**Possíveis pontos de integração offline:**
- Implementar uma funcionalidade que permita o armazenamento local do conteúdo do dashboard, permitindo que o usuário continue o uso mesmo sem conexão à internet.

### ARQUIVO: demo.html

**Responsabilidade:**
O arquivo `demo.html` é responsável por exibir a página de teste de nível do site VanessaSchool. Ele contém a estrutura principal da página, incluindo o cabeçalho, conteúdo principal e seções de introdução e exercício.

**Funcionalidades comprovadas:**
1. **Cabeçalho:**
   - Exibe o título "Teste de nível | English in Your Time".
   - Contém um link para voltar ao site.

2. **Conteúdo Principal:**
   - Exibe uma seção "Demo Diagnostic Hero" com informações sobre o teste de nível.
   - Exibe uma seção "Demo Diagnostic Copy" com o subtítulo "TESTE ADAPTATIVO", o título "Descubra seu nível de inglês", e uma descrição sobre o teste.
   - Exibe uma seção "Demo Diagnostic Features" com informações sobre as funcionalidades do teste.
   - Exibe um botão "Começar diagnóstico" para iniciar o teste.

3. **Seção de Introdução:**
   - Exibe uma seção "Demo Diagnostic Hero" com informações sobre o teste de nível.
   - Exibe uma seção "Demo Diagnostic Copy" com o subtítulo "TESTE ADAPTATIVO", o título "Descubra seu nível de inglês", e uma descrição sobre o teste.
   - Exibe uma seção "Demo Diagnostic Features" com informações sobre as funcionalidades do teste.

4. **Seção de Exercício:**
   - Exibe uma seção vazia para o exercício, indicando que ainda não foi carregada.

**Dependências relevantes:**
- Arquivos CSS:
  - `css/style.css?v=20261001-demo-public-topbar-1`
- Arquivos de ícones:
  - `https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css`

**Riscos ou lacunas:**
- A seção de exercício está vazia, o que pode levar a uma experiência de usuário menos interativa.
- A falta de funcionalidade para exibir o exercício pode ser um ponto de integração offline.

**Possíveis pontos de integração offline:**
- Implementar uma funcionalidade que permita o armazenamento local do exercício, permitindo que o usuário continue o teste mesmo sem conexão à internet.

## Lote 10

### Responsabilidade do arquivo `index.html`

O arquivo `index.html` é responsável por definir a estrutura e o conteúdo da página inicial da aplicação VanessaSchool. Ele contém informações sobre a marca, o título, os links de navegação, a descrição e os botões de ação.

### Funcionalidades comprovadas

1. **Responsividade**: A página é responsiva e funciona bem em diferentes tamanhos de tela.
2. **Icones**: Os ícones da biblioteca Bootstrap Icons são carregados corretamente.
3. **Fontes**: As fontes "Fraunces", "Space Mono" e "Work Sans" são carregadas e aplicadas corretamente.
4. **Estilos**: Os estilos definidos no arquivo `style.css` são aplicados corretamente.
5. **Conteúdo**: O conteúdo da página é exibido corretamente, incluindo o título, descrição, links de navegação e botões de ação.

### Dependências relevantes

1. **Bootstrap Icons**: Para os ícones da aplicação.
2. **Google Fonts**: Para as fontes utilizadas na aplicação.
3. **Firebase**: Para autenticação e gestão de usuários.

### Riscos ou lacunas

1. **Dependência de CDN**: A dependência de CDN para os ícones e fontes pode ser um risco se o CDN falhar.
2. **Estilos dinâmicos**: Os estilos podem não ser aplicados corretamente se houver problemas com o arquivo `style.css`.

### Pontos de integração offline

1. **Cache de arquivos**: O arquivo `index.html` está configurado para ser carregado com cache no navegador, o que pode ajudar a melhorar a performance offline.
2. **Estilos e scripts**: Os estilos e scripts são carregados corretamente, o que pode ajudar a melhorar a performance offline.

### Responsabilidade do arquivo `js\access-db.js`

O arquivo `js\access-db.js` é responsável por lidar com a autenticação dos usuários e a gestão de sessões.

### Funcionalidades comprovadas

1. **Autenticação**: A autenticação dos usuários é realizada corretamente usando Firebase Authentication.
2. **Redirecionamento**: O usuário é redirecionado para a página de dashboard se a autenticação for bem-sucedida.
3. **Mensagens de erro**: As mensagens de erro são exibidas corretamente para os usuários.
4. **Token de acesso**: O token de acesso é gerado corretamente e usado para autenticar as requisições.

### Dependências relevantes

1. **Firebase Authentication**: Para autenticação dos usuários.
2. **Fetch API**: Para fazer requisições HTTP.

### Riscos ou lacunas

1. **Segurança**: A autenticação não está protegida contra ataques de força bruta.
2. **Token de acesso**: O token de acesso pode ser expirado ou inválido.

### Pontos de integração offline

1. **Cache de arquivos**: O arquivo `access-db.js` está configurado para ser carregado com cache no navegador, o que pode ajudar a melhorar a performance offline.
2. **Estilos e scripts**: Os estilos e scripts são carregados corretamente, o que pode ajudar a melhorar a performance offline.

### Responsabilidade do arquivo `js\admin.js`

O arquivo `js\admin.js` é responsável por lidar com a gestão de usuários no painel administrativo.

### Funcionalidades comprovadas

1. **Autenticação**: A autenticação do administrador é realizada corretamente usando Firebase Authentication.
2. **Redirecionamento**: O administrador é redirecionado para a página de login se a autenticação for bem-sucedida.
3. **Mensagens de erro**: As mensagens de erro são exibidas corretamente para os administradores.
4. **Token de acesso**: O token de acesso é gerado corretamente e usado para autenticar as requisições.
5. **Gerenciamento de usuários**: Os usuários podem ser criados, editados e excluídos corretamente.

### Dependências relevantes

1. **Firebase Authentication**: Para autenticação dos administradores.
2. **Fetch API**: Para fazer requisições HTTP.
3. **Firebase Admin SDK**: Para gerenciar usuários no Firebase.

### Riscos ou lacunas

1. **Segurança**: A autenticação não está protegida contra ataques de força bruta.
2. **Token de acesso**: O token de acesso pode ser expirado ou inválido.
3. **Gerenciamento de usuários**: Os usuários podem ser excluídos sem confirmação.

### Pontos de integração offline

1. **Cache de arquivos**: O arquivo `admin.js` está configurado para ser carregado com cache no navegador, o que pode ajudar a melhorar a performance offline.
2. **Estilos e scripts**: Os estilos e scripts são carregados corretamente, o que pode ajudar a melhorar a performance offline.

## Lote 11

### Responsabilidade do Arquivo `js\admin-login.js`

**Responsabilidade:**
Este arquivo é responsável por implementar a autenticação e validação do login do administrador no sistema. Ele utiliza a biblioteca Firebase para autenticar o usuário e verificar se ele tem permissões administrativas.

**Funcionalidades comprovadas:**
1. **Autenticação de Usuário:**
   - O código utiliza `signInWithEmailAndPassword` para autenticar o usuário com suas credenciais.
   - O usuário é validado através da função `validateAdmin`, que verifica se o token de autenticação é válido e se o usuário tem permissões administrativas.

2. **Redirecionamento após Login:**
   - Se o login for bem-sucedido, o usuário é redirecionado para a página do administrador (`/admin`).

3. **Mensagens de Erro:**
   - O código exibe mensagens de erro apropriadas para diferentes erros de autenticação, como "E-mail ou senha inválidos" ou "Falha ao verificar o acesso administrativo".

4. **Manutenção da Sessão:**
   - O código verifica se o usuário está autenticado e atualiza a página se o usuário for deslogado.

**Dependências Relevantes:**
- `firebase-config.js`: Configuração do Firebase para autenticação.
- `firebase-auth.js`: Biblioteca Firebase para autenticação.

**Riscos ou Lacunas:**
- **Segurança:** O código não inclui validação forte de senhas ou proteção contra ataques de força bruta.
- **Desempenho:** A função `validateAdmin` pode ser lenta se o banco de dados for grande.

**Possíveis Pontos de Integração Offline:**
- Implementar um sistema de cache para melhorar o desempenho offline.
- Adicionar suporte a autenticação com tokens de sessão local.

### Responsabilidade do Arquivo `js\app.js`

**Responsabilidade:**
Este arquivo contém funções auxiliares para o aplicativo, como obtenção do usuário atual, normalização de texto, obtenção de todas as lições, obtenção do pedido de uma lição, verificação se uma lição está desbloqueada, obtenção da próxima lição, obtenção do progresso do curso, obtenção da precisão, avaliação de conquistas, obtenção do status de uma lição, escapamento de HTML, obtenção de ícones e outros métodos auxiliares.

**Funcionalidades comprovadas:**
1. **Funções Auxiliares:**
   - `requireUser`: Verifica se o usuário está autenticado e retorna o usuário atual ou um objeto de usuário padrão.
   - `normalizeText`: Normaliza o texto removendo espaços, pontuação e convertendo para minúsculas.
   - `getAllLessons`: Obtém todas as lições do curso.
   - `getLessonOrder`: Obtém o pedido de uma lição.
   - `isLessonUnlocked`: Verifica se uma lição está desbloqueada.
   - `getNextLesson`: Obtém a próxima lição disponível.
   - `getCourseProgress`: Obtém o progresso do curso em porcentagem.
   - `getAccuracy`: Obtém a precisão do usuário em porcentagem.
   - `evaluateAchievements`: Avalia as conquistas do usuário e atualiza o progresso.
   - `getLessonStatus`: Obtém o status de uma lição (concluída, disponível ou bloqueada).
   - `escapeHTML`: Escapa o HTML para evitar ataques XSS.
   - `icon`: Obtém o ícone correspondente a um nome de ícone.

**Dependências Relevantes:**
- Nenhuma dependência externa.

**Riscos ou Lacunas:**
- **Segurança:** Nenhuma dependência específica para segurança.
- **Desempenho:** As funções auxiliares podem ser lenta se o banco de dados for grande.

**Possíveis Pontos de Integração Offline:**
- Implementar um sistema de cache para melhorar o desempenho offline.

### Responsabilidade do Arquivo `js\conquistas.js`

**Responsabilidade:**
Este arquivo é responsável por exibir as conquistas do usuário no aplicativo.

**Funcionalidades comprovadas:**
1. **Exibição das Conquistas:**
   - O código obtém o progresso do usuário e as conquistas disponíveis.
   - Exibe as conquistas no formato de cartões, indicando se elas estão desbloqueadas ou bloqueadas.

2. **Atualização das Conquistas:**
   - O código atualiza as conquistas do usuário quando o progresso é atualizado.

**Dependências Relevantes:**
- `EYTApp`: Objeto contendo funções auxiliares.
- `EYTStorage`: Objeto para armazenamento de dados do usuário.
- `EYTData`: Objeto contendo dados do curso.

**Riscos ou Lacunas:**
- **Segurança:** Nenhuma dependência específica para segurança.
- **Desempenho:** O código pode ser lento se o banco de dados for grande.

**Possíveis Pontos de Integração Offline:**
- Implementar um sistema de cache para melhorar o desempenho offline.

### Responsabilidade do Arquivo `js\curso.js`

**Responsabilidade:**
Este arquivo é responsável por exibir o progresso do curso e as lições disponíveis no aplicativo.

**Funcionalidades comprovadas:**
1. **Exibição do Progresso do Curso:**
   - O código obtém o progresso do curso em porcentagem e exibe-o no aplicativo.

2. **Exibição das Lições:**
   - O código obtém todas as lições do curso e exibe-as no aplicativo, indicando se elas estão concluídas, disponíveis ou bloqueadas.

3. **Atualização do Progresso:**
   - O código atualiza o progresso do curso quando o usuário conclui uma lição.

**Dependências Relevantes:**
- `EYTApp`: Objeto contendo funções auxiliares.
- `EYTStorage`: Objeto para armazenamento de dados do usuário.
- `EYTData`: Objeto contendo dados do curso.

**Riscos ou Lacunas:**
- **Segurança:** Nenhuma dependência específica para segurança.
- **Desempenho:** O código pode ser lento se o banco de dados for grande.

**Possíveis Pontos de Integração Offline:**
- Implementar um sistema de cache para melhorar o desempenho offline.

### Responsabilidade do Arquivo `js\dashboard.js`

**Responsabilidade:**
Este arquivo é responsável por exibir o dashboard do usuário, incluindo informações sobre o usuário, o progresso do curso, as conquistas e as lições disponíveis.

**Funcionalidades comprovadas:**
1. **Exibição do Dashboard:**
   - O código obtém o usuário atual, o progresso do curso, as conquistas e as lições disponíveis.
   - Exibe o dashboard no aplicativo, incluindo informações sobre o usuário, o progresso do curso, as conquistas e as lições disponíveis.

2. **Atualização do Dashboard:**
   - O código atualiza o dashboard quando o usuário conclui uma lição ou quando o progresso do curso

## Lote 12

### Responsabilidade do arquivo `js\data.js`

O arquivo `js\data.js` contém os dados de conteúdo do curso de inglês, incluindo informações sobre as unidades, aulas e exercícios. Ele define estruturas como `EYTData` que contêm detalhes sobre o curso, como o título, o subtítulo, o nível e as aulas.

### Funcionalidades comprovadas

1. **Definição de Estruturas**: O arquivo define estruturas como `EYTData` que contêm informações sobre o curso, como o título, o subtítulo, o nível e as aulas.
2. **Definição de Unidades**: Cada unidade tem um `id`, um número, um título e uma descrição.
3. **Definição de Aulas**: Cada aula tem um `id`, um número, um título, uma descrição e uma lista de exercícios.
4. **Definição de Exercícios**: Cada exercício tem um `id`, um tipo, uma pergunta, uma lista de opções (para múltipla escolha) ou uma resposta de tradução (para tradução), e uma resposta correta.

### Dependências relevantes

- Nenhuma dependência externa é mencionada no arquivo `js\data.js`.

### Riscos ou lacunas

- Não há riscos ou lacunas notáveis no arquivo `js\data.js`.

### Pontos de integração offline

- O arquivo `js\data.js` não tem dependências externas que precisem de integração offline.

### ARQUIVO: js\demo.js

### Responsabilidade do arquivo `js\demo.js`

O arquivo `js\demo.js` contém o código para a demonstração do curso, incluindo a inicialização do DOM, definição de constantes, manipulação de elementos do DOM e a lógica para exibir exercícios e resultados.

### Funcionalidades comprovadas

1. **Adição de Evento de DOMContentLoaded**: O arquivo adiciona um evento de `DOMContentLoaded` para garantir que o DOM esteja completamente carregado antes de executar o código.
2. **Definição de Constantes**: O arquivo define constantes como o número de WhatsApp, os níveis do curso, nomes e descrições dos níveis, e o conteúdo do curso.
3. **Verificação de EYTLevelContent**: O arquivo verifica se o conteúdo do curso está disponível e, se não, exibe um erro no console.
4. **Definição de Estado**: O arquivo define um estado inicial para o jogo, incluindo o índice do nível, o número da pergunta, o número máximo de perguntas, o número de respostas corretas, o histórico de respostas, os exercícios usados, o exercício atual, se o jogador já respondeu e se o modo de prática está ativado.
5. **Manipulação de Elementos do DOM**: O arquivo manipula elementos do DOM para exibir a introdução, a seção de exercício, a seção de resultado, o conteúdo do exercício, o progresso da barra de progresso, o contador de perguntas, o indicador de nível e o conteúdo de cada exercício.
6. **Funções Auxiliares**: O arquivo define funções auxiliares como `normalize` e `escapeHtml` para normalizar e escapar valores.

### Dependências relevantes

- `js\data.js`: O arquivo `js\demo.js` depende do arquivo `js\data.js` para obter os dados de conteúdo do curso.

### Riscos ou lacunas

- Não há riscos ou lacunas notáveis no arquivo `js\demo.js`.

### Pontos de integração offline

- O arquivo `js\demo.js` não tem dependências externas que precisem de integração offline.

### ARQUIVO: js\level-content.js

### Responsabilidade do arquivo `js\level-content.js`

O arquivo `js\level-content.js` contém o conteúdo específico para cada nível do curso, incluindo o nível, o título, a descrição, os tópicos de origem e as aulas.

### Funcionalidades comprovadas

1. **Definição de Estruturas**: O arquivo define estruturas como `window.EYTLevelContent` que contêm informações específicas para cada nível do curso.
2. **Definição de Níveis**: Cada nível tem um `level`, um `title`, uma `description` e uma lista de tópicos de origem.
3. **Definição de Aulas**: Cada aula tem um `id`, um `title`, uma `description` e uma lista de exercícios.
4. **Definição de Exercícios**: Cada exercício tem um `id`, um `type`, uma pergunta, uma lista de opções (para múltipla escolha) ou uma resposta de tradução (para tradução), e uma resposta correta.

### Dependências relevantes

- Nenhuma dependência externa é mencionada no arquivo `js\level-content.js`.

### Riscos ou lacunas

- Não há riscos ou lacunas notáveis no arquivo `js\level-content.js`.

### Pontos de integração offline

- O arquivo `js\level-content.js` não tem dependências externas que precisem de integração offline.

## Lote 13

### Responsabilidade do arquivo `js\licao.js`

O arquivo `js\licao.js` é responsável por carregar e exibir detalhes de uma lição específica no site VanessaSchool. Ele verifica se o usuário está autenticado, recupera os parâmetros da URL, busca a lição correspondente e verifica se ela está desbloqueada. Se a lição estiver desbloqueada, ele carrega os elementos HTML necessários para exibir o conteúdo da lição, configura o estado inicial e inicializa os componentes de feedback e progresso.

### Funcionalidades comprovadas

1. **Verificação de autenticação**: O código verifica se o usuário está autenticado usando a função `EYTApp.requireUser()`.
2. **Recuperação de parâmetros da URL**: O código recupera o parâmetro `id` da URL para identificar a lição.
3. **Busca da lição**: O código busca a lição correspondente usando a função `EYTApp.getAllLessons()` e o método `find()`.
4. **Verificação de desbloqueamento**: O código verifica se a lição está desbloqueada usando a função `EYTApp.isLessonUnlocked()`.
5. **Redirecionamento para o curso**: Se a lição não estiver desbloqueada, o código redireciona o usuário para a página do curso.
6. **Carregamento de elementos HTML**: O código carrega os elementos HTML necessários para exibir o conteúdo da lição, como `lessonContent`, `lessonFooter`, `action`, `feedback`, `progressBar`, `lessonXp`, `closeLesson`, etc.
7. **Configuração de estado inicial**: O código inicializa o estado inicial da lição, como `exerciseIndex`, `selectedAnswer`, `checked`, `orderedWords`, `inactivityTimer`, `hintHideTimer`, `hintShown`, `audioUsed`, etc.
8. **Funções auxiliares**: O código define funções auxiliares como `escapeAttribute`, `speechAvailable`, `stopSpeech`, `soundsAvailable`, etc.

### Dependências relevantes

1. **EYTApp**: O código depende da função `EYTApp.requireUser()`, `EYTApp.getAllLessons()`, `EYTApp.isLessonUnlocked()`, `EYTApp.escapeHTML()`, `EYTApp.icon()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.requireUser()`, `EYTApp.require

## Lote 14

### Responsabilidade do arquivo `js\speech.js`

O arquivo `js\speech.js` é responsável por gerenciar a síntese de voz em tempo real para o VanessaSchool. Ele utiliza um worker para processar as solicitações de síntese e armazena os resultados em cache para melhorar a eficiência.

### Funcionalidades comprovadas

1. **Configuração de Configurações**:
   - Define constantes para o caminho do worker, idiomas, taxas de voz, tempo de timeout, nome do banco de dados, versão do banco de dados, nome do armazenamento, namespace de cache, e limites de memória e decodificação.

2. **Manipulação de Texto**:
   - Função `cleanText` para limpar e normalizar o texto.
   - Função `normalizeLang` para normalizar o idioma baseado no prefixo fornecido.

3. **Clampamento de Valores**:
   - Função `clamp` para garantir que um valor esteja dentro de um intervalo especificado.

4. **Disparo de Eventos**:
   - Função `dispatch` para disparar eventos personalizados.

5. **Prioridade de Valor**:
   - Função `priorityValue` para definir a prioridade de uma solicitação.

6. **Limpeza de Mapas**:
   - Função `trimMap` para manter o tamanho de um mapa dentro de um limite especificado.

7. **Gerenciamento de Chaves de Cache**:
   - Função `cacheKey` para gerar uma chave única para o cache baseada em texto e opções.

8. **Resolução de Opções**:
   - Função `resolveOptions` para normalizar e ajustar as opções de síntese de voz.

9. **IndexedDB**:
   - Função `openDatabase` para abrir o banco de dados IndexedDB e criar um objeto de armazenamento se necessário.

### Dependências relevantes

- `window.AudioContext` ou `window.webkitAudioContext` para criar o contexto de áudio.
- `indexedDB` para armazenar os resultados da síntese de voz em cache.

### Riscos ou lacunas

1. **Dependência de `indexedDB`**:
   - O uso de IndexedDB pode não estar disponível em todos os navegadores, o que pode afetar a funcionalidade de cache.

2. **Limitação de Memória**:
   - O limite de memória para armazenamento de blobs (`maxBlobMemoryEntries`) e decodificação (`maxDecodedEntries`) pode ser insuficiente para grandes volumes de dados.

3. **Erro de Sincronização**:
   - O código não trata erros de sincronização do contexto de áudio, o que pode afetar a funcionalidade de síntese de voz.

4. **Desempenho**:
   - O uso de worker pode não ser eficiente em todos os casos, especialmente para grandes volumes de solicitações.

### Pontos de Integração Offline

1. **Cache de Áudio**:
   - O cache de áudio (`decodedCache`) pode ser integrado para armazenar áudios decodificados e reutilizá-los offline.

2. **IndexedDB Offline**:
   - O banco de dados IndexedDB pode ser integrado para armazenar dados de progresso e outras informações offline.

3. **Worker Offline**:
   - O worker pode ser integrado para processar solicitações de síntese de voz offline, permitindo que o sistema funcione sem conexão à internet.

## Lote 15

### Responsabilidade do arquivo `js\supabase-client.js`

O arquivo `js\supabase-client.js` é responsável por gerenciar a conexão com o Supabase, um serviço de banco de dados e autenticação. Ele fornece funções para obter o cliente Supabase, obter a sessão atual, obter o perfil do usuário e realizar o logout.

### Funcionalidades comprovadas

1. **getClient**: Retorna um cliente Supabase que é criado com base nas configurações obtidas a partir da API `/api/public-config`.
2. **getSession**: Obtém a sessão atual do usuário.
3. **getProfile**: Obtém o perfil do usuário com base na sessão atual.
4. **logout**: Realiza o logout do usuário.

### Dependências relevantes

- `fetch`: Para fazer solicitações HTTP.
- `window.supabase`: Para criar um cliente Supabase.

### Riscos ou lacunas

1. **Dependência de `window.supabase`**: O código depende de `window.supabase` estar disponível, o que pode não ser o caso em alguns ambientes.
2. **Dependência de `window.supabase.createClient`**: O código depende de `window.supabase.createClient` estar disponível, o que pode não ser o caso em alguns ambientes.
3. **Dependência de `window.supabase.auth`**: O código depende de `window.supabase.auth` estar disponível, o que pode não ser o caso em alguns ambientes.
4. **Dependência de `window.supabase.from`**: O código depende de `window.supabase.from` estar disponível, o que pode não ser o caso em alguns ambientes.
5. **Dependência de `window.supabase.auth.getSession`**: O código depende de `window.supabase.auth.getSession` estar disponível, o que pode não ser o caso em alguns ambientes.
6. **Dependência de `window.supabase.auth.signOut`**: O código depende de `window.supabase.auth.signOut` estar disponível, o que pode não ser o caso em alguns ambientes.

### Pontos de integração offline

1. **Dependência de `window.supabase`**: O código depende de `window.supabase` estar disponível, o que pode não ser o caso em alguns ambientes.
2. **Dependência de `window.supabase.createClient`**: O código depende de `window.supabase.createClient` estar disponível, o que pode não ser o caso em alguns ambientes.
3. **Dependência de `window.supabase.auth`**: O código depende de `window.supabase.auth` estar disponível, o que pode não ser o caso em alguns ambientes.
4. **Dependência de `window.supabase.from`**: O código depende de `window.supabase.from` estar disponível, o que pode não ser o caso em alguns ambientes.
5. **Dependência de `window.supabase.auth.getSession`**: O código depende de `window.supabase.auth.getSession` estar disponível, o que pode não ser o caso em alguns ambientes.
6. **Dependência de `window.supabase.auth.signOut`**: O código depende de `window.supabase.auth.signOut` estar disponível, o que pode não ser o caso em alguns ambientes.

### ARQUIVO: js\tts\kokoro-worker.js

O arquivo `js\tts\kokoro-worker.js` é responsável por gerenciar a geração de áudio usando o Kokoro TTS, um serviço de texto-a-áudio.

### Funcionalidades comprovadas

1. **getTTS**: Retorna uma instância do Kokoro TTS carregada com base no modelo especificado.
2. **resolveVoice**: Resolve o nome da voz com base no idioma e pessoa especificados.
3. **generate**: Gera áudio a partir de um texto de entrada.

### Dependências relevantes

- `kokoro-js`: Para criar uma instância do Kokoro TTS.
- `self.fetch`: Para fazer solicitações HTTP.

### Riscos ou lacunas

1. **Dependência de `kokoro-js`**: O código depende de `kokoro-js` estar disponível, o que pode não ser o caso em alguns ambientes.
2. **Dependência de `self.fetch`**: O código depende de `self.fetch` estar disponível, o que pode não ser o caso em alguns ambientes.
3. **Dependência de `self.postMessage`**: O código depende de `self.postMessage` estar disponível, o que pode não ser o caso em alguns ambientes.
4. **Dependência de `self.setTimeout`**: O código depende de `self.setTimeout` estar disponível, o que pode não ser o caso em alguns ambientes.
5. **Dependência de `self.clearTimeout`**: O código depende de `self.clearTimeout` estar disponível, o que pode não ser o caso em alguns ambientes.

### Pontos de integração offline

1. **Dependência de `kokoro-js`**: O código depende de `kokoro-js` estar disponível, o que pode não ser o caso em alguns ambientes.
2. **Dependência de `self.fetch`**: O código depende de `self.fetch` estar disponível, o que pode não ser o caso em alguns ambientes.
3. **Dependência de `self.postMessage`**: O código depende de `self.postMessage` estar disponível, o que pode não ser o caso em alguns ambientes.
4. **Dependência de `self.setTimeout`**: O código depende de `self.setTimeout` estar disponível, o que pode não ser o caso em alguns ambientes.
5. **Dependência de `self.clearTimeout`**: O código depende de `self.clearTimeout` estar disponível, o que pode não ser o caso em alguns ambientes.

### ARQUIVO: js\tts-preload.js

O arquivo `js\tts-preload.js` é responsável por pré-carregar áudio para botões de fala.

### Funcionalidades comprovadas

1. **detectLanguage**: Detecta o idioma baseado no texto fornecido.
2. **preloadSpeechButton**: Pre-carrega o áudio para um botão de fala com base no texto e idioma fornecidos.
3. **scanVisibleAudio**: Escaneia todos os botões de fala visíveis e pre-carrega o áudio para eles.
4. **scheduleScan**: Agende o escaneamento dos botões de fala visíveis.
5. **collectBackgroundAudio**: Coleta áudio para uso em background baseado nos exercícios dos aulas.

### Dependências relevantes

- `EYTSpeech`: Para pré-carregar o áudio.
- `EYTApp`: Para obter as aulas.

### Riscos ou lacunas

1. **Dependência de `EYTSpeech`**: O código depende de `EYTSpeech` estar disponível, o que pode não ser o caso em alguns ambientes.
2. **Dependência de `EYTApp`**: O código depende de `EYTApp` estar disponível, o que pode não ser o caso em alguns ambientes.
3. **Dependência de `EYTApp.getAllLessons`**: O código depende de `EYTApp.getAllLessons` estar

## Lote 16

### Análise do Código

#### ARQUIVO: licao.html

**Responsabilidade:**
O arquivo `licao.html` é o principal arquivo da página de lição do site English in Your Time. Ele contém a estrutura básica da página, incluindo o cabeçalho, o conteúdo principal e o rodapé.

**Funcionalidades comprovadas:**
1. **Interface de usuário:**
   - O arquivo contém um cabeçalho (`<header>`) com botões de fechar e progresso da lição.
   - O conteúdo principal (`<main>`) é onde o conteúdo da lição é exibido.
   - O rodapé (`<footer>`) inclui um botão de verificação e um espaço para feedback.

2. **Estilos:**
   - O arquivo inclui links para estilos CSS externos para o Bootstrap Icons e Bootstrap, bem como um arquivo CSS personalizado (`style.css?v=20260930-no-question-audio-1`).

3. **Scripts:**
   - O arquivo inclui scripts para armazenamento (`storage.js`), dados (`data.js`), aplicação principal (`app.js`), fala (`speech.js?v=20261001-audio-v3`), áudio estático (`static-audio.js?v=20261001-static-offline-2`), pré-carregamento de TTS (`tts-preload.js?v=20261001-audio-v3`), e a lógica da lição (`licao.js?v=20260930-no-question-audio-1`).

4. **Dependências relevantes:**
   - Bootstrap Icons e Bootstrap: Para os ícones e estilos.
   - Estilo personalizado (`style.css?v=20260930-no-question-audio-1`): Para estilizar a página.
   - Scripts externos: Para armazenamento, dados, aplicação, fala, áudio estático, pré-carregamento de TTS e a lógica da lição.

5. **Riscos ou lacunas:**
   - Dependência externa para o Bootstrap Icons e Bootstrap: Se esses recursos não estiverem disponíveis, a página não funcionará corretamente.
   - Dependência externa para o arquivo CSS personalizado: Se o arquivo CSS não estiver disponível, a página não será estilizada corretamente.
   - Dependência externa para os scripts: Se esses scripts não estiverem disponíveis, a lógica da página não funcionará corretamente.

6. **Pontos de integração offline:**
   - O arquivo inclui scripts para armazenamento (`storage.js`), dados (`data.js`), aplicação principal (`app.js`), fala (`speech.js?v=20261001-audio-v3`), áudio estático (`static-audio.js?v=20261001-static-offline-2`), pré-carregamento de TTS (`tts-preload.js?v=20261001-audio-v3`), e a lógica da lição (`licao.js?v=20260930-no-question-audio-1`). Esses scripts podem ser integrados offline para garantir que a página funcione corretamente sem conexão à internet.

#### ARQUIVO: perfil.html

**Responsabilidade:**
O arquivo `perfil.html` é o principal arquivo da página de perfil do site English in Your Time. Ele contém a estrutura básica da página, incluindo o cabeçalho, o conteúdo principal e o rodapé.

**Funcionalidades comprovadas:**
1. **Interface de usuário:**
   - O arquivo contém um cabeçalho (`<header>`) com um logotipo e um menu de navegação.
   - O conteúdo principal (`<main>`) inclui informações pessoais do usuário, como o avatar, nome, descrição e estatísticas.
   - O rodapé (`<footer>`) inclui um botão para solicitar alterações no cadastro.

2. **Estilos:**
   - O arquivo inclui links para estilos CSS externos para o Bootstrap Icons e Bootstrap, bem como um arquivo CSS personalizado (`style.css?v=20260930-no-question-audio-1`).

3. **Scripts:**
   - O arquivo inclui scripts para armazenamento (`storage.js`), dados (`data.js`), aplicação principal (`app.js`), fala (`speech.js?v=20261001-audio-v3`), áudio estático (`static-audio.js?v=20261001-static-offline-2`), pré-carregamento de TTS (`tts-preload.js?v=20261001-audio-v3`), e a lógica do perfil (`perfil.js?v=20261001-shell-final-3`).

4. **Dependências relevantes:**
   - Bootstrap Icons e Bootstrap: Para os ícones e estilos.
   - Estilo personalizado (`style.css?v=20260930-no-question-audio-1`): Para estilizar a página.
   - Scripts externos: Para armazenamento, dados, aplicação, fala, áudio estático, pré-carregamento de TTS e a lógica do perfil.

5. **Riscos ou lacunas:**
   - Dependência externa para o Bootstrap Icons e Bootstrap: Se esses recursos não estiverem disponíveis, a página não funcionará corretamente.
   - Dependência externa para o arquivo CSS personalizado: Se o arquivo CSS não estiver disponível, a página não será estilizada corretamente.
   - Dependência externa para os scripts: Se esses scripts não estiverem disponíveis, a lógica do perfil não funcionará corretamente.

6. **Pontos de integração offline:**
   - O arquivo inclui scripts para armazenamento (`storage.js`), dados (`data.js`), aplicação principal (`app.js`), fala (`speech.js?v=20261001-audio-v3`), áudio estático (`static-audio.js?v=20261001-static-offline-2`), pré-carregamento de TTS (`tts-preload.js?v=20261001-audio-v3`), e a lógica do perfil (`perfil.js?v=20261001-shell-final-3`). Esses scripts podem ser integrados offline para garantir que a página funcione corretamente sem conexão à internet.

#### ARQUIVO: revisar.html

**Responsabilidade:**
O arquivo `revisar.html` é o principal arquivo da página de revisão do site English in Your Time. Ele contém a estrutura básica da página, incluindo o cabeçalho, o conteúdo principal e o rodapé.

**Funcionalidades comprovadas:**
1. **Interface de usuário:**
   - O arquivo contém um cabeçalho (`<header>`) com um logotipo e um menu de navegação.
   - O conteúdo principal (`

## Lote 17

### ARQUIVO: sw.js

**Responsabilidade:**
O arquivo `sw.js` é responsável por implementar um serviço web (Service Worker) para o site VanessaSchool. Ele é usado para cachear recursos estáticos e controlar a atualização do cache.

**Funcionalidades comprovadas:**
1. **Cache First:**
   - O cache de áudio é implementado como cache-first, garantindo que as áudios sejam armazenadas localmente e servidas diretamente do cache, sem fazer requisições ao servidor, a menos que o cache esteja vazio ou a requisição falhe.
   - O shell da aplicação (HTML, CSS, JS) é cacheado usando o método network-first, garantindo que o código não seja armazenado no cache e que sempre seja atualizado com o novo deploy.

2. **Cache de Áudio:**
   - O cache de áudio é nomeado como `eyt-static-audio-v3`.
   - Os arquivos de áudio são adicionados ao cache durante a instalação do Service Worker.

3. **Cache da Aplicação:**
   - O cache da aplicação é nomeado como `eyt-static-app-v3`.
   - Os arquivos do shell da aplicação são adicionados ao cache durante a instalação do Service Worker.

4. **Atualização do Cache:**
   - O Service Worker verifica se há novas versões dos arquivos no cache e atualiza o cache quando necessário.

5. **Riscos ou Lacunas:**
   - O cache de áudio pode não ser atualizado automaticamente se o arquivo de áudio for alterado no servidor.
   - O cache da aplicação pode não ser atualizado automaticamente se o arquivo de HTML, CSS ou JS for alterado no servidor.

6. **Pontos de Integração Offline:**
   - O cache de áudio e a aplicação podem ser usados offline, mas o conteúdo pode não ser atualizado automaticamente.

### ARQUIVO: teacher.html

**Responsabilidade:**
O arquivo `teacher.html` é o arquivo principal da página do professor Vanessa. Ele contém o layout e o conteúdo da página.

**Funcionalidades comprovadas:**
1. **Layout:**
   - O layout da página é bem estruturado, com um menu lateral e um cabeçalho.
   - O conteúdo da página é organizado em seções, como o hero, a filosofia e a sobre o professor.

2. **Imagens:**
   - As imagens usadas na página são carregadas corretamente e estão disponíveis offline.

3. **Estilos:**
   - Os estilos CSS são aplicados corretamente e estão disponíveis offline.

4. **Links:**
   - Os links para outras páginas e recursos externos são funcionais e estão disponíveis offline.

5. **Riscos ou Lacunas:**
   - A página pode não ser acessível offline se o cache não for atualizado.
   - A página pode não ser acessível offline se o conteúdo da página for alterado.

6. **Pontos de Integração Offline:**
   - A página pode ser usada offline, mas o conteúdo pode não ser atualizado automaticamente.

### ARQUIVO: vercel.json

**Responsabilidade:**
O arquivo `vercel.json` é responsável por configurar o ambiente do Vercel para o site VanessaSchool.

**Funcionalidades comprovadas:**
1. **Clean URLs:**
   - O Vercel está configurado para usar URLs limpas, o que significa que as URLs sem extensão `.html` serão redirecionadas para as versões com extensão `.html`.

2. **Trailing Slash:**
   - O Vercel está configurado para não usar trilhas de barra no final das URLs.

3. **Rewrites:**
   - O Vercel está configurado para redirecionar URLs para o Hugging Face, usando o caminho `/hf-kokoro/:path*`.

4. **Headers:**
   - O Vercel está configurado para adicionar cabeçalhos de cache para os arquivos do Hugging Face, garantindo que eles sejam armazenados localmente e servidos diretamente do cache.

5. **Riscos ou Lacunas:**
   - O Vercel pode não ser capaz de gerenciar o cache dos arquivos do Hugging Face de forma eficiente.
   - O Vercel pode não ser capaz de gerenciar o cache dos arquivos do Hugging Face de forma eficiente.

6. **Pontos de Integração Offline:**
   - O Vercel pode ser usado offline, mas o conteúdo pode não ser atualizado automaticamente.

## Requisitos para integração de exercícios offline

- Catálogo por fonte, tema, habilidade e nível CEFR.
- Importação local de materiais autorizados.
- Exercícios interativos e correção.
- Histórico e progresso do estudante.
- Armazenamento offline com IndexedDB.
- Avaliação de Service Worker e PWA.
- Preservação de links e atribuição de origem.
- Nenhuma credencial ou material protegido publicado no Git.

### Fontes de referência

- https://eslbrains.com/
- https://ellii.com/
- https://www.elllo.org/