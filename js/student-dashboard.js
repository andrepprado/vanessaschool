document.addEventListener(
    "DOMContentLoaded",
    async () => {
        const loading =
            document.getElementById(
                "studentLoading"
            );

        const content =
            document.getElementById(
                "studentContent"
            );

        const logout =
            document.getElementById(
                "studentLogout"
            );

        let client = null;
        let profile = null;
        let levelData = null;
        let progressMap = new Map();

        logout?.addEventListener(
            "click",
            async () => {
                await EYTSupabase.logout();
                location.href = "/acesso";
            }
        );

        try {
            client =
                await EYTSupabase
                    .getClient();

            const session =
                await EYTSupabase
                    .getSession();

            if (!session) {
                location.href =
                    "/acesso";
                return;
            }

            profile =
                await EYTSupabase
                    .getProfile();

            if (!profile) {
                throw new Error(
                    "Perfil do aluno não encontrado."
                );
            }

            if (
                profile.role ===
                "admin"
            ) {
                location.href =
                    "/admin";
                return;
            }

            if (!profile.active) {
                await EYTSupabase.logout();

                location.href =
                    "/acesso";
                return;
            }

            const level =
                String(
                    profile.level ||
                    "A1"
                ).toUpperCase();

            levelData =
                window.EYTLevelContent[
                    level
                ];

            if (!levelData) {
                throw new Error(
                    `Nenhum conteúdo foi configurado para o nível ${level}.`
                );
            }

            const {
                data: exerciseProgress,
                error: exerciseProgressError
            } = await client
                .from(
                    "student_exercise_progress"
                )
                .select(
                    "exercise_id,lesson_id,level,correct,attempts,last_answer,completed_at"
                )
                .eq(
                    "student_id",
                    profile.id
                );

            if (exerciseProgressError) {
                throw exerciseProgressError;
            }

            progressMap =
                new Map(
                    (exerciseProgress || [])
                        .map(
                            item => [
                                item.exercise_id,
                                item
                            ]
                        )
                );

            renderHeader();
            renderLessons();
            updateStatistics();

            loading.classList.add(
                "hidden"
            );

            content.classList.remove(
                "hidden"
            );
        } catch (error) {
            console.error(error);

            loading.innerHTML = `
                <div class="student-empty-state">
                    <h2>
                        Não foi possível carregar seu ambiente
                    </h2>

                    <p>
                        ${escapeHtml(
                            error.message
                        )}
                    </p>

                    <a
                        href="/acesso"
                        class="btn btn-primary">
                        Voltar ao acesso
                    </a>
                </div>
            `;
        }

        function getAllExercises() {
            return levelData.lessons
                .flatMap(
                    lesson =>
                        lesson.exercises
                            .map(
                                exercise => ({
                                    ...exercise,
                                    lessonId:
                                        lesson.id
                                })
                            )
                );
        }

        function getCompletedCount() {
            return getAllExercises()
                .filter(
                    exercise =>
                        progressMap.get(
                            exercise.id
                        )?.correct === true
                )
                .length;
        }

        function renderHeader() {
            document.getElementById(
                "studentName"
            ).textContent =
                profile.name;

            document.getElementById(
                "studentLevel"
            ).textContent =
                profile.level;

            const title =
                document.querySelector(
                    ".student-db-section .section-title h2"
                );

            const description =
                document.querySelector(
                    ".student-db-section .section-title p"
                );

            if (title) {
                title.textContent =
                    levelData.title;
            }

            if (description) {
                description.textContent =
                    levelData.description;
            }
        }

        function renderLessons() {
            const root =
                document.getElementById(
                    "studentActivities"
                );

            root.innerHTML =
                levelData.lessons
                    .map(
                        (
                            lesson,
                            index
                        ) => {
                            const completed =
                                lesson.exercises.filter(
                                    exercise =>
                                        progressMap.get(
                                            exercise.id
                                        )?.correct
                                ).length;

                            const percentage =
                                Math.round(
                                    completed /
                                    lesson.exercises.length *
                                    100
                                );

                            return `
                                <article
                                    class="student-level-lesson"
                                    data-lesson="${escapeAttribute(
                                        lesson.id
                                    )}">

                                    <button
                                        type="button"
                                        class="student-level-lesson-header"
                                        data-toggle-lesson="${escapeAttribute(
                                            lesson.id
                                        )}">

                                        <div class="student-level-lesson-number">
                                            ${index + 1}
                                        </div>

                                        <div class="student-level-lesson-title">
                                            <span>
                                                LESSON ${index + 1}
                                            </span>

                                            <h3>
                                                ${escapeHtml(
                                                    lesson.title
                                                )}
                                            </h3>

                                            <p>
                                                ${escapeHtml(
                                                    lesson.description
                                                )}
                                            </p>
                                        </div>

                                        <div class="student-level-lesson-progress">
                                            <strong>
                                                ${completed}/${lesson.exercises.length}
                                            </strong>

                                            <span>
                                                ${percentage}%
                                            </span>

                                            <i class="bi bi-chevron-down"></i>
                                        </div>
                                    </button>

                                    <div
                                        class="student-level-exercises ${
                                            index === 0
                                                ? "open"
                                                : ""
                                        }"
                                        data-lesson-content="${escapeAttribute(
                                            lesson.id
                                        )}">

                                        ${lesson.exercises
                                            .map(
                                                (
                                                    exercise,
                                                    exerciseIndex
                                                ) =>
                                                    renderExercise(
                                                        lesson,
                                                        exercise,
                                                        exerciseIndex
                                                    )
                                            )
                                            .join("")}
                                    </div>
                                </article>
                            `;
                        }
                    )
                    .join("");

            root.querySelectorAll(
                "[data-toggle-lesson]"
            ).forEach(
                button => {
                    button.addEventListener(
                        "click",
                        () => {
                            const lessonId =
                                button.dataset
                                    .toggleLesson;

                            const lessonContent =
                                root.querySelector(
                                    `[data-lesson-content="${cssEscape(
                                        lessonId
                                    )}"]`
                                );

                            lessonContent
                                ?.classList
                                .toggle("open");
                        }
                    );
                }
            );

            root.querySelectorAll(
                ".level-exercise-form"
            ).forEach(
                form => {
                    form.addEventListener(
                        "submit",
                        handleExerciseSubmit
                    );
                }
            );
        }

        function renderExercise(
            lesson,
            exercise,
            index
        ) {
            const saved =
                progressMap.get(
                    exercise.id
                );

            const completed =
                saved?.correct === true;

            let control = "";

            if (
                exercise.type ===
                "choice"
            ) {
                control = `
                    <div class="level-choice-list">
                        ${exercise.options
                            .map(
                                (
                                    option,
                                    optionIndex
                                ) => `
                                    <label class="level-choice-option">
                                        <input
                                            type="radio"
                                            name="${escapeAttribute(
                                                exercise.id
                                            )}"
                                            value="${escapeAttribute(
                                                option
                                            )}"
                                            ${
                                                completed
                                                    ? "disabled"
                                                    : ""
                                            }>

                                        <span class="level-choice-letter">
                                            ${String.fromCharCode(
                                                65 +
                                                optionIndex
                                            )}
                                        </span>

                                        <span>
                                            ${escapeHtml(
                                                option
                                            )}
                                        </span>
                                    </label>
                                `
                            )
                            .join("")}
                    </div>
                `;
            } else {
                control = `
                    <input
                        type="text"
                        class="level-fill-input"
                        name="answer"
                        autocomplete="off"
                        placeholder="Digite sua resposta..."
                        ${
                            completed
                                ? `value="${escapeAttribute(
                                    saved?.last_answer ||
                                    exercise.answer
                                )}" disabled`
                                : ""
                        }>
                `;
            }

            return `
                <form
                    class="level-exercise-form ${
                        completed
                            ? "completed"
                            : ""
                    }"
                    data-exercise="${escapeAttribute(
                        exercise.id
                    )}"
                    data-lesson="${escapeAttribute(
                        lesson.id
                    )}">

                    <div class="level-exercise-top">
                        <span class="level-exercise-number">
                            ${index + 1}
                        </span>

                        ${
                            completed
                                ? `
                                    <span class="level-exercise-completed">
                                        <i class="bi bi-check-circle-fill"></i>
                                        Concluído
                                    </span>
                                `
                                : ""
                        }
                    </div>

                    <h4>
                        ${escapeHtml(
                            exercise.question
                        )}
                    </h4>

                    ${control}

                    <div class="level-exercise-feedback"></div>

                    ${
                        completed
                            ? ""
                            : `
                                <button
                                    type="submit"
                                    class="btn btn-primary level-check-button">
                                    Verificar resposta
                                    <i class="bi bi-arrow-right"></i>
                                </button>
                            `
                    }
                </form>
            `;
        }

        async function handleExerciseSubmit(
            event
        ) {
            event.preventDefault();

            const form =
                event.currentTarget;

            const exerciseId =
                form.dataset.exercise;

            const lessonId =
                form.dataset.lesson;

            const lesson =
                levelData.lessons.find(
                    item =>
                        item.id ===
                        lessonId
                );

            const exercise =
                lesson?.exercises.find(
                    item =>
                        item.id ===
                        exerciseId
                );

            if (!exercise) {
                return;
            }

            const feedback =
                form.querySelector(
                    ".level-exercise-feedback"
                );

            const button =
                form.querySelector(
                    ".level-check-button"
                );

            let answer = "";

            if (
                exercise.type ===
                "choice"
            ) {
                const selected =
                    form.querySelector(
                        'input[type="radio"]:checked'
                    );

                if (!selected) {
                    feedback.textContent =
                        "Selecione uma alternativa.";

                    feedback.className =
                        "level-exercise-feedback error";

                    return;
                }

                answer =
                    selected.value;
            } else {
                const input =
                    form.querySelector(
                        'input[name="answer"]'
                    );

                answer =
                    input?.value
                        .trim() ||
                    "";

                if (!answer) {
                    feedback.textContent =
                        "Digite sua resposta.";

                    feedback.className =
                        "level-exercise-feedback error";

                    return;
                }
            }

            const acceptedAnswers =
                [
                    exercise.answer,
                    ...(exercise.alternatives ||
                        [])
                ]
                    .map(normalizeAnswer);

            const correct =
                acceptedAnswers.includes(
                    normalizeAnswer(
                        answer
                    )
                );

            const existing =
                progressMap.get(
                    exercise.id
                );

            button.disabled =
                true;

            button.textContent =
                "Salvando...";

            try {
                const row = {
                    student_id:
                        profile.id,
                    exercise_id:
                        exercise.id,
                    lesson_id:
                        lesson.id,
                    level:
                        profile.level,
                    correct:
                        correct ||
                        existing?.correct ===
                            true,
                    attempts:
                        Number(
                            existing?.attempts ||
                            0
                        ) + 1,
                    last_answer:
                        answer,
                    completed_at:
                        correct
                            ? new Date()
                                .toISOString()
                            : existing
                                ?.completed_at ||
                              null,
                    updated_at:
                        new Date()
                            .toISOString()
                };

                const {
                    error
                } = await client
                    .from(
                        "student_exercise_progress"
                    )
                    .upsert(
                        row,
                        {
                            onConflict:
                                "student_id,exercise_id"
                        }
                    );

                if (error) {
                    throw error;
                }

                progressMap.set(
                    exercise.id,
                    row
                );

                if (correct) {
                    feedback.innerHTML = `
                        <i class="bi bi-check-circle-fill"></i>
                        Resposta correta!
                    `;

                    feedback.className =
                        "level-exercise-feedback success";

                    setTimeout(
                        () => {
                            renderLessons();
                            updateStatistics();
                        },
                        650
                    );
                } else {
                    feedback.innerHTML = `
                        <i class="bi bi-x-circle-fill"></i>
                        Ainda não. Tente novamente.
                    `;

                    feedback.className =
                        "level-exercise-feedback error";

                    button.disabled =
                        false;

                    button.innerHTML =
                        'Tentar novamente <i class="bi bi-arrow-right"></i>';
                }
            } catch (error) {
                console.error(error);

                feedback.textContent =
                    "Não foi possível salvar sua resposta.";

                feedback.className =
                    "level-exercise-feedback error";

                button.disabled =
                    false;

                button.innerHTML =
                    'Verificar resposta <i class="bi bi-arrow-right"></i>';
            }
        }

        function updateStatistics() {
            const all =
                getAllExercises();

            const completed =
                getCompletedCount();

            const percent =
                all.length
                    ? Math.round(
                        completed /
                        all.length *
                        100
                    )
                    : 0;

            document.getElementById(
                "studentProgress"
            ).textContent =
                `${percent}%`;

            document.getElementById(
                "studentXp"
            ).textContent =
                completed * 10;

            const streak =
                document.getElementById(
                    "studentStreak"
                );

            if (streak) {
                streak.textContent =
                    completed;
            }
        }
    }
);

function normalizeAnswer(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/[.!?,;:]/g,"")
        .replace(/\s+/g," ");
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}

function escapeAttribute(value) {
    return escapeHtml(value);
}

function cssEscape(value) {
    if (
        window.CSS &&
        typeof window.CSS.escape ===
            "function"
    ) {
        return window.CSS.escape(
            value
        );
    }

    return String(value)
        .replace(
            /"/g,
            '\\"'
        );
}