document.addEventListener("DOMContentLoaded", () => {
    const usuario = EYTApp.requireUser();

    if (!usuario) {
        return;
    }

    EYTApp.evaluateAchievements();

    const progress =
        EYTStorage.getProgress();

    document.getElementById(
        "profileName"
    ).textContent =
        usuario.nome;

    document.getElementById(
        "profileNameInput"
    ).value =
        usuario.nome;

    document.getElementById(
        "profileAvatar"
    ).textContent =
        usuario.nome
            .trim()
            .charAt(0)
            .toUpperCase();

    document.getElementById(
        "profileXp"
    ).textContent =
        progress.xp;

    document.getElementById(
        "profileStreak"
    ).textContent =
        progress.streak;

    document.getElementById(
        "profileLessons"
    ).textContent =
        progress.licoesConcluidas.length;

    document.getElementById(
        "saveProfileButton"
    ).addEventListener("click", saveProfile);

    document.getElementById(
        "resetProgressButton"
    ).addEventListener("click", resetProgress);

    document.getElementById(
        "logoutButton"
    ).addEventListener("click", logout);
});

function saveProfile() {
    const input =
        document.getElementById("profileNameInput");

    const nome =
        input.value.trim();

    if (!nome) {
        alert("Informe um nome.");
        return;
    }

    const usuario =
        EYTStorage.getUser();

    usuario.nome = nome;

    EYTStorage.saveUser(usuario);

    document.getElementById(
        "profileName"
    ).textContent =
        nome;

    document.getElementById(
        "profileAvatar"
    ).textContent =
        nome.charAt(0).toUpperCase();

    alert("Perfil atualizado!");
}

function resetProgress() {
    const confirmar =
        confirm(
            "Tem certeza que deseja apagar todo o seu progresso?"
        );

    if (!confirmar) {
        return;
    }

    EYTStorage.resetProgress();

    alert("Progresso reiniciado.");

    window.location.reload();
}

function logout() {
    EYTStorage.logout();
    window.location.href = "index.html";
}