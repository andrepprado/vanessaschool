import { auth } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

const form = document.getElementById("adminLoginForm");
const message = document.getElementById("adminLoginMessage");
const button = document.getElementById("adminLoginButton");

if (!form || !message || !button) {
    console.error("Formulario administrativo nao encontrado.");
} else {
    let submitting = false;

    async function validateAdmin(user) {
        const token = await user.getIdToken();

        const response = await fetch("/api/admin-session", {
            headers: {
                Authorization: `Bearer ${token}`
            },
            cache: "no-store"
        });

        if (!response.ok) {
            const error = new Error(
                response.status === 403
                    ? "Usuario sem permissao administrativa."
                    : response.status === 401
                        ? "Sessao invalida."
                        : "Falha ao verificar o acesso administrativo."
            );
            error.status = response.status;
            throw error;
        }

        return response.json();
    }

    onAuthStateChanged(auth, async user => {
        if (!user || submitting) return;

        try {
            await validateAdmin(user);

            if (!submitting) {
                window.location.replace("/admin");
            }
        } catch (error) {
            console.warn("Verificacao administrativa:", error.message);
        }
    });

    form.addEventListener("submit", async event => {
        event.preventDefault();

        if (submitting) return;
        submitting = true;

        message.textContent = "";
        message.className = "auth-message";
        button.disabled = true;

        try {
            const email = document
                .getElementById("adminEmail")
                .value.trim();

            const password = document
                .getElementById("adminPassword")
                .value;

            const result = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            await validateAdmin(result.user);

            window.location.replace("/admin");
        } catch (error) {
            console.error(
                "Firebase login administrativo:",
                error.code || error.message
            );

            const invalidCredential = [
                "auth/invalid-credential",
                "auth/wrong-password",
                "auth/user-not-found",
                "auth/invalid-email"
            ].includes(error.code);

            message.textContent = invalidCredential
                ? "E-mail ou senha inválidos."
                : error.message || "Erro ao entrar.";

            message.className = "auth-message error";

            if (auth.currentUser) {
                try {
                    await signOut(auth);
                } catch (logoutError) {
                    console.error("Erro ao encerrar sessão:", logoutError);
                }
            }
        } finally {
            submitting = false;
            button.disabled = false;
        }
    });
}