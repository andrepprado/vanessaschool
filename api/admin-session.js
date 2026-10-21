import { adminAuth, adminDb } from "./firebase-admin.js";

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return res.status(405).json({
            error: "Method not allowed."
        });
    }

    const header = String(req.headers.authorization || "");
    const match = /^Bearer\s+(.+)$/i.exec(header);

    if (!match) {
        return res.status(401).json({
            error: "Authentication required."
        });
    }

    let decoded;

    try {
        decoded = await adminAuth.verifyIdToken(match[1], true);
    } catch {
        return res.status(401).json({
            error: "Invalid or expired session."
        });
    }

    try {
        const snapshot = await adminDb
            .collection("profiles")
            .doc(decoded.uid)
            .get();

        const profile = snapshot.data();

        if (
            !snapshot.exists ||
            profile.role !== "admin" ||
            profile.active !== true ||
            decoded.uid !== "jvkBb2WgRyezmlVCMSjRyCaR7d82"
        ) {
            return res.status(403).json({
                error: "Administrator access required."
            });
        }

        return res.status(200).json({
            authenticated: true,
            role: "admin",
            uid: decoded.uid
        });
    } catch (error) {
        console.error("Firebase admin verification:", error);

        return res.status(500).json({
            error: "Could not verify administrator."
        });
    }
}