(() => {
    "use strict";

    const MANIFEST_URL =
        "/audio/static/manifest.json";

    const decodedCache =
        new Map();

    const pending =
        new Map();

    let manifest =
        null;

    let audioContext =
        null;

    let currentSource =
        null;

    let currentButton =
        null;

    let currentKey =
        null;

    function normalize(text) {
        return String(
            text ?? ""
        )
            .replace(
                /\u00a0/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();
    }

    function getAudioContext() {
        if (audioContext) {
            return audioContext;
        }

        const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContextClass) {
            return null;
        }

        audioContext =
            new AudioContextClass({
                latencyHint:
                    "interactive"
            });

        return audioContext;
    }

    async function ensureAudioContext() {
        const context =
            getAudioContext();

        if (
            context &&
            context.state ===
                "suspended"
        ) {
            try {
                await context.resume();
            }
            catch (_) {
            }
        }

        return context;
    }

    async function loadManifest() {
        if (manifest) {
            return manifest;
        }

        try {
            const response =
                await fetch(
                    MANIFEST_URL,
                    {
                        cache:
                            "force-cache"
                    }
                );

            if (!response.ok) {
                throw new Error(
                    `Manifest HTTP ${response.status}`
                );
            }

            const json =
                await response.json();

            manifest =
                json.items ||
                {};

            console.info(
                `[EYTStaticAudio] ${Object.keys(manifest).length} static audios available.`
            );

            return manifest;
        }
        catch (error) {
            console.warn(
                "[EYTStaticAudio] Manifest unavailable:",
                error
            );

            manifest = {};

            return manifest;
        }
    }

    const manifestPromise =
        loadManifest();

    async function getUrl(text) {
        const items =
            await manifestPromise;

        return (
            items[
                normalize(text)
            ] ||
            null
        );
    }

    async function prepare(text) {
        const key =
            normalize(text);

        if (!key) {
            return null;
        }

        if (
            decodedCache.has(
                key
            )
        ) {
            return decodedCache.get(
                key
            );
        }

        if (
            pending.has(
                key
            )
        ) {
            return pending.get(
                key
            );
        }

        const promise =
            (
                async () => {
                    const url =
                        await getUrl(
                            key
                        );

                    if (!url) {
                        return null;
                    }

                    const context =
                        getAudioContext();

                    if (!context) {
                        return null;
                    }

                    const response =
                        await fetch(
                            url,
                            {
                                cache:
                                    "force-cache"
                            }
                        );

                    if (!response.ok) {
                        throw new Error(
                            `Audio HTTP ${response.status}`
                        );
                    }

                    const buffer =
                        await response
                            .arrayBuffer();

                    const decoded =
                        await context
                            .decodeAudioData(
                                buffer.slice(0)
                            );

                    decodedCache.set(
                        key,
                        decoded
                    );

                    return decoded;
                }
            )()
                .catch(
                    error => {
                        console.warn(
                            "[EYTStaticAudio] prepare:",
                            key,
                            error
                        );

                        return null;
                    }
                )
                .finally(
                    () => {
                        pending.delete(
                            key
                        );
                    }
                );

        pending.set(
            key,
            promise
        );

        return promise;
    }

    function resetButton() {
        if (
            currentButton
        ) {
            currentButton
                .classList
                .remove(
                    "is-speaking"
                );

            currentButton
                .setAttribute(
                    "aria-pressed",
                    "false"
                );
        }

        currentButton =
            null;
    }

    function stopStatic() {
        if (
            currentSource
        ) {
            try {
                currentSource.stop();
            }
            catch (_) {
            }

            try {
                currentSource.disconnect();
            }
            catch (_) {
            }
        }

        currentSource =
            null;
        currentKey =
            null;

        resetButton();
    }

    async function play(
        text,
        button = null
    ) {
        const key =
            normalize(text);

        if (
            currentSource &&
            currentKey === key
        ) {
            stopStatic();

            return false;
        }

        stopStatic();

        const decoded =
            await prepare(
                key
            );

        if (!decoded) {
            return null;
        }

        const context =
            await ensureAudioContext();

        if (!context) {
            return null;
        }

        const source =
            context.createBufferSource();

        source.buffer =
            decoded;

        source.connect(
            context.destination
        );

        currentSource =
            source;

        currentKey =
            key;

        currentButton =
            button;

        if (button) {
            button
                .classList
                .add(
                    "is-speaking"
                );

            button.setAttribute(
                "aria-pressed",
                "true"
            );
        }

        source.onended =
            () => {
                if (
                    currentSource ===
                    source
                ) {
                    currentSource =
                        null;

                    currentKey =
                        null;

                    resetButton();
                }

                try {
                    source.disconnect();
                }
                catch (_) {
                }
            };

        source.start(0);

        return true;
    }

    async function preloadMany(items) {
        const list =
            Array.isArray(items)
                ? items
                : [];

        const unique =
            [
                ...new Set(
                    list
                        .map(
                            item =>
                                typeof item ===
                                    "string"
                                    ? item
                                    : item?.text
                        )
                        .map(
                            normalize
                        )
                        .filter(Boolean)
                )
            ];

        let loaded =
            0;

        let index =
            0;

        const concurrency =
            Math.min(
                8,
                Math.max(
                    1,
                    unique.length
                )
            );

        async function runner() {
            while (
                index <
                unique.length
            ) {
                const position =
                    index++;

                const result =
                    await prepare(
                        unique[
                            position
                        ]
                    );

                if (result) {
                    loaded++;
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

        console.info(
            `[EYTStaticAudio] decoded ${loaded}/${unique.length} audios.`
        );

        return {
            total:
                unique.length,
            loaded,
            failed:
                unique.length -
                loaded
        };
    }

    function install() {
        const api =
            typeof EYTSpeech !==
                "undefined"
                ? EYTSpeech
                : window.EYTSpeech;

        if (!api) {
            return false;
        }

        if (
            api.__staticOfflineInstalled
        ) {
            return true;
        }

        window.EYTSpeech =
            api;

        const original = {
            speak:
                typeof api.speak ===
                    "function"
                    ? api.speak.bind(api)
                    : null,

            toggle:
                typeof api.toggle ===
                    "function"
                    ? api.toggle.bind(api)
                    : null,

            stop:
                typeof api.stop ===
                    "function"
                    ? api.stop.bind(api)
                    : null,

            getAudioState:
                typeof api.getAudioState ===
                    "function"
                    ? api.getAudioState.bind(api)
                    : null
        };

        /*
         * IMPORTANT:
         * Kokoro is NOT called by preload anymore.
         */
        api.preload =
            async function(text) {
                return Boolean(
                    await prepare(
                        text
                    )
                );
            };

        api.preloadMany =
            async function(items) {
                return preloadMany(
                    items
                );
            };

        api.warmup =
            async function() {
                await manifestPromise;

                getAudioContext();

                return true;
            };

        api.speak =
            async function(
                text,
                options = {}
            ) {
                const staticResult =
                    await play(
                        text,
                        options.button ||
                        null
                    );

                if (
                    staticResult !==
                    null
                ) {
                    return staticResult;
                }

                /*
                 * Fallback only when phrase is not in static library.
                 */
                if (
                    original.speak
                ) {
                    return original.speak(
                        text,
                        options
                    );
                }

                return false;
            };

        api.toggle =
            async function(
                text,
                button,
                options = {}
            ) {
                const staticResult =
                    await play(
                        text,
                        button
                    );

                if (
                    staticResult !==
                    null
                ) {
                    return staticResult;
                }

                if (
                    original.toggle
                ) {
                    return original.toggle(
                        text,
                        button,
                        options
                    );
                }

                return false;
            };

        api.speakEnglish =
            (
                text,
                options = {}
            ) =>
                api.speak(
                    text,
                    {
                        ...options,
                        lang:
                            options.lang ||
                            "en-US"
                    }
                );

        api.toggleEnglish =
            (
                text,
                button,
                options = {}
            ) =>
                api.toggle(
                    text,
                    button,
                    {
                        ...options,
                        lang:
                            options.lang ||
                            "en-US"
                    }
                );

        api.stop =
            function() {
                stopStatic();

                try {
                    original.stop?.();
                }
                catch (_) {
                }
            };

        api.getAudioState =
            function() {
                return {
                    engine:
                        "static-offline",

                    manifest:
                        Object.keys(
                            manifest ||
                            {}
                        ).length,

                    decoded:
                        decodedCache.size,

                    pending:
                        pending.size,

                    playing:
                        Boolean(
                            currentSource
                        ),

                    online:
                        navigator.onLine,

                    legacy:
                        original.getAudioState
                            ? original
                                .getAudioState()
                            : null
                };
            };

        api.__staticOfflineInstalled =
            true;

        window.EYTStaticAudio = {
            prepare,
            preloadMany,
            play,
            stop:
                stopStatic,

            getState() {
                return api
                    .getAudioState();
            },

            async has(text) {
                return Boolean(
                    await getUrl(
                        text
                    )
                );
            }
        };

        console.info(
            "[EYTStaticAudio] STATIC/OFFLINE engine installed."
        );

        return true;
    }

    if (!install()) {
        let attempts =
            0;

        const timer =
            setInterval(
                () => {
                    attempts++;

                    if (
                        install() ||
                        attempts >=
                            100
                    ) {
                        clearInterval(
                            timer
                        );
                    }
                },
                20
            );
    }
})();
