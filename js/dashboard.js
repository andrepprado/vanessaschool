document.addEventListener("DOMContentLoaded", () => {
    const user = EYTApp.requireUser(); if (!user) return;
    EYTApp.evaluateAchievements();
    const p = EYTStorage.getProgress(), next = EYTApp.getNextLesson();
    document.getElementById("userName").textContent = user.nome.split(" ")[0];
    document.getElementById("streakTop").textContent = `${p.streak} ${p.streak === 1 ? "dia" : "dias"}`;
    document.getElementById("xpTop").textContent = `${p.xp} XP`;
    document.getElementById("totalXp").textContent = p.xp;
    document.getElementById("streak").textContent = p.streak;
    document.getElementById("completedLessons").textContent = p.licoesConcluidas.length;
    document.getElementById("achievementCount").textContent = p.conquistas.length;
    const mobileStreak = document.getElementById("mobileStreak"), mobileXp = document.getElementById("mobileXp");
    if (mobileStreak) mobileStreak.textContent = `🔥 ${p.streak}`;
    if (mobileXp) mobileXp.textContent = `★ ${p.xp}`;
    if (next) {
        const lp = p.progressoLicoes[next.id] || { percent: 0 };
        document.getElementById("continueTitle").textContent = next.title;
        document.getElementById("continueDescription").textContent = next.description;
        document.getElementById("continuePercent").textContent = `${lp.percent || 0}%`;
        document.getElementById("continueProgressBar").style.width = `${lp.percent || 0}%`;
        document.getElementById("continueButton").href = `licao.html?id=${encodeURIComponent(next.id)}`;
    }
    const today = p.dataXpHoje === EYTStorage.dateKey() ? p.xpHoje : 0, goal = Math.min(100, Math.round(today / 50 * 100));
    document.getElementById("dailyGoalValue").textContent = `${today} / 50 XP`;
    document.getElementById("dailyGoalPercent").textContent = `${goal}%`;
    document.getElementById("dailyGoalBar").style.width = `${goal}%`;
    const root = document.getElementById("dashboardPath");
    root.innerHTML = EYTData.course.units.map(unit => `
<article class="path-unit">
<header class="path-unit-header"><div class="path-unit-number">${unit.number}</div><div><h3>${EYTApp.escapeHTML(unit.title)}</h3><p>${EYTApp.escapeHTML(unit.description)}</p></div></header>
<div class="path-lessons">${unit.lessons.map(lesson => {
        const status = EYTApp.getLessonStatus(lesson.id);
        const label = status === "completed" ? "Concluída" : status === "available" ? "Disponível" : "Bloqueada";
        const icon = status === "completed" ? "✓" : status === "locked" ? "•" : lesson.icon;
        return `<${status === "locked" ? "div" : "a"} ${status !== "locked" ? `href="licao.html?id=${lesson.id}"` : ""} class="path-lesson ${status}"><div class="path-lesson-icon">${icon}</div><div class="path-lesson-info"><h4>${EYTApp.escapeHTML(lesson.title)}</h4><p>${EYTApp.escapeHTML(lesson.description)}</p></div><div class="path-lesson-status">${label}</div></${status === "locked" ? "div" : "a"}>`;
    }).join("")}</div>
</article>`).join("");
});