document.addEventListener("DOMContentLoaded", () => {
    const usuario = EYTApp.requireUser();

    if (!usuario) {
        return;
    }

    renderReview();
});

function renderReview() {
    const container =
        document.getElementById("reviewContent");

    const progress =
        EYTStorage.getProgress();

    if (!progress.erros.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎉</div>

                <h2>Nada para revisar!</h2>

                <p>
                    Seus exercícios respondidos incorretamente aparecerão aqui.
                    Continue aprendendo.
                </p>

                <a href="curso.html" class="btn btn-primary">
                    CONTINUAR APRENDENDO →
                </a>
            </div>
        `;

        return;
    }

    container.innerHTML = `
        <div class="review-summary">
            <div>
                <span>EXERCÍCIOS PARA REVISAR</span>
                <strong>${progress.erros.length}</strong>
            </div>

            <p>
                Reveja as respostas e depois refaça a lição para remover os erros.
            </p>
        </div>

        <div class="review-list">
            ${progress.erros
            .map(renderMistake)
            .join("")}
        </div>
    `;
}

function renderMistake(mistake) {
    const lesson =
        EYTData.licoes[mistake.lessonId];

    if (!lesson) {
        return "";
    }

    return `
        <article class="review-card">
            <div class="review-card-icon">
                ${lesson.icone}
            </div>

            <div class="review-card-content">
                <span>
                    ${EYTApp.escapeHTML(lesson.titulo)}
                </span>

                <h3>
                    ${EYTApp.escapeHTML(mistake.pergunta)}
                </h3>

                <p>
                    Resposta correta:
                    <strong>
                        ${EYTApp.escapeHTML(mistake.resposta)}
                    </strong>
                </p>

                <small>
                    Errou ${mistake.quantidade}
                    ${mistake.quantidade === 1 ? "vez" : "vezes"}
                </small>
            </div>

            <a
                href="licao.html?id=${lesson.id}"
                class="review-button"
            >
                REVISAR →
            </a>
        </article>
    `;
}