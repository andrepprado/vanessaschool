import { auth } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

const form = document.getElementById("studentLoginForm");
const email = document.getElementById("loginEmail");
const password = document.getElementById("loginPassword");
const message = document.getElementById("loginMessage");
const button = document.getElementById("loginButton");
const year = document.getElementById("currentYear");

if (year) year.textContent = new Date().getFullYear();

async function getProfile(user) {
    const token = await user.getIdToken();

    const response = await fetch("/api/session-profile", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || "Não foi possível carregar o perfil.");
    }

    return data;
}

function redirect(profile) {
    window.location.replace(
        profile.role === "admin" ? "/admin" : "/dashboard"
    );
}

let submitting = false;

onAuthStateChanged(auth, async user => {
    if (!user || submitting) return;

    try {
        redirect(await getProfile(user));
    } catch (error) {
        console.warn("Sessão existente:", error.message);
    }
});

if (form && email && password && message && button) {
    form.addEventListener("submit", async event => {
        event.preventDefault();

        if (submitting) return;
        submitting = true;
        button.disabled = true;
        message.textContent = "";

        try {
            const result = await signInWithEmailAndPassword(
                auth, email.value.trim(), password.value
            );

            const profile = await getProfile(result.user);
            redirect(profile);
        } catch (error) {
            console.error("Firebase access:", error.code || error.message);

            message.textContent = [
                "auth/invalid-credential",
                "auth/user-not-found",
                "auth/wrong-password",
                "auth/invalid-email"
            ].includes(error.code)
                ? "E-mail ou senha inválidos."
                : (error.message || "Falha ao entrar.");

            message.className = "auth-message error";

            if (auth.currentUser) {
                await signOut(auth).catch(console.error);
            }
        } finally {
            submitting = false;
            button.disabled = false;
        }
    });
}