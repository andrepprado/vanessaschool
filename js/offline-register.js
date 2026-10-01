(() => {
    "use strict";

    if (
        !(
            "serviceWorker" in
            navigator
        )
    ) {
        return;
    }

    async function initialize() {
        try {
            const registration =
                await navigator
                    .serviceWorker
                    .register(
                        "/sw.js",
                        {
                            scope:
                                "/"
                        }
                    );

            const ready =
                await navigator
                    .serviceWorker
                    .ready;

            console.info(
                "[EYTOffline] Service Worker ready."
            );

            const response =
                await fetch(
                    "/audio/static/manifest.json",
                    {
                        cache:
                            "force-cache"
                    }
                );

            if (!response.ok) {
                return;
            }

            const manifest =
                await response.json();

            const urls =
                [
                    ...new Set(
                        Object.values(
                            manifest.items ||
                            {}
                        )
                    )
                ];

            const worker =
                ready.active ||
                registration.active;

            if (
                worker &&
                urls.length
            ) {
                worker.postMessage({
                    type:
                        "EYT_CACHE_AUDIO_LIBRARY",

                    urls
                });

                console.info(
                    `[EYTOffline] Background cache requested for ${urls.length} audios.`
                );
            }
        }
        catch (error) {
            console.warn(
                "[EYTOffline]",
                error
            );
        }
    }

    navigator.serviceWorker
        .addEventListener(
            "message",
            event => {
                if (
                    event.data?.type ===
                    "EYT_AUDIO_CACHE_COMPLETE"
                ) {
                    console.info(
                        `[EYTOffline] OFFLINE AUDIO READY: ${event.data.cached}/${event.data.total}; failed=${event.data.failed}`
                    );

                    window.dispatchEvent(
                        new CustomEvent(
                            "eyt:offline-audio-ready",
                            {
                                detail:
                                    event.data
                            }
                        )
                    );
                }
            }
        );

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            {
                once:
                    true
            }
        );
    }
    else {
        initialize();
    }
})();
