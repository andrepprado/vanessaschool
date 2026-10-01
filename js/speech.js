const EYTSpeech = (() => {
    "use strict";

    const CONFIG = {
        workerPath:
            "/js/tts/kokoro-worker.js?v=20260930-natural-2",

        englishLang:
            "en-US",

        portugueseLang:
            "pt-BR",

        englishRate:
            1.00,

        slowEnglishRate:
            0.93,

        portugueseRate:
            1.00,

        timeout:
            180000,

        maxCacheEntries:
            100
    };

    let worker = null;
    let requestId = 0;
    let sessionId = 0;

    let currentSession = null;
    let currentButton = null;
    let currentSource = null;
    let currentUtterance = null;

    let audioContext = null;
    let runtime = null;

    const pending =
        new Map();

    const cache =
        new Map();

    function cleanText(value) {
        return String(value ?? "")
            .replace(/\u00a0/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function normalizeLang(value) {
        const lang =
            String(value || "")
                .trim()
                .toLowerCase();

        if (lang.startsWith("pt")) {
            return CONFIG.portugueseLang;
        }

        if (lang.startsWith("en-gb")) {
            return "en-GB";
        }

        return CONFIG.englishLang;
    }

    function clamp(
        value,
        min,
        max,
        fallback
    ) {
        const number =
            Number(value);

        if (!Number.isFinite(number)) {
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

    function rememberButton(button) {
        if (
            !button ||
            button.dataset.eytOriginalLabel
        ) {
            return;
        }

        button.dataset.eytOriginalLabel =
            button.getAttribute("aria-label") ||
            button.getAttribute("title") ||
            "Ouvir pronúncia";
    }

    function activateButton(button) {
        if (!button) {
            return;
        }

        rememberButton(button);

        if (
            currentButton &&
            currentButton !== button
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
            "Preparando áudio"
        );

        button.setAttribute(
            "title",
            "Preparando áudio"
        );
    }

    function setButtonPlaying(button) {
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

        const label =
            button.dataset.eytOriginalLabel ||
            "Ouvir pronúncia";

        button.setAttribute(
            "aria-label",
            label
        );

        button.setAttribute(
            "title",
            label
        );

        if (
            button === currentButton
        ) {
            currentButton = null;
        }
    }

    function stopSource() {
        if (!currentSource) {
            return;
        }

        try {
            currentSource.stop(0);
        } catch (_) {
        }

        try {
            currentSource.disconnect();
        } catch (_) {
        }

        currentSource = null;
    }

    function stopNative() {
        if (
            "speechSynthesis" in window
        ) {
            try {
                window.speechSynthesis
                    .cancel();
            } catch (_) {
            }
        }

        currentUtterance = null;
    }

    function stop() {
        sessionId += 1;

        stopSource();
        stopNative();
        resetButton();

        currentSession = null;

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
                    engine: "kokoro",
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
                message.progress || {}
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
                    "Falha ao gerar áudio."
                )
            );
        }
    }

    function handleWorkerError(event) {
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

        worker = null;

        console.error(
            "[EYTSpeech]",
            error
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
                    type: "module",
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

    function cacheKey(
        text,
        options
    ) {
        return [
            options.lang,
            options.persona,
            options.voice || "",
            options.rate.toFixed(2),
            text
        ].join("|");
    }

    function trimCache() {
        while (
            cache.size >
            CONFIG.maxCacheEntries
        ) {
            const first =
                cache.keys()
                    .next()
                    .value;

            if (
                first === undefined
            ) {
                break;
            }

            cache.delete(first);
        }
    }

    function generateEnglish(
        text,
        options
    ) {
        const key =
            cacheKey(
                text,
                options
            );

        if (cache.has(key)) {
            return Promise.resolve({
                blob:
                    cache.get(key),
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
                                    "Tempo excedido ao gerar o áudio neural."
                                )
                            );
                        },
                        CONFIG.timeout
                    );

                pending.set(
                    id,
                    {
                        timer,

                        resolve:
                            result => {
                                if (
                                    result.blob instanceof Blob
                                ) {
                                    cache.set(
                                        key,
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
                "AudioContext não disponível."
            );
        }

        if (
            context.state ===
            "suspended"
        ) {
            await context.resume();
        }

        const bytes =
            await blob.arrayBuffer();

        const buffer =
            await context
                .decodeAudioData(
                    bytes.slice(0)
                );

        if (
            currentSession?.id !==
            session.id
        ) {
            return false;
        }

        const source =
            context
                .createBufferSource();

        source.buffer =
            buffer;

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

                        resolve(true);
                    };

                try {
                    source.start(0);
                } catch (error) {
                    reject(error);
                }
            }
        );
    }

    function getPortugueseVoices() {
        if (
            !("speechSynthesis" in window)
        ) {
            return [];
        }

        return window
            .speechSynthesis
            .getVoices()
            .filter(
                voice =>
                    String(
                        voice.lang ||
                        ""
                    )
                        .toLowerCase()
                        .startsWith("pt")
            );
    }

    function selectPortugueseVoice() {
        const voices =
            getPortugueseVoices();

        if (!voices.length) {
            return null;
        }

        const preferredNames = [
            "francisca",
            "maria",
            "luciana",
            "fernanda",
            "brasil",
            "brazil"
        ];

        const ptBR =
            voices.filter(
                voice =>
                    String(
                        voice.lang ||
                        ""
                    )
                        .toLowerCase()
                        .startsWith(
                            "pt-br"
                        )
            );

        const pool =
            ptBR.length
                ? ptBR
                : voices;

        return (
            pool.find(
                voice =>
                    preferredNames.some(
                        name =>
                            String(
                                voice.name ||
                                ""
                            )
                                .toLowerCase()
                                .includes(name)
                    )
            ) ||
            pool[0]
        );
    }

    function speakPortugueseNative(
        text,
        options,
        session
    ) {
        if (
            !(
                "speechSynthesis" in
                window
            ) ||
            typeof SpeechSynthesisUtterance ===
                "undefined"
        ) {
            return Promise.reject(
                new Error(
                    "Voz em português não disponível."
                )
            );
        }

        return new Promise(
            (
                resolve,
                reject
            ) => {
                const utterance =
                    new SpeechSynthesisUtterance(
                        text
                    );

                const voice =
                    selectPortugueseVoice();

                utterance.lang =
                    voice?.lang ||
                    "pt-BR";

                utterance.rate =
                    options.rate;

                utterance.pitch = 1;
                utterance.volume = 1;

                if (voice) {
                    utterance.voice =
                        voice;
                }

                currentUtterance =
                    utterance;

                utterance.onstart =
                    () => {
                        if (
                            currentSession?.id !==
                            session.id
                        ) {
                            return;
                        }

                        setButtonPlaying(
                            session.button
                        );

                        dispatch(
                            "eyt:speech-start",
                            {
                                text,
                                lang:
                                    "pt-BR",
                                voice:
                                    voice?.name ||
                                    null,
                                engine:
                                    "browser-pt"
                            }
                        );
                    };

                utterance.onend =
                    () => {
                        if (
                            currentUtterance ===
                            utterance
                        ) {
                            currentUtterance =
                                null;
                        }

                        resolve(true);
                    };

                utterance.onerror =
                    event => {
                        if (
                            event.error ===
                                "canceled" ||
                            event.error ===
                                "interrupted"
                        ) {
                            resolve(false);

                            return;
                        }

                        reject(
                            new Error(
                                event.error ||
                                "Falha no áudio em português."
                            )
                        );
                    };

                window
                    .speechSynthesis
                    .cancel();

                window
                    .speechSynthesis
                    .speak(
                        utterance
                    );
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
                CONFIG.portugueseRate;
        } else if (
            options.slow
        ) {
            defaultRate =
                CONFIG.slowEnglishRate;
        } else {
            defaultRate =
                CONFIG.englishRate;
        }

        return {
            lang,

            rate:
                clamp(
                    options.rate,
                    lang ===
                        CONFIG.portugueseLang
                        ? 0.85
                        : 0.92,
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
            cleanText(text);

        if (!value) {
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

        void unlockAudio();

        try {
            let result;

            if (
                resolved.lang ===
                CONFIG.portugueseLang
            ) {
                result =
                    await speakPortugueseNative(
                        value,
                        resolved,
                        session
                    );
            } else {
                const generated =
                    await generateEnglish(
                        value,
                        resolved
                    );

                if (
                    currentSession?.id !==
                    id
                ) {
                    return false;
                }

                result =
                    await playBlob(
                        generated.blob,
                        session,
                        generated
                    );
            }

            if (
                currentSession?.id ===
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
                            resolved.lang
                    }
                );
            }

            return result !== false;
        } catch (error) {
            if (
                currentSession?.id ===
                id
            ) {
                resetButton(
                    session.button
                );

                currentSession =
                    null;
            }

            console.error(
                "[EYTSpeech]",
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
            currentButton === button
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
                    CONFIG.englishLang
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
                    CONFIG.englishLang,
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
                    CONFIG.portugueseLang
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
                    options.lang ||
                    CONFIG.englishLang
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
                    CONFIG.portugueseLang
            }
        );
    }

    async function preload(
        text,
        options = {}
    ) {
        const value =
            cleanText(text);

        if (!value) {
            return false;
        }

        const resolved =
            resolveOptions(
                options
            );

        if (
            resolved.lang ===
            CONFIG.portugueseLang
        ) {
            return true;
        }

        try {
            await generateEnglish(
                value,
                resolved
            );

            return true;
        } catch (_) {
            return false;
        }
    }

    function warmup() {
        try {
            getWorker()
                .postMessage({
                    type:
                        "warmup"
                });

            return true;
        } catch (_) {
            return false;
        }
    }

    function clearCache() {
        cache.clear();

        return true;
    }

    function getRuntime() {
        return runtime;
    }

    function getConfig() {
        return {
            ...CONFIG
        };
    }

    function getAudioState() {
        return {
            speaking:
                isSpeaking(),
            runtime,
            currentLanguage:
                currentSession?.lang ||
                null
        };
    }

    if (
        "speechSynthesis" in window
    ) {
        window.speechSynthesis
            .getVoices();

        window.speechSynthesis
            .addEventListener?.(
                "voiceschanged",
                () => {
                    window
                        .speechSynthesis
                        .getVoices();
                }
            );
    }

    window.addEventListener(
        "pagehide",
        stop
    );

    return {
        isSupported:
            () => true,

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