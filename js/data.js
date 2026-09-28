const EYTData = {
    curso: {
        id: "english-foundations",
        titulo: "English Foundations",
        descricao: "Construa uma base sólida para se comunicar em inglês.",
        nivel: "A1"
    },

    unidades: [
        {
            id: "unit-1",
            numero: 1,
            titulo: "Getting Started",
            descricao: "Comece a se comunicar em inglês.",
            licoes: [
                "greetings",
                "introductions",
                "personal-information"
            ]
        },
        {
            id: "unit-2",
            numero: 2,
            titulo: "Everyday English",
            descricao: "Inglês para situações do cotidiano.",
            licoes: [
                "daily-routine",
                "days-time",
                "family"
            ]
        },
        {
            id: "unit-3",
            numero: 3,
            titulo: "Real Life",
            descricao: "Use inglês em situações reais.",
            licoes: [
                "restaurant",
                "shopping",
                "directions"
            ]
        }
    ],

    licoes: {
        "greetings": {
            id: "greetings",
            unidade: "unit-1",
            titulo: "Greetings",
            subtitulo: "Saudações",
            descricao: "Aprenda as principais formas de cumprimentar alguém em inglês.",
            icone: "👋",
            xp: 80,
            exercicios: [
                {
                    id: "greetings-1",
                    tipo: "multipla_escolha",
                    pergunta: "Como dizemos “Bom dia” em inglês?",
                    alternativas: [
                        "Good morning",
                        "Good night",
                        "Good afternoon",
                        "Goodbye"
                    ],
                    resposta: "Good morning",
                    explicacao: "Good morning significa “Bom dia”.",
                    xp: 10
                },
                {
                    id: "greetings-2",
                    tipo: "multipla_escolha",
                    pergunta: "Qual expressão significa “Boa noite” ao se despedir?",
                    alternativas: [
                        "Good evening",
                        "Good night",
                        "Good morning",
                        "Hello"
                    ],
                    resposta: "Good night",
                    explicacao: "Good night é normalmente usado ao se despedir à noite ou antes de dormir.",
                    xp: 10
                },
                {
                    id: "greetings-3",
                    tipo: "traducao",
                    pergunta: "Traduza para o inglês:",
                    instrucao: "Olá!",
                    resposta: "Hello",
                    respostasAceitas: [
                        "hello",
                        "hi"
                    ],
                    explicacao: "Hello e Hi são formas comuns de dizer “Olá”.",
                    xp: 10
                },
                {
                    id: "greetings-4",
                    tipo: "completar",
                    pergunta: "Complete a frase:",
                    instrucao: "Good _____! It's 8 AM.",
                    resposta: "morning",
                    respostasAceitas: [
                        "morning"
                    ],
                    explicacao: "Às 8 da manhã usamos “Good morning”.",
                    xp: 10
                },
                {
                    id: "greetings-5",
                    tipo: "multipla_escolha",
                    pergunta: "Você encontra um amigo às 3 PM. O que pode dizer?",
                    alternativas: [
                        "Good morning",
                        "Good afternoon",
                        "Good night",
                        "See you yesterday"
                    ],
                    resposta: "Good afternoon",
                    explicacao: "Good afternoon é usado durante a tarde.",
                    xp: 10
                },
                {
                    id: "greetings-6",
                    tipo: "ordenar",
                    pergunta: "Organize as palavras:",
                    palavras: [
                        "to",
                        "Nice",
                        "you",
                        "meet"
                    ],
                    resposta: "Nice to meet you",
                    explicacao: "Nice to meet you significa “Prazer em conhecer você”.",
                    xp: 10
                },
                {
                    id: "greetings-7",
                    tipo: "multipla_escolha",
                    pergunta: "Qual expressão é uma despedida?",
                    alternativas: [
                        "Hello",
                        "Good morning",
                        "Goodbye",
                        "Nice to meet you"
                    ],
                    resposta: "Goodbye",
                    explicacao: "Goodbye significa “Tchau” ou “Adeus”.",
                    xp: 10
                },
                {
                    id: "greetings-8",
                    tipo: "traducao",
                    pergunta: "Escreva em inglês:",
                    instrucao: "Até logo",
                    resposta: "See you later",
                    respostasAceitas: [
                        "see you later",
                        "see you"
                    ],
                    explicacao: "See you later significa “Até logo”.",
                    xp: 10
                }
            ]
        },

        "introductions": {
            id: "introductions",
            unidade: "unit-1",
            titulo: "Introductions",
            subtitulo: "Apresentações",
            descricao: "Aprenda a se apresentar e perguntar o nome de alguém.",
            icone: "💬",
            xp: 80,
            exercicios: [
                {
                    id: "introductions-1",
                    tipo: "multipla_escolha",
                    pergunta: "Como perguntamos “Qual é o seu nome?”",
                    alternativas: [
                        "Where are you?",
                        "What's your name?",
                        "How old are you?",
                        "What time is it?"
                    ],
                    resposta: "What's your name?",
                    explicacao: "What's your name? significa “Qual é o seu nome?”.",
                    xp: 10
                },
                {
                    id: "introductions-2",
                    tipo: "completar",
                    pergunta: "Complete:",
                    instrucao: "My _____ is Vanessa.",
                    resposta: "name",
                    respostasAceitas: [
                        "name"
                    ],
                    explicacao: "My name is... significa “Meu nome é...”.",
                    xp: 10
                },
                {
                    id: "introductions-3",
                    tipo: "traducao",
                    pergunta: "Traduza para o inglês:",
                    instrucao: "Meu nome é Lucas.",
                    resposta: "My name is Lucas",
                    respostasAceitas: [
                        "my name is lucas",
                        "i am lucas",
                        "i'm lucas"
                    ],
                    explicacao: "Você pode usar “My name is Lucas” ou “I'm Lucas”.",
                    xp: 10
                },
                {
                    id: "introductions-4",
                    tipo: "multipla_escolha",
                    pergunta: "Como responder a “How are you?”",
                    alternativas: [
                        "I'm fine, thanks.",
                        "My name is fine.",
                        "Goodbye morning.",
                        "I have twenty."
                    ],
                    resposta: "I'm fine, thanks.",
                    explicacao: "I'm fine, thanks é uma resposta comum para “How are you?”.",
                    xp: 10
                },
                {
                    id: "introductions-5",
                    tipo: "ordenar",
                    pergunta: "Organize a frase:",
                    palavras: [
                        "are",
                        "How",
                        "you"
                    ],
                    resposta: "How are you",
                    explicacao: "How are you? significa “Como você está?”.",
                    xp: 10
                },
                {
                    id: "introductions-6",
                    tipo: "traducao",
                    pergunta: "Traduza:",
                    instrucao: "Prazer em conhecer você.",
                    resposta: "Nice to meet you",
                    respostasAceitas: [
                        "nice to meet you"
                    ],
                    explicacao: "Nice to meet you é usado quando conhecemos alguém.",
                    xp: 10
                },
                {
                    id: "introductions-7",
                    tipo: "multipla_escolha",
                    pergunta: "Someone says: “Nice to meet you.” Qual resposta funciona bem?",
                    alternativas: [
                        "Nice to meet you too.",
                        "Good morning yesterday.",
                        "My fine.",
                        "I name Vanessa."
                    ],
                    resposta: "Nice to meet you too.",
                    explicacao: "Too significa “também” nesse contexto.",
                    xp: 10
                },
                {
                    id: "introductions-8",
                    tipo: "completar",
                    pergunta: "Complete:",
                    instrucao: "I _____ André.",
                    resposta: "am",
                    respostasAceitas: [
                        "am",
                        "'m"
                    ],
                    explicacao: "Com I usamos o verbo “am”: I am André.",
                    xp: 10
                }
            ]
        },

        "personal-information": {
            id: "personal-information",
            unidade: "unit-1",
            titulo: "Personal Information",
            subtitulo: "Informações pessoais",
            descricao: "Fale sobre país, cidade, idade e informações básicas.",
            icone: "🪪",
            xp: 80,
            exercicios: [
                {
                    id: "personal-1",
                    tipo: "multipla_escolha",
                    pergunta: "Como perguntamos “De onde você é?”",
                    alternativas: [
                        "Where are you from?",
                        "Where do you time?",
                        "Who old are you?",
                        "What your country?"
                    ],
                    resposta: "Where are you from?",
                    explicacao: "Where are you from? pergunta a origem de alguém.",
                    xp: 10
                },
                {
                    id: "personal-2",
                    tipo: "traducao",
                    pergunta: "Traduza:",
                    instrucao: "Eu sou do Brasil.",
                    resposta: "I am from Brazil",
                    respostasAceitas: [
                        "i am from brazil",
                        "i'm from brazil"
                    ],
                    explicacao: "I am from Brazil significa “Eu sou do Brasil”.",
                    xp: 10
                },
                {
                    id: "personal-3",
                    tipo: "completar",
                    pergunta: "Complete:",
                    instrucao: "I live _____ Brazil.",
                    resposta: "in",
                    respostasAceitas: [
                        "in"
                    ],
                    explicacao: "Usamos “in” com países e cidades: I live in Brazil.",
                    xp: 10
                },
                {
                    id: "personal-4",
                    tipo: "multipla_escolha",
                    pergunta: "Como perguntamos a idade?",
                    alternativas: [
                        "How age you?",
                        "How old are you?",
                        "What years you?",
                        "Where old are you?"
                    ],
                    resposta: "How old are you?",
                    explicacao: "How old are you? significa “Quantos anos você tem?”.",
                    xp: 10
                },
                {
                    id: "personal-5",
                    tipo: "traducao",
                    pergunta: "Escreva em inglês:",
                    instrucao: "Eu tenho vinte anos.",
                    resposta: "I am twenty years old",
                    respostasAceitas: [
                        "i am twenty years old",
                        "i'm twenty years old",
                        "i am twenty"
                    ],
                    explicacao: "Em inglês usamos o verbo to be para idade.",
                    xp: 10
                },
                {
                    id: "personal-6",
                    tipo: "ordenar",
                    pergunta: "Organize:",
                    palavras: [
                        "live",
                        "I",
                        "São Paulo",
                        "in"
                    ],
                    resposta: "I live in São Paulo",
                    explicacao: "A estrutura é: I + live + in + lugar.",
                    xp: 10
                },
                {
                    id: "personal-7",
                    tipo: "multipla_escolha",
                    pergunta: "Brazilian significa:",
                    alternativas: [
                        "Brasil",
                        "Brasileiro(a)",
                        "Brasília",
                        "Português"
                    ],
                    resposta: "Brasileiro(a)",
                    explicacao: "Brazilian é a nacionalidade de quem é do Brasil.",
                    xp: 10
                },
                {
                    id: "personal-8",
                    tipo: "completar",
                    pergunta: "Complete:",
                    instrucao: "I _____ Brazilian.",
                    resposta: "am",
                    respostasAceitas: [
                        "am",
                        "'m"
                    ],
                    explicacao: "I am Brazilian significa “Eu sou brasileiro(a)”.",
                    xp: 10
                }
            ]
        },

        "daily-routine": {
            id: "daily-routine",
            unidade: "unit-2",
            titulo: "Daily Routine",
            subtitulo: "Rotina diária",
            descricao: "Fale sobre atividades do seu dia.",
            icone: "☀️",
            xp: 60,
            exercicios: [
                {
                    id: "routine-1",
                    tipo: "multipla_escolha",
                    pergunta: "Wake up significa:",
                    alternativas: [
                        "Dormir",
                        "Acordar",
                        "Trabalhar",
                        "Comer"
                    ],
                    resposta: "Acordar",
                    explicacao: "Wake up significa “acordar”.",
                    xp: 10
                },
                {
                    id: "routine-2",
                    tipo: "traducao",
                    pergunta: "Traduza:",
                    instrucao: "Eu acordo às sete.",
                    resposta: "I wake up at seven",
                    respostasAceitas: [
                        "i wake up at seven",
                        "i wake up at 7",
                        "i wake up at 7:00"
                    ],
                    explicacao: "Usamos at antes de horários.",
                    xp: 10
                },
                {
                    id: "routine-3",
                    tipo: "completar",
                    pergunta: "Complete:",
                    instrucao: "I _____ breakfast every morning.",
                    resposta: "have",
                    respostasAceitas: [
                        "have",
                        "eat"
                    ],
                    explicacao: "Have breakfast é uma expressão muito comum.",
                    xp: 10
                },
                {
                    id: "routine-4",
                    tipo: "multipla_escolha",
                    pergunta: "Go to work significa:",
                    alternativas: [
                        "Ir trabalhar",
                        "Voltar para casa",
                        "Ir dormir",
                        "Tomar café"
                    ],
                    resposta: "Ir trabalhar",
                    explicacao: "Go to work significa “ir trabalhar”.",
                    xp: 10
                },
                {
                    id: "routine-5",
                    tipo: "ordenar",
                    pergunta: "Organize:",
                    palavras: [
                        "go",
                        "I",
                        "bed",
                        "to"
                    ],
                    resposta: "I go to bed",
                    explicacao: "Go to bed significa “ir para a cama”.",
                    xp: 10
                },
                {
                    id: "routine-6",
                    tipo: "traducao",
                    pergunta: "Traduza:",
                    instrucao: "Eu estudo inglês todos os dias.",
                    resposta: "I study English every day",
                    respostasAceitas: [
                        "i study english every day",
                        "i study english everyday"
                    ],
                    explicacao: "Every day significa “todos os dias”.",
                    xp: 10
                }
            ]
        },

        "days-time": {
            id: "days-time",
            unidade: "unit-2",
            titulo: "Days & Time",
            subtitulo: "Dias e horários",
            descricao: "Aprenda dias da semana e como falar sobre horários.",
            icone: "🕒",
            xp: 60,
            exercicios: [
                {
                    id: "time-1",
                    tipo: "multipla_escolha",
                    pergunta: "Monday significa:",
                    alternativas: [
                        "Domingo",
                        "Segunda-feira",
                        "Terça-feira",
                        "Sábado"
                    ],
                    resposta: "Segunda-feira",
                    explicacao: "Monday é segunda-feira.",
                    xp: 10
                },
                {
                    id: "time-2",
                    tipo: "multipla_escolha",
                    pergunta: "Friday significa:",
                    alternativas: [
                        "Sexta-feira",
                        "Quarta-feira",
                        "Domingo",
                        "Segunda-feira"
                    ],
                    resposta: "Sexta-feira",
                    explicacao: "Friday é sexta-feira.",
                    xp: 10
                },
                {
                    id: "time-3",
                    tipo: "traducao",
                    pergunta: "Traduza:",
                    instrucao: "Hoje é terça-feira.",
                    resposta: "Today is Tuesday",
                    respostasAceitas: [
                        "today is tuesday",
                        "it's tuesday today",
                        "it is tuesday today"
                    ],
                    explicacao: "Tuesday significa terça-feira.",
                    xp: 10
                },
                {
                    id: "time-4",
                    tipo: "completar",
                    pergunta: "Complete:",
                    instrucao: "What _____ is it?",
                    resposta: "time",
                    respostasAceitas: [
                        "time"
                    ],
                    explicacao: "What time is it? significa “Que horas são?”.",
                    xp: 10
                },
                {
                    id: "time-5",
                    tipo: "multipla_escolha",
                    pergunta: "It's nine o'clock significa:",
                    alternativas: [
                        "São oito horas",
                        "São nove horas",
                        "São dez horas",
                        "É meio-dia"
                    ],
                    resposta: "São nove horas",
                    explicacao: "Nine o'clock corresponde a nove horas.",
                    xp: 10
                },
                {
                    id: "time-6",
                    tipo: "ordenar",
                    pergunta: "Organize:",
                    palavras: [
                        "is",
                        "What",
                        "it",
                        "time"
                    ],
                    resposta: "What time is it",
                    explicacao: "What time is it? é a pergunta padrão para horário.",
                    xp: 10
                }
            ]
        },

        "family": {
            id: "family",
            unidade: "unit-2",
            titulo: "Family",
            subtitulo: "Família",
            descricao: "Aprenda vocabulário para falar sobre sua família.",
            icone: "🏠",
            xp: 60,
            exercicios: [
                {
                    id: "family-1",
                    tipo: "multipla_escolha",
                    pergunta: "Mother significa:",
                    alternativas: [
                        "Mãe",
                        "Pai",
                        "Irmã",
                        "Avó"
                    ],
                    resposta: "Mãe",
                    explicacao: "Mother significa mãe.",
                    xp: 10
                },
                {
                    id: "family-2",
                    tipo: "multipla_escolha",
                    pergunta: "Brother significa:",
                    alternativas: [
                        "Irmã",
                        "Irmão",
                        "Pai",
                        "Primo"
                    ],
                    resposta: "Irmão",
                    explicacao: "Brother significa irmão.",
                    xp: 10
                },
                {
                    id: "family-3",
                    tipo: "traducao",
                    pergunta: "Traduza:",
                    instrucao: "Esta é minha irmã.",
                    resposta: "This is my sister",
                    respostasAceitas: [
                        "this is my sister"
                    ],
                    explicacao: "Sister significa irmã.",
                    xp: 10
                },
                {
                    id: "family-4",
                    tipo: "completar",
                    pergunta: "Complete:",
                    instrucao: "This is _____ father.",
                    resposta: "my",
                    respostasAceitas: [
                        "my"
                    ],
                    explicacao: "My significa “meu/minha”.",
                    xp: 10
                },
                {
                    id: "family-5",
                    tipo: "multipla_escolha",
                    pergunta: "Parents significa:",
                    alternativas: [
                        "Parentes em geral",
                        "Pais",
                        "Primos",
                        "Avós"
                    ],
                    resposta: "Pais",
                    explicacao: "Parents significa pai e mãe, ou pais.",
                    xp: 10
                },
                {
                    id: "family-6",
                    tipo: "ordenar",
                    pergunta: "Organize:",
                    palavras: [
                        "my",
                        "This",
                        "mother",
                        "is"
                    ],
                    resposta: "This is my mother",
                    explicacao: "This is my mother significa “Esta é minha mãe”.",
                    xp: 10
                }
            ]
        },

        "restaurant": {
            id: "restaurant",
            unidade: "unit-3",
            titulo: "At the Restaurant",
            subtitulo: "No restaurante",
            descricao: "Peça alimentos e bebidas em inglês.",
            icone: "🍽️",
            xp: 60,
            exercicios: [
                {
                    id: "restaurant-1",
                    tipo: "multipla_escolha",
                    pergunta: "Menu significa:",
                    alternativas: [
                        "Conta",
                        "Cardápio",
                        "Mesa",
                        "Garçom"
                    ],
                    resposta: "Cardápio",
                    explicacao: "Menu significa cardápio.",
                    xp: 10
                },
                {
                    id: "restaurant-2",
                    tipo: "traducao",
                    pergunta: "Traduza:",
                    instrucao: "Eu gostaria de água.",
                    resposta: "I would like water",
                    respostasAceitas: [
                        "i would like water",
                        "i'd like water"
                    ],
                    explicacao: "I would like... é uma forma educada de fazer pedidos.",
                    xp: 10
                },
                {
                    id: "restaurant-3",
                    tipo: "completar",
                    pergunta: "Complete:",
                    instrucao: "Can I _____ the menu, please?",
                    resposta: "see",
                    respostasAceitas: [
                        "see",
                        "have"
                    ],
                    explicacao: "Can I see the menu? é uma forma comum de pedir o cardápio.",
                    xp: 10
                },
                {
                    id: "restaurant-4",
                    tipo: "multipla_escolha",
                    pergunta: "The bill, please significa:",
                    alternativas: [
                        "O cardápio, por favor",
                        "A conta, por favor",
                        "Água, por favor",
                        "Uma mesa, por favor"
                    ],
                    resposta: "A conta, por favor",
                    explicacao: "Bill é a conta do restaurante.",
                    xp: 10
                },
                {
                    id: "restaurant-5",
                    tipo: "ordenar",
                    pergunta: "Organize:",
                    palavras: [
                        "like",
                        "coffee",
                        "I'd",
                        "a"
                    ],
                    resposta: "I'd like a coffee",
                    explicacao: "I'd like... significa “Eu gostaria de...”.",
                    xp: 10
                },
                {
                    id: "restaurant-6",
                    tipo: "traducao",
                    pergunta: "Traduza:",
                    instrucao: "A conta, por favor.",
                    resposta: "The bill, please",
                    respostasAceitas: [
                        "the bill please",
                        "the bill, please",
                        "check please",
                        "the check please"
                    ],
                    explicacao: "Nos EUA também é comum usar “check”.",
                    xp: 10
                }
            ]
        },

        "shopping": {
            id: "shopping",
            unidade: "unit-3",
            titulo: "Going Shopping",
            subtitulo: "Compras",
            descricao: "Pergunte preços e compre produtos em inglês.",
            icone: "🛍️",
            xp: 60,
            exercicios: [
                {
                    id: "shopping-1",
                    tipo: "multipla_escolha",
                    pergunta: "How much is it? significa:",
                    alternativas: [
                        "Onde está?",
                        "Quanto custa?",
                        "Que horas são?",
                        "Qual tamanho?"
                    ],
                    resposta: "Quanto custa?",
                    explicacao: "How much is it? pergunta o preço.",
                    xp: 10
                },
                {
                    id: "shopping-2",
                    tipo: "traducao",
                    pergunta: "Traduza:",
                    instrucao: "Quanto custa isto?",
                    resposta: "How much is this",
                    respostasAceitas: [
                        "how much is this",
                        "how much does this cost"
                    ],
                    explicacao: "How much...? é usado para perguntar preços.",
                    xp: 10
                },
                {
                    id: "shopping-3",
                    tipo: "completar",
                    pergunta: "Complete:",
                    instrucao: "Do you have this in a larger _____?",
                    resposta: "size",
                    respostasAceitas: [
                        "size"
                    ],
                    explicacao: "Size significa tamanho.",
                    xp: 10
                },
                {
                    id: "shopping-4",
                    tipo: "multipla_escolha",
                    pergunta: "Cheap significa:",
                    alternativas: [
                        "Caro",
                        "Barato",
                        "Grande",
                        "Pequeno"
                    ],
                    resposta: "Barato",
                    explicacao: "Cheap significa barato.",
                    xp: 10
                },
                {
                    id: "shopping-5",
                    tipo: "multipla_escolha",
                    pergunta: "Expensive significa:",
                    alternativas: [
                        "Barato",
                        "Grátis",
                        "Caro",
                        "Bonito"
                    ],
                    resposta: "Caro",
                    explicacao: "Expensive significa caro.",
                    xp: 10
                },
                {
                    id: "shopping-6",
                    tipo: "ordenar",
                    pergunta: "Organize:",
                    palavras: [
                        "much",
                        "this",
                        "How",
                        "is"
                    ],
                    resposta: "How much is this",
                    explicacao: "How much is this? significa “Quanto custa isto?”.",
                    xp: 10
                }
            ]
        },

        "directions": {
            id: "directions",
            unidade: "unit-3",
            titulo: "Asking for Directions",
            subtitulo: "Pedindo direções",
            descricao: "Pergunte onde ficam lugares e entenda orientações básicas.",
            icone: "🗺️",
            xp: 60,
            exercicios: [
                {
                    id: "directions-1",
                    tipo: "multipla_escolha",
                    pergunta: "Where is the hotel? significa:",
                    alternativas: [
                        "Quanto custa o hotel?",
                        "Onde fica o hotel?",
                        "O hotel está aberto?",
                        "Qual é o hotel?"
                    ],
                    resposta: "Onde fica o hotel?",
                    explicacao: "Where is...? pergunta onde algo está.",
                    xp: 10
                },
                {
                    id: "directions-2",
                    tipo: "multipla_escolha",
                    pergunta: "Turn left significa:",
                    alternativas: [
                        "Vire à esquerda",
                        "Vire à direita",
                        "Siga em frente",
                        "Pare"
                    ],
                    resposta: "Vire à esquerda",
                    explicacao: "Left significa esquerda.",
                    xp: 10
                },
                {
                    id: "directions-3",
                    tipo: "multipla_escolha",
                    pergunta: "Turn right significa:",
                    alternativas: [
                        "Vire à esquerda",
                        "Vire à direita",
                        "Volte",
                        "Atravesse"
                    ],
                    resposta: "Vire à direita",
                    explicacao: "Right significa direita.",
                    xp: 10
                },
                {
                    id: "directions-4",
                    tipo: "traducao",
                    pergunta: "Traduza:",
                    instrucao: "Onde fica o banco?",
                    resposta: "Where is the bank",
                    respostasAceitas: [
                        "where is the bank",
                        "where's the bank"
                    ],
                    explicacao: "Where is the bank? pergunta a localização do banco.",
                    xp: 10
                },
                {
                    id: "directions-5",
                    tipo: "completar",
                    pergunta: "Complete:",
                    instrucao: "Go straight _____ .",
                    resposta: "ahead",
                    respostasAceitas: [
                        "ahead"
                    ],
                    explicacao: "Go straight ahead significa “Siga em frente”.",
                    xp: 10
                },
                {
                    id: "directions-6",
                    tipo: "ordenar",
                    pergunta: "Organize:",
                    palavras: [
                        "the",
                        "Where",
                        "station",
                        "is"
                    ],
                    resposta: "Where is the station",
                    explicacao: "Where is the station? significa “Onde fica a estação?”.",
                    xp: 10
                }
            ]
        }
    },

    conquistas: [
        {
            id: "first-lesson",
            titulo: "First Step",
            descricao: "Conclua sua primeira lição.",
            icone: "🚀"
        },
        {
            id: "xp-100",
            titulo: "100 XP",
            descricao: "Alcance 100 XP.",
            icone: "⭐"
        },
        {
            id: "three-lessons",
            titulo: "On a Roll",
            descricao: "Conclua 3 lições.",
            icone: "📚"
        },
        {
            id: "streak-3",
            titulo: "Keep Going",
            descricao: "Estude por 3 dias consecutivos.",
            icone: "🔥"
        },
        {
            id: "xp-500",
            titulo: "English Explorer",
            descricao: "Alcance 500 XP.",
            icone: "🧭"
        },
        {
            id: "all-lessons",
            titulo: "Course Champion",
            descricao: "Conclua todas as lições disponíveis.",
            icone: "🏆"
        }
    ]
};