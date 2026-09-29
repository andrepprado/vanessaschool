const EYTStorage = (() => {
    const KEYS = { user: "eyt_user", progress: "eyt_progress" };
    const read = (key, fallback) => { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback } catch { return fallback } };
    const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
    const defaultProgress = () => ({ xp: 0, xpHoje: 0, dataXpHoje: "", streak: 0, ultimoEstudo: "", licoesConcluidas: [], progressoLicoes: {}, erros: [], conquistas: [], respostasCorretas: 0, respostasTotais: 0 });
    const dateKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const differenceInDays = (a, b) => Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / 86400000);
    const getUser = () => read(KEYS.user, null);
    const saveUser = user => write(KEYS.user, user);
    const createUser = nome => { const user = { nome: nome.trim(), criadoEm: new Date().toISOString() }; saveUser(user); if (!localStorage.getItem(KEYS.progress)) write(KEYS.progress, defaultProgress()); return user };
    const getProgress = () => ({ ...defaultProgress(), ...read(KEYS.progress, defaultProgress()) });
    const saveProgress = progress => write(KEYS.progress, progress);
    const registerStudyDay = () => {
        const p = getProgress(), today = dateKey();
        if (p.ultimoEstudo !== today) {
            if (!p.ultimoEstudo) p.streak = 1;
            else { const diff = differenceInDays(p.ultimoEstudo, today); p.streak = diff === 1 ? p.streak + 1 : 1 }
            p.ultimoEstudo = today;
        }
        if (p.dataXpHoje !== today) { p.dataXpHoje = today; p.xpHoje = 0 }
        saveProgress(p); return p;
    };
    const addXP = (amount = 0) => {
        const p = registerStudyDay(), today = dateKey();
        if (p.dataXpHoje !== today) { p.dataXpHoje = today; p.xpHoje = 0 }
        p.xp += Number(amount) || 0; p.xpHoje += Number(amount) || 0; saveProgress(p); return p;
    };
    const saveLessonProgress = (id, index, total) => {
        const p = getProgress();
        p.progressoLicoes[id] = { index, total, percent: total ? Math.min(100, Math.round(index / total * 100)) : 0 };
        saveProgress(p); return p;
    };
    const completeLesson = id => {
        const p = getProgress();
        if (!p.licoesConcluidas.includes(id)) p.licoesConcluidas.push(id);
        if (p.progressoLicoes[id]) p.progressoLicoes[id].percent = 100;
        else p.progressoLicoes[id] = { index: 1, total: 1, percent: 100 };
        saveProgress(p); return p;
    };
    const registerAnswer = correct => {
        const p = getProgress(); p.respostasTotais++; if (correct) p.respostasCorretas++; saveProgress(p); return p;
    };
    const addMistake = item => {
        const p = getProgress();
        const key = `${item.lessonId}:${item.exerciseId}`;
        const existing = p.erros.findIndex(e => `${e.lessonId}:${e.exerciseId}` === key);
        const data = { ...item, data: new Date().toISOString() };
        if (existing >= 0) p.erros[existing] = data; else p.erros.push(data);
        saveProgress(p); return p;
    };
    const removeMistake = (lessonId, exerciseId) => {
        const p = getProgress(); p.erros = p.erros.filter(e => !(e.lessonId === lessonId && e.exerciseId === exerciseId)); saveProgress(p); return p;
    };
    const unlockAchievement = id => {
        const p = getProgress(); if (!p.conquistas.includes(id)) p.conquistas.push(id); saveProgress(p); return p;
    };
    const resetProgress = () => { const p = defaultProgress(); saveProgress(p); return p };
    const logout = () => localStorage.removeItem(KEYS.user);
    const deleteEverything = () => { localStorage.removeItem(KEYS.user); localStorage.removeItem(KEYS.progress) };
    return { getUser, saveUser, createUser, defaultProgress, getProgress, saveProgress, dateKey, differenceInDays, registerStudyDay, addXP, saveLessonProgress, completeLesson, registerAnswer, addMistake, removeMistake, unlockAchievement, resetProgress, logout, deleteEverything };
})();