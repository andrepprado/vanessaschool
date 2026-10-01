document.addEventListener(
    "DOMContentLoaded",
    async () => {
        const escapeHTML = value =>
            String(value ?? "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");

        const icon = name =>
            `<i class="bi ${name}" aria-hidden="true"></i>`;

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
                    `Nenhum conteúdo disponível para o nível ${level}.`
                );
            }

            const {
                data: progress,
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

            const completed =
                Array.isArray(
                    progress.completed_lessons
                )
                    ? progress.completed_lessons
                    : [];

            const lessonProgress =
                progress.lesson_progress &&
                typeof progress.lesson_progress ===
                    "object"
                    ? progress.lesson_progress
                    : {};

            const lessons =
                levelData.lessons.map(
                    (
                        lesson,
                        index
                    ) => ({
                        ...lesson,
                        number:
                            index + 1,
                        icon:
                            lesson.icon ||
                            "bi-book",
                        xp:
                            lesson.xp ||
                            40
                    })
                );

            function statusFor(index) {
                const lesson =
                    lessons[index];

                if (
                    completed.includes(
                        lesson.id
                    )
                ) {
                    return "completed";
                }

                if (index === 0) {
                    return "available";
                }

                if (
                    completed.includes(
                        lessons[
                            index - 1
                        ].id
                    )
                ) {
                    return "available";
                }

                return "locked";
            }

            function percentFor(
                lesson
            ) {
                if (
                    completed.includes(
                        lesson.id
                    )
                ) {
                    return 100;
                }

                return Number(
                    lessonProgress[
                        lesson.id
                    ]?.percent ||
                    0
                );
            }

            const nextLesson =
                lessons.find(
                    (
                        lesson,
                        index
                    ) =>
                        statusFor(
                            index
                        ) ===
                            "available" &&
                        !completed.includes(
                            lesson.id
                        )
                ) ||
                lessons[
                    lessons.length -
                    1
                ];

            const completedCount =
                lessons.filter(
                    lesson =>
                        completed.includes(
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

            /*
             * ORIGINAL HEADER
             */
            const firstName =
                String(
                    profile.name ||
                    "Aluno"
                )
                    .trim()
                    .split(/\s+/)[0];

            document.getElementById(
                "userName"
            ).textContent =
                firstName;

            document.getElementById(
                "streakTop"
            ).textContent =
                `${progress.streak || 0} ${
                    Number(
                        progress.streak ||
                        0
                    ) === 1
                        ? "dia"
                        : "dias"
                }`;

            document.getElementById(
                "xpTop"
            ).textContent =
                `${progress.xp || 0} XP`;

            document.getElementById(
                "totalXp"
            ).textContent =
                progress.xp ||
                0;

            document.getElementById(
                "streak"
            ).textContent =
                progress.streak ||
                0;

            document.getElementById(
                "completedLessons"
            ).textContent =
                completedCount;

            document.getElementById(
                "achievementCount"
            ).textContent =
                Math.min(
                    5,
                    Math.floor(
                        coursePercent /
                        20
                    )
                );

            const mobileStreak =
                document.getElementById(
                    "mobileStreak"
                );

            if (mobileStreak) {
                mobileStreak.innerHTML =
                    `${icon(
                        "bi-fire"
                    )} ${
                        progress.streak ||
                        0
                    }`;
            }

            const mobileXp =
                document.getElementById(
                    "mobileXp"
                );

            if (mobileXp) {
                mobileXp.innerHTML =
                    `${icon(
                        "bi-star-fill"
                    )} ${
                        progress.xp ||
                        0
                    }`;
            }

            /*
             * LEVEL BADGE
             */
            const welcome =
                document.querySelector(
                    ".dashboard-welcome"
                );

            if (
                welcome &&
                !welcome.querySelector(
                    ".student-level-dashboard-badge"
                )
            ) {
                const badge =
                    document.createElement(
                        "div"
                    );

                badge.className =
                    "student-level-dashboard-badge";

                badge.innerHTML = `
                    ${icon(
                        "bi-mortarboard-fill"
                    )}
                    Nível ${escapeHTML(
                        level
                    )}
                `;

                welcome.appendChild(
                    badge
                );
            }

            /*
             * CONTINUE CARD - ORIGINAL
             */
            if (nextLesson) {
                const nextPercent =
                    percentFor(
                        nextLesson
                    );

                document.getElementById(
                    "continueTitle"
                ).textContent =
                    nextLesson.title;

                document.getElementById(
                    "continueDescription"
                ).textContent =
                    nextLesson.description;

                document.getElementById(
                    "continuePercent"
                ).textContent =
                    `${nextPercent}%`;

                document.getElementById(
                    "continueProgressBar"
                ).style.width =
                    `${nextPercent}%`;

                document.getElementById(
                    "continueButton"
                ).href =
                    `student-lesson.html?id=${encodeURIComponent(
                        nextLesson.id
                    )}`;
            }

            /*
             * DAILY GOAL - ORIGINAL
             */
            const today =
                new Date()
                    .toISOString()
                    .slice(
                        0,
                        10
                    );

            const todayXp =
                progress.last_study_date ===
                today
                    ? Number(
                        progress.xp_today ||
                        0
                    )
                    : 0;

            const dailyPercent =
                Math.min(
                    100,
                    Math.round(
                        todayXp /
                        50 *
                        100
                    )
                );

            document.getElementById(
                "dailyGoalValue"
            ).textContent =
                `${todayXp} / 50 XP`;

            document.getElementById(
                "dailyGoalPercent"
            ).textContent =
                `${dailyPercent}%`;

            document.getElementById(
                "dailyGoalBar"
            ).style.width =
                `${dailyPercent}%`;

            /*
             * ORIGINAL LEARNING PATH
             */
            const root =
                document.getElementById(
                    "dashboardPath"
                );

            root.innerHTML = `
                <article class="path-unit">

                    <header class="path-unit-header">

                        <div class="path-unit-number">
                            ${escapeHTML(
                                level
                            )}
                        </div>

                        <div>

                            <h3>
                                ${escapeHTML(
                                    levelData.title
                                )}
                            </h3>

                            <p>
                                ${escapeHTML(
                                    levelData.description
                                )}
                            </p>

                        </div>

                    </header>

                    <div class="path-lessons">

                        ${lessons.map(
                            (
                                lesson,
                                index
                            ) => {
                                const status =
                                    statusFor(
                                        index
                                    );

                                const percent =
                                    percentFor(
                                        lesson
                                    );

                                const statusText =
                                    status ===
                                    "completed"
                                        ? "Concluída"
                                        : status ===
                                          "locked"
                                            ? "Bloqueada"
                                            : percent > 0
                                                ? `${percent}%`
                                                : "Disponível";

                                const lessonIcon =
                                    status ===
                                    "completed"
                                        ? icon(
                                            "bi-check-lg"
                                        )
                                        : status ===
                                          "locked"
                                            ? icon(
                                                "bi-lock-fill"
                                            )
                                            : icon(
                                                lesson.icon
                                            );

                                const content = `
                                    <div class="path-lesson-icon">
                                        ${lessonIcon}
                                    </div>

                                    <div class="path-lesson-info">

                                        <h4>
                                            ${escapeHTML(
                                                lesson.title
                                            )}
                                        </h4>

                                        <p>
                                            ${escapeHTML(
                                                lesson.description
                                            )}
                                        </p>

                                    </div>

                                    <div class="path-lesson-status">
                                        ${escapeHTML(
                                            statusText
                                        )}
                                    </div>
                                `;

                                if (
                                    status ===
                                    "locked"
                                ) {
                                    return `
                                        <div class="path-lesson locked">
                                            ${content}
                                        </div>
                                    `;
                                }

                                return `
                                    <a
                                        href="student-lesson.html?id=${encodeURIComponent(
                                            lesson.id
                                        )}"
                                        class="path-lesson ${status}">
                                        ${content}
                                    </a>
                                `;
                            }
                        ).join("")}

                    </div>

                </article>
            `;

            /*
             * Links that previously went to localStorage-only pages
             * now take the authenticated student to the learning path.
             */
            document
                .querySelectorAll(
                    'a[href="#dashboardPath"]'
                )
                .forEach(
                    link => {
                        link.addEventListener(
                            "click",
                            event => {
                                event.preventDefault();

                                document.getElementById(
                                    "dashboardPath"
                                )?.scrollIntoView({
                                    behavior:
                                        "smooth",
                                    block:
                                        "start"
                                });
                            }
                        );
                    }
                );
        }
        catch (error) {
            console.error(error);

            document.body.innerHTML = `
                <main
                    style="
                        min-height:100vh;
                        display:grid;
                        place-items:center;
                        padding:30px;
                        background:#F7F3EA;
                    ">

                    <section
                        style="
                            max-width:600px;
                            text-align:center;
                        ">

                        <h1
                            style="
                                color:#0B1F3F;
                                margin-bottom:15px;
                            ">
                            Não foi possível carregar seu ambiente
                        </h1>

                        <p
                            style="
                                color:#4A4F5E;
                                margin-bottom:25px;
                            ">
                            ${escapeHTML(
                                error.message
                            )}
                        </p>

                        <a
                            href="/acesso"
                            class="btn btn-primary">
                            Voltar ao acesso
                        </a>

                    </section>

                </main>
            `;
        }
    }
);
