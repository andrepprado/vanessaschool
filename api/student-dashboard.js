import { adminAuth, adminDb } from "./firebase-admin.js";

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    res.setHeader("Vary", "Authorization");

    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return res.status(405).json({
            error: "Method not allowed."
        });
    }

    const match = /^Bearer\s+(.+)$/i.exec(
        String(req.headers.authorization || "")
    );

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
        const uid = decoded.uid;

        const [profileDoc, progressDoc] = await Promise.all([
            adminDb.collection("profiles").doc(uid).get(),
            adminDb.collection("student_progress").doc(uid).get()
        ]);

        if (!profileDoc.exists) {
            return res.status(403).json({
                error: "Student profile not found."
            });
        }

        const profile = profileDoc.data();

        if (profile.role !== "student") {
            return res.status(403).json({
                error: "Student access required."
            });
        }

        if (profile.active !== true) {
            return res.status(403).json({
                error: "Student account is inactive."
            });
        }

        const authUser = await adminAuth.getUser(uid);

        if (authUser.disabled) {
            return res.status(403).json({
                error: "Student account is disabled."
            });
        }

        const raw = progressDoc.exists
            ? progressDoc.data()
            : {};

        const progress = {
            progress_percent: 0,
            xp: 0,
            streak: 0,
            completed_lessons: [],
            lesson_progress: {},
            correct_answers: 0,
            total_answers: 0,
            last_study_date: null,
            xp_today: 0,
            ...raw
        };

        return res.status(200).json({
            profile: {
                id: uid,
                name: profile.name || authUser.displayName || "Aluno",
                email: authUser.email || "",
                role: "student",
                level: profile.level || "A1",
                active: true
            },
            progress
        });
    } catch (error) {
        console.error("Student dashboard API:", error);

        return res.status(500).json({
            error: "Failed to load student dashboard."
        });
    }
}