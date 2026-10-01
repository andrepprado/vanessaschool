document.addEventListener(
    "DOMContentLoaded",
    () => {
        "use strict";

        const content =
            window.EYTLevelContent;

        if (!content) {
            console.error(
                "[Demo] EYTLevelContent unavailable."
            );

            return;
        }

        const LEVELS = [
            "A1",
            "A2",
            "B1",
            "B2",
            "C1"
        ];

        const state = {
            level: "A2",
            exercises: [],
            current: 0,
            correct: 0,
            answered: false
        };

        const levelSection =
            document.getElementById(
                "demoLevelSection"
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

        const counter =
            document.getElementById(
                "demoExerciseCounter"
            );

        const progressBar =
            document.getElementById(
                "demoExerciseProgressBar"
            );

        const exerciseLevel =
            document.getElementById(
                "demoExerciseLevel"
            );

        function normalize(
            value
        ) {
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

        function escapeHtml(
            value
        ) {
            return String(
                value ?? ""
            )
                .replace(
                    /&/g,
                    "&amp;"
                )
                .replace(
                    /</g,
                    "&lt;"
                )
                .replace(
                    />/g,
                    "&gt;"
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

        function getLevelData(
            level
        ) {
            return (
                content[level] ||
                null
            );
        }

        function buildDemoExercises(
            level
        ) {
            const data =
                getLevelData(
                    level
                );

            if (
                !data ||
                !Array.isArray(
                    data.lessons
                )
            ) {
                return [];
            }

            /*
             * One exercise per lesson gives a broader
             * demonstration of the selected level.
             */
            return data.lessons
                .map(
                    lesson => {
                        const exercise =
                            Array.isArray(
                                lesson.exercises
                            )
                                ? lesson.exercises[0]
                                : null;

                        if (!exercise) {
                            return null;
                        }

                        return {
                            ...exercise,

                            lessonTitle:
                                lesson.title
                        };
                    }
                )
                .filter(Boolean)
                .slice(
                    0,
                    5
                );
        }

        function updateLevelSelection() {
            document
                .querySelectorAll(
                    "[data-demo-level]"
                )
                .forEach(
                    button => {
                        button
                            .classList
                            .toggle(
                                "active",
                                button.dataset
                                    .demoLevel ===
                                    state.level
                            );
                    }
                );

            const data =
                getLevelData(
                    state.level
                );

            const selectedLevel =
                document.getElementById(
                    "demoSelectedLevel"
                );

            const description =
                document.getElementById(
                    "demoSelectedDescription"
                );

            const launch =
                document.getElementById(
                    "demoLaunchButton"
                );

            if (selectedLevel) {
                selectedLevel.textContent =
                    state.level;
            }

            if (description) {
                description.textContent =
                    data?.description ||
                    "";
            }

            if (launch) {
                launch.innerHTML = `
                    Experimentar ${state.level}

                    <i class="bi bi-play-fill"></i>
                `;
            }
        }

        function selectLevel(
            level
        ) {
            if (
                !LEVELS.includes(
                    level
                )
            ) {
                return;
            }

            state.level =
                level;

            updateLevelSelection();
        }

        function renderChoice(
            exercise
        ) {
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
                state.exercises[
                    state.current
                ];

            if (!exercise) {
                finishDemo();
                return;
            }

            state.answered =
                false;

            const total =
                state.exercises.length;

            counter.textContent =
                `${state.current + 1} / ${total}`;

            exerciseLevel.textContent =
                state.level;

            progressBar.style.width =
                `${
                    (
                        state.current /
                        total
                    ) *
                    100
                }%`;

            exerciseContent.innerHTML = `
                <div class="demo-question-card">

                    <span class="demo-question-lesson">
                        ${escapeHtml(
                            exercise.lessonTitle
                        )}
                    </span>

                    <span class="eyebrow">
                        QUESTÃO ${state.current + 1}
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

            document
                .getElementById(
                    "demoCheckAnswer"
                )
                .addEventListener(
                    "click",
                    checkAnswer
                );
        }

        function getUserAnswer(
            exercise
        ) {
            if (
                exercise.type ===
                "choice"
            ) {
                return document
                    .querySelector(
                        ".demo-answer-option.selected"
                    )
                    ?.dataset
                    ?.demoAnswer ||
                    "";
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

        function isCorrectAnswer(
            exercise,
            userAnswer
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
                    userAnswer
                )
            );
        }

        function checkAnswer() {
            if (
                state.answered
            ) {
                nextExercise();
                return;
            }

            const exercise =
                state.exercises[
                    state.current
                ];

            const answer =
                getUserAnswer(
                    exercise
                );

            if (!answer.trim()) {
                return;
            }

            state.answered =
                true;

            const correct =
                isCorrectAnswer(
                    exercise,
                    answer
                );

            if (correct) {
                state.correct++;
            }

            const feedback =
                document.getElementById(
                    "demoQuestionFeedback"
                );

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
                                Muito bem!
                            </strong>

                            <span>
                                Sua resposta está correta.
                            </span>

                        </div>
                    `
                    : `
                        <i class="bi bi-x-circle-fill"></i>

                        <div>

                            <strong>
                                Quase!
                            </strong>

                            <span>
                                Resposta correta:
                                ${escapeHtml(
                                    exercise.answer
                                )}
                            </span>

                        </div>
                    `;

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

                input.disabled =
                    true;

                input.classList.add(
                    correct
                        ? "correct"
                        : "incorrect"
                );
            }

            const button =
                document.getElementById(
                    "demoCheckAnswer"
                );

            button.innerHTML =
                state.current ===
                    state.exercises.length -
                    1
                    ? `
                        Ver resultado
                        <i class="bi bi-arrow-right"></i>
                    `
                    : `
                        Continuar
                        <i class="bi bi-arrow-right"></i>
                    `;
        }

        function nextExercise() {
            state.current++;

            if (
                state.current >=
                state.exercises.length
            ) {
                finishDemo();
                return;
            }

            renderExercise();
        }

        function startDemo() {
            state.exercises =
                buildDemoExercises(
                    state.level
                );

            if (
                !state.exercises.length
            ) {
                alert(
                    "Não há exercícios demonstrativos disponíveis para este nível."
                );

                return;
            }

            state.current = 0;
            state.correct = 0;
            state.answered =
                false;

            levelSection.hidden =
                true;

            resultSection.hidden =
                true;

            exerciseSection.hidden =
                false;

            window.scrollTo({
                top:
                    exerciseSection
                        .offsetTop -
                    20,

                behavior:
                    "smooth"
            });

            renderExercise();
        }

        function closeDemo() {
            exerciseSection.hidden =
                true;

            resultSection.hidden =
                true;

            levelSection.hidden =
                false;

            window.scrollTo({
                top:
                    levelSection
                        .offsetTop -
                    30,

                behavior:
                    "smooth"
            });
        }

        function finishDemo() {
            exerciseSection.hidden =
                true;

            resultSection.hidden =
                false;

            const total =
                state.exercises.length;

            const percent =
                total
                    ? Math.round(
                        state.correct /
                        total *
                        100
                    )
                    : 0;

            document
                .getElementById(
                    "demoResultLevel"
                )
                .textContent =
                    state.level;

            document
                .getElementById(
                    "demoResultScore"
                )
                .textContent =
                    `${state.correct}/${total}`;

            const text =
                document.getElementById(
                    "demoResultText"
                );

            if (
                percent === 100
            ) {
                text.textContent =
                    "Excelente desempenho nesta pequena amostra. No ambiente do aluno, você teria acesso à trilha completa do nível.";
            }
            else if (
                percent >= 60
            ) {
                text.textContent =
                    "Bom resultado. Esta demonstração mostra apenas uma pequena parte das atividades disponíveis no nível.";
            }
            else {
                text.textContent =
                    "Esta foi apenas uma amostra. Na plataforma, cada atividade faz parte de uma sequência de aprendizagem.";
            }

            window.scrollTo({
                top:
                    resultSection
                        .offsetTop -
                    30,

                behavior:
                    "smooth"
            });
        }

        document
            .querySelectorAll(
                "[data-demo-level]"
            )
            .forEach(
                button => {
                    button.addEventListener(
                        "click",
                        () => {
                            selectLevel(
                                button.dataset
                                    .demoLevel
                            );
                        }
                    );
                }
            );

        document
            .getElementById(
                "demoStartButton"
            )
            .addEventListener(
                "click",
                () => {
                    levelSection
                        .scrollIntoView({
                            behavior:
                                "smooth",
                            block:
                                "start"
                        });
                }
            );

        document
            .getElementById(
                "demoLaunchButton"
            )
            .addEventListener(
                "click",
                startDemo
            );

        document
            .getElementById(
                "demoCloseExercise"
            )
            .addEventListener(
                "click",
                closeDemo
            );

        document
            .getElementById(
                "demoTryAgain"
            )
            .addEventListener(
                "click",
                closeDemo
            );

        updateLevelSelection();

        console.info(
            "[Demo] Interactive level demo ready."
        );
    }
);