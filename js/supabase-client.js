const EYTSupabase = (() => {
    let clientPromise = null;

    async function getClient() {
        if (!clientPromise) {
            clientPromise =
                (async () => {
                    const response =
                        await fetch(
                            "/api/public-config",
                            {
                                cache:
                                    "no-store"
                            }
                        );

                    if (!response.ok) {
                        throw new Error(
                            "Não foi possível carregar a configuração de acesso."
                        );
                    }

                    const config =
                        await response.json();

                    if (
                        !window.supabase ||
                        !window.supabase.createClient
                    ) {
                        throw new Error(
                            "Supabase JS não foi carregado."
                        );
                    }

                    return window.supabase
                        .createClient(
                            config.url,
                            config.publishableKey,
                            {
                                auth: {
                                    persistSession: true,
                                    autoRefreshToken: true,
                                    detectSessionInUrl: true
                                }
                            }
                        );
                })();
        }

        return clientPromise;
    }

    async function getSession() {
        const client =
            await getClient();

        const {
            data,
            error
        } = await client
            .auth
            .getSession();

        if (error) {
            throw error;
        }

        return data.session;
    }

    async function getProfile() {
        const client =
            await getClient();

        const session =
            await getSession();

        if (!session) {
            return null;
        }

        const {
            data,
            error
        } = await client
            .from("profiles")
            .select(
                "id,email,name,role,level,active"
            )
            .eq(
                "id",
                session.user.id
            )
            .single();

        if (error) {
            throw error;
        }

        return data;
    }

    async function logout() {
        const client =
            await getClient();

        await client
            .auth
            .signOut();
    }

    return {
        getClient,
        getSession,
        getProfile,
        logout
    };
})();