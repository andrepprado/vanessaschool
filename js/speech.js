const EYTSpeech = (() => {
    "use strict";

    const CONFIG = {
        workerPath: "/js/tts/kokoro-worker.js",
        englishLang: "en-GB",
        portugueseLang: "pt-BR",
        englishRate: 0.90,
        portugueseRate: 0.96,
        slowEnglishRate: 0.76,
        timeout: 120000,
        debug: false
    };

    let worker = null;
    let workerReady = false;
    let workerInitPromise = null;
    let workerRuntime = null;

    let requestId = 0;
    let sessionId = 0;

    let currentSession = null;
    let currentButton = null;
    let currentSource = null;
    let currentAudio = null;
    let currentUtterance = null;

    let audioContext = null;
    let audioUnlocked = false;

    const pending = new Map();
    const cache = new Map();

    const clean = value =>
        String(value ?? "")
            .replace(/\u00a0/g, " ")
            .replace(/\s+/g, " ")
            .trim();

    const langOf = value =>
        String(value || "")
            .toLowerCase()
            .startsWith("pt")
            ? CONFIG.portugueseLang
            : CONFIG.englishLang;

    const clamp = (
        value,
        min,
        max,
        fallback
    ) => {
        const number = Number(value);

        return Number.isFinite(number)
            ? Math.min(
                max,
                Math.max(min, number)
            )
            : fallback;
    };

    function nativeAvailable() {
        return (
            "speechSynthesis" in window &&
            typeof SpeechSynthesisUtterance !==
            "undefined"
        );
    }

    function kokoroAvailable() {
        return (
            typeof Worker !== "undefined" &&
            typeof WebAssembly !== "undefined" &&
            typeof fetch === "function"
        );
    }

    function isSupported() {
        return (
            nativeAvailable() ||
            kokoroAvailable()
        );
    }

    function log(...args) {
        if (CONFIG.debug) {
            console.log(
                "[EYTSpeech]",
                ...args
            );
        }
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

    function unlockAudio() {
        const context =
            getAudioContext();

        if (!context) {
            return Promise.resolve(
                false
            );
        }

        try {
            const resume =
                context.state ===
                    "suspended"
                    ? context.resume()
                    : Promise.resolve();

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

            source.start(0);

            return Promise
                .resolve(resume)
                .then(() => {
                    audioUnlocked =
                        context.state ===
                        "running";

                    return audioUnlocked;
                })
                .catch(
                    () => false
                );
        } catch (_) {
            return Promise.resolve(
                false
            );
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

        const label =
            button.dataset
                .eytOriginalLabel ||
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
            button ===
            currentButton
        ) {
            currentButton =
                null;
        }
    }

    function stopPlayback() {
        if (currentSource) {
            try {
                currentSource.stop(0);
            } catch (_) {
            }

            try {
                currentSource.disconnect();
            } catch (_) {
            }

            currentSource =
                null;
        }

        if (currentAudio) {
            try {
                currentAudio.pause();
                currentAudio.currentTime =
                    0;
            } catch (_) {
            }

            currentAudio =
                null;
        }

        if (nativeAvailable()) {
            try {
                speechSynthesis.cancel();
            } catch (_) {
            }
        }

        currentUtterance =
            null;
    }

    function stop() {
        sessionId += 1;

        stopPlayback();

        resetButton();

        currentSession =
            null;

        dispatch(
            "eyt:speech-stop"
        );
    }

    function isSpeaking() {
        const nativeSpeaking =
            nativeAvailable() &&
            (
                speechSynthesis
                    .speaking ||
                speechSynthesis
                    .pending
            );

        return Boolean(
            nativeSpeaking ||
            currentSource ||
            (
                currentAudio &&
                !currentAudio.paused &&
                !currentAudio.ended
            ) ||
            currentSession?.loading
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
            if (message.device) {
                workerRuntime = {
                    device:
                        message.device,
                    dtype:
                        message.dtype,
                    source:
                        message.source ||
                        null
                };
            }

            dispatch(
                "eyt:speech-engine-status",
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

    function handleWorkerError(
        event
    ) {
        const error =
            new Error(
                event?.message ||
                "Falha no motor Kokoro."
            );

        for (
            const [, request]
            of pending
        ) {
            clearTimeout(
                request.timer
            );

            request.reject(
                error
            );
        }

        pending.clear();

        workerReady =
            false;

        workerInitPromise =
            null;

        try {
            worker?.terminate();
        } catch (_) {
        }

        worker =
            null;

        dispatch(
            "eyt:speech-engine-error",
            {
                error:
                    error.message
            }
        );
    }

    function createWorker() {
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
                        "eyt-kokoro-tts"
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

    function ensureWorker() {
        if (!kokoroAvailable()) {
            return Promise.reject(
                new Error(
                    "Kokoro indisponível."
                )
            );
        }

        if (workerReady) {
            return Promise.resolve(
                workerRuntime
            );
        }

        if (workerInitPromise) {
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

                    const cleanup =
                        () => {
                            clearTimeout(
                                timer
                            );

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
                                event.detail
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
                                    event.detail
                                        ?.error ||
                                    "Não foi possível iniciar o Kokoro."
                                )
                            );
                        };

                    const timer =
                        setTimeout(
                            () => {
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
                                        "Tempo excedido ao iniciar o Kokoro."
                                    )
                                );
                            },
                            CONFIG.timeout
                        );

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

                    instance.postMessage({
                        type:
                            "init"
                    });
                }
            );

        return workerInitPromise;
    }

    function generateKokoro(
        segment
    ) {
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
                                    "Tempo excedido ao gerar áudio."
                                )
                            );
                        },
                        CONFIG.timeout
                    );

                pending.set(
                    id,
                    {
                        resolve,
                        reject,
                        timer
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
                            segment.rate,
                        persona:
                            segment.persona,
                        voice:
                            segment.voice ||
                            ""
                    });
            }
        );
    }

    async function getKokoroAudio(
        segment
    ) {
        const key =
            JSON.stringify(
                segment
            );

        if (
            cache.has(key)
        ) {
            return {
                blob:
                    cache.get(key),
                lang:
                    segment.lang,
                voice:
                    null,
                runtime:
                    workerRuntime,
                source:
                    "memory-cache"
            };
        }

        await ensureWorker();

        const result =
            await generateKokoro(
                segment
            );

        if (
            !(result.blob instanceof Blob) ||
            result.blob.size === 0
        ) {
            throw new Error(
                "Áudio vazio."
            );
        }

        cache.set(
            key,
            result.blob
        );

        return {
            blob:
                result.blob,
            lang:
                result.lang ||
                segment.lang,
            voice:
                result.voice ||
                null,
            runtime:
                result.runtime ||
                workerRuntime,
            source:
                "kokoro"
        };
    }

    function selectNativeVoice(
        lang,
        persona
    ) {
        if (!nativeAvailable()) {
            return null;
        }

        const prefix =
            langOf(lang)
                .toLowerCase()
                .slice(
                    0,
                    2
                );

        const voices =
            speechSynthesis
                .getVoices()
                .filter(
                    voice =>
                        String(
                            voice.lang ||
                            ""
                        )
                            .toLowerCase()
                            .startsWith(
                                prefix
                            )
                );

        if (!voices.length) {
            return null;
        }

        const terms =
            prefix === "pt"
                ? [
                    "francisca",
                    "maria",
                    "luciana",
                    "fernanda",
                    "portugu"
                ]
                : persona ===
                    "teacherMale"
                    ? [
                        "george",
                        "ryan",
                        "daniel",
                        "male"
                    ]
                    : [
                        "sonia",
                        "hazel",
                        "susan",
                        "female",
                        "uk english"
                    ];

        return (
            voices.find(
                voice =>
                    terms.some(
                        term =>
                            String(
                                voice.name ||
                                ""
                            )
                                .toLowerCase()
                                .includes(
                                    term
                                )
                    )
            ) ||
            voices[0]
        );
    }

    function speakNative(
        text,
        options,
        session
    ) {
        if (!nativeAvailable()) {
            return Promise.reject(
                new Error(
                    "Voz do navegador indisponível."
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
                    selectNativeVoice(
                        options.lang,
                        options.persona
                    );

                utterance.lang =
                    voice?.lang ||
                    options.lang;

                utterance.rate =
                    options.rate;

                utterance.pitch =
                    1;

                utterance.volume =
                    1;

                if (voice) {
                    utterance.voice =
                        voice;
                }

                currentUtterance =
                    utterance;

                utterance.onstart =
                    () => {
                        if (
                            currentSession
                                ?.id !==
                            session.id
                        ) {
                            return;
                        }

                        session.loading =
                            false;

                        setButtonPlaying(
                            session.button
                        );

                        dispatch(
                            "eyt:speech-start",
                            {
                                text,
                                lang:
                                    options.lang,
                                voice:
                                    voice?.name ||
                                    null,
                                source:
                                    "browser",
                                engine:
                                    "speechSynthesis"
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

                        resolve(
                            true
                        );
                    };

                utterance.onerror =
                    event => {
                        if (
                            event.error ===
                            "canceled" ||
                            event.error ===
                            "interrupted"
                        ) {
                            resolve(
                                false
                            );

                            return;
                        }

                        reject(
                            new Error(
                                event.error ||
                                "Falha na voz do navegador."
                            )
                        );
                    };

                speechSynthesis
                    .cancel();

                speechSynthesis
                    .speak(
                        utterance
                    );
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

        if (context) {
            try {
                if (
                    context.state ===
                    "suspended"
                ) {
                    await context
                        .resume();
                }

                const buffer =
                    await context
                        .decodeAudioData(
                            (
                                await blob
                                    .arrayBuffer()
                            )
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
                    buffer;

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
                            metadata.voice,
                        source:
                            metadata.source,
                        engine:
                            "kokoro",
                        runtime:
                            metadata.runtime
                    }
                );

                return await new Promise(
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
            } catch (error) {
                log(
                    "WebAudio fallback",
                    error
                );
            }
        }

        return await new Promise(
            (
                resolve,
                reject
            ) => {
                const url =
                    URL.createObjectURL(
                        blob
                    );

                const audio =
                    new Audio(
                        url
                    );

                currentAudio =
                    audio;

                audio.playsInline =
                    true;

                audio.onplay =
                    () => {
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
                                    metadata.voice,
                                source:
                                    metadata.source,
                                engine:
                                    "kokoro",
                                runtime:
                                    metadata.runtime
                            }
                        );
                    };

                audio.onended =
                    () => {
                        if (
                            currentAudio ===
                            audio
                        ) {
                            currentAudio =
                                null;
                        }

                        URL.revokeObjectURL(
                            url
                        );

                        resolve(
                            true
                        );
                    };

                audio.onerror =
                    () => {
                        URL.revokeObjectURL(
                            url
                        );

                        reject(
                            new Error(
                                "Falha ao reproduzir áudio."
                            )
                        );
                    };

                audio
                    .play()
                    .catch(
                        error => {
                            URL.revokeObjectURL(
                                url
                            );

                            reject(
                                error
                            );
                        }
                    );
            }
        );
    }

    function resolveOptions(
        options = {}
    ) {
        const lang =
            langOf(
                options.lang
            );

        const fallbackRate =
            lang ===
                CONFIG.portugueseLang
                ? CONFIG
                    .portugueseRate
                : options.slow
                    ? CONFIG
                        .slowEnglishRate
                    : CONFIG
                        .englishRate;

        return {
            lang,
            rate:
                clamp(
                    options.rate,
                    0.65,
                    1.20,
                    fallbackRate
                ),
            persona:
                clean(
                    options.persona
                ) ||
                "teacher",
            voice:
                clean(
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
            clean(text);

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

        void unlockAudio();

        stop();

        const id =
            ++sessionId;

        const session = {
            id,
            text:
                value,
            button:
                resolved.button,
            loading:
                true
        };

        currentSession =
            session;

        activateButton(
            session.button
        );

        dispatch(
            "eyt:speech-loading",
            {
                text:
                    value,
                lang:
                    resolved.lang
            }
        );

        try {
            let result;

            if (
                resolved.lang ===
                CONFIG.portugueseLang
            ) {
                result =
                    await speakNative(
                        value,
                        resolved,
                        session
                    );
            } else {
                try {
                    const generated =
                        await getKokoroAudio({
                            text:
                                value,
                            lang:
                                resolved.lang,
                            rate:
                                resolved.rate,
                            persona:
                                resolved.persona,
                            voice:
                                resolved.voice
                        });

                    if (
                        currentSession
                            ?.id !==
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
                } catch (error) {
                    log(
                        "Kokoro falhou; usando voz do navegador.",
                        error
                    );

                    if (
                        !nativeAvailable()
                    ) {
                        throw error;
                    }

                    result =
                        await speakNative(
                            value,
                            resolved,
                            session
                        );
                }
            }

            if (
                currentSession
                    ?.id ===
                id
            ) {
                dispatch(
                    "eyt:speech-end",
                    {
                        text:
                            value,
                        lang:
                            resolved.lang
                    }
                );

                resetButton(
                    session.button
                );

                currentSession =
                    null;
            }

            return result !==
                false;
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

            console.error(
                "[EYTSpeech]",
                error
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
            currentButton ===
            button &&
            isSpeaking()
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
            clean(text);

        const resolved =
            resolveOptions(
                options
            );

        if (!value) {
            return false;
        }

        if (
            resolved.lang ===
            CONFIG.portugueseLang
        ) {
            return nativeAvailable();
        }

        try {
            await getKokoroAudio({
                text:
                    value,
                lang:
                    resolved.lang,
                rate:
                    resolved.rate,
                persona:
                    resolved.persona,
                voice:
                    resolved.voice
            });

            return true;
        } catch (_) {
            return nativeAvailable();
        }
    }

    async function warmup() {
        if (
            !kokoroAvailable()
        ) {
            return nativeAvailable();
        }

        try {
            await ensureWorker();
            return true;
        } catch (_) {
            return nativeAvailable();
        }
    }

    async function clearCache() {
        cache.clear();
        return true;
    }

    function getRuntime() {
        return (
            workerRuntime ||
            {
                device:
                    nativeAvailable()
                        ? "browser"
                        : null,
                dtype:
                    null,
                source:
                    nativeAvailable()
                        ? "native"
                        : null
            }
        );
    }

    function getConfig() {
        return {
            ...CONFIG
        };
    }

    function getAudioState() {
        return {
            supported:
                isSupported(),
            speaking:
                isSpeaking(),
            audioUnlocked,
            workerReady,
            runtime:
                getRuntime()
        };
    }

    window.addEventListener(
        "pagehide",
        stop
    );

    document.addEventListener(
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
                        () => { }
                    );
            }
        }
    );

    if (nativeAvailable()) {
        try {
            speechSynthesis
                .getVoices();
        } catch (_) {
        }
    }

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