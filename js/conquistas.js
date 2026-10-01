document.addEventListener("DOMContentLoaded", () => {
    if (!EYTApp.requireUser()) return;
    EYTApp.evaluateAchievements();
    const p = EYTStorage.getProgress(), items = EYTData.achievements;
    document.getElementById("achievementSummaryValue").textContent = `${p.conquistas.length} / ${items.length}`;
    document.getElementById("achievementsGrid").innerHTML = items.map(item => {
        const unlocked = p.conquistas.includes(item.id);
        return `<article class="achievement-card ${unlocked ? "unlocked" : "locked"}"><div class="achievement-icon">${unlocked ? EYTApp.icon(item.icon) : EYTApp.icon("bi-lock-fill")}</div><h3>${EYTApp.escapeHTML(item.title)}</h3><p>${EYTApp.escapeHTML(item.description)}</p><span class="badge ${unlocked ? "badge-warning" : ""}" style="margin-top:13px">${unlocked ? "Desbloqueada" : "Bloqueada"}</span></article>`;
    }).join("");
});