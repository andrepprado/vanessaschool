const EYTStorage = (() => {
    const USER_KEY = "eyt_user";
    const PROGRESS_KEY = "eyt_progress";

    function getUser() {
        try {
            return JSON.parse(localStorage.getItem(USER_KEY));
        } catch {
            return null;
        }
    }

    function createUser(nome) {
        const usuario = {
            id: "user_" + Date.now(),
            nome: nome,
            criadoEm: new Date().toISOString()
        };

        localStorage.setItem(USER_KEY, JSON.stringify(usuario));

        if (!localStorage.getItem(PROGRESS_KEY)) {
            saveProgress(defaultProgress());
        }

        return usuario;
    }

    function saveUser(usuario) {
        localStorage.setItem(USER_KEY, JSON.stringify(usuario));
    }

    function defaultProgress() {
        return {
            xp: 0,
            xpHoje: 0,
            dataXpHoje: "",
            streak: 0,
            ultimoEstudo: "",
            licoesConcluidas: [],
            progressoLicoes: {},
            erros: [],
            conquistas: [],
            respostasCorretas: 0,
            respostasTotais: 0
        };
    }

    function getProgress() {
        let progress;

        try {
            progress = JSON.parse(localStorage.getItem(PROGRESS_KEY));
        } catch {
            progress = null;
        }

        if (!progress) {
            progress = defaultProgress();
            saveProgress(progress);
        }

        const padrao = defaultProgress();

        progress = {
            ...padrao,
            ...progress
        };

        progress.licoesConcluidas =
            Array.isArray(progress.licoesConcluidas)
                ? progress.licoesConcluidas
                : [];

        progress.erros =
            Array.isArray(progress.erros)
                ? progress.erros
                : [];

        progress.conquistas =
            Array.isArray(progress.conquistas)
                ? progress.conquistas
                : [];

        progress.progressoLicoes =
            progress.progressoLicoes || {};

        return progress;
    }

    function saveProgress(progress) {
        localStorage.setItem(
            PROGRESS_KEY,
            JSON.stringify(progress)
        );
    }

    function dateKey(date = new Date()) {
        const ano = date.getFullYear();
        const mes = String(date.getMonth() + 1).padStart(2, "0");
        const dia = String(date.getDate()).padStart(2, "0");

        return `${ano}-${mes}-${dia}`;
    }

    function differenceInDays(dateA, dateB) {
        const a = new Date(dateA + "T12:00:00");
        const b = new Date(dateB + "T12:00:00");

        return Math.round(
            Math.abs(b - a) / 86400000
        );
    }

    function registerStudyDay(progress) {
        const hoje = dateKey();

        if (progress.dataXpHoje !== hoje) {
            progress.xpHoje = 0;
            progress.dataXpHoje = hoje;
        }

        if (!progress.ultimoEstudo) {
            progress.streak = 1;
            progress.ultimoEstudo = hoje;
            return progress;
        }

        if (progress.ultimoEstudo === hoje) {
            return progress;
        }

        const diferenca = differenceInDays(
            progress.ultimoEstudo,
            hoje
        );

        if (diferenca === 1) {
            progress.streak += 1;
        } else {
            progress.streak = 1;
        }

        progress.ultimoEstudo = hoje;

        return progress;
    }

    function addXP(valor) {
        const progress = getProgress();

        registerStudyDay(progress);

        progress.xp += valor;
        progress.xpHoje += valor;

        saveProgress(progress);

        return progress;
    }

    function saveLessonProgress(lessonId, current, total) {
        const progress = getProgress();

        progress.progressoLicoes[lessonId] = {
            atual: current,
            total: total,
            percentual: total
                ? Math.round((current / total) * 100)
                : 0,
            atualizadoEm: new Date().toISOString()
        };

        saveProgress(progress);
    }

    function completeLesson(lessonId) {
        const progress = getProgress();

        if (!progress.licoesConcluidas.includes(lessonId)) {
            progress.licoesConcluidas.push(lessonId);
        }

        progress.progressoLicoes[lessonId] = {
            atual: 1,
            total: 1,
            percentual: 100,
            atualizadoEm: new Date().toISOString()
        };

        registerStudyDay(progress);
        saveProgress(progress);

        return progress;
    }

    function registerAnswer(correct) {
        const progress = getProgress();

        progress.respostasTotais += 1;

        if (correct) {
            progress.respostasCorretas += 1;
        }

        saveProgress(progress);
    }

    function addMistake(lessonId, exercise) {
        const progress = getProgress();

        const existente = progress.erros.find(
            item =>
                item.lessonId === lessonId &&
                item.exerciseId === exercise.id
        );

        if (existente) {
            existente.quantidade += 1;
            existente.ultimaOcorrencia =
                new Date().toISOString();
        } else {
            progress.erros.push({
                lessonId,
                exerciseId: exercise.id,
                pergunta: exercise.pergunta,
                resposta: exercise.resposta,
                quantidade: 1,
                ultimaOcorrencia: new Date().toISOString()
            });
        }

        saveProgress(progress);
    }

    function removeMistake(lessonId, exerciseId) {
        const progress = getProgress();

        progress.erros = progress.erros.filter(
            item =>
                !(
                    item.lessonId === lessonId &&
                    item.exerciseId === exerciseId
                )
        );

        saveProgress(progress);
    }

    function unlockAchievement(id) {
        const progress = getProgress();

        if (!progress.conquistas.includes(id)) {
            progress.conquistas.push(id);
            saveProgress(progress);

            return true;
        }

        return false;
    }

    function resetProgress() {
        saveProgress(defaultProgress());
    }

    function logout() {
        localStorage.removeItem(USER_KEY);
    }

    function deleteEverything() {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(PROGRESS_KEY);
    }

    return {
        getUser,
        createUser,
        saveUser,
        getProgress,
        saveProgress,
        addXP,
        saveLessonProgress,
        completeLesson,
        registerAnswer,
        addMistake,
        removeMistake,
        unlockAchievement,
        resetProgress,
        logout,
        deleteEverything,
        dateKey
    };
})();