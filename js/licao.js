document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    if (!EYTApp.requireUser()) {
        return;
    }

    const params =
        new URLSearchParams(
            window.location.search
        );

    const lessonId =
        params.get("id") ||
        "greetings";

    const lesson =
        EYTApp
            .getAllLessons()
            .find(
                item =>
                    item.id ===
                    lessonId
            );

    if (
        !lesson ||
        !EYTApp.isLessonUnlocked(
            lessonId
        )
    ) {
        window.location.href =
            "curso.html";

        return;
    }

    /* ==========================================================================
       ELEMENTOS
       ========================================================================== */

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

    const progressBar =
        document.getElementById(
            "lessonProgressBar"
        );

    const lessonXp =
        document.getElementById(
            "lessonXp"
        );

    const closeLesson =
        document.getElementById(
            "closeLesson"
        );

    /* ==========================================================================
       CONFIGURAÇÃO
       ========================================================================== */

    const CONFIG = {
        firstHintDelay: 12000,
        nextHintDelay: 18000,
        emptyAnswerHintDelay: 7000,
        hintVisibleTime: 8500,

        autoPlaySelectedAnswer: true,
        autoPlayOrderWord: true,

        questionEnglishLang:
            "en-US",

        questionPortugueseLang:
            "pt-BR",

        answerEnglishLang:
            "en-US",

        /*
         * Velocidade ligeiramente menor para palavras
         * isoladas e alternativas.
         *
         * Isso melhora a percepção dos fonemas sem
         * transformar a fala em "câmera lenta".
         */

        answerSpeechRate:
            0.86,

        wordSpeechRate:
            0.82,

        feedbackSpeechRate:
            0.86,

        questionEnglishRate:
            0.90,

        questionPortugueseRate:
            0.96
    };

    /* ==========================================================================
       ESTADO
       ========================================================================== */

    let exerciseIndex =
        0;

    let selectedAnswer =
        null;

    let checked =
        false;

    let orderedWords =
        [];

    let inactivityTimer =
        null;

    let hintHideTimer =
        null;

    let hintShown =
        false;

    let audioUsed =
        false;

    /* ==========================================================================
       HTML
       ========================================================================== */

    function escapeAttribute(
        value
    ) {
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
    }

    /* ==========================================================================
       SPEECH
       ========================================================================== */

    function speechAvailable() {
        return (
            typeof EYTSpeech !==
            "undefined" &&
            EYTSpeech.isSupported()
        );
    }

    function stopSpeech() {
        if (
            !speechAvailable()
        ) {
            return;
        }

        EYTSpeech.stop();
    }

    /* ==========================================================================
       IDIOMA
       ========================================================================== */

    function detectLanguage(
        text
    ) {
        const value =
            String(
                text || ""
            )
                .toLowerCase();

        const portugueseSignals = [
            "como ",
            "qual ",
            "quais ",
            "traduza",
            "tradução",
            "complete",
            "organize",
            "você",
            "vocês",
            " inglês",
            "português",
            "significa",
            "se diz",
            "para o inglês",
            "para inglês",
            "frase",
            "número",
            "cor ",
            "dia ",
            "depois de",
            "antes de",
            "escolha",
            "família",
            "rotina",
            "manhã",
            "tarde",
            "noite",
            "resposta",
            "palavra"
        ];

        const portuguese =
            portugueseSignals.some(
                signal =>
                    value.includes(
                        signal
                    )
            );

        return portuguese
            ? CONFIG.questionPortugueseLang
            : CONFIG.questionEnglishLang;
    }

    function getSpeechRateForLanguage(
        lang
    ) {
        return String(
            lang || ""
        )
            .toLowerCase()
            .startsWith(
                "pt"
            )
            ? CONFIG.questionPortugueseRate
            : CONFIG.questionEnglishRate;
    }

    /* ==========================================================================
       SVG
       ========================================================================== */

    function speakerIcon() {
        return `
            <svg
                class="eyt-speaker-svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
            >
                <path
                    d="M4 9.5V14.5H8L13 18.5V5.5L8 9.5H4Z"
                    fill="currentColor"
                ></path>

                <path
                    d="M16 8.5C17.05 9.45 17.65 10.62 17.65 12C17.65 13.38 17.05 14.55 16 15.5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                ></path>

                <path
                    d="M18.7 6C20.35 7.5 21.3 9.55 21.3 12C21.3 14.45 20.35 16.5 18.7 18"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                ></path>
            </svg>
        `;
    }

    /* ==========================================================================
       BOTÃO DE SPEECH
       ========================================================================== */

    function speechButton(
        text,
        options = {}
    ) {
        if (
            !speechAvailable()
        ) {
            return "";
        }

        const lang =
            options.lang ||
            CONFIG.answerEnglishLang;

        const className =
            options.className ||
            "";

        const label =
            options.label ||
            "Ouvir pronúncia";

        const rate =
            options.rate !==
                undefined &&
                options.rate !==
                null
                ? Number(
                    options.rate
                )
                : getSpeechRateForLanguage(
                    lang
                );

        return `
            <button
                type="button"
                class="eyt-speech-button ${className}"
                data-speech="${escapeAttribute(
            text
        )}"
                data-speech-lang="${escapeAttribute(
            lang
        )}"
                data-speech-rate="${escapeAttribute(
            rate
        )}"
                aria-label="${escapeAttribute(
            label
        )}"
                title="${escapeAttribute(
            label
        )}"
            >
                <span class="eyt-speech-icon">
                    ${speakerIcon()}
                </span>

                <span
                    class="eyt-speech-ring"
                    aria-hidden="true"
                ></span>
            </button>
        `;
    }

    /* ==========================================================================
       TIMERS
       ========================================================================== */

    function clearInactivityTimer() {
        if (
            inactivityTimer !==
            null
        ) {
            window.clearTimeout(
                inactivityTimer
            );

            inactivityTimer =
                null;
        }
    }

    function clearHintHideTimer() {
        if (
            hintHideTimer !==
            null
        ) {
            window.clearTimeout(
                hintHideTimer
            );

            hintHideTimer =
                null;
        }
    }

    function clearTimers() {
        clearInactivityTimer();
        clearHintHideTimer();
    }

    /* ==========================================================================
       COACH
       ========================================================================== */

    function getCoach() {
        return document.getElementById(
            "lessonAudioCoach"
        );
    }

    function getQuestionSpeechButton() {
        return document.querySelector(
            ".eyt-question-speech"
        );
    }

    function hideAudioHint() {
        const coach =
            getCoach();

        const questionButton =
            getQuestionSpeechButton();

        if (
            coach
        ) {
            coach.classList.remove(
                "is-visible"
            );

            coach.setAttribute(
                "aria-hidden",
                "true"
            );
        }

        if (
            questionButton
        ) {
            questionButton.classList.remove(
                "needs-attention"
            );
        }

        clearHintHideTimer();
    }

    function showAudioHint() {
        clearInactivityTimer();

        if (
            checked ||
            hintShown ||
            audioUsed
        ) {
            return;
        }

        if (
            !speechAvailable()
        ) {
            return;
        }

        if (
            EYTSpeech.isSpeaking()
        ) {
            scheduleAudioHint(
                5000
            );

            return;
        }

        const coach =
            getCoach();

        const questionButton =
            getQuestionSpeechButton();

        if (
            !coach ||
            !questionButton
        ) {
            return;
        }

        hintShown =
            true;

        coach.classList.add(
            "is-visible"
        );

        coach.setAttribute(
            "aria-hidden",
            "false"
        );

        questionButton.classList.add(
            "needs-attention"
        );

        clearHintHideTimer();

        hintHideTimer =
            window.setTimeout(
                hideAudioHint,
                CONFIG.hintVisibleTime
            );
    }

    function scheduleAudioHint(
        customDelay = null
    ) {
        clearInactivityTimer();

        if (
            checked ||
            hintShown ||
            audioUsed
        ) {
            return;
        }

        const delay =
            customDelay ??
            (
                exerciseIndex ===
                    0
                    ? CONFIG.firstHintDelay
                    : CONFIG.nextHintDelay
            );

        inactivityTimer =
            window.setTimeout(
                showAudioHint,
                delay
            );
    }

    function registerInteraction(
        options = {}
    ) {
        if (
            options.speech ===
            true
        ) {
            audioUsed =
                true;

            hideAudioHint();
            clearInactivityTimer();

            return;
        }

        hideAudioHint();

        if (
            !checked &&
            !hintShown &&
            !audioUsed
        ) {
            scheduleAudioHint();
        }
    }

    function coachHTML() {
        if (
            !speechAvailable()
        ) {
            return "";
        }

        return `
            <div
                id="lessonAudioCoach"
                class="eyt-audio-coach"
                aria-hidden="true"
            >
                <div class="eyt-audio-coach-icon">
                    ${speakerIcon()}
                </div>

                <div class="eyt-audio-coach-copy">
                    <strong>
                        Ficou em dúvida?
                    </strong>

                    <span>
                        Toque no alto-falante para ouvir a pronúncia.
                    </span>
                </div>
            </div>
        `;
    }

    /* ==========================================================================
       BIND SPEECH
       ========================================================================== */

    function bindSpeechButtons(
        root = document
    ) {
        if (
            !speechAvailable()
        ) {
            return;
        }

        root
            .querySelectorAll(
                "[data-speech]"
            )
            .forEach(
                button => {
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
                                speech:
                                    true
                            });

                            const text =
                                button.dataset
                                    .speech ||
                                "";

                            const lang =
                                button.dataset
                                    .speechLang ||
                                CONFIG.answerEnglishLang;

                            const rateValue =
                                Number(
                                    button.dataset
                                        .speechRate
                                );

                            const rate =
                                Number.isFinite(
                                    rateValue
                                )
                                    ? rateValue
                                    : getSpeechRateForLanguage(
                                        lang
                                    );

                            EYTSpeech.toggle(
                                text,
                                button,
                                {
                                    lang,
                                    rate
                                }
                            );
                        }
                    );
                }
            );
    }

    /* ==========================================================================
       PRONUNCIAR ALTERNATIVA AUTOMATICAMENTE
       ========================================================================== */

    function autoSpeakAnswer(
        text
    ) {
        if (
            !CONFIG.autoPlaySelectedAnswer ||
            !speechAvailable()
        ) {
            return;
        }

        const value =
            String(
                text || ""
            )
                .trim();

        if (
            !value
        ) {
            return;
        }

        registerInteraction({
            speech:
                true
        });

        EYTSpeech.speakEnglish(
            value,
            {
                rate:
                    CONFIG.answerSpeechRate
            }
        );
    }

    /* ==========================================================================
       PRONUNCIAR PALAVRA DO WORD BANK
       ========================================================================== */

    function autoSpeakWord(
        text
    ) {
        if (
            !CONFIG.autoPlayOrderWord ||
            !speechAvailable()
        ) {
            return;
        }

        const value =
            String(
                text || ""
            )
                .trim();

        if (
            !value
        ) {
            return;
        }

        registerInteraction({
            speech:
                true
        });

        EYTSpeech.speakEnglish(
            value,
            {
                rate:
                    CONFIG.wordSpeechRate
            }
        );
    }

    /* ==========================================================================
       INTRO
       ========================================================================== */

    function renderIntro() {
        clearTimers();
        stopSpeech();

        footer.classList.add(
            "hidden"
        );

        progressBar.style.width =
            "0%";

        lessonXp.textContent =
            "0";

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
            .addEventListener(
                "click",
                () => {
                    footer.classList.remove(
                        "hidden"
                    );

                    renderExercise();
                }
            );
    }

    /* ==========================================================================
       ALTERNATIVAS
       ========================================================================== */

    function multipleChoiceHTML(
        exercise
    ) {
        return `
            <div class="answer-options">

                ${exercise.options
                .map(
                    option => `
                            <div class="eyt-answer-shell">

                                <button
                                    type="button"
                                    class="answer-option"
                                    data-value="${escapeAttribute(
                        option
                    )}"
                                >
                                    <span class="eyt-answer-text">
                                        ${EYTApp.escapeHTML(
                        option
                    )}
                                    </span>
                                </button>

                                ${speechButton(
                        option,
                        {
                            lang:
                                CONFIG.answerEnglishLang,
                            rate:
                                CONFIG.answerSpeechRate,
                            className:
                                "eyt-answer-speech",
                            label:
                                `Ouvir ${option}`
                        }
                    )}

                            </div>
                        `
                )
                .join("")}

            </div>
        `;
    }

    /* ==========================================================================
       INPUT
       ========================================================================== */

    function textAnswerHTML() {
        return `
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

    /* ==========================================================================
       WORD ORDER
       ========================================================================== */

    function wordOrderHTML(
        exercise
    ) {
        return `
            <div class="ordering-area">

                <div
                    id="orderedAnswer"
                    class="ordered-answer"
                ></div>

                <div class="word-bank">

                    ${exercise.words
                .map(
                    (
                        word,
                        wordIndex
                    ) => `
                                <div class="eyt-word-shell">

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

                                    ${speechButton(
                        word,
                        {
                            lang:
                                CONFIG.answerEnglishLang,
                            rate:
                                CONFIG.wordSpeechRate,
                            className:
                                "eyt-word-speech",
                            label:
                                `Ouvir ${word}`
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

    /* ==========================================================================
       RENDER EXERCISE
       ========================================================================== */

    function renderExercise() {
        clearTimers();
        stopSpeech();

        checked =
            false;

        selectedAnswer =
            null;

        orderedWords =
            [];

        hintShown =
            false;

        audioUsed =
            false;

        footer.className =
            "lesson-answer-footer";

        feedback.innerHTML =
            "";

        action.textContent =
            "Verificar";

        action.disabled =
            false;

        const exercise =
            lesson.exercises[
            exerciseIndex
            ];

        const percentage =
            Math.round(
                (
                    exerciseIndex /
                    lesson.exercises.length
                ) *
                100
            );

        progressBar.style.width =
            `${percentage}%`;

        const questionLanguage =
            detectLanguage(
                exercise.question
            );

        const questionRate =
            getSpeechRateForLanguage(
                questionLanguage
            );

        let answerHTML =
            "";

        if (
            exercise.type ===
            "multiple"
        ) {
            answerHTML =
                multipleChoiceHTML(
                    exercise
                );
        }

        if (
            exercise.type ===
            "translation" ||
            exercise.type ===
            "fill"
        ) {
            answerHTML =
                textAnswerHTML();
        }

        if (
            exercise.type ===
            "order"
        ) {
            answerHTML =
                wordOrderHTML(
                    exercise
                );
        }

        let typeLabel =
            "Escreva a resposta";

        if (
            exercise.type ===
            "multiple"
        ) {
            typeLabel =
                "Escolha a resposta";
        }

        if (
            exercise.type ===
            "order"
        ) {
            typeLabel =
                "Organize a frase";
        }

        content.innerHTML = `
            <section class="exercise-area">

                <div class="exercise-type">
                    ${exerciseIndex + 1}
                    /
                    ${lesson.exercises.length}
                    •
                    ${typeLabel}
                </div>

                <div class="eyt-question-row">

                    <h1 class="exercise-question">
                        ${EYTApp.escapeHTML(
            exercise.question
        )}
                    </h1>

                    ${speechButton(
            exercise.question,
            {
                lang:
                    questionLanguage,
                rate:
                    questionRate,
                className:
                    "eyt-question-speech",
                label:
                    "Ouvir pergunta"
            }
        )}

                </div>

                ${coachHTML()}

                ${answerHTML}

            </section>
        `;

        bindMultipleAnswers();
        bindWordBank();
        bindTextInput();

        bindSpeechButtons(
            content
        );

        scheduleAudioHint();
    }

    /* ==========================================================================
       MULTIPLE
       ========================================================================== */

    function bindMultipleAnswers() {
        document
            .querySelectorAll(
                ".answer-option"
            )
            .forEach(
                button => {
                    button.addEventListener(
                        "click",
                        () => {
                            if (
                                checked
                            ) {
                                return;
                            }

                            document
                                .querySelectorAll(
                                    ".answer-option"
                                )
                                .forEach(
                                    item => {
                                        item.classList.remove(
                                            "selected"
                                        );
                                    }
                                );

                            button.classList.add(
                                "selected"
                            );

                            selectedAnswer =
                                button.dataset
                                    .value;

                            /*
                             * Ao selecionar a alternativa,
                             * reproduz automaticamente em inglês.
                             */

                            autoSpeakAnswer(
                                selectedAnswer
                            );
                        }
                    );
                }
            );
    }

    /* ==========================================================================
       WORD BANK
       ========================================================================== */

    function bindWordBank() {
        document
            .querySelectorAll(
                ".word-chip[data-index]"
            )
            .forEach(
                button => {
                    button.addEventListener(
                        "click",
                        () => {
                            if (
                                checked ||
                                button.classList
                                    .contains(
                                        "used"
                                    )
                            ) {
                                return;
                            }

                            const word =
                                button.dataset
                                    .word;

                            button.classList.add(
                                "used"
                            );

                            orderedWords.push({
                                index:
                                    button.dataset
                                        .index,
                                word
                            });

                            selectedAnswer =
                                orderedWords
                                    .map(
                                        item =>
                                            item.word
                                    )
                                    .join(
                                        " "
                                    );

                            renderOrderedAnswer();

                            autoSpeakWord(
                                word
                            );
                        }
                    );
                }
            );
    }

    function renderOrderedAnswer() {
        const container =
            document.getElementById(
                "orderedAnswer"
            );

        if (
            !container
        ) {
            return;
        }

        container.innerHTML =
            orderedWords
                .map(
                    (
                        item,
                        index
                    ) => `
                        <button
                            type="button"
                            class="word-chip selected-word-chip"
                            data-remove="${index}"
                        >
                            ${EYTApp.escapeHTML(
                        item.word
                    )}
                        </button>
                    `
                )
                .join("");

        container
            .querySelectorAll(
                "[data-remove]"
            )
            .forEach(
                button => {
                    button.addEventListener(
                        "click",
                        () => {
                            if (
                                checked
                            ) {
                                return;
                            }

                            registerInteraction();

                            const position =
                                Number(
                                    button.dataset
                                        .remove
                                );

                            const removed =
                                orderedWords.splice(
                                    position,
                                    1
                                )[0];

                            if (
                                !removed
                            ) {
                                return;
                            }

                            const source =
                                document.querySelector(
                                    `.word-chip[data-index="${removed.index}"]`
                                );

                            if (
                                source
                            ) {
                                source.classList.remove(
                                    "used"
                                );
                            }

                            selectedAnswer =
                                orderedWords
                                    .map(
                                        item =>
                                            item.word
                                    )
                                    .join(
                                        " "
                                    );

                            renderOrderedAnswer();
                        }
                    );
                }
            );
    }

    /* ==========================================================================
       INPUT
       ========================================================================== */

    function bindTextInput() {
        const input =
            document.getElementById(
                "textAnswer"
            );

        if (
            !input
        ) {
            return;
        }

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

                    verifyAnswer();
                }
            }
        );
    }

    /* ==========================================================================
       MARK ANSWER
       ========================================================================== */

    function markMultipleAnswer(
        exercise,
        submittedValue,
        correct
    ) {
        if (
            exercise.type !==
            "multiple"
        ) {
            return;
        }

        const normalizedCorrect =
            EYTApp.normalizeText(
                exercise.answer
            );

        const normalizedSubmitted =
            EYTApp.normalizeText(
                submittedValue
            );

        document
            .querySelectorAll(
                ".answer-option"
            )
            .forEach(
                button => {
                    const value =
                        EYTApp.normalizeText(
                            button.dataset
                                .value
                        );

                    button.disabled =
                        true;

                    if (
                        value ===
                        normalizedCorrect
                    ) {
                        button.classList.add(
                            "correct"
                        );
                    }

                    if (
                        !correct &&
                        value ===
                        normalizedSubmitted
                    ) {
                        button.classList.add(
                            "incorrect"
                        );
                    }
                }
            );
    }

    /* ==========================================================================
       FEEDBACK
       ========================================================================== */

    function renderFeedback(
        exercise,
        correct
    ) {
        if (
            correct
        ) {
            feedback.innerHTML = `
                <div class="eyt-feedback-content">

                    <div class="eyt-feedback-copy">
                        <strong>
                            Excellent!
                        </strong>

                        <p>
                            Resposta correta.
                            Continue assim.
                        </p>
                    </div>

                    ${speechButton(
                exercise.answer,
                {
                    lang:
                        CONFIG.answerEnglishLang,
                    rate:
                        CONFIG.feedbackSpeechRate,
                    className:
                        "eyt-feedback-speech",
                    label:
                        "Ouvir resposta correta"
                }
            )}

                </div>
            `;
        } else {
            feedback.innerHTML = `
                <div class="eyt-feedback-content">

                    <div class="eyt-feedback-copy">
                        <strong>
                            Quase!
                        </strong>

                        <p>
                            Resposta correta:
                            <b>
                                ${EYTApp.escapeHTML(
                exercise.answer
            )}
                            </b>
                        </p>
                    </div>

                    ${speechButton(
                exercise.answer,
                {
                    lang:
                        CONFIG.answerEnglishLang,
                    rate:
                        CONFIG.feedbackSpeechRate,
                    className:
                        "eyt-feedback-speech",
                    label:
                        "Ouvir resposta correta"
                }
            )}

                </div>
            `;
        }

        bindSpeechButtons(
            feedback
        );
    }

    /* ==========================================================================
       VERIFY
       ========================================================================== */

    function verifyAnswer() {
        if (
            checked
        ) {
            return;
        }

        clearTimers();
        hideAudioHint();

        const exercise =
            lesson.exercises[
            exerciseIndex
            ];

        let submittedValue =
            selectedAnswer;

        if (
            exercise.type ===
            "translation" ||
            exercise.type ===
            "fill"
        ) {
            const input =
                document.getElementById(
                    "textAnswer"
                );

            submittedValue =
                input
                    ? input.value
                    : "";
        }

        if (
            !String(
                submittedValue || ""
            ).trim()
        ) {
            scheduleAudioHint(
                CONFIG.emptyAnswerHintDelay
            );

            return;
        }

        const acceptedAnswers = [
            exercise.answer,
            ...(exercise.alternatives || [])
        ].map(
            EYTApp.normalizeText
        );

        const correct =
            acceptedAnswers.includes(
                EYTApp.normalizeText(
                    submittedValue
                )
            );

        EYTStorage.registerAnswer(
            correct
        );

        markMultipleAnswer(
            exercise,
            submittedValue,
            correct
        );

        const input =
            document.getElementById(
                "textAnswer"
            );

        if (
            input
        ) {
            input.disabled =
                true;

            input.classList.add(
                correct
                    ? "answer-correct"
                    : "answer-incorrect"
            );
        }

        document
            .querySelectorAll(
                ".word-chip"
            )
            .forEach(
                button => {
                    button.disabled =
                        true;
                }
            );

        if (
            correct
        ) {
            EYTStorage.removeMistake(
                lesson.id,
                exercise.id
            );

            footer.classList.add(
                "correct"
            );
        } else {
            EYTStorage.addMistake({
                lessonId:
                    lesson.id,
                exerciseId:
                    exercise.id,
                question:
                    exercise.question,
                answer:
                    exercise.answer
            });

            footer.classList.add(
                "incorrect"
            );
        }

        renderFeedback(
            exercise,
            correct
        );

        checked =
            true;

        action.textContent =
            exerciseIndex ===
                lesson.exercises.length -
                1
                ? "Finalizar"
                : "Continuar";

        EYTStorage.saveLessonProgress(
            lesson.id,
            exerciseIndex + 1,
            lesson.exercises.length
        );
    }

    /* ==========================================================================
       FINISH
       ========================================================================== */

    function finishLesson() {
        clearTimers();
        stopSpeech();

        const progressBefore =
            EYTStorage.getProgress();

        const alreadyCompleted =
            progressBefore
                .licoesConcluidas
                .includes(
                    lesson.id
                );

        EYTStorage.completeLesson(
            lesson.id
        );

        /*
         * Evita ganhar XP completo repetidamente
         * refazendo a mesma lição.
         */

        if (
            !alreadyCompleted
        ) {
            EYTStorage.addXP(
                lesson.xp
            );
        }

        EYTApp.evaluateAchievements();

        progressBar.style.width =
            "100%";

        footer.classList.add(
            "hidden"
        );

        const awardedXp =
            alreadyCompleted
                ? 0
                : lesson.xp;

        lessonXp.textContent =
            awardedXp;

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
                            +${awardedXp}
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

                ${alreadyCompleted
                ? `
                            <p class="eyt-review-note">
                                Revisão concluída.
                                O XP desta lição já havia sido recebido.
                            </p>
                        `
                : ""
            }

                <a
                    href="curso.html"
                    class="btn btn-primary btn-large"
                >
                    Continuar aprendendo →
                </a>

            </section>
        `;
    }

    /* ==========================================================================
       ACTION
       ========================================================================== */

    action.addEventListener(
        "click",
        () => {
            registerInteraction();

            if (
                !checked
            ) {
                verifyAnswer();
                return;
            }

            if (
                exerciseIndex >=
                lesson.exercises.length -
                1
            ) {
                finishLesson();
                return;
            }

            exerciseIndex++;

            renderExercise();
        }
    );

    /* ==========================================================================
       CLOSE
       ========================================================================== */

    closeLesson.addEventListener(
        "click",
        () => {
            clearTimers();
            stopSpeech();

            window.location.href =
                "curso.html";
        }
    );

    /* ==========================================================================
       INTERAÇÃO GERAL
       ========================================================================== */

    content.addEventListener(
        "pointerdown",
        event => {
            if (
                event.target.closest(
                    "[data-speech]"
                )
            ) {
                return;
            }

            if (
                event.target.closest(
                    ".answer-option"
                )
            ) {
                return;
            }

            if (
                event.target.closest(
                    ".word-chip[data-index]"
                )
            ) {
                return;
            }

            registerInteraction();
        }
    );

    /* ==========================================================================
       SPEECH EVENTS
       ========================================================================== */

    window.addEventListener(
        "eyt:speech-start",
        () => {
            hideAudioHint();
            clearInactivityTimer();
        }
    );

    /* ==========================================================================
       CLEANUP
       ========================================================================== */

    window.addEventListener(
        "pagehide",
        () => {
            clearTimers();
            stopSpeech();
        }
    );

    /* ==========================================================================
       START
       ========================================================================== */

    renderIntro();
});