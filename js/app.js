const EYTApp = (() => {
    function requireUser() {
        const usuario = EYTStorage.getUser();

        if (!usuario) {
            window.location.href = "index.html";
            return null;
        }

        return usuario;
    }

    function normalizeText(texto) {
        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[.,!?;:'"]/g, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function getAllLessons() {
        return EYTData.unidades.flatMap(
            unidade =>
                unidade.licoes
                    .map(id => EYTData.licoes[id])
                    .filter(Boolean)
        );
    }

    function getLessonOrder() {
        return getAllLessons().map(licao => licao.id);
    }

    function isLessonUnlocked(lessonId) {
        const ordem = getLessonOrder();
        const indice = ordem.indexOf(lessonId);

        if (indice <= 0) {
            return true;
        }

        const progress = EYTStorage.getProgress();
        const anterior = ordem[indice - 1];

        return progress.licoesConcluidas.includes(anterior);
    }

    function getNextLesson() {
        const progress = EYTStorage.getProgress();
        const licoes = getAllLessons();

        return (
            licoes.find(
                licao =>
                    isLessonUnlocked(licao.id) &&
                    !progress.licoesConcluidas.includes(licao.id)
            ) ||
            licoes[licoes.length - 1]
        );
    }

    function getCourseProgress() {
        const progress = EYTStorage.getProgress();
        const total = getAllLessons().length;
        const concluidas =
            progress.licoesConcluidas.filter(
                id => EYTData.licoes[id]
            ).length;

        return {
            total,
            concluidas,
            percentual: total
                ? Math.round((concluidas / total) * 100)
                : 0
        };
    }

    function getAccuracy() {
        const progress = EYTStorage.getProgress();

        if (!progress.respostasTotais) {
            return 0;
        }

        return Math.round(
            (
                progress.respostasCorretas /
                progress.respostasTotais
            ) * 100
        );
    }

    function evaluateAchievements() {
        const progress = EYTStorage.getProgress();
        const totalLessons = getAllLessons().length;

        if (progress.licoesConcluidas.length >= 1) {
            EYTStorage.unlockAchievement("first-lesson");
        }

        if (progress.xp >= 100) {
            EYTStorage.unlockAchievement("xp-100");
        }

        if (progress.licoesConcluidas.length >= 3) {
            EYTStorage.unlockAchievement("three-lessons");
        }

        if (progress.streak >= 3) {
            EYTStorage.unlockAchievement("streak-3");
        }

        if (progress.xp >= 500) {
            EYTStorage.unlockAchievement("xp-500");
        }

        if (progress.licoesConcluidas.length >= totalLessons) {
            EYTStorage.unlockAchievement("all-lessons");
        }

        return EYTStorage.getProgress().conquistas;
    }

    function getLessonStatus(lessonId) {
        const progress = EYTStorage.getProgress();

        if (progress.licoesConcluidas.includes(lessonId)) {
            return "completed";
        }

        if (isLessonUnlocked(lessonId)) {
            return "available";
        }

        return "locked";
    }

    function escapeHTML(texto) {
        const div = document.createElement("div");
        div.textContent = texto;
        return div.innerHTML;
    }

    return {
        requireUser,
        normalizeText,
        getAllLessons,
        getLessonOrder,
        isLessonUnlocked,
        getNextLesson,
        getCourseProgress,
        getAccuracy,
        evaluateAchievements,
        getLessonStatus,
        escapeHTML
    };
})();