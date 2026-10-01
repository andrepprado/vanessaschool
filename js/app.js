const EYTApp = (() => {
    const requireUser = () => { const user = EYTStorage.getUser(); if (!user) { location.href = "index.html"; return null } return user };
    const normalizeText = value => String(value ?? "").trim().toLowerCase().replace(/[.!?,;:]/g, "").replace(/\s+/g, " ");
    const getAllLessons = () => EYTData.course.units.flatMap((unit, unitIndex) => unit.lessons.map((lesson, lessonIndex) => ({ ...lesson, unit, unitIndex, lessonIndex })));
    const getLessonOrder = id => getAllLessons().findIndex(l => l.id === id);
    const isLessonUnlocked = id => { const order = getLessonOrder(id); if (order <= 0) return true; const previous = getAllLessons()[order - 1]; return EYTStorage.getProgress().licoesConcluidas.includes(previous.id) };
    const getNextLesson = () => {
        const lessons = getAllLessons(), p = EYTStorage.getProgress();
        for (const lesson of lessons) if (!p.licoesConcluidas.includes(lesson.id) && isLessonUnlocked(lesson.id)) return lesson;
        return lessons[lessons.length - 1];
    };
    const getCourseProgress = () => { const lessons = getAllLessons(), p = EYTStorage.getProgress(); return lessons.length ? Math.round(p.licoesConcluidas.length / lessons.length * 100) : 0 };
    const getAccuracy = () => { const p = EYTStorage.getProgress(); return p.respostasTotais ? Math.round(p.respostasCorretas / p.respostasTotais * 100) : 0 };
    const evaluateAchievements = () => {
        let p = EYTStorage.getProgress(), changed = false, total = getAllLessons().length;
        const unlock = id => { if (!p.conquistas.includes(id)) { p.conquistas.push(id); changed = true } };
        if (p.licoesConcluidas.length >= 1) unlock("first-step");
        if (p.xp >= 100) unlock("xp-100");
        if (p.streak >= 3) unlock("streak-3");
        if (p.licoesConcluidas.length >= 5) unlock("lessons-5");
        if (p.respostasCorretas >= 10) unlock("perfect-10");
        if (p.licoesConcluidas.length >= total) unlock("course-complete");
        if (changed) EYTStorage.saveProgress(p);
        return p.conquistas;
    };
    const getLessonStatus = id => {
        const p = EYTStorage.getProgress();
        if (p.licoesConcluidas.includes(id)) return "completed";
        if (isLessonUnlocked(id)) return "available";
        return "locked";
    };
    const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
    const icon = (name, extraClass = "") => {
        const iconName = /^bi-[a-z0-9-]+$/i.test(String(name || "")) ? String(name) : "bi-circle";
        const classes = String(extraClass || "").split(/\s+/).filter(item => /^[a-z0-9_-]+$/i.test(item)).join(" ");
        return `<i class="bi ${iconName}${classes ? ` ${classes}` : ""}" aria-hidden="true"></i>`;
    };
    return { requireUser, normalizeText, getAllLessons, getLessonOrder, isLessonUnlocked, getNextLesson, getCourseProgress, getAccuracy, evaluateAchievements, getLessonStatus, escapeHTML, icon };
})();