document.addEventListener(
    "DOMContentLoaded",
    () => {
        const form =
            document.getElementById(
                "adminLoginForm"
            );

        const message =
            document.getElementById(
                "adminLoginMessage"
            );

        const button =
            document.getElementById(
                "adminLoginButton"
            );

        form.addEventListener(
            "submit",
            async event => {
                event.preventDefault();

                message.textContent = "";
                message.className =
                    "auth-message";

                button.disabled = true;

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
                                document
                                    .getElementById(
                                        "adminEmail"
                                    )
                                    .value
                                    .trim(),
                            password:
                                document
                                    .getElementById(
                                        "adminPassword"
                                    )
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
                            "Sessão administrativa não criada."
                        );
                    }

                    const profile =
                        await EYTSupabase
                            .getProfile();

                    if (
                        !profile ||
                        profile.role !==
                            "admin" ||
                        !profile.active
                    ) {
                        await client
                            .auth
                            .signOut();

                        throw new Error(
                            "Usuário sem permissão administrativa."
                        );
                    }

                    location.href =
                        "/admin";
                } catch (error) {
                    console.error(error);

                    message.textContent =
                        "E-mail, senha ou permissão administrativa inválidos.";

                    message.className =
                        "auth-message error";
                } finally {
                    button.disabled =
                        false;
                }
            }
        );
    }
);