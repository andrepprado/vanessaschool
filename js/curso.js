document.addEventListener("DOMContentLoaded", () => {
    const usuario = EYTApp.requireUser();

    if (!usuario) {
        return;
    }

    EYTApp.evaluateAchievements();

    const courseProgress =
        EYTApp.getCourseProgress();

    document.getElementById(
        "courseProgressText"
    ).textContent =
        `${courseProgress.percentual}%`;

    document.getElementById(
        "courseProgressBar"
    ).style.width =
        `${courseProgress.percentual}%`;

    renderCourse();
});

function renderCourse() {
    const container =
        document.getElementById("courseUnits");

    container.innerHTML = "";

    EYTData.unidades.forEach(unidade => {
        const article =
            document.createElement("section");

        article.className = "course-unit";

        const completedCount =
            unidade.licoes.filter(id =>
                EYTStorage
                    .getProgress()
                    .licoesConcluidas
                    .includes(id)
            ).length;

        const lessons = unidade.licoes
            .map((id, index) => {
                const lesson = EYTData.licoes[id];

                if (!lesson) {
                    return "";
                }

                const status =
                    EYTApp.getLessonStatus(id);

                let statusText = "Bloqueada";
                let buttonText = "🔒";
                let href = "#";

                if (status === "completed") {
                    statusText = "Concluída";
                    buttonText = "✓";
                    href = `licao.html?id=${id}`;
                }

                if (status === "available") {
                    statusText = "Disponível";
                    buttonText = "→";
                    href = `licao.html?id=${id}`;
                }

                return `
                    <div class="course-lesson ${status}">
                        <div class="course-lesson-number">
                            ${status === "completed" ? "✓" : index + 1}
                        </div>

                        <div class="course-lesson-icon">
                            ${status === "locked" ? "🔒" : lesson.icone}
                        </div>

                        <div class="course-lesson-info">
                            <span>${lesson.subtitulo}</span>
                            <h3>${lesson.titulo}</h3>
                            <p>${lesson.descricao}</p>

                            <div class="lesson-meta">
                                <span>
                                    ${lesson.exercicios.length} exercícios
                                </span>

                                <span>
                                    ⭐ ${lesson.xp} XP
                                </span>

                                <span class="${status}">
                                    ${statusText}
                                </span>
                            </div>
                        </div>

                        <a
                            class="course-lesson-button"
                            href="${href}"
                            ${status === "locked" ? 'onclick="return false;"' : ""}
                        >
                            ${buttonText}
                        </a>
                    </div>
                `;
            })
            .join("");

        article.innerHTML = `
            <header class="course-unit-header">
                <div class="unit-number">
                    ${unidade.numero}
                </div>

                <div>
                    <span>UNIT ${unidade.numero}</span>
                    <h2>${unidade.titulo}</h2>
                    <p>${unidade.descricao}</p>
                </div>

                <div class="unit-counter">
                    ${completedCount}/${unidade.licoes.length}
                </div>
            </header>

            <div class="course-lessons">
                ${lessons}
            </div>
        `;

        container.appendChild(article);
    });
}