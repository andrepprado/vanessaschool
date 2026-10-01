document.addEventListener(
    "DOMContentLoaded",
    () => {
        const form =
            document.getElementById(
                "studentLoginForm"
            );

        const email =
            document.getElementById(
                "loginEmail"
            );

        const password =
            document.getElementById(
                "loginPassword"
            );

        const message =
            document.getElementById(
                "loginMessage"
            );

        const button =
            document.getElementById(
                "loginButton"
            );

        const year =
            document.getElementById(
                "currentYear"
            );

        if (year) {
            year.textContent =
                new Date().getFullYear();
        }

        async function redirectExistingSession() {
            try {
                const session =
                    await EYTSupabase
                        .getSession();

                if (!session) {
                    return;
                }

                const profile =
                    await EYTSupabase
                        .getProfile();

                if (
                    !profile ||
                    !profile.active
                ) {
                    return;
                }

                location.href =
                    profile.role === "admin"
                        ? "/admin"
                        : "/dashboard";
            } catch (error) {
                console.error(error);
            }
        }

        form.addEventListener(
            "submit",
            async event => {
                event.preventDefault();

                message.textContent = "";
                message.className =
                    "auth-message";

                button.disabled = true;
                button.innerHTML =
                    '<span class="auth-spinner"></span> Entrando...';

                try {
                    const client =
                        await EYTSupabase
                            .getClient();

                    const {
                        data,
                        error
                    } = await client
                        .auth
                        .signInWithPassword({
                            email:
                                email
                                    .value
                                    .trim(),
                            password:
                                password
                                    .value
                        });

                    if (error) {
                        throw error;
                    }

                    if (
                        !data ||
                        !data.session
                    ) {
                        throw new Error(
                            "Sessão não criada."
                        );
                    }

                    const profile =
                        await EYTSupabase
                            .getProfile();

                    if (!profile) {
                        throw new Error(
                            "Perfil não encontrado."
                        );
                    }

                    if (!profile.active) {
                        await client
                            .auth
                            .signOut();

                        throw new Error(
                            "Este usuário está desativado."
                        );
                    }

                    location.href =
                        profile.role === "admin"
                            ? "/admin"
                            : "/dashboard";
                } catch (error) {
                    console.error(error);

                    message.textContent =
                        String(
                            error.message ||
                            ""
                        )
                            .toLowerCase()
                            .includes(
                                "invalid login"
                            )
                            ? "E-mail ou senha inválidos."
                            : error.message;

                    message.className =
                        "auth-message error";
                } finally {
                    button.disabled = false;
                    button.innerHTML =
                        'Entrar na plataforma <i class="bi bi-arrow-right"></i>';
                }
            }
        );

        redirectExistingSession();
    }
);