document.addEventListener(
    "DOMContentLoaded",
    () => {
        "use strict";

        const WHATSAPP_NUMBER =
            "5512997157739";

        const LEVELS = [
            "A1",
            "A2",
            "B1",
            "B2",
            "C1"
        ];

        const LEVEL_NAMES = {
            A1: "Beginner",
            A2: "Elementary",
            B1: "Intermediate",
            B2: "Upper-Intermediate",
            C1: "Advanced"
        };

        const LEVEL_DESCRIPTIONS = {
            A1:
                "Você está construindo as bases do inglês. O foco ideal é consolidar vocabulário essencial, estruturas básicas e comunicação cotidiana.",

            A2:
                "Você já possui uma boa base inicial e consegue lidar com diversas situações do dia a dia. O próximo passo é ampliar tempos verbais, vocabulário e autonomia.",

            B1:
                "Você demonstra domínio consistente das estruturas básicas e intermediárias e já consegue compreender e formular ideias com maior autonomia.",

            B2:
                "Você apresenta boa compreensão de estruturas complexas e consegue se comunicar com maior precisão, naturalidade e independência.",

            C1:
                "Você demonstra domínio avançado do idioma e boa capacidade para compreender estruturas complexas, nuances e construções mais sofisticadas."
        };

        const content =
            window.EYTLevelContent;

        if (!content) {
            console.error(
                "[Demo] EYTLevelContent unavailable."
            );
            return;
        }

        const state = {
            levelIndex: 1,
            questionNumber: 0,
            maxQuestions: 10,
            correct: 0,
            history: [],
            used: new Set(),
            currentExercise: null,
            answered: false,
            practiceMode: false
        };

        const intro =
            document.getElementById(
                "demoIntro"
            );

        const exerciseSection =
            document.getElementById(
                "demoExerciseSection"
            );

        const resultSection =
            document.getElementById(
                "demoResultSection"
            );

        const exerciseContent =
            document.getElementById(
                "demoExerciseContent"
            );

        const progressBar =
            document.getElementById(
                "demoExerciseProgressBar"
            );

        const counter =
            document.getElementById(
                "demoExerciseCounter"
            );

        const levelIndicator =
            document.getElementById(
                "demoExerciseLevel"
            );

        function normalize(value) {
            return String(
                value ?? ""
            )
                .trim()
                .toLowerCase()
                .replace(
                    /\s+/g,
                    " "
                );
        }

        function escapeHtml(value) {
            return String(
                value ?? ""
            )
                .replace(/&/g,"&amp;")
                .replace(/</g,"&lt;")
                .replace(/>/g,"&gt;")
                .replace(/"/g,"&quot;")
                .replace(/'/g,"&#039;");
        }

        function flattenExercises(level) {
            const levelData =
                content[level];

            if (!levelData) {
                return [];
            }

            const lessons =
                Array.isArray(
                    levelData.lessons
                )
                    ? levelData.lessons
                    : [];

            const output = [];

            lessons.forEach(
                (
                    lesson,
                    lessonIndex
                ) => {
                    const exercises =
                        Array.isArray(
                            lesson.exercises
                        )
                            ? lesson.exercises
                            : [];

                    exercises.forEach(
                        (
                            exercise,
                            exerciseIndex
                        ) => {
                            output.push({
                                ...exercise,
                                level,
                                lessonTitle:
                                    lesson.title ||
                                    level,
                                key:
                                    `${level}-${lessonIndex}-${exerciseIndex}`
                            });
                        }
                    );
                }
            );

            return output;
        }

        function getUnusedExercise(level) {
            const candidates =
                flattenExercises(
                    level
                )
                    .filter(
                        exercise =>
                            !state.used.has(
                                exercise.key
                            )
                    );

            if (!candidates.length) {
                return null;
            }

            const index =
                Math.floor(
                    Math.random() *
                    candidates.length
                );

            return candidates[index];
        }

        function getExercise() {
            const currentLevel =
                LEVELS[
                    state.levelIndex
                ];

            let exercise =
                getUnusedExercise(
                    currentLevel
                );

            if (exercise) {
                return exercise;
            }

            for (
                let distance = 1;
                distance < LEVELS.length;
                distance++
            ) {
                const alternatives = [
                    state.levelIndex - distance,
                    state.levelIndex + distance
                ];

                for (
                    const index of alternatives
                ) {
                    if (
                        index < 0 ||
                        index >= LEVELS.length
                    ) {
                        continue;
                    }

                    exercise =
                        getUnusedExercise(
                            LEVELS[index]
                        );

                    if (exercise) {
                        return exercise;
                    }
                }
            }

            return null;
        }

        function renderChoice(exercise) {
            const options =
                Array.isArray(
                    exercise.options
                )
                    ? exercise.options
                    : [];

            return `
                <div class="demo-question-options">
                    ${options
                        .map(
                            (
                                option,
                                index
                            ) => `
                                <button
                                    type="button"
                                    class="demo-answer-option"
                                    data-demo-answer="${escapeHtml(
                                        option
                                    )}">

                                    <span>
                                        ${String.fromCharCode(
                                            65 + index
                                        )}
                                    </span>

                                    <strong>
                                        ${escapeHtml(
                                            option
                                        )}
                                    </strong>

                                </button>
                            `
                        )
                        .join("")}
                </div>
            `;
        }

        function renderFill() {
            return `
                <div class="demo-fill-area">

                    <label
                        for="demoFillAnswer">

                        Digite sua resposta

                    </label>

                    <input
                        id="demoFillAnswer"
                        class="demo-fill-input"
                        type="text"
                        autocomplete="off"
                        spellcheck="false"
                        placeholder="Sua resposta">

                </div>
            `;
        }

        function renderExercise() {
            const exercise =
                getExercise();

            if (!exercise) {
                finishDiagnostic();
                return;
            }

            state.currentExercise =
                exercise;

            state.used.add(
                exercise.key
            );

            state.answered =
                false;

            if (counter) {
                counter.textContent =
                    `${
                        state.questionNumber + 1
                    } / ${state.maxQuestions}`;
            }

            if (levelIndicator) {
                levelIndicator.textContent =
                    `NÍVEL ${exercise.level}`;
            }

            if (progressBar) {
                progressBar.style.width =
                    `${
                        (
                            state.questionNumber /
                            state.maxQuestions
                        ) *
                        100
                    }%`;
            }

            exerciseContent.innerHTML = `
                <div class="demo-question-card">

                    <div class="demo-question-meta">

                        <span>
                            ${escapeHtml(
                                exercise.lessonTitle
                            )}
                        </span>

                        <strong>
                            ${exercise.level}
                        </strong>

                    </div>

                    <span class="eyebrow">
                        QUESTÃO ${
                            state.questionNumber + 1
                        }
                    </span>

                    <h2>
                        ${escapeHtml(
                            exercise.question
                        )}
                    </h2>

                    ${
                        exercise.type ===
                            "choice"
                            ? renderChoice(
                                exercise
                            )
                            : renderFill()
                    }

                    <div
                        class="demo-question-feedback"
                        id="demoQuestionFeedback"
                        hidden>
                    </div>

                    <div class="demo-question-actions">

                        <button
                            type="button"
                            class="btn btn-primary btn-large"
                            id="demoCheckAnswer">

                            Verificar

                        </button>

                    </div>

                </div>
            `;

            document
                .querySelectorAll(
                    ".demo-answer-option"
                )
                .forEach(
                    button => {
                        button.addEventListener(
                            "click",
                            () => {
                                if (
                                    state.answered
                                ) {
                                    return;
                                }

                                document
                                    .querySelectorAll(
                                        ".demo-answer-option"
                                    )
                                    .forEach(
                                        item =>
                                            item.classList.remove(
                                                "selected"
                                            )
                                    );

                                button.classList.add(
                                    "selected"
                                );
                            }
                        );
                    }
                );

            const input =
                document.getElementById(
                    "demoFillAnswer"
                );

            if (input) {
                input.focus();

                input.addEventListener(
                    "keydown",
                    event => {
                        if (
                            event.key ===
                            "Enter"
                        ) {
                            checkAnswer();
                        }
                    }
                );
            }

            const checkButton =
                document.getElementById(
                    "demoCheckAnswer"
                );

            if (checkButton) {
                checkButton.addEventListener(
                    "click",
                    checkAnswer
                );
            }
        }

        function getAnswer(exercise) {
            if (
                exercise.type ===
                "choice"
            ) {
                return (
                    document
                        .querySelector(
                            ".demo-answer-option.selected"
                        )
                        ?.dataset
                        ?.demoAnswer ||
                    ""
                );
            }

            return (
                document
                    .getElementById(
                        "demoFillAnswer"
                    )
                    ?.value ||
                ""
            );
        }

        function answerIsCorrect(
            exercise,
            answer
        ) {
            const accepted = [
                exercise.answer,
                ...(
                    Array.isArray(
                        exercise.alternatives
                    )
                        ? exercise.alternatives
                        : []
                )
            ]
                .map(
                    normalize
                );

            return accepted.includes(
                normalize(
                    answer
                )
            );
        }

        function updateDifficulty(correct) {
            if (
                state.practiceMode
            ) {
                return;
            }

            if (correct) {
                state.levelIndex =
                    Math.min(
                        state.levelIndex + 1,
                        LEVELS.length - 1
                    );
            }
            else {
                state.levelIndex =
                    Math.max(
                        state.levelIndex - 1,
                        0
                    );
            }
        }

        function checkAnswer() {
            if (
                state.answered
            ) {
                nextQuestion();
                return;
            }

            const exercise =
                state.currentExercise;

            const answer =
                getAnswer(
                    exercise
                );

            if (
                !String(
                    answer
                ).trim()
            ) {
                return;
            }

            state.answered =
                true;

            const correct =
                answerIsCorrect(
                    exercise,
                    answer
                );

            if (correct) {
                state.correct++;
            }

            state.history.push({
                level:
                    exercise.level,

                correct,

                lessonTitle:
                    exercise.lessonTitle
            });

            updateDifficulty(
                correct
            );

            const feedback =
                document.getElementById(
                    "demoQuestionFeedback"
                );

            if (feedback) {
                feedback.hidden =
                    false;

                feedback.className =
                    `demo-question-feedback ${
                        correct
                            ? "correct"
                            : "incorrect"
                    }`;

                feedback.innerHTML =
                    correct
                        ? `
                            <i class="bi bi-check-circle-fill"></i>

                            <div>
                                <strong>
                                    Correto!
                                </strong>

                                <span>
                                    A próxima questão pode ficar mais desafiadora.
                                </span>
                            </div>
                        `
                        : `
                            <i class="bi bi-x-circle-fill"></i>

                            <div>
                                <strong>
                                    Não foi dessa vez.
                                </strong>

                                <span>
                                    Resposta esperada:
                                    ${escapeHtml(
                                        exercise.answer
                                    )}
                                </span>
                            </div>
                        `;
            }

            if (
                exercise.type ===
                "choice"
            ) {
                document
                    .querySelectorAll(
                        ".demo-answer-option"
                    )
                    .forEach(
                        button => {
                            const value =
                                button.dataset
                                    .demoAnswer;

                            if (
                                normalize(
                                    value
                                ) ===
                                normalize(
                                    exercise.answer
                                )
                            ) {
                                button.classList.add(
                                    "correct"
                                );
                            }
                            else if (
                                button.classList
                                    .contains(
                                        "selected"
                                    )
                            ) {
                                button.classList.add(
                                    "incorrect"
                                );
                            }

                            button.disabled =
                                true;
                        }
                    );
            }
            else {
                const input =
                    document.getElementById(
                        "demoFillAnswer"
                    );

                if (input) {
                    input.disabled =
                        true;

                    input.classList.add(
                        correct
                            ? "correct"
                            : "incorrect"
                    );
                }
            }

            const button =
                document.getElementById(
                    "demoCheckAnswer"
                );

            if (button) {
                button.innerHTML =
                    state.questionNumber >=
                        state.maxQuestions - 1
                        ? `
                            Ver resultado
                            <i class="bi bi-arrow-right"></i>
                        `
                        : `
                            Continuar
                            <i class="bi bi-arrow-right"></i>
                        `;
            }
        }

        function nextQuestion() {
            state.questionNumber++;

            if (
                state.questionNumber >=
                state.maxQuestions
            ) {
                finishDiagnostic();
                return;
            }

            renderExercise();
        }

        function calculateEstimatedLevel() {
            const scores = {
                A1: [],
                A2: [],
                B1: [],
                B2: [],
                C1: []
            };

            state.history.forEach(
                item => {
                    scores[
                        item.level
                    ].push(
                        item.correct
                            ? 1
                            : 0
                    );
                }
            );

            let estimated = 0;

            LEVELS.forEach(
                (
                    level,
                    index
                ) => {
                    const values =
                        scores[level];

                    if (!values.length) {
                        return;
                    }

                    const ratio =
                        values.reduce(
                            (
                                total,
                                value
                            ) =>
                                total + value,
                            0
                        ) /
                        values.length;

                    if (
                        ratio >= .5
                    ) {
                        estimated =
                            Math.max(
                                estimated,
                                index
                            );
                    }
                }
            );

            return LEVELS[
                estimated
            ];
        }

        function getHighestTestedLevel() {
            let highest = 0;

            state.history.forEach(
                item => {
                    highest =
                        Math.max(
                            highest,
                            LEVELS.indexOf(
                                item.level
                            )
                        );
                }
            );

            return LEVELS[
                highest
            ];
        }

        function buildStrengths(level) {
            const index =
                LEVELS.indexOf(
                    level
                );

            const items = [];

            state.history
                .filter(
                    item =>
                        item.correct
                )
                .forEach(
                    item => {
                        if (
                            !items.includes(
                                item.lessonTitle
                            )
                        ) {
                            items.push(
                                item.lessonTitle
                            );
                        }
                    }
                );

            if (!items.length) {
                items.push(
                    index === 0
                        ? "fundamentos iniciais"
                        : `conteúdos até ${LEVELS[
                            Math.max(
                                index - 1,
                                0
                            )
                        ]}`
                );
            }

            return items.slice(
                0,
                4
            );
        }

        function buildDevelopment(level) {
            const items = [];

            state.history
                .filter(
                    item =>
                        !item.correct
                )
                .forEach(
                    item => {
                        if (
                            !items.includes(
                                item.lessonTitle
                            )
                        ) {
                            items.push(
                                item.lessonTitle
                            );
                        }
                    }
                );

            if (!items.length) {
                const index =
                    LEVELS.indexOf(
                        level
                    );

                items.push(
                    index <
                        LEVELS.length - 1
                        ? `conteúdos do nível ${
                            LEVELS[
                                index + 1
                            ]
                        }`
                        : "refinamento e fluência"
                );
            }

            return items.slice(
                0,
                4
            );
        }

        function renderList(
            element,
            items
        ) {
            if (!element) {
                return;
            }

            element.innerHTML =
                items
                    .map(
                        item => `
                            <span>
                                <i class="bi bi-check2"></i>

                                ${escapeHtml(
                                    item
                                )}
                            </span>
                        `
                    )
                    .join("");
        }

        function configureWhatsApp(
            level
        ) {
            const button =
                document.getElementById(
                    "demoWhatsAppButton"
                );

            if (!button) {
                return;
            }

            const score =
                `${state.correct}/${state.history.length}`;

            const message = [
                "Oi, Teacher Vanessa!",
                "",
                "Fiz o teste de nível no English in Your Time.",
                `Meu nível estimado foi ${level} - ${LEVEL_NAMES[level]}.`,
                `Meu resultado foi ${score} respostas corretas.`,
                "",
                "Gostaria de entender melhor meu resultado e saber mais sobre as aulas."
            ].join(
                "\n"
            );

            button.href =
                `https://wa.me/${WHATSAPP_NUMBER}?text=${
                    encodeURIComponent(
                        message
                    )
                }`;

            button.target =
                "_blank";

            button.rel =
                "noopener";
        }

        function finishDiagnostic() {
            exerciseSection.hidden =
                true;

            resultSection.hidden =
                false;

            if (progressBar) {
                progressBar.style.width =
                    "100%";
            }

            const level =
                calculateEstimatedLevel();

            const percent =
                state.history.length
                    ? Math.round(
                        state.correct /
                        state.history.length *
                        100
                    )
                    : 0;

            const resultLevel =
                document.getElementById(
                    "demoResultLevel"
                );

            const resultTitle =
                document.getElementById(
                    "demoResultTitle"
                );

            const resultDescription =
                document.getElementById(
                    "demoResultDescription"
                );

            const resultScore =
                document.getElementById(
                    "demoResultScore"
                );

            const resultPercent =
                document.getElementById(
                    "demoResultPercent"
                );

            const resultHighest =
                document.getElementById(
                    "demoResultHighest"
                );

            if (resultLevel) {
                resultLevel.textContent =
                    level;
            }

            if (resultTitle) {
                resultTitle.textContent =
                    LEVEL_NAMES[level];
            }

            if (resultDescription) {
                resultDescription.textContent =
                    LEVEL_DESCRIPTIONS[
                        level
                    ];
            }

            if (resultScore) {
                resultScore.textContent =
                    `${state.correct}/${state.history.length}`;
            }

            if (resultPercent) {
                resultPercent.textContent =
                    `${percent}%`;
            }

            if (resultHighest) {
                resultHighest.textContent =
                    getHighestTestedLevel();
            }

            renderList(
                document.getElementById(
                    "demoStrengths"
                ),
                buildStrengths(
                    level
                )
            );

            renderList(
                document.getElementById(
                    "demoDevelopment"
                ),
                buildDevelopment(
                    level
                )
            );

            configureWhatsApp(
                level
            );

            window.scrollTo({
                top:
                    resultSection
                        .offsetTop -
                    20,

                behavior:
                    "smooth"
            });
        }

        function resetState() {
            state.levelIndex = 1;
            state.questionNumber = 0;
            state.maxQuestions = 10;
            state.correct = 0;
            state.history = [];
            state.used =
                new Set();
            state.currentExercise =
                null;
            state.answered =
                false;
            state.practiceMode =
                false;
        }

        function startDiagnostic() {
            resetState();

            if (intro) {
                intro.hidden =
                    true;
            }

            resultSection.hidden =
                true;

            exerciseSection.hidden =
                false;

            renderExercise();

            window.scrollTo({
                top:
                    exerciseSection
                        .offsetTop -
                    20,

                behavior:
                    "smooth"
            });
        }

        function restartDiagnostic() {
            resetState();

            exerciseSection.hidden =
                true;

            resultSection.hidden =
                true;

            if (intro) {
                intro.hidden =
                    false;
            }

            window.scrollTo({
                top: 0,
                behavior:
                    "smooth"
            });
        }

        function startLevelPractice() {
            const level =
                calculateEstimatedLevel();

            resetState();

            state.levelIndex =
                LEVELS.indexOf(
                    level
                );

            state.maxQuestions = 5;

            state.practiceMode =
                true;

            if (intro) {
                intro.hidden =
                    true;
            }

            resultSection.hidden =
                true;

            exerciseSection.hidden =
                false;

            renderExercise();

            window.scrollTo({
                top:
                    exerciseSection
                        .offsetTop -
                    20,

                behavior:
                    "smooth"
            });
        }

        document
            .getElementById(
                "demoStartDiagnostic"
            )
            ?.addEventListener(
                "click",
                startDiagnostic
            );

        document
            .getElementById(
                "demoCloseExercise"
            )
            ?.addEventListener(
                "click",
                restartDiagnostic
            );

        document
            .getElementById(
                "demoTryAgain"
            )
            ?.addEventListener(
                "click",
                restartDiagnostic
            );

        document
            .getElementById(
                "demoTryLevel"
            )
            ?.addEventListener(
                "click",
                startLevelPractice
            );

        console.info(
            "[Demo] Adaptive diagnostic ready."
        );
    }
);