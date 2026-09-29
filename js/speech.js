const EYTSpeech = (() => {
    "use strict";

    const CONFIG = {
        workerPath:
            "/js/tts/kokoro-worker.js",

        cacheName:
            "eyt-kokoro-audio-v3",

        englishLang:
            "en-GB",

        portugueseLang:
            "pt-BR",

        englishRate:
            0.90,

        portugueseRate:
            0.97,

        slowEnglishRate:
            0.76,

        maxMemoryEntries:
            80,

        autoWarmup:
            true,

        debug:
            false,

        errorBannerDuration:
            12000
    };

    let worker =
        null;

    let workerReady =
        false;

    let workerInitPromise =
        null;

    let workerRuntime =
        null;

    let messageId =
        0;

    let playSessionId =
        0;

    let currentSession =
        null;

    let currentButton =
        null;

    let currentSource =
        null;

    let currentAudioElement =
        null;

    let currentObjectUrl =
        null;

    let audioContext =
        null;

    let audioUnlocked =
        false;

    const pending =
        new Map();

    const memoryCache =
        new Map();

    /* ==========================================================================
       HELPERS
       ========================================================================== */

    function cleanText(
        value
    ) {
        return String(
            value ?? ""
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

    function normalize(
        value
    ) {
        return cleanText(
            value
        )
            .toLowerCase()
            .normalize(
                "NFD"
            )
            .replace(
                /[\u0300-\u036f]/g,
                ""
            );
    }

    function normalizeLang(
        value
    ) {
        return String(
            value ||
            ""
        )
            .toLowerCase()
            .startsWith(
                "pt"
            )
            ? CONFIG
                .portugueseLang
            : CONFIG
                .englishLang;
    }

    function clamp(
        value,
        min,
        max,
        fallback
    ) {
        const number =
            Number(
                value
            );

        return Number.isFinite(
            number
        )
            ? Math.min(
                max,
                Math.max(
                    min,
                    number
                )
            )
            : fallback;
    }

    function isSupported() {
        return (
            typeof Worker !==
            "undefined" &&

            typeof Audio !==
            "undefined" &&

            typeof WebAssembly !==
            "undefined" &&

            typeof fetch ===
            "function"
        );
    }

    function dispatch(
        name,
        detail = {}
    ) {
        try {
            window
                .dispatchEvent(
                    new CustomEvent(
                        name,
                        {
                            detail
                        }
                    )
                );
        } catch (_) {
        }
    }

    function log(
        ...args
    ) {
        if (
            CONFIG.debug
        ) {
            console.log(
                "[EYTSpeech]",
                ...args
            );
        }
    }

    /* ==========================================================================
       ERROS VISÍVEIS

       Útil principalmente no celular, onde normalmente não temos console.
       ========================================================================== */

    function humanError(
        error
    ) {
        const text =
            String(
                error?.message ||
                error ||
                "Falha desconhecida no áudio."
            );

        if (
            /Failed to fetch|fetch|CORS/i
                .test(
                    text
                )
        ) {
            return "Não foi possível baixar os arquivos do motor de voz. Verifique a conexão e tente novamente.";
        }

        if (
            /memory|out of memory/i
                .test(
                    text
                )
        ) {
            return "O dispositivo não possui memória suficiente para carregar a voz neural. Feche outras abas e tente novamente.";
        }

        if (
            /backend|wasm|webgpu/i
                .test(
                    text
                )
        ) {
            return "O motor de voz não conseguiu iniciar neste dispositivo. O sistema tentou WebGPU/WASM automaticamente.";
        }

        if (
            /play|NotAllowedError|gesture/i
                .test(
                    text
                )
        ) {
            return "O navegador bloqueou a reprodução automática. Toque novamente no alto-falante para liberar o áudio.";
        }

        return text;
    }

    function showErrorBanner(
        message
    ) {
        let banner =
            document
                .getElementById(
                    "eytSpeechErrorBanner"
                );

        if (
            !banner
        ) {
            banner =
                document
                    .createElement(
                        "div"
                    );

            banner.id =
                "eytSpeechErrorBanner";

            banner
                .setAttribute(
                    "role",
                    "alert"
                );

            Object.assign(
                banner.style,
                {
                    position:
                        "fixed",

                    left:
                        "12px",

                    right:
                        "12px",

                    bottom:
                        "12px",

                    zIndex:
                        "99999",

                    padding:
                        "12px 14px",

                    borderRadius:
                        "12px",

                    background:
                        "#B00020",

                    color:
                        "#fff",

                    font:
                        "600 14px/1.35 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",

                    boxShadow:
                        "0 8px 24px rgba(0,0,0,.25)",

                    textAlign:
                        "center"
                }
            );

            document.body
                .appendChild(
                    banner
                );
        }

        banner.textContent =
            `Áudio: ${message}`;

        banner.hidden =
            false;

        clearTimeout(
            showErrorBanner.timer
        );

        showErrorBanner.timer =
            setTimeout(
                () => {
                    if (
                        banner
                    ) {
                        banner.hidden =
                            true;
                    }
                },
                CONFIG
                    .errorBannerDuration
            );
    }

    function hideErrorBanner() {
        const banner =
            document
                .getElementById(
                    "eytSpeechErrorBanner"
                );

        if (
            banner
        ) {
            banner.hidden =
                true;
        }
    }

    /* ==========================================================================
       AUDIO CONTEXT

       A saída de áudio utilizada é a saída padrão do sistema operacional.

       Exemplo:
       - Bluetooth
       - P2
       - USB
       - alto-falante

       Não tentamos selecionar manualmente o dispositivo.
       ========================================================================== */

    function getAudioContext() {
        if (
            audioContext
        ) {
            return audioContext;
        }

        const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;

        if (
            !AudioContextClass
        ) {
            return null;
        }

        audioContext =
            new AudioContextClass({
                latencyHint:
                    "interactive"
            });

        return audioContext;
    }

    function unlockAudio() {
        const context =
            getAudioContext();

        if (
            !context
        ) {
            return Promise.resolve(
                false
            );
        }

        try {
            const resumePromise =
                context.state ===
                    "suspended"
                    ? context.resume()
                    : Promise.resolve();

            /*
             * Reprodução silenciosa mínima.
             *
             * Isso registra o gesto do usuário no AudioContext.
             * É especialmente importante no Safari/iOS.
             */

            const buffer =
                context.createBuffer(
                    1,
                    1,
                    22050
                );

            const source =
                context
                    .createBufferSource();

            source.buffer =
                buffer;

            source.connect(
                context.destination
            );

            source.start(
                0
            );

            return Promise
                .resolve(
                    resumePromise
                )
                .then(
                    () => {
                        audioUnlocked =
                            context.state ===
                            "running";

                        return audioUnlocked;
                    }
                )
                .catch(
                    () =>
                        false
                );
        } catch (_) {
            return Promise.resolve(
                false
            );
        }
    }

    /* ==========================================================================
       OBJECT URL
       ========================================================================== */

    function releaseObjectUrl() {
        if (
            !currentObjectUrl
        ) {
            return;
        }

        try {
            URL
                .revokeObjectURL(
                    currentObjectUrl
                );
        } catch (_) {
        }

        currentObjectUrl =
            null;
    }

    /* ==========================================================================
       STOP PLAYBACK
       ========================================================================== */

    function stopPlaybackOnly() {
        if (
            currentSource
        ) {
            try {
                currentSource
                    .stop(
                        0
                    );
            } catch (_) {
            }

            try {
                currentSource
                    .disconnect();
            } catch (_) {
            }

            currentSource =
                null;
        }

        if (
            currentAudioElement
        ) {
            try {
                currentAudioElement
                    .pause();

                currentAudioElement
                    .currentTime =
                    0;
            } catch (_) {
            }

            currentAudioElement =
                null;
        }

        releaseObjectUrl();
    }

    /* ==========================================================================
       BOTÃO
       ========================================================================== */

    function rememberButton(
        button
    ) {
        if (
            !button
        ) {
            return;
        }

        if (
            !button
                .dataset
                .eytOriginalLabel
        ) {
            button
                .dataset
                .eytOriginalLabel =
                button
                    .getAttribute(
                        "aria-label"
                    ) ||
                button
                    .getAttribute(
                        "title"
                    ) ||
                "Ouvir pronúncia";
        }
    }

    function activateButton(
        button
    ) {
        if (
            !button
        ) {
            return;
        }

        rememberButton(
            button
        );

        if (
            currentButton &&
            currentButton !==
            button
        ) {
            resetButton(
                currentButton
            );
        }

        currentButton =
            button;

        button
            .classList
            .add(
                "is-speaking"
            );

        button
            .setAttribute(
                "aria-pressed",
                "true"
            );

        button
            .setAttribute(
                "aria-label",
                "Preparando áudio"
            );

        button
            .setAttribute(
                "title",
                "Preparando áudio"
            );
    }

    function setButtonPlaying(
        button
    ) {
        if (
            !button
        ) {
            return;
        }

        button
            .setAttribute(
                "aria-label",
                "Parar áudio"
            );

        button
            .setAttribute(
                "title",
                "Parar áudio"
            );
    }

    function resetButton(
        button =
            currentButton
    ) {
        if (
            !button
        ) {
            return;
        }

        button
            .classList
            .remove(
                "is-speaking"
            );

        button
            .setAttribute(
                "aria-pressed",
                "false"
            );

        const label =
            button
                .dataset
                .eytOriginalLabel ||
            "Ouvir pronúncia";

        button
            .setAttribute(
                "aria-label",
                label
            );

        button
            .setAttribute(
                "title",
                label
            );

        if (
            button ===
            currentButton
        ) {
            currentButton =
                null;
        }
    }

    /* ==========================================================================
       HASH
       ========================================================================== */

    function hashString(
        value
    ) {
        let h1 =
            0xdeadbeef ^
            value.length;

        let h2 =
            0x41c6ce57 ^
            value.length;

        for (
            let i = 0, ch;
            i < value.length;
            i += 1
        ) {
            ch =
                value
                    .charCodeAt(
                        i
                    );

            h1 =
                Math.imul(
                    h1 ^ ch,
                    2654435761
                );

            h2 =
                Math.imul(
                    h2 ^ ch,
                    1597334677
                );
        }

        h1 =
            Math.imul(
                h1 ^
                (
                    h1 >>>
                    16
                ),
                2246822507
            ) ^
            Math.imul(
                h2 ^
                (
                    h2 >>>
                    13
                ),
                3266489909
            );

        h2 =
            Math.imul(
                h2 ^
                (
                    h2 >>>
                    16
                ),
                2246822507
            ) ^
            Math.imul(
                h1 ^
                (
                    h1 >>>
                    13
                ),
                3266489909
            );

        return (
            4294967296 *
            (
                2097151 &
                h2
            ) +
            (
                h1 >>>
                0
            )
        )
            .toString(
                36
            );
    }

    /* ==========================================================================
       CACHE
       ========================================================================== */

    function cacheKey(
        segment
    ) {
        return hashString(
            JSON.stringify({
                v:
                    3,

                text:
                    segment.text,

                lang:
                    segment.lang,

                speed:
                    segment.speed,

                persona:
                    segment.persona,

                voice:
                    segment.voice ||
                    ""
            })
        );
    }

    function cacheRequest(
        key
    ) {
        return new Request(
            `${location.origin}/__eyt_kokoro_cache__/${encodeURIComponent(
                key
            )}.wav`
        );
    }

    function trimMemoryCache() {
        while (
            memoryCache.size >
            CONFIG.maxMemoryEntries
        ) {
            const first =
                memoryCache
                    .keys()
                    .next()
                    .value;

            memoryCache
                .delete(
                    first
                );
        }
    }

    async function getCachedBlob(
        key
    ) {
        if (
            memoryCache
                .has(
                    key
                )
        ) {
            const blob =
                memoryCache
                    .get(
                        key
                    );

            memoryCache
                .delete(
                    key
                );

            memoryCache
                .set(
                    key,
                    blob
                );

            return blob;
        }

        if (
            typeof caches ===
            "undefined"
        ) {
            return null;
        }

        try {
            const cache =
                await caches
                    .open(
                        CONFIG
                            .cacheName
                    );

            const response =
                await cache
                    .match(
                        cacheRequest(
                            key
                        )
                    );

            if (
                !response
            ) {
                return null;
            }

            const blob =
                await response
                    .blob();

            memoryCache
                .set(
                    key,
                    blob
                );

            trimMemoryCache();

            return blob;
        } catch (_) {
            return null;
        }
    }

    async function setCachedBlob(
        key,
        blob
    ) {
        memoryCache
            .set(
                key,
                blob
            );

        trimMemoryCache();

        if (
            typeof caches ===
            "undefined"
        ) {
            return;
        }

        try {
            const cache =
                await caches
                    .open(
                        CONFIG
                            .cacheName
                    );

            await cache
                .put(
                    cacheRequest(
                        key
                    ),
                    new Response(
                        blob,
                        {
                            headers: {
                                "Content-Type":
                                    blob.type ||
                                    "audio/wav",

                                "Cache-Control":
                                    "public, max-age=31536000"
                            }
                        }
                    )
                );
        } catch (_) {
        }
    }

    /* ==========================================================================
       WORKER
       ========================================================================== */

    function handleWorkerMessage(
        event
    ) {
        const message =
            event.data ||
            {};

        if (
            message.type ===
            "engine-status"
        ) {
            if (
                message.device
            ) {
                workerRuntime = {
                    device:
                        message.device,

                    dtype:
                        message.dtype,

                    reason:
                        message.reason ||
                        null
                };
            }

            dispatch(
                "eyt:speech-engine-status",
                message
            );

            log(
                "engine-status",
                message
            );

            return;
        }

        if (
            message.type ===
            "init-complete"
        ) {
            workerReady =
                true;

            workerRuntime =
                message.runtime ||
                workerRuntime;

            dispatch(
                "eyt:speech-engine-ready",
                {
                    runtime:
                        workerRuntime
                }
            );

            return;
        }

        if (
            message.type ===
            "init-error"
        ) {
            workerReady =
                false;

            dispatch(
                "eyt:speech-engine-error",
                {
                    error:
                        message.error
                }
            );

            return;
        }

        if (
            message.id ==
            null
        ) {
            return;
        }

        const request =
            pending
                .get(
                    message.id
                );

        if (
            !request
        ) {
            return;
        }

        if (
            message.type ===
            "generation-complete"
        ) {
            pending
                .delete(
                    message.id
                );

            request
                .resolve({
                    blob:
                        message.blob,

                    voice:
                        message.voice,

                    lang:
                        message.lang,

                    runtime:
                        message.runtime
                });

            return;
        }

        if (
            message.type ===
            "generation-error"
        ) {
            pending
                .delete(
                    message.id
                );

            request
                .reject(
                    new Error(
                        message.error ||
                        "Falha ao gerar áudio."
                    )
                );
        }
    }

    function handleWorkerError(
        event
    ) {
        const error =
            new Error(
                event?.message ||
                "Falha no motor Kokoro."
            );

        for (
            const [
                ,
                request
            ]
            of pending
        ) {
            request
                .reject(
                    error
                );
        }

        pending
            .clear();

        workerReady =
            false;

        workerInitPromise =
            null;

        dispatch(
            "eyt:speech-engine-error",
            {
                error:
                    error.message
            }
        );

        showErrorBanner(
            humanError(
                error
            )
        );
    }

    function createWorker() {
        if (
            worker
        ) {
            return worker;
        }

        worker =
            new Worker(
                CONFIG.workerPath,
                {
                    type:
                        "module",

                    name:
                        "eyt-kokoro-tts"
                }
            );

        worker
            .addEventListener(
                "message",
                handleWorkerMessage
            );

        worker
            .addEventListener(
                "error",
                handleWorkerError
            );

        return worker;
    }

    function ensureWorker() {
        if (
            !isSupported()
        ) {
            return Promise
                .reject(
                    new Error(
                        "Este navegador não suporta o motor de voz local."
                    )
                );
        }

        if (
            workerReady
        ) {
            return Promise
                .resolve(
                    workerRuntime
                );
        }

        if (
            workerInitPromise
        ) {
            return workerInitPromise;
        }

        workerInitPromise =
            new Promise(
                (
                    resolve,
                    reject
                ) => {
                    const instance =
                        createWorker();

                    let finished =
                        false;

                    const onReady =
                        event => {
                            if (
                                finished
                            ) {
                                return;
                            }

                            finished =
                                true;

                            cleanup();

                            resolve(
                                event
                                    .detail
                                    ?.runtime ||
                                workerRuntime
                            );
                        };

                    const onError =
                        event => {
                            if (
                                finished
                            ) {
                                return;
                            }

                            finished =
                                true;

                            cleanup();

                            workerInitPromise =
                                null;

                            reject(
                                new Error(
                                    event
                                        .detail
                                        ?.error ||
                                    "Não foi possível iniciar o Kokoro."
                                )
                            );
                        };

                    const cleanup =
                        () => {
                            window
                                .removeEventListener(
                                    "eyt:speech-engine-ready",
                                    onReady
                                );

                            window
                                .removeEventListener(
                                    "eyt:speech-engine-error",
                                    onError
                                );
                        };

                    window
                        .addEventListener(
                            "eyt:speech-engine-ready",
                            onReady
                        );

                    window
                        .addEventListener(
                            "eyt:speech-engine-error",
                            onError
                        );

                    instance
                        .postMessage({
                            type:
                                "init"
                        });
                }
            );

        return workerInitPromise;
    }

    function requestGeneration(
        segment
    ) {
        return new Promise(
            (
                resolve,
                reject
            ) => {
                const id =
                    ++messageId;

                pending
                    .set(
                        id,
                        {
                            resolve,
                            reject
                        }
                    );

                createWorker()
                    .postMessage({
                        type:
                            "generate",

                        id,

                        text:
                            segment.text,

                        lang:
                            segment.lang,

                        speed:
                            segment.speed,

                        persona:
                            segment.persona,

                        voice:
                            segment.voice ||
                            ""
                    });
            }
        );
    }

    async function getGeneratedAudio(
        segment
    ) {
        const key =
            cacheKey(
                segment
            );

        const cached =
            await getCachedBlob(
                key
            );

        if (
            cached
        ) {
            return {
                blob:
                    cached,

                source:
                    "audio-cache",

                key,

                lang:
                    segment.lang
            };
        }

        await ensureWorker();

        const result =
            await requestGeneration(
                segment
            );

        await setCachedBlob(
            key,
            result.blob
        );

        return {
            ...result,

            source:
                "kokoro",

            key,

            lang:
                segment.lang
        };
    }

    /* ==========================================================================
       DETECÇÃO INGLÊS
       ========================================================================== */

    function isLikelyEnglishFragment(
        text
    ) {
        const value =
            cleanText(
                text
            );

        if (
            !value
        ) {
            return false;
        }

        if (
            /[áàâãéêíóôõúç]/i
                .test(
                    value
                )
        ) {
            return false;
        }

        const normalized =
            normalize(
                value
            );

        const signals = [
            "hello",
            "hi",
            "good morning",
            "good afternoon",
            "good evening",
            "good night",
            "thank you",
            "thanks",
            "please",
            "goodbye",
            "bye",
            "see you",
            "my name",
            "how are you",
            "what is",
            "where",
            "when",
            "who",
            "why",
            "mother",
            "father",
            "brother",
            "sister",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
            "one",
            "two",
            "three",
            "four",
            "five",
            "six",
            "seven",
            "eight",
            "nine",
            "ten",
            "red",
            "blue",
            "green",
            "black",
            "white",
            "coffee"
        ];

        if (
            signals
                .some(
                    signal =>
                        normalized
                            .includes(
                                signal
                            )
                )
        ) {
            return true;
        }

        return /\b(i|you|he|she|we|they|my|your|his|her|our|their|am|is|are|do|does|have|has|like|love|work|name|morning|evening)\b/i
            .test(
                value
            );
    }

    /* ==========================================================================
       IDIOMA MISTO
       ========================================================================== */

    function splitMixedLanguage(
        text,
        lang
    ) {
        const source =
            cleanText(
                text
            );

        const baseLang =
            normalizeLang(
                lang
            );

        if (
            !source
        ) {
            return [];
        }

        if (
            baseLang !==
            CONFIG.portugueseLang
        ) {
            return [
                {
                    text:
                        source,

                    lang:
                        CONFIG
                            .englishLang
                }
            ];
        }

        const segments =
            [];

        const push =
            (
                value,
                segmentLang
            ) => {
                const cleaned =
                    cleanText(
                        value
                    );

                if (
                    !cleaned
                ) {
                    return;
                }

                const last =
                    segments[
                    segments.length -
                    1
                    ];

                if (
                    last &&
                    last.lang ===
                    segmentLang
                ) {
                    last.text =
                        cleanText(
                            `${last.text} ${cleaned}`
                        );
                } else {
                    segments
                        .push({
                            text:
                                cleaned,

                            lang:
                                segmentLang
                        });
                }
            };

        const quoteRegex =
            /["“]([^"”]+)["”]/g;

        let cursor =
            0;

        let match;

        let foundQuote =
            false;

        while (
            (
                match =
                quoteRegex
                    .exec(
                        source
                    )
            )
        ) {
            foundQuote =
                true;

            push(
                source
                    .slice(
                        cursor,
                        match.index
                    ),

                CONFIG
                    .portugueseLang
            );

            push(
                match[1],

                isLikelyEnglishFragment(
                    match[1]
                )
                    ? CONFIG
                        .englishLang
                    : CONFIG
                        .portugueseLang
            );

            cursor =
                match.index +
                match[0].length;
        }

        if (
            foundQuote
        ) {
            push(
                source
                    .slice(
                        cursor
                    ),

                CONFIG
                    .portugueseLang
            );

            return segments;
        }

        const patterns = [
            /(\bn[uú]mero\s+)([A-Za-z][A-Za-z'-]*)/i,
            /(\bdepois de\s+)([A-Za-z][A-Za-z'-]*)/i,
            /(\bantes de\s+)([A-Za-z][A-Za-z'-]*)/i,
            /(\bpalavra\s+)([A-Za-z][A-Za-z'-]*)/i
        ];

        for (
            const pattern
            of patterns
        ) {
            const matchPattern =
                pattern
                    .exec(
                        source
                    );

            if (
                matchPattern &&
                isLikelyEnglishFragment(
                    matchPattern[2]
                )
            ) {
                const start =
                    matchPattern.index +
                    matchPattern[1]
                        .length;

                push(
                    source
                        .slice(
                            0,
                            start
                        ),

                    CONFIG
                        .portugueseLang
                );

                push(
                    matchPattern[2],

                    CONFIG
                        .englishLang
                );

                push(
                    source
                        .slice(
                            start +
                            matchPattern[2]
                                .length
                        ),

                    CONFIG
                        .portugueseLang
                );

                return segments;
            }
        }

        return [
            {
                text:
                    source,

                lang:
                    CONFIG
                        .portugueseLang
            }
        ];
    }

    function getPersona(
        options,
        segmentLang
    ) {
        if (
            options.persona
        ) {
            return options.persona;
        }

        if (
            options.voice ===
            "male"
        ) {
            return "teacherMale";
        }

        return "teacher";
    }

    function buildSegments(
        text,
        options = {}
    ) {
        const requestedLang =
            normalizeLang(
                options.lang ||
                CONFIG
                    .englishLang
            );

        const baseRate =
            requestedLang ===
                CONFIG
                    .portugueseLang
                ? CONFIG
                    .portugueseRate
                : CONFIG
                    .englishRate;

        const requestedRate =
            clamp(
                options.rate,
                0.65,
                1.25,
                options.slow &&
                    requestedLang ===
                    CONFIG
                        .englishLang
                    ? CONFIG
                        .slowEnglishRate
                    : baseRate
            );

        return splitMixedLanguage(
            text,
            requestedLang
        )
            .map(
                segment => ({
                    text:
                        segment.text,

                    lang:
                        segment.lang,

                    speed:
                        segment.lang ===
                            CONFIG
                                .englishLang &&
                            options.slow
                            ? CONFIG
                                .slowEnglishRate
                            : requestedRate,

                    persona:
                        getPersona(
                            options,
                            segment.lang
                        ),

                    voice:
                        options
                            .kokoroVoice ||
                        ""
                })
            );
    }

    /* ==========================================================================
       REPRODUÇÃO WEB AUDIO

       Principal método mobile.

       AudioContext.destination utiliza automaticamente
       a saída padrão definida pelo sistema.
       ========================================================================== */

    async function playWithWebAudio(
        blob,
        session,
        metadata
    ) {
        const context =
            getAudioContext();

        if (
            !context
        ) {
            throw new Error(
                "AudioContext indisponível."
            );
        }

        if (
            context.state ===
            "suspended"
        ) {
            try {
                await context
                    .resume();
            } catch (_) {
            }
        }

        if (
            context.state !==
            "running" &&
            !audioUnlocked
        ) {
            throw new Error(
                "NotAllowedError: contexto de áudio ainda bloqueado pelo navegador."
            );
        }

        const arrayBuffer =
            await blob
                .arrayBuffer();

        const audioBuffer =
            await context
                .decodeAudioData(
                    arrayBuffer
                        .slice(
                            0
                        )
                );

        if (
            !currentSession ||
            currentSession.id !==
            session.id
        ) {
            return false;
        }

        const source =
            context
                .createBufferSource();

        source.buffer =
            audioBuffer;

        source.connect(
            context.destination
        );

        currentSource =
            source;

        session.loading =
            false;

        setButtonPlaying(
            session.button
        );

        dispatch(
            "eyt:speech-start",
            {
                text:
                    session.text,

                lang:
                    metadata.lang,

                voice:
                    metadata.voice ||
                    null,

                source:
                    metadata.source,

                engine:
                    "kokoro",

                runtime:
                    metadata.runtime ||
                    workerRuntime
            }
        );

        return new Promise(
            (
                resolve,
                reject
            ) => {
                source.onended =
                    () => {
                        if (
                            currentSource ===
                            source
                        ) {
                            currentSource =
                                null;
                        }

                        try {
                            source
                                .disconnect();
                        } catch (_) {
                        }

                        resolve(
                            true
                        );
                    };

                try {
                    source.start(
                        0
                    );
                } catch (error) {
                    reject(
                        error
                    );
                }
            }
        );
    }

    /* ==========================================================================
       FALLBACK HTML AUDIO
       ========================================================================== */

    async function playWithHtmlAudio(
        blob,
        session,
        metadata
    ) {
        releaseObjectUrl();

        const objectUrl =
            URL
                .createObjectURL(
                    blob
                );

        currentObjectUrl =
            objectUrl;

        const audio =
            new Audio(
                objectUrl
            );

        audio.preload =
            "auto";

        audio.volume =
            1;

        audio.playsInline =
            true;

        currentAudioElement =
            audio;

        session.loading =
            false;

        setButtonPlaying(
            session.button
        );

        return new Promise(
            (
                resolve,
                reject
            ) => {
                audio.onplay =
                    () =>
                        dispatch(
                            "eyt:speech-start",
                            {
                                text:
                                    session.text,

                                lang:
                                    metadata.lang,

                                voice:
                                    metadata.voice ||
                                    null,

                                source:
                                    metadata.source,

                                engine:
                                    "kokoro",

                                runtime:
                                    metadata.runtime ||
                                    workerRuntime
                            }
                        );

                audio.onended =
                    () => {
                        if (
                            currentAudioElement ===
                            audio
                        ) {
                            currentAudioElement =
                                null;
                        }

                        releaseObjectUrl();

                        resolve(
                            true
                        );
                    };

                audio.onerror =
                    () =>
                        reject(
                            new Error(
                                "Não foi possível reproduzir o áudio gerado."
                            )
                        );

                const playPromise =
                    audio.play();

                if (
                    playPromise &&
                    typeof playPromise
                        .catch ===
                    "function"
                ) {
                    playPromise
                        .catch(
                            reject
                        );
                }
            }
        );
    }

    async function playBlob(
        blob,
        session,
        metadata
    ) {
        if (
            !currentSession ||
            currentSession.id !==
            session.id
        ) {
            return false;
        }

        stopPlaybackOnly();

        try {
            return await playWithWebAudio(
                blob,
                session,
                metadata
            );
        } catch (firstError) {
            log(
                "WebAudio fallback",
                firstError
            );

            try {
                return await playWithHtmlAudio(
                    blob,
                    session,
                    metadata
                );
            } catch (secondError) {
                throw (
                    secondError ||
                    firstError
                );
            }
        }
    }

    /* ==========================================================================
       STOP
       ========================================================================== */

    function stop() {
        playSessionId +=
            1;

        stopPlaybackOnly();

        if (
            currentButton
        ) {
            resetButton(
                currentButton
            );
        }

        currentSession =
            null;

        dispatch(
            "eyt:speech-stop",
            {}
        );
    }

    function isSpeaking() {
        return Boolean(
            currentSession &&
            (
                currentSession
                    .loading ||

                currentSource ||

                (
                    currentAudioElement &&
                    !currentAudioElement
                        .paused &&
                    !currentAudioElement
                        .ended
                )
            )
        );
    }

    /* ==========================================================================
       SPEAK
       ========================================================================== */

    async function speak(
        text,
        options = {}
    ) {
        const value =
            cleanText(
                text
            );

        if (
            !value ||
            !isSupported()
        ) {
            return false;
        }

        hideErrorBanner();

        /*
         * IMPORTANTE:
         *
         * Chamado antes do primeiro await.
         *
         * Quando speak() é chamado dentro de um clique,
         * o navegador ainda considera que estamos dentro
         * do gesto do usuário.
         */

        void unlockAudio();

        stop();

        const id =
            ++playSessionId;

        const session = {
            id,

            text:
                value,

            button:
                options.button ||
                null,

            loading:
                true
        };

        currentSession =
            session;

        if (
            session.button
        ) {
            activateButton(
                session.button
            );
        }

        dispatch(
            "eyt:speech-loading",
            {
                text:
                    value
            }
        );

        try {
            const segments =
                buildSegments(
                    value,
                    options
                );

            for (
                const segment
                of segments
            ) {
                if (
                    !currentSession ||
                    currentSession.id !==
                    id
                ) {
                    return false;
                }

                const generated =
                    await getGeneratedAudio(
                        segment
                    );

                if (
                    !currentSession ||
                    currentSession.id !==
                    id
                ) {
                    return false;
                }

                const played =
                    await playBlob(
                        generated.blob,

                        session,

                        {
                            ...generated,

                            lang:
                                segment.lang
                        }
                    );

                if (
                    !played ||
                    !currentSession ||
                    currentSession.id !==
                    id
                ) {
                    return false;
                }

                session.loading =
                    true;
            }

            if (
                currentSession &&
                currentSession.id ===
                id
            ) {
                if (
                    currentButton
                ) {
                    resetButton(
                        currentButton
                    );
                }

                currentSession =
                    null;

                dispatch(
                    "eyt:speech-end",
                    {
                        text:
                            value,

                        engine:
                            "kokoro"
                    }
                );
            }

            return true;
        } catch (error) {
            if (
                currentSession &&
                currentSession.id ===
                id
            ) {
                stopPlaybackOnly();

                if (
                    currentButton
                ) {
                    resetButton(
                        currentButton
                    );
                }

                currentSession =
                    null;
            }

            const message =
                humanError(
                    error
                );

            showErrorBanner(
                message
            );

            dispatch(
                "eyt:speech-error",
                {
                    text:
                        value,

                    error:
                        error?.message ||
                        String(error),

                    friendlyMessage:
                        message
                }
            );

            log(
                "speech error",
                error
            );

            return false;
        }
    }

    /* ==========================================================================
       TOGGLE
       ========================================================================== */

    function toggle(
        text,
        button,
        options = {}
    ) {
        const value =
            cleanText(
                text
            );

        if (
            !value ||
            !isSupported()
        ) {
            return false;
        }

        /*
         * Executado SINCRONAMENTE no clique.
         */

        void unlockAudio();

        if (
            currentSession &&
            currentButton ===
            button &&
            isSpeaking()
        ) {
            stop();

            return false;
        }

        void speak(
            value,
            {
                ...options,
                button
            }
        );

        return true;
    }

    /* ==========================================================================
       API IDIOMAS
       ========================================================================== */

    function speakEnglish(
        text,
        options = {}
    ) {
        return speak(
            text,
            {
                ...options,

                lang:
                    CONFIG
                        .englishLang
            }
        );
    }

    function speakEnglishSlow(
        text,
        options = {}
    ) {
        return speak(
            text,
            {
                ...options,

                lang:
                    CONFIG
                        .englishLang,

                slow:
                    true
            }
        );
    }

    function speakPortuguese(
        text,
        options = {}
    ) {
        return speak(
            text,
            {
                ...options,

                lang:
                    CONFIG
                        .portugueseLang
            }
        );
    }

    function toggleEnglish(
        text,
        button,
        options = {}
    ) {
        return toggle(
            text,
            button,
            {
                ...options,

                lang:
                    CONFIG
                        .englishLang
            }
        );
    }

    function togglePortuguese(
        text,
        button,
        options = {}
    ) {
        return toggle(
            text,
            button,
            {
                ...options,

                lang:
                    CONFIG
                        .portugueseLang
            }
        );
    }

    /* ==========================================================================
       PRELOAD
       ========================================================================== */

    async function preload(
        text,
        options = {}
    ) {
        const value =
            cleanText(
                text
            );

        if (
            !value ||
            !isSupported()
        ) {
            return false;
        }

        try {
            const segments =
                buildSegments(
                    value,
                    options
                );

            for (
                const segment
                of segments
            ) {
                await getGeneratedAudio(
                    segment
                );
            }

            return true;
        } catch (error) {
            log(
                "preload",
                error
            );

            return false;
        }
    }

    /* ==========================================================================
       WARMUP
       ========================================================================== */

    async function warmup() {
        if (
            !isSupported()
        ) {
            return false;
        }

        try {
            await ensureWorker();

            return true;
        } catch (error) {
            const message =
                humanError(
                    error
                );

            showErrorBanner(
                message
            );

            log(
                "warmup",
                error
            );

            return false;
        }
    }

    /* ==========================================================================
       CACHE
       ========================================================================== */

    async function clearCache() {
        memoryCache
            .clear();

        if (
            typeof caches !==
            "undefined"
        ) {
            try {
                await caches
                    .delete(
                        CONFIG
                            .cacheName
                    );
            } catch (_) {
            }
        }
    }

    /* ==========================================================================
       DEBUG / STATUS
       ========================================================================== */

    function getRuntime() {
        return workerRuntime
            ? {
                ...workerRuntime
            }
            : null;
    }

    function getConfig() {
        return {
            ...CONFIG
        };
    }

    function getAudioState() {
        return {
            contextState:
                audioContext?.state ||
                "not-created",

            unlocked:
                audioUnlocked,

            output:
                "system-default",

            runtime:
                getRuntime()
        };
    }

    /* ==========================================================================
       MOBILE AUDIO UNLOCK

       Capturamos o primeiro gesto do usuário no documento inteiro.
       ========================================================================== */

    window
        .addEventListener(
            "pointerdown",
            () => {
                void unlockAudio();
            },
            {
                capture:
                    true,

                passive:
                    true
            }
        );

    window
        .addEventListener(
            "touchstart",
            () => {
                void unlockAudio();
            },
            {
                capture:
                    true,

                passive:
                    true
            }
        );

    /* ==========================================================================
       CICLO DE VIDA
       ========================================================================== */

    window
        .addEventListener(
            "pagehide",
            stop
        );

    document
        .addEventListener(
            "visibilitychange",
            () => {
                if (
                    document
                        .visibilityState ===
                    "visible" &&
                    audioContext?.state ===
                    "suspended"
                ) {
                    audioContext
                        .resume()
                        .catch(
                            () => {
                            }
                        );
                }
            }
        );

    /* ==========================================================================
       WARMUP AUTOMÁTICO
       ========================================================================== */

    if (
        CONFIG.autoWarmup &&
        isSupported()
    ) {
        const schedule =
            () => {
                if (
                    "requestIdleCallback"
                    in window
                ) {
                    window
                        .requestIdleCallback(
                            () =>
                                void warmup(),
                            {
                                timeout:
                                    2500
                            }
                        );
                } else {
                    setTimeout(
                        () =>
                            void warmup(),
                        1200
                    );
                }
            };

        if (
            document
                .readyState ===
            "loading"
        ) {
            document
                .addEventListener(
                    "DOMContentLoaded",
                    schedule,
                    {
                        once:
                            true
                    }
                );
        } else {
            schedule();
        }
    }

    /* ==========================================================================
       API
       ========================================================================== */

    return {
        isSupported,

        isSpeaking,

        speak,

        speakEnglish,

        speakEnglishSlow,

        speakPortuguese,

        toggle,

        toggleEnglish,

        togglePortuguese,

        stop,

        preload,

        warmup,

        clearCache,

        getRuntime,

        getConfig,

        getAudioState,

        unlockAudio
    };
})();