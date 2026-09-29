const EYTData = {
    course: {
        id: "foundations-a1", title: "English Foundations", subtitle: "Construa uma base sólida para começar a se comunicar em inglês.", level: "A1", units: [
            {
                id: "unit-1", number: 1, title: "First Connections", description: "Comece a se comunicar desde a primeira unidade.", lessons: [
                    {
                        id: "greetings", title: "Greetings", description: "Aprenda formas essenciais de cumprimentar pessoas.", icon: "👋", xp: 30, exercises: [
                            { id: "g1", type: "multiple", question: 'Como você diz "Olá" em inglês?', options: ["Hello", "Goodbye", "Thanks", "Please"], answer: "Hello" },
                            { id: "g2", type: "multiple", question: 'Qual expressão significa "Bom dia"?', options: ["Good night", "Good morning", "Good afternoon", "See you"], answer: "Good morning" },
                            { id: "g3", type: "translation", question: 'Traduza para o inglês: "Boa noite"', answer: "Good evening", alternatives: ["good evening"] },
                            { id: "g4", type: "fill", question: 'Complete: "___, my name is Vanessa."', answer: "Hello", alternatives: ["hello", "hi"] },
                            { id: "g5", type: "order", question: "Organize a frase:", words: ["are", "How", "you", "?"], answer: "How are you ?" }]
                    },
                    {
                        id: "introductions", title: "Introducing Yourself", description: "Aprenda a dizer seu nome e se apresentar.", icon: "●", xp: 30, exercises: [
                            { id: "i1", type: "multiple", question: 'Como você diz "Meu nome é..."?', options: ["My name is...", "Your name is...", "I am fine", "Good morning"], answer: "My name is..." },
                            { id: "i2", type: "fill", question: 'Complete: "My ___ is John."', answer: "name", alternatives: ["name"] },
                            { id: "i3", type: "translation", question: 'Traduza: "Eu sou Vanessa."', answer: "I am Vanessa", alternatives: ["i am vanessa", "i'm vanessa"] },
                            { id: "i4", type: "multiple", question: 'Qual pergunta pede o nome de alguém?', options: ["How are you?", "What is your name?", "Where are you?", "How old are you?"], answer: "What is your name?" }]
                    },
                    {
                        id: "goodbyes", title: "Saying Goodbye", description: "Encerre conversas de forma natural.", icon: "→", xp: 30, exercises: [
                            { id: "b1", type: "multiple", question: 'Qual expressão significa "Até logo"?', options: ["See you", "Hello", "Thank you", "Good morning"], answer: "See you" },
                            { id: "b2", type: "translation", question: 'Traduza: "Tchau"', answer: "Goodbye", alternatives: ["goodbye", "bye"] },
                            { id: "b3", type: "fill", question: 'Complete: "See you ___!"', answer: "later", alternatives: ["later", "soon"] }]
                    }]
            },
            {
                id: "unit-2", number: 2, title: "Everyday Basics", description: "Vocabulário e estruturas para situações do cotidiano.", lessons: [
                    {
                        id: "numbers", title: "Numbers", description: "Números básicos para o dia a dia.", icon: "#", xp: 35, exercises: [
                            { id: "n1", type: "multiple", question: "Qual é o número five?", options: ["3", "4", "5", "6"], answer: "5" },
                            { id: "n2", type: "translation", question: 'Traduza "dez" para o inglês.', answer: "ten", alternatives: ["ten"] },
                            { id: "n3", type: "fill", question: "One, two, ___, four.", answer: "three", alternatives: ["three"] }]
                    },
                    {
                        id: "colors", title: "Colors", description: "Aprenda as cores mais usadas em inglês.", icon: "◆", xp: 35, exercises: [
                            { id: "c1", type: "multiple", question: 'Como se diz "azul"?', options: ["Red", "Blue", "Green", "Black"], answer: "Blue" },
                            { id: "c2", type: "translation", question: 'Traduza "vermelho".', answer: "red", alternatives: ["red"] },
                            { id: "c3", type: "fill", question: "Black and ___.", answer: "white", alternatives: ["white"] }]
                    },
                    {
                        id: "days", title: "Days of the Week", description: "Fale sobre sua semana e seus compromissos.", icon: "□", xp: 35, exercises: [
                            { id: "d1", type: "multiple", question: "Qual dia vem depois de Monday?", options: ["Sunday", "Tuesday", "Friday", "Saturday"], answer: "Tuesday" },
                            { id: "d2", type: "translation", question: 'Traduza "sexta-feira".', answer: "Friday", alternatives: ["friday"] },
                            { id: "d3", type: "fill", question: "Monday, Tuesday, ___.", answer: "Wednesday", alternatives: ["wednesday"] }]
                    }]
            },
            {
                id: "unit-3", number: 3, title: "About You", description: "Comece a falar sobre você e sua vida.", lessons: [
                    {
                        id: "family", title: "Family", description: "Vocabulário para falar sobre sua família.", icon: "♡", xp: 40, exercises: [
                            { id: "f1", type: "multiple", question: 'Como se diz "mãe"?', options: ["Mother", "Father", "Brother", "Sister"], answer: "Mother" },
                            { id: "f2", type: "translation", question: 'Traduza "irmão".', answer: "brother", alternatives: ["brother"] },
                            { id: "f3", type: "fill", question: "My father's wife is my ___.", answer: "mother", alternatives: ["mother"] }]
                    },
                    {
                        id: "likes", title: "Likes & Dislikes", description: "Diga do que você gosta e não gosta.", icon: "♥", xp: 40, exercises: [
                            { id: "l1", type: "multiple", question: 'Qual frase significa "Eu gosto de café"?', options: ["I like coffee", "I am coffee", "I have coffee", "I want likes"], answer: "I like coffee" },
                            { id: "l2", type: "translation", question: 'Traduza: "Eu não gosto de chuva."', answer: "I don't like rain", alternatives: ["i don't like rain", "i do not like rain"] },
                            { id: "l3", type: "fill", question: "I ___ music.", answer: "like", alternatives: ["like", "love"] }]
                    },
                    {
                        id: "routine", title: "Daily Routine", description: "Fale sobre atividades da sua rotina.", icon: "◷", xp: 40, exercises: [
                            { id: "r1", type: "multiple", question: 'Qual frase significa "Eu acordo às sete"?', options: ["I wake up at seven", "I sleep at seven", "I eat seven", "I work seven"], answer: "I wake up at seven" },
                            { id: "r2", type: "translation", question: 'Traduza: "Eu trabalho de manhã."', answer: "I work in the morning", alternatives: ["i work in the morning"] },
                            { id: "r3", type: "fill", question: "I ___ breakfast every morning.", answer: "eat", alternatives: ["eat", "have"] }]
                    }]
            }]
    },
    achievements: [
        { id: "first-step", icon: "★", title: "First Step", description: "Conclua sua primeira lição." },
        { id: "xp-100", icon: "◆", title: "100 XP", description: "Acumule 100 XP." },
        { id: "streak-3", icon: "🔥", title: "On Fire", description: "Estude por 3 dias consecutivos." },
        { id: "lessons-5", icon: "✓", title: "Keep Going", description: "Conclua 5 lições." },
        { id: "perfect-10", icon: "◎", title: "Practice Pays Off", description: "Acerte pelo menos 10 exercícios." },
        { id: "course-complete", icon: "♛", title: "Foundation Complete", description: "Conclua todas as lições do curso." }
    ]
};