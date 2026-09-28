document.addEventListener("DOMContentLoaded", () => {
    const usuario = EYTApp.requireUser();

    if (!usuario) {
        return;
    }

    EYTApp.evaluateAchievements();
    renderAchievements();
});

function renderAchievements() {
    const progress =
        EYTStorage.getProgress();

    const unlocked =
        progress.conquistas.length;

    const total =
        EYTData.conquistas.length;

    document.getElementById(
        "achievementSummary"
    ).innerHTML = `
        <div class="achievement-summary-icon">
            🏆
        </div>

        <div>
            <span>CONQUISTAS DESBLOQUEADAS</span>
            <strong>${unlocked} / ${total}</strong>
            <p>
                Continue aprendendo para completar sua coleção.
            </p>
        </div>
    `;

    document.getElementById(
        "achievementGrid"
    ).innerHTML =
        EYTData.conquistas
            .map(conquista => {
                const isUnlocked =
                    progress.conquistas.includes(
                        conquista.id
                    );

                return `
                    <article
                        class="achievement-card
                        ${isUnlocked ? "unlocked" : "locked"}"
                    >
                        <div class="achievement-icon">
                            ${isUnlocked ? conquista.icone : "🔒"}
                        </div>

                        <div>
                            <span>
                                ${isUnlocked ? "DESBLOQUEADA" : "BLOQUEADA"}
                            </span>

                            <h3>
                                ${EYTApp.escapeHTML(conquista.titulo)}
                            </h3>

                            <p>
                                ${EYTApp.escapeHTML(conquista.descricao)}
                            </p>
                        </div>
                    </article>
                `;
            })
            .join("");
}