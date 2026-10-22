import { auth } from "./firebase-config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

const ADMIN_UID = "jvkBb2WgRyezmlVCMSjRyCaR7d82";

async function getUser() {
    await auth.authStateReady();
    return auth.currentUser;
}

async function verifyAdmin() {
    const user = await getUser();

    if (!user) {
        throw new Error("Authentication required.");
    }

    const token = await user.getIdToken();

    const response = await fetch("/api/admin-session", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        },
        cache: "no-store"
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || "Acesso administrativo negado.");
    }

    if (
        data.authenticated !== true ||
        data.role !== "admin" ||
        data.uid !== ADMIN_UID ||
        user.uid !== ADMIN_UID
    ) {
        throw new Error("Administrador nao autorizado.");
    }

    return {
        name: user.displayName || "Teacher Vanessa",
        role: "admin",
        active: true
    };
}

window.EYTAdminFirebase = {
    getUser,
    verifyAdmin,

    async token() {
        const user = await getUser();

        if (!user) {
            throw new Error("Session expired.");
        }

        return user.getIdToken();
    },

    logout: () => signOut(auth)
};