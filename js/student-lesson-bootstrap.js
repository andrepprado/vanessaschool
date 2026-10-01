(async () => {
    "use strict";

    const normalizeText = value =>
        String(value ?? "")
            .trim()
            .toLowerCase()
            .replace(/[.!?,;:]/g, "")
            .replace(/\s+/g, " ");

    const escapeHTML = value =>
        String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    try {
        const client =
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

        const profile =
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
            await EYTSupabase
                .logout();

            location.href =
                "/acesso";

            return;
        }

        const level =
            String(
                profile.level ||
                "A1"
            ).toUpperCase();

        const levelData =
            window.EYTLevelContent[
                level
            ];

        if (!levelData) {
            throw new Error(
                `Conteúdo não configurado para ${level}.`
            );
        }

        /*
         * Convert our level exercises to the data structure
         * expected by the ORIGINAL lesson engine.
         */
        const lessons =
            levelData.lessons.map(
                (
                    lesson,
                    index
                ) => ({
                    ...lesson,

                    number:
                        index + 1,

                    xp:
                        lesson.xp ||
                        40,

                    icon:
                        lesson.icon ||
                        "bi-book",

                    unit: {
                        number:
                            level,
                        title:
                            levelData.title
                    },

                    exercises:
                        lesson.exercises.map(
                            (
                                exercise,
                                exerciseIndex
                            ) => ({
                                ...exercise,

                                id:
                                    exercise.id ||
                                    `${lesson.id}-${exerciseIndex + 1}`,

                                type:
                                    exercise.type ===
                                    "choice"
                                        ? "multiple"
                                        : exercise.type
                            })
                        )
                })
            );

        const {
            data: db,
            error
        } = await client
            .from(
                "student_progress"
            )
            .select(
                "progress_percent,xp,streak,completed_lessons,lesson_progress,correct_answers,total_answers,last_study_date,xp_today"
            )
            .eq(
                "student_id",
                profile.id
            )
            .single();

        if (error) {
            throw error;
        }

        const progress = {
            xp:
                Number(
                    db.xp ||
                    0
                ),

            xpHoje:
                Number(
                    db.xp_today ||
                    0
                ),

            dataXpHoje:
                db.last_study_date ||
                "",

            streak:
                Number(
                    db.streak ||
                    0
                ),

            ultimoEstudo:
                db.last_study_date ||
                "",

            licoesConcluidas:
                Array.isArray(
                    db.completed_lessons
                )
                    ? [
                        ...db.completed_lessons
                    ]
                    : [],

            progressoLicoes:
                db.lesson_progress &&
                typeof db.lesson_progress ===
                    "object"
                    ? {
                        ...db.lesson_progress
                    }
                    : {},

            erros: [],

            conquistas: [],

            respostasCorretas:
                Number(
                    db.correct_answers ||
                    0
                ),

            respostasTotais:
                Number(
                    db.total_answers ||
                    0
                )
        };

        function dateKey() {
            return new Date()
                .toISOString()
                .slice(
                    0,
                    10
                );
        }

        function registerStudyDay() {
            const today =
                dateKey();

            if (
                progress.ultimoEstudo !==
                today
            ) {
                if (
                    !progress.ultimoEstudo
                ) {
                    progress.streak =
                        1;
                }
                else {
                    const oldDate =
                        new Date(
                            `${progress.ultimoEstudo}T12:00:00`
                        );

                    const newDate =
                        new Date(
                            `${today}T12:00:00`
                        );

                    const diff =
                        Math.round(
                            (
                                newDate -
                                oldDate
                            ) /
                            86400000
                        );

                    progress.streak =
                        diff === 1
                            ? progress.streak +
                              1
                            : 1;
                }

                progress.ultimoEstudo =
                    today;
            }

            if (
                progress.dataXpHoje !==
                today
            ) {
                progress.dataXpHoje =
                    today;

                progress.xpHoje =
                    0;
            }
        }

        async function persist() {
            const completedCount =
                lessons.filter(
                    lesson =>
                        progress
                            .licoesConcluidas
                            .includes(
                                lesson.id
                            )
                ).length;

            const coursePercent =
                lessons.length
                    ? Math.round(
                        completedCount /
                        lessons.length *
                        100
                    )
                    : 0;

            const payload = {
                progress_percent:
                    coursePercent,

                xp:
                    progress.xp,

                streak:
                    progress.streak,

                completed_lessons:
                    progress
                        .licoesConcluidas,

                lesson_progress:
                    progress
                        .progressoLicoes,

                correct_answers:
                    progress
                        .respostasCorretas,

                total_answers:
                    progress
                        .respostasTotais,

                last_study_date:
                    progress
                        .ultimoEstudo ||
                    null,

                xp_today:
                    progress
                        .dataXpHoje ===
                    dateKey()
                        ? progress.xpHoje
                        : 0
            };

            const {
                error
            } = await client
                .from(
                    "student_progress"
                )
                .update(
                    payload
                )
                .eq(
                    "student_id",
                    profile.id
                );

            if (error) {
                console.error(
                    "[StudentProgress]",
                    error
                );
            }
        }

        /*
         * Adapter expected by original licao.js
         */
        window.EYTApp = {
            requireUser() {
                return {
                    nome:
                        profile.name,
                    nivel:
                        level
                };
            },

            getAllLessons() {
                return lessons;
            },

            isLessonUnlocked(
                lessonId
            ) {
                const index =
                    lessons.findIndex(
                        lesson =>
                            lesson.id ===
                            lessonId
                    );

                if (index <= 0) {
                    return true;
                }

                return progress
                    .licoesConcluidas
                    .includes(
                        lessons[
                            index - 1
                        ].id
                    );
            },

            normalizeText,

            escapeHTML,

            icon(
                name,
                extraClass = ""
            ) {
                return `
                    <i
                        class="bi ${name}${
                            extraClass
                                ? ` ${extraClass}`
                                : ""
                        }"
                        aria-hidden="true">
                    </i>
                `;
            },

            evaluateAchievements() {
                return [];
            }
        };

        window.EYTStorage = {
            getProgress() {
                return progress;
            },

            registerAnswer(
                correct
            ) {
                registerStudyDay();

                progress
                    .respostasTotais++;

                if (correct) {
                    progress
                        .respostasCorretas++;
                }

                void persist();

                return progress;
            },

            saveLessonProgress(
                lessonId,
                index,
                total
            ) {
                registerStudyDay();

                progress
                    .progressoLicoes[
                        lessonId
                    ] = {
                        index,
                        total,
                        percent:
                            total
                                ? Math.min(
                                    100,
                                    Math.round(
                                        index /
                                        total *
                                        100
                                    )
                                )
                                : 0
                    };

                void persist();

                return progress;
            },

            completeLesson(
                lessonId
            ) {
                registerStudyDay();

                if (
                    !progress
                        .licoesConcluidas
                        .includes(
                            lessonId
                        )
                ) {
                    progress
                        .licoesConcluidas
                        .push(
                            lessonId
                        );
                }

                const lesson =
                    lessons.find(
                        item =>
                            item.id ===
                            lessonId
                    );

                const total =
                    lesson
                        ?.exercises
                        ?.length ||
                    1;

                progress
                    .progressoLicoes[
                        lessonId
                    ] = {
                        index:
                            total,
                        total:
                            total,
                        percent:
                            100
                    };

                void persist();

                return progress;
            },

            addXP(
                amount
            ) {
                registerStudyDay();

                const value =
                    Number(
                        amount
                    ) ||
                    0;

                progress.xp +=
                    value;

                progress.xpHoje +=
                    value;

                void persist();

                return progress;
            },

            addMistake() {
                return progress;
            },

            removeMistake() {
                return progress;
            },

            unlockAchievement() {
                return progress;
            }
        };

        /*
         * Everything is ready.
         * Start the original lesson engine now.
         */
        if (
            typeof window
                .EYTStudentLessonMain !==
            "function"
        ) {
            throw new Error(
                "Original lesson engine was not loaded."
            );
        }

        window
            .EYTStudentLessonMain();
    }
    catch (error) {
        console.error(error);

        const root =
            document.getElementById(
                "lessonContent"
            );

        if (root) {
            root.innerHTML = `
                <section class="lesson-intro">

                    <span class="eyebrow">
                        ERRO
                    </span>

                    <h1>
                        Não foi possível carregar esta lição
                    </h1>

                    <p>
                        ${escapeHTML(
                            error.message
                        )}
                    </p>

                    <a
                        href="/dashboard"
                        class="btn btn-primary">
                        Voltar ao dashboard
                    </a>

                </section>
            `;
        }
    }
})();
