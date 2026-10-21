import { auth } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

let cachedUserPromise = null;

function getUser() {
    if (!cachedUserPromise) {
        cachedUserPromise = new Promise((resolve, reject) => {
            const unsubscribe = onAuthStateChanged(
                auth,
                user => {
                    unsubscribe();
                    resolve(user);
                },
                reject
            );
        });
    }

    return cachedUserPromise;
}

async function verifyAdmin() {
    const user = await getUser();

    if (!user) {
        throw new Error("Authentication required.");
    }

    const token = await user.getIdToken();

    const response = await fetch("/api/admin-session", {
        headers: {
            Authorization: `Bearer ${token}`
        },
        cache: "no-store"
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || "Administrator access denied.");
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
        if (!user) throw new Error("Session expired.");
        return user.getIdToken();
    },
    logout: () => signOut(auth)
};