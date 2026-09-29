document.addEventListener("DOMContentLoaded", () => {
    if (!EYTApp.requireUser()) return;
    EYTApp.evaluateAchievements();
    const progress = EYTApp.getCourseProgress();
    document.getElementById("courseProgressText").textContent = `${progress}%`;
    document.getElementById("courseProgressBar").style.width = `${progress}%`;
    document.getElementById("courseUnits").innerHTML = EYTData.course.units.map(unit => `
<article class="course-unit">
<header class="course-unit-header"><div class="course-unit-number">${unit.number}</div><div><h2>${EYTApp.escapeHTML(unit.title)}</h2><p>${EYTApp.escapeHTML(unit.description)}</p></div></header>
<div class="course-lessons">${unit.lessons.map(lesson => {
        const status = EYTApp.getLessonStatus(lesson.id);
        const label = status === "completed" ? "Concluída" : status === "available" ? "Começar" : "Bloqueada";
        return `<${status === "locked" ? "div" : "a"} ${status !== "locked" ? `href="licao.html?id=${lesson.id}"` : ""} class="lesson-card ${status}">
<div class="lesson-card-icon">${status === "completed" ? "✓" : lesson.icon}</div>
<h3>${EYTApp.escapeHTML(lesson.title)}</h3>
<p>${EYTApp.escapeHTML(lesson.description)}</p>
<div class="lesson-card-footer"><span>+${lesson.xp} XP</span><span class="lesson-status">${label}</span></div>
</${status === "locked" ? "div" : "a"}>`;
    }).join("")}</div>
</article>`).join("");
});