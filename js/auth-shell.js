/* === FIREBASE STUDENT AREA GUARD === */

async function EYTRequireAuthenticatedArea() {
    try {
        const { studentAuth } = await import("./firebase-config.js");

        await studentAuth.authStateReady();

        const user = studentAuth.currentUser;

        if (!user) {
            window.location.replace("/acesso");
            return false;
        }

        const token = await user.getIdToken();

        const response = await fetch("/api/session-profile", {
            headers: {
                Authorization: `Bearer ${token}`
            },
            cache: "no-store"
        });

        if (!response.ok) {
            window.location.replace("/acesso");
            return false;
        }

        const profile = await response.json();

        if (profile.role !== "student" || profile.active !== true) {
            window.location.replace("/acesso");
            return false;
        }

        return true;
    } catch (error) {
        console.warn("[EYTAuthShell] Firebase authorization:", error);
        window.location.replace("/acesso");
        return false;
    }
}

window.EYTRequireAuthenticatedArea = EYTRequireAuthenticatedArea;

/* === FIREBASE STUDENT AREA GUARD END === */
(() => {
    "use strict";

    function getCurrentPage() {
        return (
            location.pathname
                .split("/")
                .pop() ||
            "/dashboard"
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
                target === "/dashboard"
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
                            "/dashboard";
                    }

                    if (
                        text === "aprender"
                    ) {
                        link.href =
                            "/curso";
                    }

                    if (
                        text === "revisar"
                    ) {
                        link.href =
                            "/revisar";
                    }

                    if (
                        text === "conquistas"
                    ) {
                        link.href =
                            "/conquistas";
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
                            "/perfil";
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
        const buttons = document.querySelectorAll(
            "[data-eyt-logout]"
        );

        buttons.forEach(button => {
            button.disabled = true;
        });

        try {
            const { studentAuth } =
                await import("./firebase-config.js");

            const { signOut } = await import(
                "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js"
            );

            await studentAuth.authStateReady();
            await signOut(studentAuth);

            window.location.replace("/acesso");
        } catch (error) {
            console.error("[EYTAuthShell] Logout failed:", error);

            buttons.forEach(button => {
                button.disabled = false;
            });
        }
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
