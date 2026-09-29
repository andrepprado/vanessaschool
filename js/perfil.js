document.addEventListener("DOMContentLoaded", () => {
    let user = EYTApp.requireUser(); if (!user) return;
    EYTApp.evaluateAchievements();
    const render = () => {
        user = EYTStorage.getUser(); const p = EYTStorage.getProgress();
        document.getElementById("profileName").textContent = user.nome;
        document.getElementById("profileNameInput").value = user.nome;
        document.getElementById("profileAvatar").textContent = user.nome.trim().charAt(0).toUpperCase() || "A";
        document.getElementById("profileXp").textContent = p.xp;
        document.getElementById("profileStreak").textContent = p.streak;
        document.getElementById("profileLessons").textContent = p.licoesConcluidas.length;
        document.getElementById("profileAccuracy").textContent = `${EYTApp.getAccuracy()}%`;
    };
    document.getElementById("profileForm").addEventListener("submit", e => { e.preventDefault(); const nome = document.getElementById("profileNameInput").value.trim(); if (!nome) return; EYTStorage.saveUser({ ...user, nome }); render() });
    document.getElementById("logoutButton").onclick = () => { EYTStorage.logout(); location.href = "index.html" };
    document.getElementById("resetButton").onclick = () => { if (!confirm("Deseja realmente apagar todo o seu progresso?")) return; EYTStorage.resetProgress(); render() };
    render();
});