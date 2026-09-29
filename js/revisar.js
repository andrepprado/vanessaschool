document.addEventListener("DOMContentLoaded", () => {
    if (!EYTApp.requireUser()) return;
    const p = EYTStorage.getProgress(), root = document.getElementById("reviewList");
    document.getElementById("reviewSummaryText").textContent = p.erros.length ? `Você tem ${p.erros.length} ${p.erros.length === 1 ? "ponto" : "pontos"} para revisar.` : "Você está em dia. Novos pontos de revisão aparecerão aqui quando necessário.";
    if (!p.erros.length) {
        root.innerHTML = `<div class="empty-state"><div class="empty-state-icon">✓</div><h2>Tudo revisado!</h2><p>Você não possui exercícios pendentes de revisão. Continue avançando nas suas lições.</p><a href="curso.html" class="btn btn-primary" style="margin-top:18px">Continuar aprendendo →</a></div>`;
        return;
    }
    root.innerHTML = p.erros.map(error => {
        const lesson = EYTApp.getAllLessons().find(l => l.id === error.lessonId);
        return `<article class="review-card"><div class="review-card-icon">↻</div><div><h3>${EYTApp.escapeHTML(error.question)}</h3><p>${lesson ? EYTApp.escapeHTML(lesson.title) : "Revisão"} • Resposta: ${EYTApp.escapeHTML(error.answer)}</p></div><a class="btn btn-secondary btn-small" href="licao.html?id=${encodeURIComponent(error.lessonId)}">Revisar</a></article>`;
    }).join("");
});