import fs from "node:fs";

const files = {
    level: "js/level-content.js",
    demo: "js/demo.js",
    runner: "js/student-lesson-runner.js",
    css: "css/style.css"
};

function read(path) {
    return fs.readFileSync(path, "utf8");
}

function write(path, content) {
    fs.writeFileSync(path, content, "utf8");
}

function replaceOnce(content, search, replacement, label) {
    if (!content.includes(search)) {
        throw new Error(`Trecho não encontrado para alteração: ${label}`);
    }

    return content.replace(search, replacement);
}

/* =========================================================
   1. CONTEXTO PEDAGÓGICO CENTRALIZADO
   ========================================================= */

let level = read(files.level);

if (!level.includes("window.EYTExerciseContext")) {
    level += `

/* ==========================================================================
   CONTEXTO PEDAGÓGICO PT-BR
   --------------------------------------------------------------------------
   Fornece ao aluno o sentido esperado da resposta sem alterar:
   - question
   - answer
   - áudio
   - manifest
   - frases estáticas
   ========================================================================== */

window.EYTExerciseContext = (() => {
    "use strict";

    const ANSWER_MEANINGS = {
        "is": "ser/estar, na forma usada com he, she ou it",
        "are": "ser/estar, na forma usada com you, we ou they",
        "we": "nós",
        "it": "ele/ela para objeto, animal ou coisa",
        "fifteen": "quinze",
        "week": "semana",
        "wednesday": "quarta-feira",
        "thirty": "trinta",
        "visited": "visitar, no passado",
        "enjoy": "gostar/apreciar",
        "were": "ser/estar no passado, usado com you, we ou they",
        "wasn't": "não era/não estava",
        "playing": "jogar/brincar, na forma com -ing",
        "more interesting": "mais interessante",
        "highest": "o mais alto",
        "meeting": "encontrar/conhecer, na forma com -ing",
        "study": "estudar",
        "able": "capaz",
        "find": "encontrar",
        "need": "precisar",
        "may": "pode/talvez, indicando possibilidade ou permissão",
        "might": "talvez/poderia, indicando possibilidade",
        "use": "usar",
        "did": "auxiliar de pergunta no passado",
        "to study": "estudar, usando infinitivo com to",
        "to look for": "procurar, usando infinitivo com to",
        "whose": "de quem",
        "where": "onde",
        "spoken": "falado, particípio de speak",
        "sent": "enviado, particípio/passado de send",
        "passed": "passar/aprovar, no passado",
        "won": "ganhar/vencer, no passado",
        "do": "fazer",
        "pay": "pagar",
        "to lock": "trancar, usando infinitivo com to",
        "watching": "assistir, na forma com -ing",
        "concerned": "preocupado",
        "widespread": "generalizado/amplamente difundido",
        "to take": "pegar/levar/tomar, usando infinitivo com to",
        "not to": "não fazer algo, usando infinitivo negativo",
        "does": "auxiliar usado com he, she ou it",
        "had": "ter/haver no passado",
        "finished": "terminado/concluído",
        "resolved": "resolvido",
        "wouldn't": "não faria/não iria",
        "could": "capacidade no passado",
        "can": "capacidade ou possibilidade no presente",
        "am": "ser/estar com o pronome I",
        "was": "era/estava",
        "went": "ir, no passado",
        "have": "ter",
        "has": "ter, usado com he, she ou it",
        "will": "indicar futuro",
        "would": "indicar hipótese, condição ou hábito no passado",
        "should": "deveria, indicando conselho",
        "must": "dever/ter que, indicando obrigação",
        "mustn't": "não poder/não dever, indicando proibição",
        "couldn't": "não conseguia/não podia",
        "don't": "não, no presente com I, you, we ou they",
        "doesn't": "não, no presente com he, she ou it",
        "didn't": "não, no passado",
        "been": "sido/estado, particípio de be",
        "have been": "ter estado/ter sido",
        "has been": "tem estado/tem sido",
        "would have": "teria",
        "could have": "poderia ter",
        "should have": "deveria ter",
        "might have": "talvez tivesse/poderia ter",
        "used to": "costumava",
        "be able to": "ser capaz de/conseguir",
        "because": "porque",
        "although": "embora",
        "however": "porém/contudo",
        "therefore": "portanto",
        "unless": "a menos que",
        "despite": "apesar de",
        "who": "quem",
        "which": "qual/que",
        "what": "o que/qual",
        "when": "quando",
        "why": "por quê",
        "how": "como"
    };

    function normalize(value) {
        return String(value ?? "")
            .trim()
            .toLowerCase()
            .replace(/[.!?]+$/g, "")
            .replace(/\\s+/g, " ");
    }

    function isEnglishQuestion(question) {
        const value = String(question ?? "").trim();

        if (!value) {
            return false;
        }

        const englishMarkers = [
            /\\bcomplete\\b/i,
            /\\bchoose\\b/i,
            /\\bwhich\\b/i,
            /\\bwhat\\b/i,
            /\\bwhere\\b/i,
            /\\bwhen\\b/i,
            /\\bwho\\b/i,
            /\\bwhose\\b/i,
            /\\bhow\\b/i,
            /\\bwrite\\b/i,
            /\\breplace\\b/i,
            /\\bselect\\b/i,
            /\\bfill\\b/i,
            /\\bcorrect\\b/i,
            /\\bsentence\\b/i,
            /\\benglish\\b/i,
            /\\bI\\b/,
            /\\byou\\b/i,
            /\\bhe\\b/i,
            /\\bshe\\b/i,
            /\\bwe\\b/i,
            /\\bthey\\b/i,
            /\\bit\\b/i,
            /\\bthe\\b/i,
            /\\ba\\b/i,
            /\\ban\\b/i,
            /\\bis\\b/i,
            /\\bare\\b/i,
            /\\bwas\\b/i,
            /\\bwere\\b/i,
            /\\bhave\\b/i,
            /\\bhas\\b/i,
            /\\bdid\\b/i,
            /\\bdo\\b/i,
            /\\bdoes\\b/i
        ];

        return englishMarkers.some(
            pattern => pattern.test(value)
        );
    }

    function specialContext(exercise) {
        const id = String(exercise?.id ?? "");
        const question = String(exercise?.question ?? "");

        const SPECIAL = {
            "a2-past-04":
                "Complete usando o verbo com sentido de “gostar/apreciar”.",

            "b1-ability-01":
                "Escolha uma expressão que indique “capacidade no passado”."
        };

        if (SPECIAL[id]) {
            return SPECIAL[id];
        }

        if (
            /did you\\s+___\\s+the film/i.test(question)
        ) {
            return "Complete usando o verbo com sentido de “gostar/apreciar”.";
        }

        if (
            /when i was younger.*___.*run very fast/i.test(question)
        ) {
            return "Escolha uma expressão que indique “capacidade no passado”.";
        }

        return "";
    }

    function contextFromAnswer(exercise) {
        const answer = normalize(
            exercise?.answer
        );

        const meaning =
            ANSWER_MEANINGS[answer];

        if (!meaning) {
            return "";
        }

        if (
            exercise?.type === "fill"
        ) {
            return \`Complete a lacuna usando uma palavra ou expressão com sentido de “\${meaning}”.\`;
        }

        if (
            exercise?.type === "choice" ||
            exercise?.type === "multiple"
        ) {
            return \`Escolha a alternativa que corresponde ao sentido de “\${meaning}”.\`;
        }

        return \`Considere como sentido esperado “\${meaning}”.\`;
    }

    function contextFromQuestion(exercise) {
        const question =
            String(
                exercise?.question ??
                ""
            );

        if (/choose the correct negative sentence/i.test(question)) {
            return "Escolha a frase negativa gramaticalmente correta.";
        }

        if (/choose the correct question/i.test(question)) {
            return "Escolha a pergunta formada corretamente em inglês.";
        }

        if (/choose the most polite request/i.test(question)) {
            return "Escolha a forma mais educada de fazer o pedido.";
        }

        if (/which answer is correct/i.test(question)) {
            return "Escolha a resposta que faz sentido para a pergunta apresentada.";
        }

        if (/choose the correct sentence/i.test(question)) {
            return "Escolha a frase gramaticalmente correta em inglês.";
        }

        if (/replace .* with a pronoun/i.test(question)) {
            return "Substitua o trecho indicado pelo pronome correspondente.";
        }

        if (/write the number .* in english/i.test(question)) {
            return "Escreva em inglês o número apresentado.";
        }

        if (/what time/i.test(question)) {
            return "Escolha como esse horário é dito em inglês.";
        }

        if (/which number/i.test(question)) {
            return "Escolha o número correspondente ao valor escrito em inglês.";
        }

        if (/complete the sequence/i.test(question)) {
            return "Complete a sequência com o próximo item correspondente.";
        }

        if (/___ is your name/i.test(question)) {
            return "Complete com a palavra interrogativa usada para perguntar “qual é o seu nome?”.";
        }

        if (/___ are you from/i.test(question)) {
            return "Complete com a palavra interrogativa usada para perguntar “de onde você é?”.";
        }

        if (/translation|translate/i.test(question)) {
            return "Responda de acordo com o sentido solicitado na tradução.";
        }

        return "";
    }

    function get(exercise) {
        if (
            !exercise ||
            !isEnglishQuestion(
                exercise.question
            )
        ) {
            return "";
        }

        return (
            specialContext(exercise) ||
            contextFromQuestion(exercise) ||
            contextFromAnswer(exercise) ||
            (
                exercise.type === "fill"
                    ? "Complete a lacuna considerando o sentido e a estrutura gramatical trabalhados nesta questão."
                    : exercise.type === "choice" ||
                      exercise.type === "multiple"
                        ? "Escolha a alternativa que corresponde ao sentido e à estrutura solicitados."
                        : exercise.type === "order"
                            ? "Organize as palavras para formar a frase correta em inglês."
                            : exercise.type === "translation"
                                ? "Responda em inglês mantendo o sentido solicitado."
                                : "Considere o sentido solicitado pelo exercício."
            )
        );
    }

    function html(exercise, escapeHTML) {
        const context =
            get(exercise);

        if (!context) {
            return "";
        }

        const escape =
            typeof escapeHTML === "function"
                ? escapeHTML
                : value => String(value ?? "");

        return \`
            <div class="eyt-answer-context" role="note">
                <span class="eyt-answer-context-label">
                    Contexto em português
                </span>
                <p>
                    \${escape(context)}
                </p>
            </div>
        \`;
    }

    return {
        get,
        html
    };
})();
`;
}

/* =========================================================
   2. DEMONSTRAÇÃO
   ========================================================= */

let demo = read(files.demo);

if (!demo.includes("EYTExerciseContext.html(")) {
    const demoTarget = `                    <h2>
                        \${escapeHtml(
                            exercise.question
                        )}
                    </h2>

                    \${`;

    const demoReplacement = `                    <h2>
                        \${escapeHtml(
                            exercise.question
                        )}
                    </h2>

                    \${
                        window.EYTExerciseContext
                            ? window.EYTExerciseContext.html(
                                exercise,
                                escapeHtml
                            )
                            : ""
                    }

                    \${`;

    demo = replaceOnce(
        demo,
        demoTarget,
        demoReplacement,
        "contexto PT-BR na demonstração"
    );
}

/* =========================================================
   3. EXERCÍCIOS DAS AULAS
   ========================================================= */

let runner = read(files.runner);

if (!runner.includes("window.EYTExerciseContext.html(\n                        exercise")) {
    const runnerTarget = `                </div>

                \${coachHTML()}

                \${answerHTML}`;

    const runnerReplacement = `                </div>

                \${
                    window.EYTExerciseContext
                        ? window.EYTExerciseContext.html(
                            exercise,
                            EYTApp.escapeHTML
                        )
                        : ""
                }

                \${coachHTML()}

                \${answerHTML}`;

    runner = replaceOnce(
        runner,
        runnerTarget,
        runnerReplacement,
        "contexto PT-BR nas aulas"
    );
}

/* =========================================================
   4. CSS
   ========================================================= */

let css = read(files.css);

if (!css.includes("EYT EXERCISE CONTEXT PT-BR")) {
    css += `

/* === EYT EXERCISE CONTEXT PT-BR START === */

.eyt-answer-context {
    box-sizing: border-box;
    width: 100%;
    margin: 14px 0 20px;
    padding: 13px 15px;
    border: 1px solid rgba(7, 35, 73, 0.10);
    border-left: 3px solid #072349;
    border-radius: 10px;
    background: rgba(7, 35, 73, 0.035);
}

.eyt-answer-context-label {
    display: block;
    margin: 0 0 5px;
    color: #072349;
    font-size: 9px;
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: .10em;
    text-transform: uppercase;
}

.eyt-answer-context p {
    margin: 0;
    color: #4f5d70;
    font-size: 12px;
    font-weight: 500;
    line-height: 1.5;
}

.demo-question-card .eyt-answer-context {
    margin-top: 14px;
    margin-bottom: 20px;
}

@media (max-width: 700px) {
    .eyt-answer-context {
        margin-top: 12px;
        margin-bottom: 17px;
        padding: 11px 13px;
    }

    .eyt-answer-context-label {
        font-size: 8px;
    }

    .eyt-answer-context p {
        font-size: 11px;
        line-height: 1.45;
    }
}

/* === EYT EXERCISE CONTEXT PT-BR END === */
`;
}

/* =========================================================
   5. GRAVAÇÃO
   ========================================================= */

write(files.level, level);
write(files.demo, demo);
write(files.runner, runner);
write(files.css, css);

console.log("");
console.log("========================================");
console.log("CONTEXTO PT-BR APLICADO");
console.log("========================================");
console.log("OK - js/level-content.js");
console.log("OK - js/demo.js");
console.log("OK - js/student-lesson-runner.js");
console.log("OK - css/style.css");
console.log("");
console.log("ÁUDIO PRESERVADO:");
console.log("OK - perguntas originais não alteradas");
console.log("OK - answers originais não alterados");
console.log("OK - phrases.json não alterado");
console.log("OK - manifest.json não alterado");
console.log("OK - static-audio.js não alterado");
console.log("OK - speech.js não alterado");
console.log("OK - lesson-sounds.js não alterado");
console.log("========================================");
