"use strict";

/*
 * IMPORTANTE:
 * O cache de audio continua cache-first.
 * HTML/JS/CSS usam network-first para nunca manter codigo antigo
 * depois de um novo deploy.
 */
const VERSION =
    "eyt-static-audio-v3";

const AUDIO_CACHE =
    `${VERSION}-audio`;

const APP_CACHE =
    `${VERSION}-app`;

const APP_SHELL = [
    "/",
    "/dashboard",
    "/dashboard.html",
    "/curso",
    "/curso.html",
    "/revisar",
    "/revisar.html",
    "/conquistas",
    "/conquistas.html",
    "/perfil",
    "/perfil.html",
    "/teacher",
    "/teacher.html",
    "/student-lesson.html",
    "/css/style.css",
    "/js/speech.js",
    "/js/static-audio.js",
    "/js/tts-preload.js",
    "/js/offline-register.js",
    "/audio/static/manifest.json"
];

self.addEventListener(
    "install",
    event => {
        self.skipWaiting();

        event.waitUntil(
            caches
                .open(APP_CACHE)
                .then(
                    cache =>
                        cache.addAll(
                            APP_SHELL
                        )
                )
                .catch(
                    error =>
                        console.warn(
                            "[EYT SW] shell:",
                            error
                        )
                )
        );
    }
);

self.addEventListener(
    "activate",
    event => {
        event.waitUntil(
            (
                async () => {
                    const names =
                        await caches.keys();

                    await Promise.all(
                        names
                            .filter(
                                name =>
                                    (
                                        name.startsWith(
                                            "eyt-static-audio-"
                                        )
                                    ) &&
                                    name !== AUDIO_CACHE &&
                                    name !== APP_CACHE
                            )
                            .map(
                                name =>
                                    caches.delete(
                                        name
                                    )
                            )
                    );

                    await self.clients.claim();

                    console.info(
                        `[EYT SW] Activated ${VERSION}`
                    );
                }
            )()
        );
    }
);

async function cacheFirst(
    request,
    cacheName
) {
    const cache =
        await caches.open(
            cacheName
        );

    const cached =
        await cache.match(
            request
        );

    if (cached) {
        return cached;
    }

    const response =
        await fetch(
            request
        );

    if (
        response &&
        response.ok
    ) {
        await cache.put(
            request,
            response.clone()
        );
    }

    return response;
}

async function networkFirst(
    request,
    cacheName,
    fallbackUrls = []
) {
    const cache =
        await caches.open(
            cacheName
        );

    try {
        const response =
            await fetch(
                request,
                {
                    cache:
                        "no-store"
                }
            );

        if (
            response &&
            response.ok
        ) {
            await cache.put(
                request,
                response.clone()
            );
        }

        return response;
    }
    catch (error) {
        const cached =
            await cache.match(
                request
            );

        if (cached) {
            return cached;
        }

        for (
            const fallbackUrl of
            fallbackUrls
        ) {
            const fallback =
                await cache.match(
                    fallbackUrl
                );

            if (fallback) {
                return fallback;
            }
        }

        throw error;
    }
}

function isApplicationCode(
    request,
    url
) {
    if (
        request.destination ===
            "script" ||
        request.destination ===
            "style" ||
        request.destination ===
            "document"
    ) {
        return true;
    }

    return (
        url.pathname.endsWith(
            ".js"
        ) ||
        url.pathname.endsWith(
            ".css"
        ) ||
        url.pathname.endsWith(
            ".html"
        )
    );
}

self.addEventListener(
    "fetch",
    event => {
        if (
            event.request.method !==
            "GET"
        ) {
            return;
        }

        const url =
            new URL(
                event.request.url
            );

        if (
            url.origin !==
            self.location.origin
        ) {
            return;
        }

        /*
         * AUDIO:
         * continua cache-first para manter os 800 audios offline.
         */
        if (
            url.pathname.startsWith(
                "/audio/static/"
            )
        ) {
            event.respondWith(
                cacheFirst(
                    event.request,
                    AUDIO_CACHE
                )
            );

            return;
        }

        /*
         * NAVEGACAO:
         * servidor primeiro.
         *
         * Assim /curso, /conquistas, /perfil etc nunca recebem
         * uma pagina antiga apenas porque havia cache.
         */
        if (
            event.request.mode ===
            "navigate"
        ) {
            event.respondWith(
                networkFirst(
                    event.request,
                    APP_CACHE,
                    [
                        "/dashboard",
                        "/dashboard.html"
                    ]
                )
            );

            return;
        }

        /*
         * JS / CSS / HTML:
         * SEMPRE tenta buscar a versao publicada primeiro.
         *
         * Este e o ponto que elimina o bug do JS antigo
         * redirecionando o aluno para a home.
         */
        if (
            isApplicationCode(
                event.request,
                url
            )
        ) {
            event.respondWith(
                networkFirst(
                    event.request,
                    APP_CACHE
                )
            );

            return;
        }

        /*
         * Imagens/fontes/outros assets podem continuar cache-first.
         */
        event.respondWith(
            cacheFirst(
                event.request,
                APP_CACHE
            )
        );
    }
);

async function cacheAudioLibrary(
    urls
) {
    const cache =
        await caches.open(
            AUDIO_CACHE
        );

    let cached = 0;
    let failed = 0;
    let index = 0;

    const concurrency = 4;

    async function runner() {
        while (
            index <
            urls.length
        ) {
            const position =
                index++;

            const url =
                urls[
                    position
                ];

            try {
                const existing =
                    await cache.match(
                        url
                    );

                if (existing) {
                    cached++;
                    continue;
                }

                const response =
                    await fetch(
                        url
                    );

                if (!response.ok) {
                    throw new Error(
                        `HTTP ${response.status}`
                    );
                }

                await cache.put(
                    url,
                    response
                );

                cached++;
            }
            catch (error) {
                failed++;

                console.warn(
                    "[EYT SW] audio:",
                    url,
                    error
                );
            }
        }
    }

    await Promise.all(
        Array.from(
            {
                length:
                    concurrency
            },
            runner
        )
    );

    const clients =
        await self.clients
            .matchAll({
                includeUncontrolled:
                    true
            });

    for (
        const client of
        clients
    ) {
        client.postMessage({
            type:
                "EYT_AUDIO_CACHE_COMPLETE",

            total:
                urls.length,

            cached,
            failed
        });
    }
}

self.addEventListener(
    "message",
    event => {
        if (
            event.data?.type ===
            "EYT_CACHE_AUDIO_LIBRARY"
        ) {
            const urls =
                Array.isArray(
                    event.data.urls
                )
                    ? event.data.urls
                    : [];

            event.waitUntil(
                cacheAudioLibrary(
                    urls
                )
            );
        }

        if (
            event.data?.type ===
            "EYT_SKIP_WAITING"
        ) {
            self.skipWaiting();
        }
    }
);