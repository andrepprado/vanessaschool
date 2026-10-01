const EYTData = {
    course: {
        id: "foundations-a1", title: "English Foundations", subtitle: "Construa uma base sólida para começar a se comunicar em inglês.", level: "A1", units: [
            {
                id: "unit-1", number: 1, title: "First Connections", description: "Comece a se comunicar desde a primeira unidade.", lessons: [
                    {
                        id: "greetings", title: "Greetings", description: "Aprenda formas essenciais de cumprimentar pessoas.", icon: "bi-chat-dots-fill", xp: 30, exercises: [
                            { id: "g1", type: "multiple", question: 'Como você diz "Olá" em inglês?', options: ["Hello", "Goodbye", "Thanks", "Please"], answer: "Hello" },
                            { id: "g2", type: "multiple", question: 'Qual expressão significa "Bom dia"?', options: ["Good night", "Good morning", "Good afternoon", "See you"], answer: "Good morning" },
                            { id: "g3", type: "translation", question: 'Traduza para o inglês: "Boa noite"', answer: "Good evening", alternatives: ["good evening"] },
                            { id: "g4", type: "fill", question: 'Complete: "___, my name is Vanessa."', answer: "Hello", alternatives: ["hello", "hi"] },
                            { id: "g5", type: "order", question: "Organize a frase:", words: ["are", "How", "you", "?"], answer: "How are you ?" }]
                    },
                    {
                        id: "introductions", title: "Introducing Yourself", description: "Aprenda a dizer seu nome e se apresentar.", icon: "bi-person-badge-fill", xp: 30, exercises: [
                            { id: "i1", type: "multiple", question: 'Como você diz "Meu nome é..."?', options: ["My name is...", "Your name is...", "I am fine", "Good morning"], answer: "My name is..." },
                            { id: "i2", type: "fill", question: 'Complete: "My ___ is John."', answer: "name", alternatives: ["name"] },
                            { id: "i3", type: "translation", question: 'Traduza: "Eu sou Vanessa."', answer: "I am Vanessa", alternatives: ["i am vanessa", "i'm vanessa"] },
                            { id: "i4", type: "multiple", question: 'Qual pergunta pede o nome de alguém?', options: ["How are you?", "What is your name?", "Where are you?", "How old are you?"], answer: "What is your name?" }]
                    },
                    {
                        id: "goodbyes", title: "Saying Goodbye", description: "Encerre conversas de forma natural.", icon: "bi-box-arrow-right", xp: 30, exercises: [
                            { id: "b1", type: "multiple", question: 'Qual expressão significa "Até logo"?', options: ["See you", "Hello", "Thank you", "Good morning"], answer: "See you" },
                            { id: "b2", type: "translation", question: 'Traduza: "Tchau"', answer: "Goodbye", alternatives: ["goodbye", "bye"] },
                            { id: "b3", type: "fill", question: 'Complete: "See you ___!"', answer: "later", alternatives: ["later", "soon"] }]
                    }]
            },
            {
                id: "unit-2", number: 2, title: "Everyday Basics", description: "Vocabulário e estruturas para situações do cotidiano.", lessons: [
                    {
                        id: "numbers", title: "Numbers", description: "Números básicos para o dia a dia.", icon: "bi-123", xp: 35, exercises: [
                            { id: "n1", type: "multiple", question: "Qual é o número five?", options: ["3", "4", "5", "6"], answer: "5" },
                            { id: "n2", type: "translation", question: 'Traduza "dez" para o inglês.', answer: "ten", alternatives: ["ten"] },
                            { id: "n3", type: "fill", question: "One, two, ___, four.", answer: "three", alternatives: ["three"] }]
                    },
                    {
                        id: "colors", title: "Colors", description: "Aprenda as cores mais usadas em inglês.", icon: "bi-palette-fill", xp: 35, exercises: [
                            { id: "c1", type: "multiple", question: 'Como se diz "azul"?', options: ["Red", "Blue", "Green", "Black"], answer: "Blue" },
                            { id: "c2", type: "translation", question: 'Traduza "vermelho".', answer: "red", alternatives: ["red"] },
                            { id: "c3", type: "fill", question: "Black and ___.", answer: "white", alternatives: ["white"] }]
                    },
                    {
                        id: "days", title: "Days of the Week", description: "Fale sobre sua semana e seus compromissos.", icon: "bi-calendar-week", xp: 35, exercises: [
                            { id: "d1", type: "multiple", question: "Qual dia vem depois de Monday?", options: ["Sunday", "Tuesday", "Friday", "Saturday"], answer: "Tuesday" },
                            { id: "d2", type: "translation", question: 'Traduza "sexta-feira".', answer: "Friday", alternatives: ["friday"] },
                            { id: "d3", type: "fill", question: "Monday, Tuesday, ___.", answer: "Wednesday", alternatives: ["wednesday"] }]
                    }]
            },
            {
                id: "unit-3", number: 3, title: "About You", description: "Comece a falar sobre você e sua vida.", lessons: [
                    {
                        id: "family", title: "Family", description: "Vocabulário para falar sobre sua família.", icon: "bi-people-fill", xp: 40, exercises: [
                            { id: "f1", type: "multiple", question: 'Como se diz "mãe"?', options: ["Mother", "Father", "Brother", "Sister"], answer: "Mother" },
                            { id: "f2", type: "translation", question: 'Traduza "irmão".', answer: "brother", alternatives: ["brother"] },
                            { id: "f3", type: "fill", question: "My father's wife is my ___.", answer: "mother", alternatives: ["mother"] }]
                    },
                    {
                        id: "likes", title: "Likes & Dislikes", description: "Diga do que você gosta e não gosta.", icon: "bi-heart-fill", xp: 40, exercises: [
                            { id: "l1", type: "multiple", question: 'Qual frase significa "Eu gosto de café"?', options: ["I like coffee", "I am coffee", "I have coffee", "I want likes"], answer: "I like coffee" },
                            { id: "l2", type: "translation", question: 'Traduza: "Eu não gosto de chuva."', answer: "I don't like rain", alternatives: ["i don't like rain", "i do not like rain"] },
                            { id: "l3", type: "fill", question: "I ___ music.", answer: "like", alternatives: ["like", "love"] }]
                    },
                    {
                        id: "routine", title: "Daily Routine", description: "Fale sobre atividades da sua rotina.", icon: "bi-clock-fill", xp: 40, exercises: [
                            { id: "r1", type: "multiple", question: 'Qual frase significa "Eu acordo às sete"?', options: ["I wake up at seven", "I sleep at seven", "I eat seven", "I work seven"], answer: "I wake up at seven" },
                            { id: "r2", type: "translation", question: 'Traduza: "Eu trabalho de manhã."', answer: "I work in the morning", alternatives: ["i work in the morning"] },
                            { id: "r3", type: "fill", question: "I ___ breakfast every morning.", answer: "eat", alternatives: ["eat", "have"] }]
                    }]
            },
            {
                id: "unit-4",
                number: 4,
                title: "Food & Everyday English",
                description: "Aprenda vocabulário e expressões para situações comuns do dia a dia.",
                lessons: [
                    {
                        id: "food-drinks",
                        title: "Food & Drinks",
                        description: "Aprenda alimentos, bebidas e preferências.",
                        icon: "bi-cup-straw",
                        xp: 45,
                        exercises: [
                            { id: "fd1", type: "multiple", question: 'Como se diz "água" em inglês?', options: ["Water", "Milk", "Coffee", "Juice"], answer: "Water" },
                            { id: "fd2", type: "multiple", question: 'Como se diz "pão" em inglês?', options: ["Bread", "Rice", "Cheese", "Meat"], answer: "Bread" },
                            { id: "fd3", type: "translation", question: 'Traduza: "Eu gosto de café."', answer: "I like coffee", alternatives: ["i like coffee"] },
                            { id: "fd4", type: "fill", question: "I drink ___ every morning.", answer: "coffee", alternatives: ["coffee", "water", "milk", "juice"] },
                            { id: "fd5", type: "order", question: "Organize a frase:", words: ["like", "I", "cheese"], answer: "I like cheese" }
                        ]
                    },
                    {
                        id: "restaurant",
                        title: "At a Restaurant",
                        description: "Use expressões naturais para pedir comida e bebida.",
                        icon: "bi-shop",
                        xp: 45,
                        exercises: [
                            { id: "res1", type: "multiple", question: "Você está em um restaurante. Qual pedido é mais natural?", options: ["Could I have some water, please?", "Give me water.", "I want waters.", "Water me."], answer: "Could I have some water, please?" },
                            { id: "res2", type: "translation", question: 'Traduza: "A conta, por favor."', answer: "The bill, please", alternatives: ["the bill please", "the bill, please", "the check please", "the check, please"] },
                            { id: "res3", type: "fill", question: "I would ___ a sandwich, please.", answer: "like", alternatives: ["like"] },
                            { id: "res4", type: "multiple", question: 'Qual palavra significa "cardápio"?', options: ["Menu", "Bill", "Table", "Order"], answer: "Menu" },
                            { id: "res5", type: "order", question: "Organize a frase:", words: ["like", "I'd", "coffee", "some"], answer: "I'd like some coffee" }
                        ]
                    },
                    {
                        id: "places-prepositions",
                        title: "Places & Prepositions",
                        description: "Fale sobre lugares e use preposições básicas.",
                        icon: "bi-geo-alt-fill",
                        xp: 45,
                        exercises: [
                            { id: "pp1", type: "multiple", question: "I live ___ Brazil.", options: ["in", "on", "at", "to"], answer: "in" },
                            { id: "pp2", type: "multiple", question: "Where do you usually take a shower?", options: ["In the bathroom", "In the kitchen", "In the garage", "In the garden"], answer: "In the bathroom" },
                            { id: "pp3", type: "translation", question: 'Traduza: "Eu moro no Brasil."', answer: "I live in Brazil", alternatives: ["i live in brazil"] },
                            { id: "pp4", type: "fill", question: "My brother lives ___ Canada.", answer: "in", alternatives: ["in"] },
                            { id: "pp5", type: "order", question: "Organize a frase:", words: ["bank", "the", "Where", "is"], answer: "Where is the bank" }
                        ]
                    }
                ]
            },
            {
                id: "unit-5",
                number: 5,
                title: "School & Preferences",
                description: "Fale sobre escola, matérias, preferências e opiniões.",
                lessons: [
                    {
                        id: "school-subjects",
                        title: "School Subjects",
                        description: "Aprenda os nomes das principais matérias escolares.",
                        icon: "bi-book-fill",
                        xp: 50,
                        exercises: [
                            { id: "ss1", type: "multiple", question: "Which subject teaches us about the past?", options: ["History", "Maths", "Music", "PE"], answer: "History" },
                            { id: "ss2", type: "multiple", question: "Which subject works with numbers?", options: ["Maths", "Art", "History", "Music"], answer: "Maths" },
                            { id: "ss3", type: "multiple", question: "Football and basketball are commonly practiced in...", options: ["PE", "Geography", "Science", "History"], answer: "PE" },
                            { id: "ss4", type: "translation", question: 'Traduza: "Minha matéria favorita é geografia."', answer: "My favorite subject is geography", alternatives: ["my favorite subject is geography", "my favourite subject is geography"] },
                            { id: "ss5", type: "order", question: "Organize a frase:", words: ["favorite", "English", "My", "subject", "is"], answer: "My favorite subject is English" }
                        ]
                    },
                    {
                        id: "preferences",
                        title: "Likes & Preferences",
                        description: "Fale sobre coisas que você gosta, ama ou não gosta.",
                        icon: "bi-heart-fill",
                        xp: 50,
                        exercises: [
                            { id: "pr1", type: "multiple", question: 'Qual frase significa "Eu gosto de aprender inglês"?', options: ["I like learning English", "I am learning like English", "I likes English", "I like learnings English"], answer: "I like learning English" },
                            { id: "pr2", type: "translation", question: 'Traduza: "Eu amo viajar."', answer: "I love travelling", alternatives: ["i love travelling", "i love traveling"] },
                            { id: "pr3", type: "fill", question: "I ___ playing video games.", answer: "like", alternatives: ["like", "love"] },
                            { id: "pr4", type: "translation", question: 'Traduza: "Eu não gosto de matemática."', answer: "I don't like maths", alternatives: ["i don't like maths", "i do not like maths", "i don't like math", "i do not like math"] },
                            { id: "pr5", type: "order", question: "Organize a frase:", words: ["really", "I", "music", "like"], answer: "I really like music" }
                        ]
                    },
                    {
                        id: "adjectives-opinions",
                        title: "Adjectives & Opinions",
                        description: "Descreva matérias e atividades usando adjetivos.",
                        icon: "bi-chat-square-text-fill",
                        xp: 50,
                        exercises: [
                            { id: "ao1", type: "multiple", question: 'Qual palavra significa "interessante"?', options: ["Interesting", "Boring", "Difficult", "Easy"], answer: "Interesting" },
                            { id: "ao2", type: "multiple", question: 'Qual é o oposto de "easy"?', options: ["Difficult", "Interesting", "Creative", "Active"], answer: "Difficult" },
                            { id: "ao3", type: "translation", question: 'Traduza: "Eu acho ciências interessante."', answer: "I think science is interesting", alternatives: ["i think science is interesting"] },
                            { id: "ao4", type: "fill", question: "This exercise is very ___. I can do it quickly.", answer: "easy", alternatives: ["easy"] },
                            { id: "ao5", type: "order", question: "Organize a frase:", words: ["difficult", "but", "Maths", "interesting", "is"], answer: "Maths is difficult but interesting" }
                        ]
                    }
                ]
            },
            {
                id: "unit-6",
                number: 6,
                title: "Present English",
                description: "Reforce estruturas importantes para falar sobre o presente.",
                lessons: [
                    {
                        id: "do-does",
                        title: "Do & Does",
                        description: "Faça perguntas no presente usando do e does.",
                        icon: "bi-question-circle-fill",
                        xp: 55,
                        exercises: [
                            { id: "dd1", type: "multiple", question: "Where ___ your parents work?", options: ["do", "does", "are", "is"], answer: "do" },
                            { id: "dd2", type: "multiple", question: "Where ___ your brother work?", options: ["does", "do", "is", "are"], answer: "does" },
                            { id: "dd3", type: "fill", question: "___ you like coffee?", answer: "Do", alternatives: ["do"] },
                            { id: "dd4", type: "translation", question: 'Traduza: "Ela gosta de música?"', answer: "Does she like music?", alternatives: ["does she like music", "does she like music?"] },
                            { id: "dd5", type: "order", question: "Organize a pergunta:", words: ["work", "Where", "you", "do"], answer: "Where do you work" }
                        ]
                    },
                    {
                        id: "present-continuous",
                        title: "Present Continuous",
                        description: "Fale sobre ações que estão acontecendo agora.",
                        icon: "bi-arrow-repeat",
                        xp: 55,
                        exercises: [
                            { id: "pc1", type: "multiple", question: "She ___ an orange right now.", options: ["is eating", "eats", "eat", "ate"], answer: "is eating" },
                            { id: "pc2", type: "multiple", question: "Look! It ___.", options: ["is raining", "rains", "rained", "rain"], answer: "is raining" },
                            { id: "pc3", type: "fill", question: "They are ___ English now. (study)", answer: "studying", alternatives: ["studying"] },
                            { id: "pc4", type: "translation", question: 'Traduza: "Eu estou trabalhando agora."', answer: "I am working now", alternatives: ["i am working now", "i'm working now"] },
                            { id: "pc5", type: "order", question: "Organize a frase:", words: ["TV", "watching", "They", "are"], answer: "They are watching TV" }
                        ]
                    },
                    {
                        id: "articles",
                        title: "A, An & The",
                        description: "Aprenda a usar os artigos básicos em inglês.",
                        icon: "bi-fonts",
                        xp: 55,
                        exercises: [
                            { id: "ar1", type: "multiple", question: "She is eating ___ orange.", options: ["an", "a", "the", "some"], answer: "an" },
                            { id: "ar2", type: "multiple", question: "I have ___ car.", options: ["a", "an", "some", "any"], answer: "a" },
                            { id: "ar3", type: "fill", question: "He is ___ English teacher.", answer: "an", alternatives: ["an"] },
                            { id: "ar4", type: "translation", question: 'Traduza: "Eu tenho um cachorro."', answer: "I have a dog", alternatives: ["i have a dog"] },
                            { id: "ar5", type: "order", question: "Organize a frase:", words: ["apple", "an", "She", "has"], answer: "She has an apple" }
                        ]
                    }
                ]
            },
            {
                id: "unit-7",
                number: 7,
                title: "Past of To Be",
                description: "Use was e were para falar sobre pessoas e situações no passado.",
                lessons: [
                    {
                        id: "was-were",
                        title: "Was & Were",
                        description: "Aprenda as formas passadas do verbo to be.",
                        icon: "bi-clock-history",
                        xp: 60,
                        exercises: [
                            { id: "ww1", type: "multiple", question: "I ___ at home yesterday.", options: ["was", "were", "am", "are"], answer: "was" },
                            { id: "ww2", type: "multiple", question: "They ___ happy at school.", options: ["were", "was", "are", "did"], answer: "were" },
                            { id: "ww3", type: "fill", question: "She ___ a student last year.", answer: "was", alternatives: ["was"] },
                            { id: "ww4", type: "translation", question: 'Traduza: "Nós estávamos cansados."', answer: "We were tired", alternatives: ["we were tired"] },
                            { id: "ww5", type: "order", question: "Organize a frase:", words: ["yesterday", "was", "cold", "It"], answer: "It was cold yesterday" }
                        ]
                    },
                    {
                        id: "wasnt-werent",
                        title: "Wasn't & Weren't",
                        description: "Use as formas negativas de was e were.",
                        icon: "bi-x-circle-fill",
                        xp: 60,
                        exercises: [
                            { id: "wn1", type: "multiple", question: "The teacher ___ boring.", options: ["wasn't", "weren't", "didn't", "doesn't"], answer: "wasn't" },
                            { id: "wn2", type: "multiple", question: "We ___ at school yesterday.", options: ["weren't", "wasn't", "aren't", "didn't"], answer: "weren't" },
                            { id: "wn3", type: "fill", question: "There ___ many people at the concert.", answer: "weren't", alternatives: ["weren't", "were not"] },
                            { id: "wn4", type: "translation", question: 'Traduza: "Eu não estava em casa."', answer: "I wasn't at home", alternatives: ["i wasn't at home", "i was not at home"] },
                            { id: "wn5", type: "order", question: "Organize a frase:", words: ["weren't", "They", "tired"], answer: "They weren't tired" }
                        ]
                    },
                    {
                        id: "was-were-questions",
                        title: "Questions with Was & Were",
                        description: "Faça perguntas sobre situações no passado.",
                        icon: "bi-patch-question-fill",
                        xp: 60,
                        exercises: [
                            { id: "wwq1", type: "multiple", question: "___ you at school yesterday?", options: ["Were", "Was", "Did", "Are"], answer: "Were" },
                            { id: "wwq2", type: "multiple", question: "___ your teacher friendly?", options: ["Was", "Were", "Did", "Does"], answer: "Was" },
                            { id: "wwq3", type: "translation", question: 'Traduza: "Eles estavam felizes?"', answer: "Were they happy?", alternatives: ["were they happy", "were they happy?"] },
                            { id: "wwq4", type: "fill", question: "___ there a park near your school?", answer: "Was", alternatives: ["was"] },
                            { id: "wwq5", type: "order", question: "Organize a pergunta:", words: ["teachers", "Were", "friendly", "your"], answer: "Were your teachers friendly" }
                        ]
                    },
                    {
                        id: "school-days",
                        title: "School Days",
                        description: "Converse sobre como eram seus tempos de escola.",
                        icon: "bi-mortarboard-fill",
                        xp: 60,
                        exercises: [
                            { id: "sd1", type: "multiple", question: "My favorite subject ___ English.", options: ["was", "were", "did", "is"], answer: "was" },
                            { id: "sd2", type: "fill", question: "My classmates and I ___ happy at school.", answer: "were", alternatives: ["were"] },
                            { id: "sd3", type: "translation", question: 'Traduza: "Meus professores eram amigáveis."', answer: "My teachers were friendly", alternatives: ["my teachers were friendly"] },
                            { id: "sd4", type: "multiple", question: 'Choose the correct short answer: "Were they happy?"', options: ["Yes, they were.", "Yes, they was.", "Yes, they did.", "Yes, they are."], answer: "Yes, they were." },
                            { id: "sd5", type: "order", question: "Organize a frase:", words: ["fun", "school", "My", "days", "were"], answer: "My school days were fun" }
                        ]
                    }
                ]
            },
            {
                id: "unit-8",
                number: 8,
                title: "Past Simple Basics",
                description: "Comece a falar sobre ações concluídas no passado.",
                lessons: [
                    {
                        id: "regular-verbs",
                        title: "Regular Verbs",
                        description: "Forme o passado de verbos regulares.",
                        icon: "bi-calendar-check-fill",
                        xp: 65,
                        exercises: [
                            { id: "rv1", type: "multiple", question: 'Qual é o passado de "work"?', options: ["worked", "workt", "working", "works"], answer: "worked" },
                            { id: "rv2", type: "multiple", question: 'Qual é o passado de "visit"?', options: ["visited", "visitted", "visit", "visiting"], answer: "visited" },
                            { id: "rv3", type: "fill", question: "Yesterday I ___ my grandmother. (visit)", answer: "visited", alternatives: ["visited"] },
                            { id: "rv4", type: "translation", question: 'Traduza: "Nós trabalhamos ontem."', answer: "We worked yesterday", alternatives: ["we worked yesterday"] },
                            { id: "rv5", type: "order", question: "Organize a frase:", words: ["TV", "watched", "night", "They", "last"], answer: "They watched TV last night" }
                        ]
                    },
                    {
                        id: "spelling-past",
                        title: "Past Spelling Rules",
                        description: "Pratique regras de escrita dos verbos regulares.",
                        icon: "bi-pencil-fill",
                        xp: 65,
                        exercises: [
                            { id: "spr1", type: "multiple", question: 'Past of "live":', options: ["lived", "liveed", "livved", "living"], answer: "lived" },
                            { id: "spr2", type: "multiple", question: 'Past of "study":', options: ["studied", "studyed", "studyd", "studing"], answer: "studied" },
                            { id: "spr3", type: "multiple", question: 'Past of "stop":', options: ["stopped", "stoped", "stopt", "stop"], answer: "stopped" },
                            { id: "spr4", type: "fill", question: "She ___ hard for the exam. (study)", answer: "studied", alternatives: ["studied"] },
                            { id: "spr5", type: "fill", question: "The car ___ near the school. (stop)", answer: "stopped", alternatives: ["stopped"] }
                        ]
                    },
                    {
                        id: "past-time-expressions",
                        title: "Past Time Expressions",
                        description: "Use expressões que indicam quando algo aconteceu.",
                        icon: "bi-calendar3",
                        xp: 65,
                        exercises: [
                            { id: "pte1", type: "multiple", question: "Which expression refers to the past?", options: ["Yesterday", "Right now", "Every day", "Usually"], answer: "Yesterday" },
                            { id: "pte2", type: "multiple", question: 'Qual expressão significa "na noite passada"?', options: ["Last night", "Next night", "Every night", "Tonight"], answer: "Last night" },
                            { id: "pte3", type: "translation", question: 'Traduza: "Eu trabalhei no mês passado."', answer: "I worked last month", alternatives: ["i worked last month"] },
                            { id: "pte4", type: "fill", question: "We visited Canada ___ year.", answer: "last", alternatives: ["last"] },
                            { id: "pte5", type: "order", question: "Organize a frase:", words: ["ago", "moved", "years", "They", "two"], answer: "They moved two years ago" }
                        ]
                    }
                ]
            },
            {
                id: "unit-9",
                number: 9,
                title: "Irregular Verbs",
                description: "Aprenda verbos irregulares frequentes no Past Simple.",
                lessons: [
                    {
                        id: "irregular-verbs-1",
                        title: "Irregular Verbs I",
                        description: "Pratique verbos irregulares comuns.",
                        icon: "bi-lightning-fill",
                        xp: 70,
                        exercises: [
                            { id: "iv1", type: "multiple", question: 'Past of "go":', options: ["went", "goed", "gone", "goes"], answer: "went" },
                            { id: "iv2", type: "multiple", question: 'Past of "see":', options: ["saw", "seen", "seed", "seeing"], answer: "saw" },
                            { id: "iv3", type: "multiple", question: 'Past of "eat":', options: ["ate", "eated", "eaten", "eats"], answer: "ate" },
                            { id: "iv4", type: "fill", question: "Yesterday we ___ to the mall. (go)", answer: "went", alternatives: ["went"] },
                            { id: "iv5", type: "translation", question: 'Traduza: "Eu vi meu professor ontem."', answer: "I saw my teacher yesterday", alternatives: ["i saw my teacher yesterday"] }
                        ]
                    },
                    {
                        id: "irregular-verbs-2",
                        title: "Irregular Verbs II",
                        description: "Pratique buy, drink, write e outros verbos.",
                        icon: "bi-lightning-charge-fill",
                        xp: 70,
                        exercises: [
                            { id: "iv6", type: "multiple", question: 'Past of "buy":', options: ["bought", "buyed", "brought", "buys"], answer: "bought" },
                            { id: "iv7", type: "multiple", question: 'Past of "drink":', options: ["drank", "drunk", "drinked", "drinks"], answer: "drank" },
                            { id: "iv8", type: "multiple", question: 'Past of "write":', options: ["wrote", "written", "writed", "writes"], answer: "wrote" },
                            { id: "iv9", type: "fill", question: "She ___ a new book yesterday. (buy)", answer: "bought", alternatives: ["bought"] },
                            { id: "iv10", type: "order", question: "Organize a frase:", words: ["coffee", "drank", "morning", "He", "this"], answer: "He drank coffee this morning" }
                        ]
                    },
                    {
                        id: "past-events",
                        title: "Talking About Past Events",
                        description: "Combine verbos regulares e irregulares para falar do passado.",
                        icon: "bi-journal-text",
                        xp: 70,
                        exercises: [
                            { id: "pev1", type: "fill", question: "I ___ a movie last night. (watch)", answer: "watched", alternatives: ["watched"] },
                            { id: "pev2", type: "fill", question: "She ___ home early yesterday. (leave)", answer: "left", alternatives: ["left"] },
                            { id: "pev3", type: "translation", question: 'Traduza: "Eu encontrei meus amigos no fim de semana passado."', answer: "I met my friends last weekend", alternatives: ["i met my friends last weekend"] },
                            { id: "pev4", type: "multiple", question: "Yesterday, we ___ to the mall.", options: ["went", "go", "going", "goes"], answer: "went" },
                            { id: "pev5", type: "order", question: "Organize a frase:", words: ["last", "We", "Canada", "visited", "year"], answer: "We visited Canada last year" }
                        ]
                    }
                ]
            },
            {
                id: "unit-10",
                number: 10,
                title: "Past Simple Negative & Questions",
                description: "Use didn't e did corretamente para falar sobre o passado.",
                lessons: [
                    {
                        id: "past-negative",
                        title: "Didn't + Base Verb",
                        description: "Construa frases negativas no Past Simple.",
                        icon: "bi-dash-circle-fill",
                        xp: 75,
                        exercises: [
                            { id: "pn1", type: "multiple", question: "I didn't ___ TV yesterday.", options: ["watch", "watched", "watching", "watches"], answer: "watch" },
                            { id: "pn2", type: "multiple", question: "Choose the correct sentence:", options: ["She didn't go to school.", "She didn't went to school.", "She doesn't went to school.", "She not went to school."], answer: "She didn't go to school." },
                            { id: "pn3", type: "fill", question: "They didn't ___ the bus. (catch)", answer: "catch", alternatives: ["catch"] },
                            { id: "pn4", type: "translation", question: 'Traduza: "Nós não fomos ao parque."', answer: "We didn't go to the park", alternatives: ["we didn't go to the park", "we did not go to the park"] },
                            { id: "pn5", type: "order", question: "Organize a frase:", words: ["didn't", "yesterday", "work", "I"], answer: "I didn't work yesterday" }
                        ]
                    },
                    {
                        id: "questions-did",
                        title: "Questions with Did",
                        description: "Faça perguntas no passado usando did.",
                        icon: "bi-patch-question-fill",
                        xp: 75,
                        exercises: [
                            { id: "qd1", type: "multiple", question: "___ you work yesterday?", options: ["Did", "Do", "Were", "Was"], answer: "Did" },
                            { id: "qd2", type: "multiple", question: "Choose the correct question:", options: ["Did she bring the food?", "Did she brought the food?", "Does she brought the food?", "She did brought the food?"], answer: "Did she bring the food?" },
                            { id: "qd3", type: "fill", question: "Did they ___ the movie? (enjoy)", answer: "enjoy", alternatives: ["enjoy"] },
                            { id: "qd4", type: "translation", question: 'Traduza: "Você viu Maria ontem?"', answer: "Did you see Maria yesterday?", alternatives: ["did you see maria yesterday", "did you see maria yesterday?"] },
                            { id: "qd5", type: "order", question: "Organize a pergunta:", words: ["you", "Did", "last", "travel", "year"], answer: "Did you travel last year" }
                        ]
                    },
                    {
                        id: "short-answers",
                        title: "Short Answers",
                        description: "Responda perguntas no passado com did e didn't.",
                        icon: "bi-chat-dots-fill",
                        xp: 75,
                        exercises: [
                            { id: "sha1", type: "multiple", question: "Did you work yesterday?", options: ["Yes, I did.", "Yes, I was.", "Yes, I do.", "Yes, I worked did."], answer: "Yes, I did." },
                            { id: "sha2", type: "multiple", question: "Did she call you?", options: ["No, she didn't.", "No, she wasn't.", "No, she doesn't.", "No, she not."], answer: "No, she didn't." },
                            { id: "sha3", type: "fill", question: "Did they leave early? Yes, they ___.", answer: "did", alternatives: ["did"] },
                            { id: "sha4", type: "fill", question: "Did he study English? No, he ___.", answer: "didn't", alternatives: ["didn't", "did not"] },
                            { id: "sha5", type: "order", question: "Organize a resposta:", words: ["didn't", "No", "we"], answer: "No we didn't" }
                        ]
                    }
                ]
            },
            {
                id: "unit-11",
                number: 11,
                title: "Past Conversations",
                description: "Faça perguntas mais completas e converse sobre experiências passadas.",
                lessons: [
                    {
                        id: "past-question-words",
                        title: "Question Words",
                        description: "Use where, when, what, who e how em perguntas no passado.",
                        icon: "bi-question-lg",
                        xp: 80,
                        exercises: [
                            { id: "pqw1", type: "multiple", question: "___ did you go yesterday?", options: ["Where", "When", "Who", "How many"], answer: "Where" },
                            { id: "pqw2", type: "multiple", question: "___ did she arrive? At 8 p.m.", options: ["When", "Where", "Who", "What"], answer: "When" },
                            { id: "pqw3", type: "fill", question: "___ did you see at the party? My teacher.", answer: "Who", alternatives: ["who"] },
                            { id: "pqw4", type: "translation", question: 'Traduza: "Onde você trabalhou?"', answer: "Where did you work?", alternatives: ["where did you work", "where did you work?"] },
                            { id: "pqw5", type: "order", question: "Organize a pergunta:", words: ["did", "What", "yesterday", "do", "you"], answer: "What did you do yesterday" }
                        ]
                    },
                    {
                        id: "past-trip",
                        title: "A Trip I Remember",
                        description: "Use o passado para falar sobre uma viagem.",
                        icon: "bi-airplane-fill",
                        xp: 80,
                        exercises: [
                            { id: "pt1", type: "multiple", question: "Last July, I ___ to Canada.", options: ["went", "go", "going", "goes"], answer: "went" },
                            { id: "pt2", type: "fill", question: "We ___ many interesting places. (visit)", answer: "visited", alternatives: ["visited"] },
                            { id: "pt3", type: "translation", question: 'Traduza: "Eu estava com meus amigos."', answer: "I was with my friends", alternatives: ["i was with my friends"] },
                            { id: "pt4", type: "multiple", question: "___ you enjoy your trip?", options: ["Did", "Were", "Was", "Do"], answer: "Did" },
                            { id: "pt5", type: "order", question: "Organize a frase:", words: ["trip", "was", "The", "fun"], answer: "The trip was fun" }
                        ]
                    },
                    {
                        id: "past-weekend",
                        title: "My Last Weekend",
                        description: "Fale sobre atividades realizadas no último fim de semana.",
                        icon: "bi-calendar-week-fill",
                        xp: 80,
                        exercises: [
                            { id: "plw1", type: "multiple", question: "I ___ my friends last weekend.", options: ["met", "meet", "meeting", "meeted"], answer: "met" },
                            { id: "plw2", type: "fill", question: "We ___ dinner together. (have)", answer: "had", alternatives: ["had"] },
                            { id: "plw3", type: "translation", question: 'Traduza: "Nós assistimos a um filme."', answer: "We watched a movie", alternatives: ["we watched a movie", "we watched a film"] },
                            { id: "plw4", type: "multiple", question: "Did you have a good weekend?", options: ["Yes, I did.", "Yes, I was.", "Yes, I do.", "Yes, I had did."], answer: "Yes, I did." },
                            { id: "plw5", type: "order", question: "Organize a frase:", words: ["Sunday", "home", "stayed", "I", "on"], answer: "I stayed home on Sunday" }
                        ]
                    }
                ]
            }]
    },
    achievements: [
        { id: "first-step", icon: "bi-star-fill", title: "First Step", description: "Conclua sua primeira lição." },
        { id: "xp-100", icon: "bi-gem", title: "100 XP", description: "Acumule 100 XP." },
        { id: "streak-3", icon: "bi-fire", title: "On Fire", description: "Estude por 3 dias consecutivos." },
        { id: "lessons-5", icon: "bi-check-circle-fill", title: "Keep Going", description: "Conclua 5 lições." },
        { id: "perfect-10", icon: "bi-bullseye", title: "Practice Pays Off", description: "Acerte pelo menos 10 exercícios." },
        { id: "course-complete", icon: "bi-trophy-fill", title: "Foundation Complete", description: "Conclua todas as lições do curso." }
    ]
};