let students = [];

document.addEventListener(
    "DOMContentLoaded",
    async () => {
        try {
            await requireAdmin();
            bindEvents();
            await loadStudents();
        } catch (error) {
            console.error(error);
            location.href =
                "/admin-login";
        }
    }
);

async function requireAdmin() {
    const session =
        await EYTSupabase
            .getSession();

    if (!session) {
        throw new Error(
            "Authentication required."
        );
    }

    const profile =
        await EYTSupabase
            .getProfile();

    if (
        !profile ||
        profile.role !== "admin" ||
        !profile.active
    ) {
        throw new Error(
            "Administrator required."
        );
    }

    const name =
        document.getElementById(
            "adminName"
        );

    if (name) {
        name.textContent =
            profile.name;
    }

    return profile;
}

async function token() {
    const session =
        await EYTSupabase
            .getSession();

    if (!session) {
        throw new Error(
            "Session expired."
        );
    }

    return session.access_token;
}

async function api(
    url,
    options = {}
) {
    const accessToken =
        await token();

    const response =
        await fetch(
            url,
            {
                ...options,
                headers: {
                    "Content-Type":
                        "application/json",
                    Authorization:
                        `Bearer ${accessToken}`,
                    ...(options.headers || {})
                }
            }
        );

    const data =
        await response
            .json()
            .catch(
                () => ({})
            );

    if (!response.ok) {
        throw new Error(
            data.error ||
            "Request failed."
        );
    }

    return data;
}

function bindEvents() {
    document.getElementById(
        "adminLogout"
    ).addEventListener(
        "click",
        async () => {
            await EYTSupabase
                .logout();

            location.href =
                "/admin-login";
        }
    );

    document.getElementById(
        "createStudentForm"
    ).addEventListener(
        "submit",
        createStudent
    );

    document.getElementById(
        "editStudentForm"
    ).addEventListener(
        "submit",
        saveStudent
    );

    document.getElementById(
        "editCancel"
    ).addEventListener(
        "click",
        closeEdit
    );
}

async function loadStudents() {
    setMessage(
        "Carregando alunos...",
        ""
    );

    try {
        const data =
            await api(
                "/api/admin-students"
            );

        students =
            data.students || [];

        renderStudents();

        setMessage("","");
    } catch (error) {
        setMessage(
            error.message,
            "error"
        );

        throw error;
    }
}

window.loadStudents =
    loadStudents;

function renderStudents() {
    const root =
        document.getElementById(
            "studentsTableBody"
        );

    document.getElementById(
        "studentsCount"
    ).textContent =
        students.length;

    if (!students.length) {
        root.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="admin-empty">
                        Nenhum aluno cadastrado ainda.
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    root.innerHTML =
        students.map(
            student => {
                const progress =
                    student.progress || {};

                return `
                    <tr>
                        <td>
                            <strong>
                                ${escapeHtml(
                                    student.name
                                )}
                            </strong>
                            <small>
                                ${escapeHtml(
                                    student.email
                                )}
                            </small>
                        </td>

                        <td>
                            <span class="level-badge">
                                ${escapeHtml(
                                    student.level
                                )}
                            </span>
                        </td>

                        <td>
                            ${Number(
                                progress.progress_percent ||
                                0
                            )}%
                        </td>

                        <td>
                            ${Number(
                                progress.xp ||
                                0
                            )}
                        </td>

                        <td>
                            ${Number(
                                progress.streak ||
                                0
                            )}
                        </td>

                        <td>
                            <span class="status-badge ${
                                student.active
                                    ? "active"
                                    : "inactive"
                            }">
                                ${
                                    student.active
                                        ? "Ativo"
                                        : "Inativo"
                                }
                            </span>
                        </td>

                        <td class="admin-notes-cell">
                            ${escapeHtml(
                                progress.teacher_notes ||
                                ""
                            )}
                        </td>

                        <td>
                            <div class="admin-row-actions">
                                <button
                                    type="button"
                                    class="btn btn-secondary btn-small"
                                    onclick="openEditStudent('${student.id}')">
                                    Editar
                                </button>

                                <button
                                    type="button"
                                    class="btn btn-secondary btn-small"
                                    onclick="toggleStudent('${student.id}')">
                                    ${
                                        student.active
                                            ? "Desativar"
                                            : "Ativar"
                                    }
                                </button>

                                <button
                                    type="button"
                                    class="btn btn-danger btn-small"
                                    onclick="deleteStudent('${student.id}')">
                                    Excluir
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }
        ).join("");
}

async function createStudent(event) {
    event.preventDefault();

    const button =
        document.getElementById(
            "createStudentButton"
        );

    button.disabled = true;

    try {
        await api(
            "/api/admin-students",
            {
                method: "POST",
                body: JSON.stringify({
                    name:
                        document
                            .getElementById(
                                "newStudentName"
                            )
                            .value
                            .trim(),
                    email:
                        document
                            .getElementById(
                                "newStudentEmail"
                            )
                            .value
                            .trim(),
                    password:
                        document
                            .getElementById(
                                "newStudentPassword"
                            )
                            .value,
                    level:
                        document
                            .getElementById(
                                "newStudentLevel"
                            )
                            .value
                })
            }
        );

        document.getElementById(
            "createStudentForm"
        ).reset();

        setMessage(
            "Aluno cadastrado com sucesso.",
            "success"
        );

        await loadStudents();
    } catch (error) {
        setMessage(
            error.message,
            "error"
        );
    } finally {
        button.disabled =
            false;
    }
}

window.openEditStudent =
    function(id) {
        const student =
            students.find(
                item =>
                    item.id === id
            );

        if (!student) {
            return;
        }

        const progress =
            student.progress || {};

        document.getElementById(
            "editStudentId"
        ).value =
            student.id;

        document.getElementById(
            "editStudentName"
        ).value =
            student.name;

        document.getElementById(
            "editStudentEmail"
        ).value =
            student.email;

        document.getElementById(
            "editStudentLevel"
        ).value =
            student.level;

        document.getElementById(
            "editStudentActive"
        ).checked =
            student.active;

        document.getElementById(
            "editStudentProgress"
        ).value =
            progress.progress_percent ||
            0;

        document.getElementById(
            "editStudentXp"
        ).value =
            progress.xp || 0;

        document.getElementById(
            "editStudentStreak"
        ).value =
            progress.streak || 0;

        document.getElementById(
            "editStudentNotes"
        ).value =
            progress.teacher_notes ||
            "";

        document.getElementById(
            "editStudentPassword"
        ).value = "";

        document.getElementById(
            "editStudentDialog"
        ).showModal();
    };

function closeEdit() {
    document.getElementById(
        "editStudentDialog"
    ).close();
}

async function saveStudent(event) {
    event.preventDefault();

    try {
        await api(
            "/api/admin-students",
            {
                method: "PATCH",
                body: JSON.stringify({
                    id:
                        document
                            .getElementById(
                                "editStudentId"
                            )
                            .value,
                    name:
                        document
                            .getElementById(
                                "editStudentName"
                            )
                            .value
                            .trim(),
                    email:
                        document
                            .getElementById(
                                "editStudentEmail"
                            )
                            .value
                            .trim(),
                    password:
                        document
                            .getElementById(
                                "editStudentPassword"
                            )
                            .value ||
                        undefined,
                    level:
                        document
                            .getElementById(
                                "editStudentLevel"
                            )
                            .value,
                    active:
                        document
                            .getElementById(
                                "editStudentActive"
                            )
                            .checked,
                    progress_percent:
                        Number(
                            document
                                .getElementById(
                                    "editStudentProgress"
                                )
                                .value
                        ),
                    xp:
                        Number(
                            document
                                .getElementById(
                                    "editStudentXp"
                                )
                                .value
                        ),
                    streak:
                        Number(
                            document
                                .getElementById(
                                    "editStudentStreak"
                                )
                                .value
                        ),
                    teacher_notes:
                        document
                            .getElementById(
                                "editStudentNotes"
                            )
                            .value
                })
            }
        );

        closeEdit();

        setMessage(
            "Aluno atualizado com sucesso.",
            "success"
        );

        await loadStudents();
    } catch (error) {
        setMessage(
            error.message,
            "error"
        );
    }
}

window.toggleStudent =
    async function(id) {
        const student =
            students.find(
                item =>
                    item.id === id
            );

        if (!student) {
            return;
        }

        try {
            await api(
                "/api/admin-students",
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        id,
                        active:
                            !student.active
                    })
                }
            );

            await loadStudents();
        } catch (error) {
            setMessage(
                error.message,
                "error"
            );
        }
    };

window.deleteStudent =
    async function(id) {
        const student =
            students.find(
                item =>
                    item.id === id
            );

        if (!student) {
            return;
        }

        const confirmed =
            confirm(
                `Excluir definitivamente o aluno "${student.name}"?`
            );

        if (!confirmed) {
            return;
        }

        try {
            await api(
                `/api/admin-students?id=${encodeURIComponent(id)}`,
                {
                    method:
                        "DELETE"
                }
            );

            setMessage(
                "Aluno excluído.",
                "success"
            );

            await loadStudents();
        } catch (error) {
            setMessage(
                error.message,
                "error"
            );
        }
    };

function setMessage(
    text,
    type
) {
    const root =
        document.getElementById(
            "adminMessage"
        );

    root.textContent =
        text || "";

    root.className =
        `auth-message ${type || ""}`;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}