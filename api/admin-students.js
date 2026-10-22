import { adminAuth, adminDb } from "./firebase-admin.js";

const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

function normalizeLevel(value) {
    const level = String(value || "").trim().toUpperCase();
    return LEVELS.includes(level) ? level : "A1";
}

function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
}

function numberRange(value, max = Infinity) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : 0;
}

function errorResponse(res, status, message) {
    return res.status(status).json({ error: message });
}

function getBody(req) {
    if (typeof req.body === "string") {
        return JSON.parse(req.body);
    }
    return req.body && typeof req.body === "object" ? req.body : {};
}

async function requireAdmin(req) {
    const header = String(req.headers.authorization || "");
    const match = /^Bearer\s+(.+)$/i.exec(header);

    if (!match) {
        return { ok: false, status: 401, message: "Authentication required." };
    }

    let decoded;

    try {
        decoded = await adminAuth.verifyIdToken(match[1], true);
    } catch {
        return { ok: false, status: 401, message: "Invalid or expired session." };
    }

    const snapshot = await adminDb.collection("profiles").doc(decoded.uid).get();
    const profile = snapshot.data();

    if (!profile || profile.role !== "admin" || profile.active !== true || decoded.uid !== "jvkBb2WgRyezmlVCMSjRyCaR7d82") {
        return { ok: false, status: 403, message: "Administrator access required." };
    }

    return { ok: true, uid: decoded.uid };
}

async function requireStudent(id) {
    if (!id || id.includes("/")) {
        const error = new Error("Invalid student id.");
        error.status = 400;
        throw error;
    }

    const ref = adminDb.collection("profiles").doc(id);
    const snapshot = await ref.get();

    if (!snapshot.exists || snapshot.data().role !== "student") {
        const error = new Error("Student not found.");
        error.status = 404;
        throw error;
    }

    return { ref, profile: snapshot.data() };
}

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Allow", "GET,POST,PATCH,DELETE");

    if (!["GET", "POST", "PATCH", "DELETE"].includes(req.method)) {
        return errorResponse(res, 405, "Method not allowed.");
    }

    try {
        const permission = await requireAdmin(req);

        if (!permission.ok) {
            return errorResponse(res, permission.status, permission.message);
        }

        if (req.method === "GET") {
            const [profiles, progress] = await Promise.all([
                adminDb.collection("profiles").where("role", "==", "student").get(),
                adminDb.collection("student_progress").get()
            ]);

            const progressMap = new Map(
                progress.docs.map(doc => [doc.id, doc.data()])
            );

            const students = profiles.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
                progress: {
                    progress_percent: 0,
                    xp: 0,
                    streak: 0,
                    teacher_notes: "",
                    ...(progressMap.get(doc.id) || {})
                }
            }));

            students.sort((a, b) =>
                String(a.name || "").localeCompare(String(b.name || ""), "pt-BR")
            );

            return res.status(200).json({ students });
        }

        const body = getBody(req);

        if (req.method === "POST") {
            const email = normalizeEmail(body.email);
            const password = String(body.password || "");
            const name = String(body.name || "").trim();
            const level = normalizeLevel(body.level);

            if (!email || !name || password.length < 6) {
                return errorResponse(
                    res,
                    400,
                    "Informe nome, e-mail e senha com pelo menos 6 caracteres."
                );
            }

            const user = await adminAuth.createUser({
                email,
                password,
                displayName: name,
                emailVerified: true,
                disabled: false
            });

            try {
                const now = new Date().toISOString();
                const batch = adminDb.batch();

                batch.set(adminDb.collection("profiles").doc(user.uid), {
                    id: user.uid,
                    email,
                    name,
                    role: "student",
                    level,
                    active: true,
                    created_at: now,
                    updated_at: now
                });

                batch.set(adminDb.collection("student_progress").doc(user.uid), {
                    student_id: user.uid,
                    progress_percent: 0,
                    xp: 0,
                    streak: 0,
                    teacher_notes: "",
                    completed_lessons: [],
                    lesson_progress: {},
                    correct_answers: 0,
                    total_answers: 0,
                    xp_today: 0,
                    last_study_date: null,
                    updated_at: now
                });

                await batch.commit();
            } catch (error) {
                try {
                    await adminAuth.deleteUser(user.uid);
                } catch (cleanupError) {
                    console.error("Firebase cleanup failed:", cleanupError);
                }
                throw error;
            }

            return res.status(201).json({
                success: true,
                id: user.uid
            });
        }

        const id = String(
            req.method === "DELETE"
                ? (req.query?.id || body.id || "")
                : (body.id || "")
        ).trim();

        const { ref, profile } = await requireStudent(id);

        if (req.method === "PATCH") {
            const authUpdate = {};
            const profileUpdate = {};
            const progressUpdate = {};

            if (body.email !== undefined) {
                const email = normalizeEmail(body.email);
                if (!email) return errorResponse(res, 400, "Invalid email.");
                authUpdate.email = email;
                profileUpdate.email = email;
            }

            if (body.password !== undefined && body.password !== "") {
                const password = String(body.password);
                if (password.length < 6) {
                    return errorResponse(res, 400, "Password too short.");
                }
                authUpdate.password = password;
            }

            if (body.name !== undefined) {
                const name = String(body.name || "").trim();
                if (!name) return errorResponse(res, 400, "Invalid name.");
                authUpdate.displayName = name;
                profileUpdate.name = name;
            }

            if (body.level !== undefined) {
                profileUpdate.level = normalizeLevel(body.level);
            }

            if (body.active !== undefined) {
                if (typeof body.active !== "boolean") {
                    return errorResponse(res, 400, "Invalid active value.");
                }
                authUpdate.disabled = !body.active;
                profileUpdate.active = body.active;
            }

            if (body.progress_percent !== undefined) {
                progressUpdate.progress_percent = numberRange(body.progress_percent, 100);
            }
            if (body.xp !== undefined) {
                progressUpdate.xp = numberRange(body.xp);
            }
            if (body.streak !== undefined) {
                progressUpdate.streak = numberRange(body.streak);
            }
            if (body.teacher_notes !== undefined) {
                progressUpdate.teacher_notes = String(body.teacher_notes || "");
            }

            if (Object.keys(authUpdate).length > 0) {
                await adminAuth.updateUser(id, authUpdate);
            }

            const batch = adminDb.batch();
            const now = new Date().toISOString();

            if (Object.keys(profileUpdate).length > 0) {
                batch.update(ref, {
                    ...profileUpdate,
                    updated_at: now
                });
            }

            if (Object.keys(progressUpdate).length > 0) {
                batch.set(
                    adminDb.collection("student_progress").doc(id),
                    {
                        ...progressUpdate,
                        student_id: id,
                        updated_at: now
                    },
                    { merge: true }
                );
            }

            if (
                Object.keys(profileUpdate).length > 0 ||
                Object.keys(progressUpdate).length > 0
            ) {
                await batch.commit();
            }

            return res.status(200).json({ success: true });
        }

        if (req.method === "DELETE") {
            // Remove o acesso imediatamente, preservando os documentos
            // ate que a exclusao dos dados seja concluida.
            await adminAuth.updateUser(id, { disabled: true });
            await ref.update({
                active: false,
                updated_at: new Date().toISOString()
            });

            await adminAuth.deleteUser(id);

            // Exclusao recursiva contempla documentos e subcolecoes.
            for (const collection of [
                "student_exercise_progress",
                "student_assignments"
            ]) {
                const snapshot = await adminDb.collection(collection)
                    .where("student_id", "==", id)
                    .get();

                for (const doc of snapshot.docs) {
                    await adminDb.recursiveDelete(doc.ref);
                }
            }

            await adminDb.recursiveDelete(
                adminDb.collection("student_progress").doc(id)
            );
            await adminDb.recursiveDelete(ref);

            return res.status(200).json({ success: true });
        }

        return errorResponse(res, 405, "Method not allowed.");
    } catch (error) {
        console.error("Admin students API:", error);

        const status = error.status ||
            (error.code === "auth/email-already-exists" ? 409 :
            error.code === "auth/invalid-email" ? 400 :
            error.code === "auth/invalid-password" ? 400 : 500);

        return errorResponse(
            res,
            status,
            status === 500 ? "Internal server error." : error.message
        );
    }
}