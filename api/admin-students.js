import { createClient } from "@supabase/supabase-js";

function createAdminClient() {
    const url =
        process.env.SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL;

    const secret =
        process.env.SUPABASE_SECRET_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !secret) {
        throw new Error(
            "Supabase server configuration is missing."
        );
    }

    return createClient(
        url,
        secret,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            }
        }
    );
}

function bearer(req) {
    const authorization =
        String(
            req.headers.authorization ||
            ""
        );

    if (
        !authorization.startsWith(
            "Bearer "
        )
    ) {
        return null;
    }

    return authorization
        .slice(7)
        .trim();
}

async function requireAdmin(
    req,
    supabase
) {
    const token =
        bearer(req);

    if (!token) {
        return {
            ok: false,
            status: 401,
            message:
                "Authentication required."
        };
    }

    const {
        data,
        error
    } = await supabase.auth.getUser(
        token
    );

    if (
        error ||
        !data ||
        !data.user
    ) {
        return {
            ok: false,
            status: 401,
            message:
                "Invalid or expired session."
        };
    }

    const {
        data: profile,
        error: profileError
    } = await supabase
        .from("profiles")
        .select(
            "id,role,active"
        )
        .eq(
            "id",
            data.user.id
        )
        .single();

    if (
        profileError ||
        !profile ||
        profile.role !== "admin" ||
        !profile.active
    ) {
        return {
            ok: false,
            status: 403,
            message:
                "Administrator access required."
        };
    }

    return {
        ok: true,
        profile
    };
}

function normalizeLevel(level) {
    const levels =
        [
            "A1",
            "A2",
            "B1",
            "B2",
            "C1"
        ];

    const value =
        String(level || "")
            .trim()
            .toUpperCase();

    return levels.includes(value)
        ? value
        : "A1";
}

export default async function handler(
    req,
    res
) {
    res.setHeader(
        "Cache-Control",
        "no-store"
    );

    let supabase;

    try {
        supabase =
            createAdminClient();
    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }

    const permission =
        await requireAdmin(
            req,
            supabase
        );

    if (!permission.ok) {
        return res
            .status(permission.status)
            .json({
                error:
                    permission.message
            });
    }

    try {
        if (req.method === "GET") {
            const {
                data: profiles,
                error: profilesError
            } = await supabase
                .from("profiles")
                .select(
                    "id,email,name,role,level,active,created_at,updated_at"
                )
                .eq(
                    "role",
                    "student"
                )
                .order(
                    "name",
                    {
                        ascending: true
                    }
                );

            if (profilesError) {
                throw profilesError;
            }

            const {
                data: progress,
                error: progressError
            } = await supabase
                .from(
                    "student_progress"
                )
                .select(
                    "student_id,progress_percent,xp,streak,teacher_notes,updated_at"
                );

            if (progressError) {
                throw progressError;
            }

            const progressMap =
                new Map(
                    (progress || []).map(
                        row => [
                            row.student_id,
                            row
                        ]
                    )
                );

            const students =
                (profiles || []).map(
                    profile => ({
                        ...profile,
                        progress:
                            progressMap.get(
                                profile.id
                            ) || {
                                progress_percent: 0,
                                xp: 0,
                                streak: 0,
                                teacher_notes: ""
                            }
                    })
                );

            return res
                .status(200)
                .json({
                    students
                });
        }

        if (req.method === "POST") {
            const body =
                req.body || {};

            const email =
                String(
                    body.email || ""
                )
                    .trim()
                    .toLowerCase();

            const password =
                String(
                    body.password || ""
                );

            const name =
                String(
                    body.name || ""
                ).trim();

            const level =
                normalizeLevel(
                    body.level
                );

            if (
                !email ||
                !password ||
                !name
            ) {
                return res
                    .status(400)
                    .json({
                        error:
                            "Name, email and password are required."
                    });
            }

            if (
                password.length < 8
            ) {
                return res
                    .status(400)
                    .json({
                        error:
                            "Password must have at least 8 characters."
                    });
            }

            const {
                data,
                error
            } = await supabase
                .auth
                .admin
                .createUser({
                    email,
                    password,
                    email_confirm: true,
                    user_metadata: {
                        name
                    }
                });

            if (
                error ||
                !data.user
            ) {
                throw (
                    error ||
                    new Error(
                        "Could not create student."
                    )
                );
            }

            const userId =
                data.user.id;

            const {
                error: profileError
            } = await supabase
                .from("profiles")
                .upsert(
                    {
                        id: userId,
                        email,
                        name,
                        role: "student",
                        level,
                        active: true
                    },
                    {
                        onConflict: "id"
                    }
                );

            if (profileError) {
                await supabase
                    .auth
                    .admin
                    .deleteUser(
                        userId
                    );

                throw profileError;
            }

            const {
                error: progressError
            } = await supabase
                .from(
                    "student_progress"
                )
                .upsert(
                    {
                        student_id:
                            userId,
                        progress_percent: 0,
                        xp: 0,
                        streak: 0,
                        teacher_notes: ""
                    },
                    {
                        onConflict:
                            "student_id"
                    }
                );

            if (progressError) {
                throw progressError;
            }

            return res
                .status(201)
                .json({
                    success: true,
                    id: userId
                });
        }

        if (req.method === "PATCH") {
            const body =
                req.body || {};

            const id =
                String(
                    body.id || ""
                );

            if (!id) {
                return res
                    .status(400)
                    .json({
                        error:
                            "Student id is required."
                    });
            }

            const authUpdate = {};

            if (
                body.email !== undefined
            ) {
                authUpdate.email =
                    String(
                        body.email || ""
                    )
                        .trim()
                        .toLowerCase();

                authUpdate.email_confirm =
                    true;
            }

            if (
                body.password !== undefined &&
                body.password !== ""
            ) {
                const password =
                    String(body.password);

                if (
                    password.length < 8
                ) {
                    return res
                        .status(400)
                        .json({
                            error:
                                "Password must have at least 8 characters."
                        });
                }

                authUpdate.password =
                    password;
            }

            if (
                Object.keys(
                    authUpdate
                ).length > 0
            ) {
                const {
                    error
                } = await supabase
                    .auth
                    .admin
                    .updateUserById(
                        id,
                        authUpdate
                    );

                if (error) {
                    throw error;
                }
            }

            const profileUpdate = {};

            if (
                body.name !== undefined
            ) {
                profileUpdate.name =
                    String(
                        body.name || ""
                    ).trim();
            }

            if (
                body.email !== undefined
            ) {
                profileUpdate.email =
                    String(
                        body.email || ""
                    )
                        .trim()
                        .toLowerCase();
            }

            if (
                body.level !== undefined
            ) {
                profileUpdate.level =
                    normalizeLevel(
                        body.level
                    );
            }

            if (
                body.active !== undefined
            ) {
                profileUpdate.active =
                    Boolean(
                        body.active
                    );
            }

            if (
                Object.keys(
                    profileUpdate
                ).length > 0
            ) {
                const {
                    error
                } = await supabase
                    .from("profiles")
                    .update(
                        profileUpdate
                    )
                    .eq(
                        "id",
                        id
                    )
                    .eq(
                        "role",
                        "student"
                    );

                if (error) {
                    throw error;
                }
            }

            const progressUpdate = {
                student_id: id
            };

            if (
                body.progress_percent !==
                undefined
            ) {
                progressUpdate.progress_percent =
                    Math.max(
                        0,
                        Math.min(
                            100,
                            Number(
                                body.progress_percent
                            ) || 0
                        )
                    );
            }

            if (
                body.xp !== undefined
            ) {
                progressUpdate.xp =
                    Math.max(
                        0,
                        Number(body.xp) ||
                        0
                    );
            }

            if (
                body.streak !== undefined
            ) {
                progressUpdate.streak =
                    Math.max(
                        0,
                        Number(
                            body.streak
                        ) || 0
                    );
            }

            if (
                body.teacher_notes !==
                undefined
            ) {
                progressUpdate.teacher_notes =
                    String(
                        body.teacher_notes ||
                        ""
                    );
            }

            if (
                Object.keys(
                    progressUpdate
                ).length > 1
            ) {
                const {
                    error
                } = await supabase
                    .from(
                        "student_progress"
                    )
                    .upsert(
                        progressUpdate,
                        {
                            onConflict:
                                "student_id"
                        }
                    );

                if (error) {
                    throw error;
                }
            }

            return res
                .status(200)
                .json({
                    success: true
                });
        }

        if (req.method === "DELETE") {
            const id =
                String(
                    req.query.id ||
                    req.body?.id ||
                    ""
                );

            if (!id) {
                return res
                    .status(400)
                    .json({
                        error:
                            "Student id is required."
                    });
            }

            const {
                error
            } = await supabase
                .auth
                .admin
                .deleteUser(id);

            if (error) {
                throw error;
            }

            return res
                .status(200)
                .json({
                    success: true
                });
        }

        res.setHeader(
            "Allow",
            "GET,POST,PATCH,DELETE"
        );

        return res
            .status(405)
            .json({
                error:
                    "Method not allowed."
            });
    } catch (error) {
        console.error(error);

        return res
            .status(500)
            .json({
                error:
                    error.message ||
                    "Unexpected server error."
            });
    }
}