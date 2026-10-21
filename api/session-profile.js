import { adminAuth, adminDb } from "./firebase-admin.js";

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return res.status(405).json({ error: "Method not allowed." });
    }

    const match = /^Bearer\s+(.+)$/i.exec(
        String(req.headers.authorization || "")
    );

    if (!match) {
        return res.status(401).json({ error: "Authentication required." });
    }

    try {
        const user = await adminAuth.verifyIdToken(match[1], true);
        const snapshot = await adminDb
            .collection("profiles").doc(user.uid).get();

        if (!snapshot.exists) {
            return res.status(403).json({ error: "Perfil não encontrado." });
        }

        const profile = snapshot.data();

        if (profile.active !== true) {
            return res.status(403).json({ error: "Conta desativada." });
        }

        if (
            profile.role !== "student" &&
            profile.role !== "admin"
        ) {
            return res.status(403).json({ error: "Perfil inválido." });
        }

        if (
            profile.role === "admin" &&
            user.uid !== "jvkBb2WgRyezmlVCMSjRyCaR7d82"
        ) {
            return res.status(403).json({
                error: "Sem permissão administrativa."
            });
        }

        return res.status(200).json({
            id: user.uid,
            name: profile.name || user.name || "",
            role: profile.role,
            level: profile.level || "A1",
            active: true
        });
    } catch (error) {
        if (error.code && String(error.code).startsWith("auth/")) {
            return res.status(401).json({ error: "Sessão inválida." });
        }

        console.error("Session profile:", error);
        return res.status(500).json({
            error: "Falha ao consultar perfil."
        });
    }
}