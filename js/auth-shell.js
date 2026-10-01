/* === AUTHENTICATED AREA GUARD START === */

async function EYTRequireAuthenticatedArea() {
    try {
        if (
            typeof EYTSupabase !== "undefined" &&
            typeof EYTSupabase.getSession === "function"
        ) {
            const session =
                await EYTSupabase.getSession();

            if (session) {
                return true;
            }
        }
    }
    catch (error) {
        console.warn(
            "[EYTAuthShell] Supabase session check:",
            error
        );
    }

    /*
     * Keep compatibility with older local sessions.
     */
    try {
        if (
            typeof EYTStorage !== "undefined" &&
            typeof EYTStorage.getUser === "function" &&
            EYTStorage.getUser()
        ) {
            return true;
        }
    }
    catch (_) {
    }

    /*
     * Authenticated pages NEVER redirect to public index.html.
     */
    location.replace(
        "acesso.html"
    );

    return false;
}

window.EYTRequireAuthenticatedArea =
    EYTRequireAuthenticatedArea;

/* === AUTHENTICATED AREA GUARD END === */

(() => {
    "use strict";

    function getCurrentPage() {
        return (
            location.pathname
                .split("/")
                .pop() ||
            "dashboard.html"
        ).toLowerCase();
    }

    function isActivePage(
        href
    ) {
        const current =
            getCurrentPage();

        const target =
            String(
                href || ""
            )
                .split("?")[0]
                .split("#")[0]
                .toLowerCase();

        return (
            current === target ||
            (
                current === "" &&
                target === "dashboard.html"
            )
        );
    }

    function normalizeInternalLinks() {
        document
            .querySelectorAll(
                ".sidebar-nav a, .mobile-bottom-nav a"
            )
            .forEach(
                link => {
                    const text =
                        String(
                            link.textContent ||
                            ""
                        )
                            .replace(/\s+/g, " ")
                            .trim()
                            .toLowerCase();

                    if (
                        text === "início" ||
                        text === "inicio"
                    ) {
                        link.href =
                            "dashboard.html";
                    }

                    if (
                        text === "aprender"
                    ) {
                        link.href =
                            "curso.html";
                    }

                    if (
                        text === "revisar"
                    ) {
                        link.href =
                            "revisar.html";
                    }

                    if (
                        text === "conquistas"
                    ) {
                        link.href =
                            "conquistas.html";
                    }

                    if (
                        text.includes(
                            "teacher vanessa"
                        )
                    ) {
                        link.href =
                            "/teacher";
                    }

                    if (
                        text === "perfil"
                    ) {
                        link.href =
                            "perfil.html";
                    }

                    link.classList.toggle(
                        "active",
                        isActivePage(
                            link.getAttribute(
                                "href"
                            )
                        )
                    );
                }
            );
    }

    function fixTeacherLinks() {
        document
            .querySelectorAll(
                "a"
            )
            .forEach(
                link => {
                    const text =
                        String(
                            link.textContent ||
                            ""
                        )
                            .replace(/\s+/g, " ")
                            .trim()
                            .toLowerCase();

                    if (
                        text.includes(
                            "conhecer a teacher"
                        ) ||
                        text.includes(
                            "conheça sua teacher"
                        ) ||
                        text ===
                            "teacher vanessa"
                    ) {
                        link.href =
                            "/teacher";
                    }
                }
            );

        const mobileSiteButton =
            document.querySelector(
                ".mobile-site-button"
            );

        if (
            mobileSiteButton
        ) {
            mobileSiteButton.href =
                "/teacher";

            mobileSiteButton.setAttribute(
                "aria-label",
                "Teacher Vanessa"
            );

            mobileSiteButton.setAttribute(
                "title",
                "Teacher Vanessa"
            );

            mobileSiteButton.innerHTML = `
                <i
                    class="bi bi-mortarboard"
                    aria-hidden="true">
                </i>
            `;
        }
    }

    async function logout() {
        const buttons =
            document.querySelectorAll(
                "[data-eyt-logout]"
            );

        buttons.forEach(
            button => {
                button.disabled =
                    true;
            }
        );

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
        }
        catch (error) {
            console.warn(
                "[EYTAuthShell] Supabase logout:",
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
        }
        catch (_) {
        }

        location.href =
            "acesso.html";
    }

    function createLogoutButton() {
        const sidebar =
            document.querySelector(
                ".sidebar"
            );

        if (
            !sidebar ||
            sidebar.querySelector(
                "[data-eyt-logout]"
            )
        ) {
            return;
        }

        let sidebarBottom =
            sidebar.querySelector(
                ".sidebar-bottom"
            );

        if (!sidebarBottom) {
            sidebarBottom =
                document.createElement(
                    "div"
                );

            sidebarBottom.className =
                "sidebar-bottom";

            sidebar.appendChild(
                sidebarBottom
            );
        }

        const button =
            document.createElement(
                "button"
            );

        button.type =
            "button";

        button.className = "sidebar-site-link sidebar-logout-button";

        button.dataset
            .eytLogout =
            "";

        button.innerHTML = `
            <span class="sidebar-site-link-icon">
                <i
                    class="bi bi-box-arrow-right"
                    aria-hidden="true">
                </i>
            </span>

            <div>
                <strong>
                    Sair da conta
                </strong>

                <span>
                    Encerrar sessão
                </span>
            </div>
        `;

        button.addEventListener(
            "click",
            logout
        );

        sidebarBottom.appendChild(
            button
        );
    }

    function bindExistingLogout() {
        const existing =
            document.getElementById(
                "logoutButton"
            );

        if (!existing) {
            return;
        }

        /*
         * Clone removes the old perfil.js onclick/listener
         * before we attach the authenticated logout.
         */
        const replacement =
            existing.cloneNode(
                true
            );

        replacement.dataset
            .eytLogout =
            "";

        existing.replaceWith(
            replacement
        );

        replacement.addEventListener(
            "click",
            logout
        );
    }

    function alignMobileHeader() {
        const header =
            document.querySelector(
                ".mobile-header"
            );

        if (!header) {
            return;
        }

        const stats =
            header.querySelector(
                ".mobile-header-stats"
            );

        if (!stats) {
            return;
        }

        stats.classList.add(
            "mobile-header-stats-fixed"
        );
    }

    function init() {
        normalizeInternalLinks();
        fixTeacherLinks();
        createLogoutButton();
        bindExistingLogout();
        alignMobileHeader();

        window.EYTAuthShell = {
            logout,
            normalizeInternalLinks
        };

        console.info(
            "[EYTAuthShell] Ready."
        );
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            init,
            {
                once: true
            }
        );
    }
    else {
        init();
    }
})();
