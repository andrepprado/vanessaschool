"use strict";

const VERSION =
    "eyt-static-audio-v2";

const AUDIO_CACHE =
    `${VERSION}-audio`;

const APP_CACHE =
    `${VERSION}-app`;

const APP_SHELL = [
    "/",
    "/dashboard",
    "/dashboard.html",
    "/student-lesson.html",
    "/css/style.css",
    "/js/speech.js",
    "/js/static-audio.js",
    "/js/tts-preload.js",
    "/js/offline-register.js",
    "/audio/static/manifest.json",
    "/audio/feedback/correct.wav",
    "/audio/feedback/incorrect.wav",
    "/audio/feedback/finish.mp3"
];

self.addEventListener(
    "install",
    event => {
        self.skipWaiting();

        event.waitUntil(
            caches.open(
                APP_CACHE
            )
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
                                    name.startsWith(
                                        "eyt-static-audio-"
                                    ) &&
                                    name !==
                                        AUDIO_CACHE &&
                                    name !==
                                        APP_CACHE
                            )
                            .map(
                                name =>
                                    caches.delete(
                                        name
                                    )
                            )
                    );

                    await self.clients
                        .claim();
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

        if (
            (
                url.pathname.startsWith(
                    "/audio/static/"
                ) ||
                url.pathname.startsWith(
                    "/audio/feedback/"
                )
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

        if (
            event.request.mode ===
            "navigate"
        ) {
            event.respondWith(
                (
                    async () => {
                        try {
                            const response =
                                await fetch(
                                    event.request
                                );

                            const cache =
                                await caches.open(
                                    APP_CACHE
                                );

                            await cache.put(
                                event.request,
                                response.clone()
                            );

                            return response;
                        }
                        catch (_) {
                            const cache =
                                await caches.open(
                                    APP_CACHE
                                );

                            return (
                                await cache.match(
                                    event.request
                                ) ||
                                await cache.match(
                                    "/dashboard.html"
                                ) ||
                                await cache.match(
                                    "/"
                                )
                            );
                        }
                    }
                )()
            );

            return;
        }

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

    let cached =
        0;

    let failed =
        0;

    let index =
        0;

    const concurrency =
        4;

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
    }
);
