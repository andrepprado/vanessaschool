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

        logout?.addEventListener(
            "click",
            async () => {
                await EYTSupabase.logout();
                location.href = "/acesso";
            }
        );

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
                profile.role === "admin"
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

            const {
                data: progress,
                error: progressError
            } = await client
                .from(
                    "student_progress"
                )
                .select(
                    "progress_percent,xp,streak,teacher_notes"
                )
                .eq(
                    "student_id",
                    profile.id
                )
                .single();

            if (progressError) {
                throw progressError;
            }

            const {
                data: assignments,
                error: assignmentError
            } = await client
                .from(
                    "student_assignments"
                )
                .select(
                    "id,title,description,assignment_type,level,content_url,status,sort_order"
                )
                .eq(
                    "student_id",
                    profile.id
                )
                .in(
                    "status",
                    [
                        "active",
                        "completed"
                    ]
                )
                .order(
                    "sort_order",
                    {
                        ascending: true
                    }
                );

            if (assignmentError) {
                throw assignmentError;
            }

            document.getElementById(
                "studentName"
            ).textContent =
                profile.name;

            document.getElementById(
                "studentLevel"
            ).textContent =
                profile.level;

            document.getElementById(
                "studentProgress"
            ).textContent =
                `${
                    progress?.progress_percent ||
                    0
                }%`;

            document.getElementById(
                "studentXp"
            ).textContent =
                progress?.xp || 0;

            document.getElementById(
                "studentStreak"
            ).textContent =
                progress?.streak || 0;

            const root =
                document.getElementById(
                    "studentActivities"
                );

            if (
                !assignments ||
                !assignments.length
            ) {
                root.innerHTML = `
                    <div class="student-empty-state">
                        <div class="student-empty-icon">
                            <i class="bi bi-journal-check"></i>
                        </div>

                        <span class="eyebrow">
                            SUA TRILHA
                        </span>

                        <h2>
                            Nenhuma atividade liberada no momento
                        </h2>

                        <p>
                            Seus materiais, exercícios e atividades aparecerão
                            aqui conforme seu nível e a programação definida
                            pela Teacher Vanessa.
                        </p>

                        <div class="student-empty-level">
                            Seu nível atual:
                            <strong>
                                ${escapeHtml(profile.level)}
                            </strong>
                        </div>
                    </div>
                `;
            } else {
                root.innerHTML =
                    assignments
                        .map(
                            item => `
                                <article class="student-assignment-card">
                                    <div class="student-assignment-type">
                                        ${typeLabel(
                                            item.assignment_type
                                        )}
                                    </div>

                                    <h3>
                                        ${escapeHtml(
                                            item.title
                                        )}
                                    </h3>

                                    <p>
                                        ${escapeHtml(
                                            item.description
                                        )}
                                    </p>

                                    <div class="student-assignment-footer">
                                        <span>
                                            Nível
                                            ${escapeHtml(
                                                item.level
                                            )}
                                        </span>

                                        ${
                                            item.content_url
                                                ? `
                                                    <a
                                                        href="${escapeAttribute(
                                                            item.content_url
                                                        )}"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        class="btn btn-primary">
                                                        Abrir
                                                        <i class="bi bi-arrow-up-right"></i>
                                                    </a>
                                                `
                                                : ""
                                        }
                                    </div>
                                </article>
                            `
                        )
                        .join("");
            }

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
    }
);

function typeLabel(type) {
    const labels = {
        material: "MATERIAL",
        activity: "ATIVIDADE",
        exercise: "EXERCÍCIO"
    };

    return labels[type] ||
        "ATIVIDADE";
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