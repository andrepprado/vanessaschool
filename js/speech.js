const EYTSpeech = (() => {
    "use strict";

    const CONFIG = {
        workerPath:
            "/js/tts/kokoro-worker.js?v=20260930-natural-1",

        englishLang:
            "en-GB",

        portugueseLang:
            "pt-BR",

        englishRate:
            0.98,

        portugueseRate:
            1.00,

        slowEnglishRate:
            0.92,

        requestTimeout:
            180000,

        maxCacheEntries:
            100
    };

    let worker =
        null;

    let requestId =
        0;

    let sessionId =
        0;

    let currentSession =
        null;

    let currentButton =
        null;

    let currentSource =
        null;

    let audioContext =
        null;

    let runtime =
        null;

    const pending =
        new Map();

    const audioCache =
        new Map();

    function cleanText(value) {
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

    function normalizeLang(value) {
        const lang =
            String(
                value || ""
            )
                .trim()
                .toLowerCase();

        if (
            lang.startsWith(
                "pt"
            )
        ) {
            return CONFIG
                .portugueseLang;
        }

        if (
            lang === "en-us" ||
            lang.startsWith(
                "en-us"
            )
        ) {
            return "en-US";
        }

        return CONFIG
            .englishLang;
    }

    function clamp(
        value,
        min,
        max,
        fallback
    ) {
        const number =
            Number(value);

        if (
            !Number.isFinite(
                number
            )
        ) {
            return fallback;
        }

        return Math.min(
            max,
            Math.max(
                min,
                number
            )
        );
    }

    function dispatch(
        name,
        detail = {}
    ) {
        try {
            window.dispatchEvent(
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

    function isSupported() {
        return (
            typeof Worker !==
                "undefined" &&
            typeof WebAssembly !==
                "undefined" &&
            typeof AudioContext !==
                "undefined" ||
            typeof webkitAudioContext !==
                "undefined"
        );
    }

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

    async function unlockAudio() {
        const context =
            getAudioContext();

        if (!context) {
            return false;
        }

        try {
            if (
                context.state ===
                "suspended"
            ) {
                await context.resume();
            }

            /*
             * Buffer silencioso curto.
             * Mantém o AudioContext liberado pelo gesto do usuário.
             */

            const buffer =
                context.createBuffer(
                    1,
                    1,
                    context.sampleRate
                );

            const source =
                context
                    .createBufferSource();

            source.buffer =
                buffer;

            source.connect(
                context.destination
            );

            source.start(0);

            return true;
        } catch (_) {
            return false;
        }
    }

    function rememberButton(
        button
    ) {
        if (
            !button ||
            button.dataset
                .eytOriginalLabel
        ) {
            return;
        }

        button.dataset
            .eytOriginalLabel =
            button.getAttribute(
                "aria-label"
            ) ||
            button.getAttribute(
                "title"
            ) ||
            "Ouvir pronúncia";
    }

    function activateButton(
        button
    ) {
        if (!button) {
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

        button.classList.add(
            "is-speaking"
        );

        button.setAttribute(
            "aria-pressed",
            "true"
        );

        button.setAttribute(
            "aria-label",
            "Preparando pronúncia"
        );

        button.setAttribute(
            "title",
            "Preparando pronúncia"
        );
    }

    function setButtonPlaying(
        button
    ) {
        if (!button) {
            return;
        }

        button.setAttribute(
            "aria-label",
            "Parar áudio"
        );

        button.setAttribute(
            "title",
            "Parar áudio"
        );
    }

    function resetButton(
        button = currentButton
    ) {
        if (!button) {
            return;
        }

        button.classList.remove(
            "is-speaking"
        );

        button.setAttribute(
            "aria-pressed",
            "false"
        );

        const original =
            button.dataset
                .eytOriginalLabel ||
            "Ouvir pronúncia";

        button.setAttribute(
            "aria-label",
            original
        );

        button.setAttribute(
            "title",
            original
        );

        if (
            button ===
            currentButton
        ) {
            currentButton =
                null;
        }
    }

    function stopSource() {
        if (!currentSource) {
            return;
        }

        try {
            currentSource.stop(
                0
            );
        } catch (_) {
        }

        try {
            currentSource.disconnect();
        } catch (_) {
        }

        currentSource =
            null;
    }

    function stop() {
        sessionId += 1;

        stopSource();

        resetButton();

        currentSession =
            null;

        dispatch(
            "eyt:speech-stop"
        );
    }

    function isSpeaking() {
        return Boolean(
            currentSession
        );
    }

    function handleWorkerMessage(
        event
    ) {
        const message =
            event.data || {};

        if (
            message.type ===
            "engine-status"
        ) {
            if (
                message.status ===
                "ready"
            ) {
                runtime = {
                    engine:
                        "kokoro",

                    model:
                        message.model,

                    device:
                        message.device,

                    dtype:
                        message.dtype
                };

                console.info(
                    "[EYTSpeech] Kokoro neural pronto:",
                    runtime
                );
            }

            dispatch(
                "eyt:speech-engine-status",
                message
            );

            return;
        }

        if (
            message.type ===
            "model-progress"
        ) {
            dispatch(
                "eyt:speech-model-progress",
                message.progress ||
                    {}
            );

            return;
        }

        if (
            message.id == null
        ) {
            return;
        }

        const request =
            pending.get(
                message.id
            );

        if (!request) {
            return;
        }

        if (
            message.type ===
            "generation-complete"
        ) {
            pending.delete(
                message.id
            );

            clearTimeout(
                request.timer
            );

            runtime =
                message.runtime ||
                runtime;

            request.resolve(
                message
            );

            return;
        }

        if (
            message.type ===
            "generation-error"
        ) {
            pending.delete(
                message.id
            );

            clearTimeout(
                request.timer
            );

            request.reject(
                new Error(
                    message.error ||
                    "Falha ao gerar pronúncia."
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
            const request
            of pending.values()
        ) {
            clearTimeout(
                request.timer
            );

            request.reject(
                error
            );
        }

        pending.clear();

        try {
            worker?.terminate();
        } catch (_) {
        }

        worker =
            null;

        console.error(
            "[EYTSpeech]",
            error
        );

        dispatch(
            "eyt:speech-error",
            {
                error:
                    error.message
            }
        );
    }

    function getWorker() {
        if (worker) {
            return worker;
        }

        worker =
            new Worker(
                CONFIG.workerPath,
                {
                    type:
                        "module",

                    name:
                        "eyt-kokoro-neural"
                }
            );

        worker.addEventListener(
            "message",
            handleWorkerMessage
        );

        worker.addEventListener(
            "error",
            handleWorkerError
        );

        return worker;
    }

    function buildCacheKey(
        text,
        options
    ) {
        return [
            options.lang,
            options.persona,
            options.voice ||
                "",
            options.rate
                .toFixed(2),
            text
        ].join(
            "|"
        );
    }

    function trimCache() {
        while (
            audioCache.size >
            CONFIG.maxCacheEntries
        ) {
            const first =
                audioCache.keys()
                    .next()
                    .value;

            if (
                first ===
                undefined
            ) {
                break;
            }

            audioCache.delete(
                first
            );
        }
    }

    function generateAudio(
        text,
        options
    ) {
        const cacheKey =
            buildCacheKey(
                text,
                options
            );

        if (
            audioCache.has(
                cacheKey
            )
        ) {
            return Promise.resolve({
                blob:
                    audioCache.get(
                        cacheKey
                    ),

                lang:
                    options.lang,

                voice:
                    options.voice ||
                    null,

                runtime,

                cached:
                    true
            });
        }

        return new Promise(
            (
                resolve,
                reject
            ) => {
                const id =
                    ++requestId;

                const timer =
                    setTimeout(
                        () => {
                            pending.delete(
                                id
                            );

                            reject(
                                new Error(
                                    "Tempo excedido ao carregar o motor neural."
                                )
                            );
                        },
                        CONFIG
                            .requestTimeout
                    );

                pending.set(
                    id,
                    {
                        timer,

                        resolve:
                            result => {
                                if (
                                    result.blob instanceof
                                    Blob
                                ) {
                                    audioCache.set(
                                        cacheKey,
                                        result.blob
                                    );

                                    trimCache();
                                }

                                resolve(
                                    result
                                );
                            },

                        reject
                    }
                );

                getWorker()
                    .postMessage({
                        type:
                            "generate",

                        id,

                        text,

                        lang:
                            options.lang,

                        speed:
                            options.rate,

                        persona:
                            options.persona,

                        voice:
                            options.voice ||
                            ""
                    });
            }
        );
    }

    async function playBlob(
        blob,
        session,
        metadata
    ) {
        const context =
            getAudioContext();

        if (!context) {
            throw new Error(
                "AudioContext não disponível neste navegador."
            );
        }

        if (
            context.state ===
            "suspended"
        ) {
            await context.resume();
        }

        const arrayBuffer =
            await blob.arrayBuffer();

        const audioBuffer =
            await context
                .decodeAudioData(
                    arrayBuffer
                        .slice(0)
                );

        if (
            currentSession
                ?.id !==
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
                    metadata.voice,

                engine:
                    "kokoro",

                runtime:
                    metadata.runtime ||
                    runtime
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
                            source.disconnect();
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

    function resolveOptions(
        options = {}
    ) {
        const lang =
            normalizeLang(
                options.lang
            );

        let defaultRate;

        if (
            lang ===
            CONFIG.portugueseLang
        ) {
            defaultRate =
                CONFIG
                    .portugueseRate;
        } else if (
            options.slow
        ) {
            defaultRate =
                CONFIG
                    .slowEnglishRate;
        } else {
            defaultRate =
                CONFIG
                    .englishRate;
        }

        return {
            lang,

            /*
             * Mantém velocidade em uma faixa natural.
             * Isso é proposital para preservar ritmo,
             * vogais e connected speech.
             */

            rate:
                clamp(
                    options.rate,
                    0.90,
                    1.08,
                    defaultRate
                ),

            persona:
                cleanText(
                    options.persona
                ) ||
                "teacher",

            voice:
                cleanText(
                    options.voice
                ),

            button:
                options.button ||
                null
        };
    }

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

        const resolved =
            resolveOptions(
                options
            );

        stop();

        const id =
            ++sessionId;

        const session = {
            id,
            text:
                value,
            button:
                resolved.button
        };

        currentSession =
            session;

        activateButton(
            session.button
        );

        /*
         * Executado antes do download/geração para aproveitar
         * o gesto do clique e liberar o áudio no navegador.
         */

        void unlockAudio();

        dispatch(
            "eyt:speech-loading",
            {
                text:
                    value,

                lang:
                    resolved.lang,

                engine:
                    "kokoro"
            }
        );

        try {
            const generated =
                await generateAudio(
                    value,
                    resolved
                );

            if (
                currentSession
                    ?.id !==
                id
            ) {
                return false;
            }

            const played =
                await playBlob(
                    generated.blob,
                    session,
                    generated
                );

            if (
                currentSession
                    ?.id ===
                id
            ) {
                resetButton(
                    session.button
                );

                currentSession =
                    null;

                dispatch(
                    "eyt:speech-end",
                    {
                        text:
                            value,

                        lang:
                            resolved.lang,

                        engine:
                            "kokoro"
                    }
                );
            }

            return played;
        } catch (error) {
            if (
                currentSession
                    ?.id ===
                id
            ) {
                resetButton(
                    session.button
                );

                currentSession =
                    null;
            }

            /*
             * Não usamos a voz nativa do navegador como fallback.
             *
             * Se Kokoro falhar, mostramos o erro.
             * Assim o aluno nunca recebe uma voz robótica
             * do Windows/Chrome no lugar da pronúncia neural.
             */

            console.error(
                "[EYTSpeech] Kokoro:",
                error
            );

            dispatch(
                "eyt:speech-error",
                {
                    error:
                        error?.message ||
                        String(error),

                    text:
                        value,

                    lang:
                        resolved.lang
                }
            );

            return false;
        }
    }

    function toggle(
        text,
        button,
        options = {}
    ) {
        if (
            currentSession &&
            currentButton ===
                button
        ) {
            stop();

            return Promise.resolve(
                false
            );
        }

        return speak(
            text,
            {
                ...options,
                button
            }
        );
    }

    function speakEnglish(
        text,
        options = {}
    ) {
        return speak(
            text,
            {
                ...options,
                lang:
                    options.lang ||
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
                    options.lang ||
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

    function warmup() {
        if (
            !isSupported()
        ) {
            return false;
        }

        getWorker()
            .postMessage({
                type:
                    "warmup"
            });

        return true;
    }

    function clearCache() {
        audioCache.clear();

        return true;
    }

    function getRuntime() {
        return runtime;
    }

    window.addEventListener(
        "pagehide",
        stop
    );

    return {
        isSupported,
        isSpeaking,
        speak,
        speakEnglish,
        speakEnglishSlow,
        speakPortuguese,
        toggle,
        stop,
        warmup,
        clearCache,
        getRuntime,
        unlockAudio
    };
})();