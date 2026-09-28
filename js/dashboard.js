document.addEventListener("DOMContentLoaded", () => {
    const usuario = EYTApp.requireUser();

    if (!usuario) {
        return;
    }

    EYTApp.evaluateAchievements();

    const progress = EYTStorage.getProgress();
    const courseProgress = EYTApp.getCourseProgress();
    const nextLesson = EYTApp.getNextLesson();

    document.getElementById("nomeUsuario").textContent =
        usuario.nome.split(" ")[0];

    document.getElementById("xpHeader").textContent =
        progress.xp;

    document.getElementById("streakHeader").textContent =
        progress.streak;

    document.getElementById("mobileXp").textContent =
        progress.xp;

    document.getElementById("mobileStreak").textContent =
        progress.streak;

    document.getElementById("totalXp").textContent =
        progress.xp;

    document.getElementById("streakValue").textContent =
        progress.streak;

    document.getElementById("completedLessons").textContent =
        courseProgress.concluidas;

    document.getElementById("achievementCount").textContent =
        progress.conquistas.length;

    const dailyTarget = 50;
    const dailyPercent = Math.min(
        100,
        Math.round((progress.xpHoje / dailyTarget) * 100)
    );

    document.getElementById("dailyXpText").textContent =
        `${progress.xpHoje} / ${dailyTarget} XP`;

    document.getElementById("dailyPercentage").textContent =
        `${dailyPercent}%`;

    document.getElementById("dailyProgressBar").style.width =
        `${dailyPercent}%`;

    if (nextLesson) {
        const lessonProgress =
            progress.progressoLicoes[nextLesson.id];

        const percentual =
            lessonProgress?.percentual || 0;

        document.getElementById("continueTitle").textContent =
            nextLesson.titulo;

        document.getElementById(
            "continueDescription"
        ).textContent =
            nextLesson.descricao;

        document.getElementById(
            "continueProgressText"
        ).textContent =
            `${percentual}%`;

        document.getElementById(
            "continueProgressBar"
        ).style.width =
            `${percentual}%`;

        document.getElementById("continueButton").href =
            `licao.html?id=${nextLesson.id}`;
    }

    renderPath();
});

function renderPath() {
    const container =
        document.getElementById("dashboardPath");

    container.innerHTML = "";

    EYTData.unidades.forEach(unidade => {
        const section = document.createElement("article");
        section.className = "dashboard-unit";

        const lessonsHTML = unidade.licoes
            .map(id => {
                const lesson = EYTData.licoes[id];

                if (!lesson) {
                    return "";
                }

                const status =
                    EYTApp.getLessonStatus(id);

                let icon = lesson.icone;
                let action = "";

                if (status === "completed") {
                    icon = "✓";
                    action = "Concluída";
                } else if (status === "available") {
                    action = "Começar";
                } else {
                    icon = "🔒";
                    action = "Bloqueada";
                }

                const href =
                    status === "locked"
                        ? "#"
                        : `licao.html?id=${id}`;

                return `
                    <a
                        class="path-lesson ${status}"
                        href="${href}"
                        ${status === "locked" ? 'onclick="return false;"' : ""}
                    >
                        <div class="path-node">
                            ${icon}
                        </div>

                        <div class="path-info">
                            <span>${lesson.subtitulo}</span>
                            <strong>${lesson.titulo}</strong>
                            <small>${lesson.descricao}</small>
                        </div>

                        <div class="path-action">
                            ${action}
                        </div>
                    </a>
                `;
            })
            .join("");

        section.innerHTML = `
            <header class="unit-header">
                <div class="unit-number">
                    ${unidade.numero}
                </div>

                <div>
                    <span>UNIT ${unidade.numero}</span>
                    <h3>${unidade.titulo}</h3>
                    <p>${unidade.descricao}</p>
                </div>
            </header>

            <div class="unit-lessons">
                ${lessonsHTML}
            </div>
        `;

        container.appendChild(section);
    });
}