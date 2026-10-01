document.addEventListener("DOMContentLoaded", async () => {
    "use strict";

    const state = {
        profile: null,
        session: null,
        legacyUser: null
    };

    function getLegacyProgress() {
        try {
            return EYTStorage.getProgress();
        } catch (_) {
            return {
                xp: 0,
                streak: 0,
                licoesConcluidas: [],
                respostasCorretas: 0,
                respostasTotais: 0
            };
        }
    }

    function getLegacyUser() {
        try {
            return EYTStorage.getUser();
        } catch (_) {
            return null;
        }
    }

    function getDisplayName() {
        return (
            state.profile?.name ||
            state.legacyUser?.nome ||
            state.session?.user?.email?.split("@")[0] ||
            "Aluno"
        );
    }

    function render() {
        const progress =
            getLegacyProgress();

        const name =
            getDisplayName();

        const completed =
            Array.isArray(
                progress.licoesConcluidas
            )
                ? progress.licoesConcluidas.length
                : 0;

        const totalAnswers =
            Number(
                progress.respostasTotais ||
                0
            );

        const correctAnswers =
            Number(
                progress.respostasCorretas ||
                0
            );

        const accuracy =
            totalAnswers > 0
                ? Math.round(
                    correctAnswers /
                    totalAnswers *
                    100
                )
                : 0;

        const profileName =
            document.getElementById(
                "profileName"
            );

        const profileNameInput =
            document.getElementById(
                "profileNameInput"
            );

        const profileAvatar =
            document.getElementById(
                "profileAvatar"
            );

        const profileXp =
            document.getElementById(
                "profileXp"
            );

        const profileStreak =
            document.getElementById(
                "profileStreak"
            );

        const profileLessons =
            document.getElementById(
                "profileLessons"
            );

        const profileAccuracy =
            document.getElementById(
                "profileAccuracy"
            );

        if (profileName) {
            profileName.textContent =
                name;
        }

        if (profileNameInput) {
            profileNameInput.value =
                name;
        }

        if (profileAvatar) {
            profileAvatar.textContent =
                name
                    .trim()
                    .charAt(0)
                    .toUpperCase() ||
                "A";
        }

        if (profileXp) {
            profileXp.textContent =
                Number(
                    progress.xp ||
                    0
                );
        }

        if (profileStreak) {
            profileStreak.textContent =
                Number(
                    progress.streak ||
                    0
                );
        }

        if (profileLessons) {
            profileLessons.textContent =
                completed;
        }

        if (profileAccuracy) {
            profileAccuracy.textContent =
                `${accuracy}%`;
        }
    }

    async function requireAuthenticatedSession() {
        /*
         * Supabase is the authoritative login state.
         *
         * DO NOT redirect based on EYTStorage anymore.
         */
        try {
            if (
                typeof EYTSupabase !==
                    "undefined" &&
                typeof EYTSupabase.getSession ===
                    "function"
            ) {
                state.session =
                    await EYTSupabase
                        .getSession();

                if (state.session) {
                    try {
                        state.profile =
                            await EYTSupabase
                                .getProfile();
                    } catch (error) {
                        console.warn(
                            "[Perfil] Profile lookup failed:",
                            error
                        );
                    }

                    return true;
                }
            }
        } catch (error) {
            console.warn(
                "[Perfil] Supabase session check failed:",
                error
            );
        }

        /*
         * Legacy fallback only for older local accounts.
         */
        state.legacyUser =
            getLegacyUser();

        if (state.legacyUser) {
            return true;
        }

        /*
         * No valid auth source exists.
         * Redirect to login, NEVER to the public home page.
         */
        location.replace(
            "acesso.html"
        );

        return false;
    }

    async function saveProfileName(
        name
    ) {
        if (!name) {
            return;
        }

        /*
         * Update Supabase profile when authenticated there.
         */
        if (
            state.session &&
            typeof EYTSupabase !==
                "undefined"
        ) {
            try {
                const client =
                    await EYTSupabase
                        .getClient();

                const {
                    error
                } =
                    await client
                        .from(
                            "profiles"
                        )
                        .update({
                            name
                        })
                        .eq(
                            "id",
                            state.session.user.id
                        );

                if (error) {
                    throw error;
                }

                state.profile = {
                    ...(state.profile || {}),
                    name
                };
            } catch (error) {
                console.warn(
                    "[Perfil] Could not update Supabase profile:",
                    error
                );
            }
        }

        /*
         * Keep local compatibility too.
         */
        try {
            const legacy =
                getLegacyUser();

            if (legacy) {
                EYTStorage.saveUser({
                    ...legacy,
                    nome:
                        name
                });

                state.legacyUser =
                    {
                        ...legacy,
                        nome:
                            name
                    };
            }
        } catch (_) {
        }

        render();
    }


    /* === PROFILE CHANGE REQUEST START === */

    function configureProfileChangeRequest() {
        const button =
            document.getElementById(
                "profileRequestChange"
            );

        const registeredName =
            document.getElementById(
                "profileRegisteredName"
            );

        if (!button) {
            return;
        }

        const name =
            getDisplayName();

        const email =
            state.session?.user?.email ||
            state.profile?.email ||
            state.legacyUser?.email ||
            "";

        if (registeredName) {
            registeredName.textContent =
                name;
        }

        const message = [
            "Oi, Teacher Vanessa!",
            "",
            "Gostaria de solicitar uma alteração no meu cadastro do English in Your Time.",
            "",
            `Nome atual: ${name}`,
            email
                ? `E-mail: ${email}`
                : "",
            "",
            "Alteração que preciso solicitar:",
            ""
        ]
            .filter(Boolean)
            .join("\n");

        button.href =
            `https://wa.me/5512997157739?text=${
                encodeURIComponent(
                    message
                )
            }`;
    }

    /* === PROFILE CHANGE REQUEST END === */

    const authenticated =
        await requireAuthenticatedSession();

    if (!authenticated) {
        return;
    }

    state.legacyUser =
        getLegacyUser();

    try {
        EYTApp.evaluateAchievements();
    } catch (_) {
    }


    const logoutButton =
        document.getElementById(
            "logoutButton"
        );

    if (logoutButton) {
        logoutButton.onclick =
            async () => {
                logoutButton.disabled =
                    true;

                try {
                    if (
                        typeof EYTSupabase !==
                            "undefined" &&
                        typeof EYTSupabase.logout ===
                            "function"
                    ) {
                        await EYTSupabase
                            .logout();
                    }
                } catch (error) {
                    console.warn(
                        "[Perfil] Supabase logout:",
                        error
                    );
                }

                try {
                    if (
                        typeof EYTStorage !==
                            "undefined" &&
                        typeof EYTStorage.logout ===
                            "function"
                    ) {
                        EYTStorage.logout();
                    }
                } catch (_) {
                }

                location.replace(
                    "acesso.html"
                );
            };
    }

    const resetButton =
        document.getElementById(
            "resetButton"
        );

    if (resetButton) {
        resetButton.onclick =
            () => {
                if (
                    !confirm(
                        "Deseja realmente apagar todo o seu progresso?"
                    )
                ) {
                    return;
                }

                try {
                    EYTStorage
                        .resetProgress();
                } catch (_) {
                }

                render();
            };
    }

    render();

    configureProfileChangeRequest();

    console.info(
        "[Perfil] Authenticated profile ready.",
        {
            supabase:
                Boolean(
                    state.session
                ),

            legacy:
                Boolean(
                    state.legacyUser
                )
        }
    );
});
