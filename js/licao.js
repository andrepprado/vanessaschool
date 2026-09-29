document.addEventListener("DOMContentLoaded", () => {
    if (!EYTApp.requireUser()) return;

    const params =
        new URLSearchParams(
            location.search
        );

    const id =
        params.get("id") ||
        "greetings";

    const lesson =
        EYTApp
            .getAllLessons()
            .find(
                item =>
                    item.id === id
            );

    if (
        !lesson ||
        !EYTApp.isLessonUnlocked(id)
    ) {
        location.href =
            "curso.html";

        return;
    }

    const content =
        document.getElementById(
            "lessonContent"
        );

    const footer =
        document.getElementById(
            "lessonFooter"
        );

    const action =
        document.getElementById(
            "lessonAction"
        );

    const feedback =
        document.getElementById(
            "lessonFeedback"
        );

    const bar =
        document.getElementById(
            "lessonProgressBar"
        );

    const closeLesson =
        document.getElementById(
            "closeLesson"
        );

    /* =========================================================
       CONFIGURAÇÕES DA LIÇÃO
    ========================================================= */

    const LESSON_CONFIG = {
        /*
         * Primeira dica aparece mais rapidamente.
         */
        firstHintDelay: 12000,

        /*
         * Nas demais questões damos um pouco mais de tempo.
         */
        nextHintDelay: 18000,

        /*
         * Tempo que o balão permanece visível.
         */
        hintVisibleTime: 8500,

        /*
         * Caso o aluno interaja, o relógio recomeça.
         */
        restartHintOnInteraction: true,

        /*
         * Reproduz automaticamente a alternativa
         * quando o aluno selecioná-la.
         */
        autoPlaySelectedAnswer: true
    };

    /* =========================================================
       ESTADO
    ========================================================= */

    let index = 0;
    let selected = null;
    let checked = false;
    let earned = 0;
    let ordered = [];

    let inactivityTimer = null;
    let hintHideTimer = null;

    let hintShownForExercise =
        false;

    let audioUsedForExercise =
        false;

    /* =========================================================
       HELPERS
    ========================================================= */

    const escapeAttribute = value => {
        return EYTApp
            .escapeHTML(
                String(
                    value ?? ""
                )
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    };

    const stopSpeech = () => {
        if (
            typeof EYTSpeech !==
            "undefined" &&
            EYTSpeech.isSupported()
        ) {
            EYTSpeech.stop();
        }
    };

    /* =========================================================
       DETECÇÃO DO IDIOMA DA PERGUNTA
    ========================================================= */

    const detectQuestionLanguage =
        text => {
            const value =
                String(text || "")
                    .toLowerCase();

            const portugueseSignals = [
                "como ",
                "qual ",
                "traduza",
                "complete",
                "organize",
                "você",
                " inglês",
                "significa",
                "se diz",
                "para o inglês",
                "frase",
                "número",
                "dia vem",
                "depois de"
            ];

            const isPortuguese =
                portugueseSignals.some(
                    signal =>
                        value.includes(
                            signal
                        )
                );

            return isPortuguese
                ? "pt-BR"
                : "en-US";
        };

    /* =========================================================
       ÍCONE
    ========================================================= */

    const getSpeakerSVG = () => {
        return `
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
            >
                <path
                    d="M4 9.5v5h4l5 4V5.5l-5 4H4Z"
                    fill="currentColor"
                ></path>

                <path
                    d="M16 8.2c1.1 1 1.7 2.3 1.7 3.8S17.1 14.8 16 15.8"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                ></path>

                <path
                    d="M18.6 5.8c1.8 1.6 2.9 3.8 2.9 6.2s-1.1 4.6-2.9 6.2"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                ></path>
            </svg>
        `;
    };

    /* =========================================================
       BOTÃO DE ÁUDIO
    ========================================================= */

    const createSpeechButton = (
        text,
        options = {}
    ) => {
        if (
            typeof EYTSpeech ===
            "undefined" ||
            !EYTSpeech.isSupported()
        ) {
            return "";
        }

        const lang =
            options.lang ||
            "en-US";

        const className =
            options.className ||
            "";

        const label =
            options.label ||
            "Ouvir pronúncia";

        return `
            <button
                type="button"
                class="speech-button ${className}"
                data-speech="${escapeAttribute(text)}"
                data-speech-lang="${escapeAttribute(lang)}"
                aria-label="${escapeAttribute(label)}"
                title="${escapeAttribute(label)}"
            >
                <span class="speech-button-icon">
                    ${getSpeakerSVG()}
                </span>

                <span class="speech-button-pulse"></span>
            </button>
        `;
    };

    /* =========================================================
       DICA DE INATIVIDADE
    ========================================================= */

    const clearInactivityTimer = () => {
        if (
            inactivityTimer !== null
        ) {
            clearTimeout(
                inactivityTimer
            );

            inactivityTimer =
                null;
        }
    };

    const clearHintHideTimer = () => {
        if (
            hintHideTimer !== null
        ) {
            clearTimeout(
                hintHideTimer
            );

            hintHideTimer =
                null;
        }
    };

    const getCoachHint = () => {
        return document.getElementById(
            "lessonAudioCoach"
        );
    };

    const getQuestionSpeechButton = () => {
        return document.querySelector(
            ".question-speech"
        );
    };

    const hideAudioHint = () => {
        const coach =
            getCoachHint();

        const speechButton =
            getQuestionSpeechButton();

        if (coach) {
            coach.classList.remove(
                "is-visible"
            );

            coach.setAttribute(
                "aria-hidden",
                "true"
            );
        }

        if (speechButton) {
            speechButton.classList.remove(
                "needs-attention"
            );
        }

        clearHintHideTimer();
    };

    const showAudioHint = () => {
        if (
            checked ||
            hintShownForExercise ||
            audioUsedForExercise
        ) {
            return;
        }

        if (
            typeof EYTSpeech ===
            "undefined" ||
            !EYTSpeech.isSupported()
        ) {
            return;
        }

        /*
         * Não interrompe o aluno se algum áudio
         * já estiver sendo reproduzido.
         */
        if (
            EYTSpeech.isSpeaking()
        ) {
            scheduleInactivityHint(
                5000
            );

            return;
        }

        const coach =
            getCoachHint();

        const speechButton =
            getQuestionSpeechButton();

        if (
            !coach ||
            !speechButton
        ) {
            return;
        }

        hintShownForExercise =
            true;

        coach.classList.add(
            "is-visible"
        );

        coach.setAttribute(
            "aria-hidden",
            "false"
        );

        speechButton.classList.add(
            "needs-attention"
        );

        clearHintHideTimer();

        hintHideTimer =
            setTimeout(
                hideAudioHint,
                LESSON_CONFIG
                    .hintVisibleTime
            );
    };

    const scheduleInactivityHint = (
        customDelay = null
    ) => {
        clearInactivityTimer();

        if (
            checked ||
            hintShownForExercise ||
            audioUsedForExercise
        ) {
            return;
        }

        const delay =
            customDelay ??
            (
                index === 0
                    ? LESSON_CONFIG
                        .firstHintDelay
                    : LESSON_CONFIG
                        .nextHintDelay
            );

        inactivityTimer =
            setTimeout(
                showAudioHint,
                delay
            );
    };

    const registerInteraction = (
        options = {}
    ) => {
        const isSpeech =
            options.speech === true;

        if (isSpeech) {
            audioUsedForExercise =
                true;

            hideAudioHint();

            clearInactivityTimer();

            return;
        }

        if (
            getCoachHint()
                ?.classList
                .contains(
                    "is-visible"
                )
        ) {
            hideAudioHint();
        }

        if (
            LESSON_CONFIG
                .restartHintOnInteraction &&
            !hintShownForExercise &&
            !audioUsedForExercise &&
            !checked
        ) {
            scheduleInactivityHint();
        }
    };

    const createAudioCoach = () => {
        if (
            typeof EYTSpeech ===
            "undefined" ||
            !EYTSpeech.isSupported()
        ) {
            return "";
        }

        return `
            <div
                id="lessonAudioCoach"
                class="lesson-audio-coach"
                aria-hidden="true"
            >
                <div class="lesson-audio-coach-icon">
                    ${getSpeakerSVG()}
                </div>

                <div class="lesson-audio-coach-text">
                    <strong>
                        Ficou em dúvida?
                    </strong>

                    <span>
                        Toque no alto-falante para ouvir a frase.
                    </span>
                </div>
            </div>
        `;
    };

    /* =========================================================
       REPRODUÇÃO AUTOMÁTICA DA ALTERNATIVA
    ========================================================= */

    const speakSelectedAnswer = (
        text
    ) => {
        if (
            !LESSON_CONFIG
                .autoPlaySelectedAnswer
        ) {
            return;
        }

        if (
            typeof EYTSpeech ===
            "undefined" ||
            !EYTSpeech.isSupported()
        ) {
            return;
        }

        const value =
            String(
                text || ""
            ).trim();

        if (!value) {
            return;
        }

        /*
         * Selecionar uma alternativa já conta como
         * utilização do recurso de áudio.
         *
         * Assim a dica de inatividade não aparece
         * desnecessariamente depois da seleção.
         */
        registerInteraction({
            speech: true
        });

        /*
         * speakEnglish() cancela automaticamente qualquer
         * fala anterior antes de iniciar a nova.
         */
        EYTSpeech.speakEnglish(
            value
        );
    };

    /* =========================================================
       EVENTOS DOS BOTÕES DE ÁUDIO
    ========================================================= */

    const bindSpeechButtons = root => {
        if (
            typeof EYTSpeech ===
            "undefined" ||
            !EYTSpeech.isSupported()
        ) {
            return;
        }

        const container =
            root ||
            document;

        container
            .querySelectorAll(
                "[data-speech]"
            )
            .forEach(button => {
                if (
                    button.dataset
                        .speechBound ===
                    "true"
                ) {
                    return;
                }

                button.dataset
                    .speechBound =
                    "true";

                button.addEventListener(
                    "click",
                    event => {
                        event.preventDefault();
                        event.stopPropagation();

                        registerInteraction({
                            speech: true
                        });

                        const text =
                            button.dataset
                                .speech;

                        const lang =
                            button.dataset
                                .speechLang ||
                            "en-US";

                        EYTSpeech.toggle(
                            text,
                            button,
                            {
                                lang
                            }
                        );
                    }
                );
            });
    };

    /* =========================================================
       RESPOSTA ORDENADA
    ========================================================= */

    const renderOrderedAnswer = () => {
        const orderedAnswer =
            document.getElementById(
                "orderedAnswer"
            );

        if (!orderedAnswer) {
            return;
        }

        orderedAnswer.innerHTML =
            ordered
                .map(
                    (
                        item,
                        position
                    ) => `
                        <button
                            type="button"
                            class="word-chip selected-word-chip"
                            data-remove="${position}"
                        >
                            ${EYTApp.escapeHTML(
                        item.word
                    )}
                        </button>
                    `
                )
                .join("");

        bindRemove();
    };

    /* =========================================================
       FECHAR LIÇÃO
    ========================================================= */

    closeLesson.onclick = () => {
        clearInactivityTimer();
        clearHintHideTimer();

        stopSpeech();

        location.href =
            "curso.html";
    };

    /* =========================================================
       INTRODUÇÃO
    ========================================================= */

    const renderIntro = () => {
        clearInactivityTimer();
        clearHintHideTimer();

        stopSpeech();

        footer.classList.add(
            "hidden"
        );

        content.innerHTML = `
            <section class="lesson-intro">

                <div class="lesson-intro-icon">
                    ${lesson.icon}
                </div>

                <span class="eyebrow">
                    UNIT ${lesson.unit.number}
                </span>

                <h1>
                    ${EYTApp.escapeHTML(
            lesson.title
        )}
                </h1>

                <p>
                    ${EYTApp.escapeHTML(
            lesson.description
        )}
                </p>

                <div class="lesson-intro-meta">

                    <div class="lesson-meta-item">
                        <strong>
                            ${lesson.exercises.length}
                        </strong>

                        <span>
                            exercícios
                        </span>
                    </div>

                    <div class="lesson-meta-item">
                        <strong>
                            +${lesson.xp} XP
                        </strong>

                        <span>
                            ao concluir
                        </span>
                    </div>

                </div>

                <button
                    id="startLesson"
                    class="btn btn-primary btn-large"
                    type="button"
                >
                    Começar →
                </button>

            </section>
        `;

        document
            .getElementById(
                "startLesson"
            )
            .onclick = () => {
                footer.classList.remove(
                    "hidden"
                );

                renderExercise();
            };
    };

    /* =========================================================
       EXERCÍCIO
    ========================================================= */

    const renderExercise = () => {
        clearInactivityTimer();
        clearHintHideTimer();

        stopSpeech();

        checked = false;
        selected = null;
        ordered = [];

        hintShownForExercise =
            false;

        audioUsedForExercise =
            false;

        footer.className =
            "lesson-answer-footer";

        feedback.innerHTML =
            "";

        action.textContent =
            "Verificar";

        action.disabled =
            false;

        const ex =
            lesson.exercises[
            index
            ];

        const pct =
            Math.round(
                index /
                lesson.exercises.length *
                100
            );

        bar.style.width =
            `${pct}%`;

        const questionLanguage =
            detectQuestionLanguage(
                ex.question
            );

        let answer = "";

        /* =====================================================
           MÚLTIPLA ESCOLHA
        ===================================================== */

        if (
            ex.type ===
            "multiple"
        ) {
            answer = `
                <div class="answer-options">

                    ${ex.options
                    .map(
                        option => `
                                <div class="answer-option-container">

                                    <button
                                        type="button"
                                        class="answer-option"
                                        data-value="${escapeAttribute(option)}"
                                    >
                                        <span class="answer-option-text">
                                            ${EYTApp.escapeHTML(
                            option
                        )}
                                        </span>
                                    </button>

                                    ${createSpeechButton(
                            option,
                            {
                                lang:
                                    "en-US",
                                className:
                                    "answer-option-speech",
                                label:
                                    `Ouvir: ${option}`
                            }
                        )}

                                </div>
                            `
                    )
                    .join("")}

                </div>
            `;
        }

        /* =====================================================
           TRADUÇÃO / PREENCHIMENTO
        ===================================================== */

        if (
            ex.type ===
            "translation" ||
            ex.type ===
            "fill"
        ) {
            answer = `
                <input
                    id="textAnswer"
                    class="text-answer-input"
                    type="text"
                    autocomplete="off"
                    autocapitalize="off"
                    spellcheck="false"
                    placeholder="Digite sua resposta..."
                >
            `;
        }

        /* =====================================================
           ORDENAÇÃO
        ===================================================== */

        if (
            ex.type ===
            "order"
        ) {
            answer = `
                <div class="ordering-area">

                    <div
                        id="orderedAnswer"
                        class="ordered-answer"
                    ></div>

                    <div class="word-bank">

                        ${ex.words
                    .map(
                        (
                            word,
                            wordIndex
                        ) => `
                                    <div class="word-chip-container">

                                        <button
                                            type="button"
                                            class="word-chip"
                                            data-index="${wordIndex}"
                                            data-word="${escapeAttribute(
                            word
                        )}"
                                        >
                                            ${EYTApp.escapeHTML(
                            word
                        )}
                                        </button>

                                        ${createSpeechButton(
                            word,
                            {
                                lang:
                                    "en-US",
                                className:
                                    "word-chip-speech",
                                label:
                                    `Ouvir: ${word}`
                            }
                        )}

                                    </div>
                                `
                    )
                    .join("")}

                    </div>

                </div>
            `;
        }

        /* =====================================================
           HTML
        ===================================================== */

        content.innerHTML = `
            <section class="exercise-area">

                <div class="exercise-type">
                    ${index + 1}
                    /
                    ${lesson.exercises.length}
                    •
                    ${ex.type ===
                "multiple"
                ? "Escolha a resposta"
                : ex.type ===
                    "order"
                    ? "Organize a frase"
                    : "Escreva a resposta"
            }
                </div>

                <div class="exercise-question-row">

                    <h1 class="exercise-question">
                        ${EYTApp.escapeHTML(
                ex.question
            )}
                    </h1>

                    ${createSpeechButton(
                ex.question,
                {
                    lang:
                        questionLanguage,
                    className:
                        "question-speech",
                    label:
                        "Ouvir pergunta"
                }
            )}

                </div>

                ${createAudioCoach()}

                ${answer}

            </section>
        `;

        /* =====================================================
           ALTERNATIVAS
        ===================================================== */

        document
            .querySelectorAll(
                ".answer-option"
            )
            .forEach(btn => {
                btn.onclick = () => {
                    if (checked) {
                        return;
                    }

                    document
                        .querySelectorAll(
                            ".answer-option"
                        )
                        .forEach(
                            button => {
                                button
                                    .classList
                                    .remove(
                                        "selected"
                                    );
                            }
                        );

                    btn.classList.add(
                        "selected"
                    );

                    selected =
                        btn.dataset.value;

                    /*
                     * A seleção da alternativa reproduz
                     * automaticamente sua pronúncia.
                     */
                    speakSelectedAnswer(
                        selected
                    );
                };
            });

        /* =====================================================
           WORD BANK
        ===================================================== */

        document
            .querySelectorAll(
                ".word-chip[data-index]"
            )
            .forEach(btn => {
                btn.onclick = () => {
                    if (checked) {
                        return;
                    }

                    if (
                        btn.classList
                            .contains(
                                "used"
                            )
                    ) {
                        return;
                    }

                    registerInteraction();

                    btn.classList.add(
                        "used"
                    );

                    ordered.push({
                        index:
                            btn.dataset
                                .index,

                        word:
                            btn.dataset
                                .word
                    });

                    selected =
                        ordered
                            .map(
                                item =>
                                    item.word
                            )
                            .join(" ");

                    renderOrderedAnswer();
                };
            });

        /* =====================================================
           SPEECH
        ===================================================== */

        bindSpeechButtons(
            content
        );

        /* =====================================================
           INPUT
        ===================================================== */

        const input =
            document.getElementById(
                "textAnswer"
            );

        if (input) {
            input.focus();

            input.addEventListener(
                "input",
                () => {
                    registerInteraction();
                }
            );

            input.addEventListener(
                "keydown",
                event => {
                    registerInteraction();

                    if (
                        event.key ===
                        "Enter" &&
                        !checked
                    ) {
                        event.preventDefault();

                        verify();
                    }
                }
            );
        }

        /* =====================================================
           MONITORAMENTO DE INATIVIDADE
        ===================================================== */

        scheduleInactivityHint();
    };

    /* =========================================================
       REMOVER PALAVRA
    ========================================================= */

    const bindRemove = () => {
        document
            .querySelectorAll(
                "[data-remove]"
            )
            .forEach(btn => {
                btn.onclick = () => {
                    if (checked) {
                        return;
                    }

                    registerInteraction();

                    const position =
                        Number(
                            btn.dataset
                                .remove
                        );

                    const removed =
                        ordered.splice(
                            position,
                            1
                        )[0];

                    if (!removed) {
                        return;
                    }

                    const source =
                        document.querySelector(
                            `.word-chip[data-index="${removed.index}"]`
                        );

                    if (source) {
                        source
                            .classList
                            .remove(
                                "used"
                            );
                    }

                    selected =
                        ordered
                            .map(
                                item =>
                                    item.word
                            )
                            .join(" ");

                    renderOrderedAnswer();
                };
            });
    };

    /* =========================================================
       MARCAÇÃO VISUAL
    ========================================================= */

    const markMultipleAnswer = (
        ex,
        value,
        correct
    ) => {
        if (
            ex.type !==
            "multiple"
        ) {
            return;
        }

        document
            .querySelectorAll(
                ".answer-option"
            )
            .forEach(btn => {
                btn.disabled =
                    true;

                const buttonValue =
                    EYTApp.normalizeText(
                        btn.dataset.value
                    );

                const correctValue =
                    EYTApp.normalizeText(
                        ex.answer
                    );

                if (
                    buttonValue ===
                    correctValue
                ) {
                    btn.classList.add(
                        "correct"
                    );
                }

                if (
                    !correct &&
                    EYTApp.normalizeText(
                        value
                    ) ===
                    buttonValue
                ) {
                    btn.classList.add(
                        "incorrect"
                    );
                }
            });
    };

    /* =========================================================
       FEEDBACK CORRETO
    ========================================================= */

    const renderCorrectFeedback =
        ex => {
            feedback.innerHTML = `
                <div class="lesson-feedback-content">

                    <div>
                        <strong>
                            Excellent!
                        </strong>

                        <p>
                            Resposta correta.
                            Continue assim.
                        </p>
                    </div>

                    ${createSpeechButton(
                ex.answer,
                {
                    lang:
                        "en-US",
                    className:
                        "feedback-speech",
                    label:
                        "Ouvir resposta correta"
                }
            )}

                </div>
            `;

            bindSpeechButtons(
                feedback
            );
        };

    /* =========================================================
       FEEDBACK INCORRETO
    ========================================================= */

    const renderIncorrectFeedback =
        ex => {
            feedback.innerHTML = `
                <div class="lesson-feedback-content">

                    <div>
                        <strong>
                            Quase!
                        </strong>

                        <p>
                            Resposta correta:
                            <b>
                                ${EYTApp.escapeHTML(
                ex.answer
            )}
                            </b>
                        </p>
                    </div>

                    ${createSpeechButton(
                ex.answer,
                {
                    lang:
                        "en-US",
                    className:
                        "feedback-speech",
                    label:
                        "Ouvir resposta correta"
                }
            )}

                </div>
            `;

            bindSpeechButtons(
                feedback
            );
        };

    /* =========================================================
       VERIFICAR
    ========================================================= */

    const verify = () => {
        if (checked) {
            return;
        }

        clearInactivityTimer();
        clearHintHideTimer();

        hideAudioHint();

        const ex =
            lesson.exercises[
            index
            ];

        let value =
            selected;

        if (
            ex.type ===
            "translation" ||
            ex.type ===
            "fill"
        ) {
            const input =
                document.getElementById(
                    "textAnswer"
                );

            value =
                input
                    ? input.value
                    : "";
        }

        if (
            !String(
                value || ""
            ).trim()
        ) {
            scheduleInactivityHint(
                7000
            );

            return;
        }

        const valid = [
            ex.answer,
            ...(ex.alternatives || [])
        ].map(
            EYTApp.normalizeText
        );

        const correct =
            valid.includes(
                EYTApp.normalizeText(
                    value
                )
            );

        EYTStorage.registerAnswer(
            correct
        );

        markMultipleAnswer(
            ex,
            value,
            correct
        );

        const textInput =
            document.getElementById(
                "textAnswer"
            );

        if (textInput) {
            textInput.disabled =
                true;

            textInput.classList.add(
                correct
                    ? "answer-correct"
                    : "answer-incorrect"
            );
        }

        document
            .querySelectorAll(
                ".word-chip"
            )
            .forEach(button => {
                button.disabled =
                    true;
            });

        if (correct) {
            earned +=
                Math.max(
                    5,
                    Math.round(
                        lesson.xp /
                        lesson.exercises
                            .length
                    )
                );

            EYTStorage.removeMistake(
                lesson.id,
                ex.id
            );

            footer.classList.add(
                "correct"
            );

            renderCorrectFeedback(
                ex
            );
        } else {
            EYTStorage.addMistake({
                lessonId:
                    lesson.id,

                exerciseId:
                    ex.id,

                question:
                    ex.question,

                answer:
                    ex.answer
            });

            footer.classList.add(
                "incorrect"
            );

            renderIncorrectFeedback(
                ex
            );
        }

        checked =
            true;

        action.textContent =
            index ===
                lesson.exercises
                    .length -
                1
                ? "Finalizar"
                : "Continuar";

        EYTStorage.saveLessonProgress(
            lesson.id,
            index + 1,
            lesson.exercises.length
        );
    };

    /* =========================================================
       FINALIZAR
    ========================================================= */

    const finish = () => {
        clearInactivityTimer();
        clearHintHideTimer();

        stopSpeech();

        EYTStorage.completeLesson(
            lesson.id
        );

        EYTStorage.addXP(
            lesson.xp
        );

        EYTApp.evaluateAchievements();

        bar.style.width =
            "100%";

        footer.classList.add(
            "hidden"
        );

        document
            .getElementById(
                "lessonXp"
            )
            .textContent =
            lesson.xp;

        content.innerHTML = `
            <section class="lesson-complete">

                <div class="complete-icon">
                    ✓
                </div>

                <span class="eyebrow">
                    LESSON COMPLETE
                </span>

                <h1>
                    Great job!
                </h1>

                <p>
                    Você concluiu
                    ${EYTApp.escapeHTML(
            lesson.title
        )}.
                </p>

                <div class="complete-stats">

                    <div class="complete-stat">
                        <strong>
                            +${lesson.xp}
                        </strong>

                        <span>
                            XP
                        </span>
                    </div>

                    <div class="complete-stat">
                        <strong>
                            ${lesson.exercises.length}
                        </strong>

                        <span>
                            exercícios
                        </span>
                    </div>

                    <div class="complete-stat">
                        <strong>
                            ✓
                        </strong>

                        <span>
                            concluída
                        </span>
                    </div>

                </div>

                <a
                    href="curso.html"
                    class="btn btn-primary btn-large"
                >
                    Continuar aprendendo →
                </a>

            </section>
        `;
    };

    /* =========================================================
       BOTÃO PRINCIPAL
    ========================================================= */

    action.onclick = () => {
        registerInteraction();

        if (!checked) {
            verify();
            return;
        }

        if (
            index >=
            lesson.exercises
                .length -
            1
        ) {
            finish();
            return;
        }

        index++;

        renderExercise();
    };

    /* =========================================================
       EVENTOS GERAIS DE INTERAÇÃO
    ========================================================= */

    content.addEventListener(
        "pointerdown",
        event => {
            /*
             * O clique no botão de áudio possui
             * tratamento próprio.
             */
            if (
                event.target.closest(
                    "[data-speech]"
                )
            ) {
                return;
            }

            /*
             * A própria alternativa também possui
             * tratamento específico porque dispara
             * reprodução automática.
             */
            if (
                event.target.closest(
                    ".answer-option"
                )
            ) {
                return;
            }

            registerInteraction();
        }
    );

    /* =========================================================
       EVENTOS DO SPEECH
    ========================================================= */

    window.addEventListener(
        "eyt:speech-start",
        () => {
            hideAudioHint();

            clearInactivityTimer();
        }
    );

    /* =========================================================
       LIMPEZA
    ========================================================= */

    window.addEventListener(
        "pagehide",
        () => {
            clearInactivityTimer();
            clearHintHideTimer();
        }
    );

    /* =========================================================
       INICIAR
    ========================================================= */

    renderIntro();
});