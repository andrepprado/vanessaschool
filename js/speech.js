const EYTSpeech = (() => {
    "use strict";

    const CONFIG = {
        workerPath: "/js/tts/kokoro-worker.js?v=20260930-instant-1",
        englishLang: "en-US",
        portugueseLang: "pt-BR",
        englishRate: 0.98,
        slowEnglishRate: 0.93,
        portugueseRate: 1.00,
        timeout: 180000,
        dbName: "eyt-audio-cache",
        dbVersion: 1,
        storeName: "audio",
        cacheNamespace: "kokoro-en-v4",
        maxBlobMemoryEntries: 180,
        maxDecodedEntries: 100
    };

    let worker = null;
    let requestId = 0;
    let sessionId = 0;
    let queueSequence = 0;
    let generationActive = false;
    let currentSession = null;
    let currentButton = null;
    let currentSource = null;
    let currentUtterance = null;
    let audioContext = null;
    let runtime = null;
    let databasePromise = null;

    const workerPending = new Map();
    const blobCache = new Map();
    const decodedCache = new Map();
    const blobLoading = new Map();
    const decoding = new Map();
    const generationByKey = new Map();
    const generationQueue = [];

    function cleanText(value) {
        return String(value ?? "")
            .replace(/\u00a0/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function normalizeLang(value) {
        const lang = String(value || "").trim().toLowerCase();

        if (lang.startsWith("pt")) {
            return CONFIG.portugueseLang;
        }

        if (lang.startsWith("en-gb")) {
            return "en-GB";
        }

        return CONFIG.englishLang;
    }

    function clamp(value, min, max, fallback) {
        const number = Number(value);

        if (!Number.isFinite(number)) {
            return fallback;
        }

        return Math.min(max, Math.max(min, number));
    }

    function dispatch(name, detail = {}) {
        try {
            window.dispatchEvent(new CustomEvent(name, { detail }));
        } catch (_) {
        }
    }

    function priorityValue(priority) {
        if (priority === "foreground") return 0;
        if (priority === "current") return 1;
        return 2;
    }

    function trimMap(map, maximum) {
        while (map.size > maximum) {
            const first = map.keys().next().value;

            if (first === undefined) {
                break;
            }

            map.delete(first);
        }
    }

    function cacheKey(text, options) {
        return [
            CONFIG.cacheNamespace,
            options.lang,
            options.persona,
            options.voice || "",
            Number(options.rate).toFixed(2),
            cleanText(text)
        ].join("|");
    }

    function resolveOptions(options = {}) {
        const lang = normalizeLang(options.lang);

        let defaultRate;

        if (lang === CONFIG.portugueseLang) {
            defaultRate = CONFIG.portugueseRate;
        } else if (options.slow) {
            defaultRate = CONFIG.slowEnglishRate;
        } else {
            defaultRate = CONFIG.englishRate;
        }

        return {
            lang,
            rate: clamp(
                options.rate,
                lang === CONFIG.portugueseLang ? 0.85 : 0.90,
                1.08,
                defaultRate
            ),
            persona: cleanText(options.persona) || "teacher",
            voice: cleanText(options.voice),
            button: options.button || null,
            priority: options.priority || "foreground"
        };
    }

    /* ========================================================
       INDEXEDDB
       ======================================================== */

    function openDatabase() {
        if (databasePromise) {
            return databasePromise;
        }

        if (!("indexedDB" in window)) {
            return Promise.resolve(null);
        }

        databasePromise = new Promise(resolve => {
            const request = indexedDB.open(CONFIG.dbName, CONFIG.dbVersion);

            request.onupgradeneeded = event => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains(CONFIG.storeName)) {
                    db.createObjectStore(CONFIG.storeName);
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
            request.onblocked = () => resolve(null);
        });

        return databasePromise;
    }

    async function persistentGet(key) {
        try {
            const db = await openDatabase();

            if (!db) {
                return null;
            }

            return await new Promise(resolve => {
                const tx = db.transaction(CONFIG.storeName, "readonly");
                const request = tx.objectStore(CONFIG.storeName).get(key);

                request.onsuccess = () => {
                    const value = request.result;

                    resolve(
                        value?.blob instanceof Blob && value.blob.size
                            ? value.blob
                            : null
                    );
                };

                request.onerror = () => resolve(null);
            });
        } catch (_) {
            return null;
        }
    }

    async function persistentSet(key, blob) {
        if (!(blob instanceof Blob) || !blob.size) {
            return false;
        }

        try {
            const db = await openDatabase();

            if (!db) {
                return false;
            }

            return await new Promise(resolve => {
                const tx = db.transaction(CONFIG.storeName, "readwrite");

                tx.objectStore(CONFIG.storeName).put(
                    {
                        blob,
                        createdAt: Date.now()
                    },
                    key
                );

                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
                tx.onabort = () => resolve(false);
            });
        } catch (_) {
            return false;
        }
    }

    async function persistentClear() {
        try {
            const db = await openDatabase();

            if (!db) {
                return;
            }

            await new Promise(resolve => {
                const tx = db.transaction(CONFIG.storeName, "readwrite");

                tx.objectStore(CONFIG.storeName).clear();

                tx.oncomplete = resolve;
                tx.onerror = resolve;
                tx.onabort = resolve;
            });
        } catch (_) {
        }
    }

    /* ========================================================
       AUDIO CONTEXT
       ======================================================== */

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

        audioContext = new AudioContextClass({
            latencyHint: "interactive"
        });

        return audioContext;
    }

    async function unlockAudio() {
        const context = getAudioContext();

        if (!context) {
            return false;
        }

        try {
            if (context.state === "suspended") {
                await context.resume();
            }

            const buffer = context.createBuffer(
                1,
                1,
                context.sampleRate
            );

            const source = context.createBufferSource();

            source.buffer = buffer;
            source.connect(context.destination);
            source.start(0);

            return true;
        } catch (_) {
            return false;
        }
    }

    /* ========================================================
       UI
       ======================================================== */

    function rememberButton(button) {
        if (!button || button.dataset.eytOriginalLabel) {
            return;
        }

        button.dataset.eytOriginalLabel =
            button.getAttribute("aria-label") ||
            button.getAttribute("title") ||
            "Ouvir pron├║ncia";
    }

    function activateButton(button) {
        if (!button) {
            return;
        }

        rememberButton(button);

        if (currentButton && currentButton !== button) {
            resetButton(currentButton);
        }

        currentButton = button;

        button.classList.add("is-speaking");
        button.setAttribute("aria-pressed", "true");
        button.setAttribute("aria-label", "Preparando ├íudio");
        button.setAttribute("title", "Preparando ├íudio");
    }

    function setButtonPlaying(button) {
        if (!button) {
            return;
        }

        button.setAttribute("aria-label", "Parar ├íudio");
        button.setAttribute("title", "Parar ├íudio");
    }

    function resetButton(button = currentButton) {
        if (!button) {
            return;
        }

        button.classList.remove("is-speaking");
        button.setAttribute("aria-pressed", "false");

        const label =
            button.dataset.eytOriginalLabel ||
            "Ouvir pron├║ncia";

        button.setAttribute("aria-label", label);
        button.setAttribute("title", label);

        if (button === currentButton) {
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
        if ("speechSynthesis" in window) {
            try {
                window.speechSynthesis.cancel();
            } catch (_) {
            }
        }

        currentUtterance = null;
    }

    function stop() {
        sessionId++;
        stopSource();
        stopNative();
        resetButton();
        currentSession = null;

        dispatch("eyt:speech-stop");
    }

    function isSpeaking() {
        return Boolean(currentSession);
    }

    /* ========================================================
       WORKER
       ======================================================== */

    function handleWorkerMessage(event) {
        const message = event.data || {};

        if (message.type === "engine-status") {
            if (message.status === "ready") {
                runtime = {
                    engine: "kokoro",
                    model: message.model,
                    device: message.device,
                    dtype: message.dtype
                };

                console.info(
                    "[EYTSpeech] Kokoro pronto:",
                    runtime
                );
            }

            dispatch(
                "eyt:speech-engine-status",
                message
            );

            return;
        }

        if (message.type === "model-progress") {
            dispatch(
                "eyt:speech-model-progress",
                message.progress || {}
            );

            return;
        }

        if (message.id == null) {
            return;
        }

        const request = workerPending.get(message.id);

        if (!request) {
            return;
        }

        if (message.type === "generation-complete") {
            workerPending.delete(message.id);
            clearTimeout(request.timer);

            runtime =
                message.runtime ||
                runtime;

            request.resolve(message);
            return;
        }

        if (message.type === "generation-error") {
            workerPending.delete(message.id);
            clearTimeout(request.timer);

            request.reject(
                new Error(
                    message.error ||
                    "Falha ao gerar ├íudio."
                )
            );
        }
    }

    function handleWorkerError(event) {
        const error = new Error(
            event?.message ||
            "Falha no Kokoro."
        );

        for (const request of workerPending.values()) {
            clearTimeout(request.timer);
            request.reject(error);
        }

        workerPending.clear();

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

        worker = new Worker(
            CONFIG.workerPath,
            {
                type: "module",
                name: "eyt-kokoro-neural"
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

    function rawGenerate(text, options) {
        return new Promise((resolve, reject) => {
            const id = ++requestId;

            const timer = setTimeout(() => {
                workerPending.delete(id);

                reject(
                    new Error(
                        "Tempo excedido ao gerar ├íudio."
                    )
                );
            }, CONFIG.timeout);

            workerPending.set(
                id,
                {
                    timer,
                    resolve,
                    reject
                }
            );

            getWorker().postMessage({
                type: "generate",
                id,
                text,
                lang: options.lang,
                speed: options.rate,
                persona: options.persona,
                voice: options.voice || ""
            });
        });
    }

    /* ========================================================
       FILA COM PRIORIDADE
       ======================================================== */

    function promoteGeneration(key, priority) {
        const task = generationByKey.get(key);

        if (!task || task.started) {
            return;
        }

        task.priority = Math.min(
            task.priority,
            priorityValue(priority)
        );
    }

    function scheduleGeneration(
        key,
        text,
        options,
        priority
    ) {
        const existing = generationByKey.get(key);

        if (existing) {
            existing.priority = Math.min(
                existing.priority,
                priorityValue(priority)
            );

            return existing.promise;
        }

        let resolveTask;
        let rejectTask;

        const promise = new Promise(
            (resolve, reject) => {
                resolveTask = resolve;
                rejectTask = reject;
            }
        );

        const task = {
            key,
            text,
            options,
            priority: priorityValue(priority),
            sequence: ++queueSequence,
            started: false,
            promise,
            resolve: resolveTask,
            reject: rejectTask
        };

        generationByKey.set(
            key,
            task
        );

        generationQueue.push(
            task
        );

        void processGenerationQueue();

        return promise;
    }

    async function processGenerationQueue() {
        if (generationActive) {
            return;
        }

        const waiting = generationQueue
            .filter(task => !task.started)
            .sort((a, b) => {
                if (a.priority !== b.priority) {
                    return a.priority - b.priority;
                }

                return a.sequence - b.sequence;
            });

        const task = waiting[0];

        if (!task) {
            return;
        }

        generationActive = true;
        task.started = true;

        try {
            const result =
                await rawGenerate(
                    task.text,
                    task.options
                );

            if (
                !(result.blob instanceof Blob) ||
                !result.blob.size
            ) {
                throw new Error(
                    "Kokoro retornou ├íudio vazio."
                );
            }

            blobCache.set(
                task.key,
                result.blob
            );

            trimMap(
                blobCache,
                CONFIG.maxBlobMemoryEntries
            );

            void persistentSet(
                task.key,
                result.blob
            );

            task.resolve({
                ...result,
                key: task.key,
                cached: false
            });
        } catch (error) {
            task.reject(error);
        } finally {
            generationByKey.delete(
                task.key
            );

            const index =
                generationQueue.indexOf(task);

            if (index >= 0) {
                generationQueue.splice(
                    index,
                    1
                );
            }

            generationActive = false;

            queueMicrotask(
                processGenerationQueue
            );
        }
    }

    /* ========================================================
       BLOB CACHE
       ======================================================== */

    async function getEnglishBlob(
        text,
        options,
        priority
    ) {
        const key =
            cacheKey(
                text,
                options
            );

        if (blobCache.has(key)) {
            return {
                key,
                blob: blobCache.get(key),
                lang: options.lang,
                voice: options.voice || null,
                runtime,
                cached: "memory"
            };
        }

        if (blobLoading.has(key)) {
            const state =
                blobLoading.get(key);

            state.priority =
                Math.min(
                    state.priority,
                    priorityValue(priority)
                );

            promoteGeneration(
                key,
                priority
            );

            return state.promise;
        }

        const state = {
            priority:
                priorityValue(priority),
            promise:
                null
        };

        state.promise = (async () => {
            const stored =
                await persistentGet(key);

            if (stored) {
                blobCache.set(
                    key,
                    stored
                );

                trimMap(
                    blobCache,
                    CONFIG.maxBlobMemoryEntries
                );

                return {
                    key,
                    blob: stored,
                    lang: options.lang,
                    voice: options.voice || null,
                    runtime,
                    cached: "indexeddb"
                };
            }

            return scheduleGeneration(
                key,
                text,
                options,
                state.priority === 0
                    ? "foreground"
                    : state.priority === 1
                        ? "current"
                        : "background"
            );
        })();

        blobLoading.set(
            key,
            state
        );

        try {
            return await state.promise;
        } finally {
            blobLoading.delete(
                key
            );
        }
    }

    /* ========================================================
       AUDIOBUFFER CACHE
       ======================================================== */

    async function decodeBlob(
        key,
        blob
    ) {
        if (decodedCache.has(key)) {
            return decodedCache.get(key);
        }

        if (decoding.has(key)) {
            return decoding.get(key);
        }

        const promise = (async () => {
            const context =
                getAudioContext();

            if (!context) {
                throw new Error(
                    "AudioContext indispon├¡vel."
                );
            }

            const bytes =
                await blob.arrayBuffer();

            const audioBuffer =
                await context.decodeAudioData(
                    bytes.slice(0)
                );

            decodedCache.set(
                key,
                audioBuffer
            );

            trimMap(
                decodedCache,
                CONFIG.maxDecodedEntries
            );

            return audioBuffer;
        })();

        decoding.set(
            key,
            promise
        );

        try {
            return await promise;
        } finally {
            decoding.delete(
                key
            );
        }
    }

    async function prepareEnglishAudio(
        text,
        options,
        priority = "foreground"
    ) {
        const key =
            cacheKey(
                text,
                options
            );

        if (decodedCache.has(key)) {
            return {
                key,
                buffer:
                    decodedCache.get(key),
                lang:
                    options.lang,
                voice:
                    options.voice || null,
                runtime,
                cached:
                    "decoded"
            };
        }

        promoteGeneration(
            key,
            priority
        );

        const audio =
            await getEnglishBlob(
                text,
                options,
                priority
            );

        const buffer =
            await decodeBlob(
                key,
                audio.blob
            );

        return {
            ...audio,
            key,
            buffer
        };
    }

    /* ========================================================
       REPRODU├ç├âO INSTANT├éNEA
       ======================================================== */

    async function playPrepared(
        prepared,
        session
    ) {
        const context =
            getAudioContext();

        if (!context) {
            throw new Error(
                "AudioContext indispon├¡vel."
            );
        }

        if (context.state === "suspended") {
            await context.resume();
        }

        if (
            currentSession?.id !==
            session.id
        ) {
            return false;
        }

        const source =
            context.createBufferSource();

        source.buffer =
            prepared.buffer;

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
                text: session.text,
                lang: prepared.lang,
                voice: prepared.voice,
                engine: "kokoro",
                cached: prepared.cached,
                runtime:
                    prepared.runtime ||
                    runtime
            }
        );

        return new Promise((resolve, reject) => {
            source.onended = () => {
                if (currentSource === source) {
                    currentSource = null;
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
        });
    }

    /* ========================================================
       PORTUGU├èS
       ======================================================== */

    function selectPortugueseVoice() {
        if (!("speechSynthesis" in window)) {
            return null;
        }

        const voices =
            window.speechSynthesis
                .getVoices()
                .filter(
                    voice =>
                        String(
                            voice.lang || ""
                        )
                            .toLowerCase()
                            .startsWith("pt")
                );

        if (!voices.length) {
            return null;
        }

        const ptBR =
            voices.filter(
                voice =>
                    String(
                        voice.lang || ""
                    )
                        .toLowerCase()
                        .startsWith("pt-br")
            );

        const pool =
            ptBR.length
                ? ptBR
                : voices;

        const preferred = [
            "francisca",
            "maria",
            "luciana",
            "fernanda"
        ];

        return (
            pool.find(
                voice =>
                    preferred.some(
                        name =>
                            String(
                                voice.name || ""
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
            !("speechSynthesis" in window) ||
            typeof SpeechSynthesisUtterance ===
                "undefined"
        ) {
            return Promise.reject(
                new Error(
                    "Voz em portugu├¬s indispon├¡vel."
                )
            );
        }

        return new Promise((resolve, reject) => {
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

            utterance.onstart = () => {
                if (
                    currentSession?.id !==
                    session.id
                ) {
                    return;
                }

                setButtonPlaying(
                    session.button
                );
            };

            utterance.onend = () => {
                if (
                    currentUtterance ===
                    utterance
                ) {
                    currentUtterance = null;
                }

                resolve(true);
            };

            utterance.onerror = event => {
                if (
                    event.error === "canceled" ||
                    event.error === "interrupted"
                ) {
                    resolve(false);
                    return;
                }

                reject(
                    new Error(
                        event.error ||
                        "Erro no ├íudio pt-BR."
                    )
                );
            };

            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(
                utterance
            );
        });
    }

    /* ========================================================
       SPEAK
       ======================================================== */

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
            resolveOptions({
                ...options,
                priority: "foreground"
            });

        stop();

        const id =
            ++sessionId;

        const session = {
            id,
            text: value,
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
                const prepared =
                    await prepareEnglishAudio(
                        value,
                        resolved,
                        "foreground"
                    );

                if (
                    currentSession?.id !==
                    id
                ) {
                    return false;
                }

                result =
                    await playPrepared(
                        prepared,
                        session
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
                        text: value,
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
                    text: value,
                    lang:
                        resolved.lang
                }
            );

            return false;
        }
    }

    /* ========================================================
       PRELOAD
       ======================================================== */

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
            resolveOptions({
                ...options,
                priority:
                    options.priority ||
                    "current"
            });

        if (
            resolved.lang ===
            CONFIG.portugueseLang
        ) {
            return true;
        }

        try {
            await prepareEnglishAudio(
                value,
                resolved,
                resolved.priority
            );

            return true;
        } catch (error) {
            console.warn(
                "[EYTSpeech] preload:",
                value,
                error
            );

            return false;
        }
    }

    async function preloadMany(
        items,
        options = {}
    ) {
        const list =
            Array.isArray(items)
                ? items
                : [];

        const unique =
            new Map();

        for (const item of list) {
            if (!item) {
                continue;
            }

            const text =
                cleanText(
                    typeof item === "string"
                        ? item
                        : item.text
                );

            if (!text) {
                continue;
            }

            const resolved =
                resolveOptions({
                    ...(typeof item === "string"
                        ? {}
                        : item),
                    priority:
                        item?.priority ||
                        options.priority ||
                        "background"
                });

            if (
                resolved.lang ===
                CONFIG.portugueseLang
            ) {
                continue;
            }

            const key =
                cacheKey(
                    text,
                    resolved
                );

            if (!unique.has(key)) {
                unique.set(
                    key,
                    {
                        text,
                        ...resolved
                    }
                );
            }
        }

        const queue =
            Array.from(
                unique.values()
            );

        let index = 0;
        let loaded = 0;
        let failed = 0;

        const concurrency =
            Math.max(
                1,
                Math.min(
                    Number(
                        options.concurrency
                    ) || 4,
                    8
                )
            );

        async function runner() {
            while (true) {
                const position =
                    index++;

                if (
                    position >=
                    queue.length
                ) {
                    return;
                }

                const item =
                    queue[position];

                const success =
                    await preload(
                        item.text,
                        item
                    );

                if (success) {
                    loaded++;
                } else {
                    failed++;
                }
            }
        }

        await Promise.all(
            Array.from(
                {
                    length:
                        Math.min(
                            concurrency,
                            queue.length
                        )
                },
                runner
            )
        );

        return {
            total:
                queue.length,
            loaded,
            failed
        };
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
                slow: true
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

    function warmup() {
        try {
            getWorker().postMessage({
                type: "warmup"
            });

            return true;
        } catch (_) {
            return false;
        }
    }

    async function clearCache() {
        blobCache.clear();
        decodedCache.clear();
        blobLoading.clear();
        decoding.clear();

        await persistentClear();

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
            blobs:
                blobCache.size,
            decoded:
                decodedCache.size,
            generating:
                generationQueue.length
        };
    }

    void openDatabase();

    try {
        navigator.storage
            ?.persist?.();
    } catch (_) {
    }

    if ("speechSynthesis" in window) {
        window.speechSynthesis.getVoices();
    }

    window.addEventListener(
        "pagehide",
        () => {
            stopSource();
            stopNative();
        }
    );

    return {
        isSupported: () => true,
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
        preloadMany,
        warmup,
        clearCache,
        getRuntime,
        getConfig,
        getAudioState,
        unlockAudio
    };
})();

/* === EYT RESILIENT AUDIO FALLBACK START === */
(() => {
    "use strict";

    /*
     * IMPORTANT:
     * EYTSpeech is originally declared as a global lexical binding:
     *
     * const EYTSpeech = ...
     *
     * That does NOT guarantee window.EYTSpeech exists.
     *
     * We therefore reference the real lexical binding first.
     */
    const speechApi =
        typeof EYTSpeech !== "undefined"
            ? EYTSpeech
            : window.EYTSpeech;

    if (!speechApi) {
        console.error(
            "[EYTAudio V3] EYTSpeech binding was not found."
        );
        return;
    }

    /*
     * Publish it explicitly so diagnostics and other scripts
     * can always use window.EYTSpeech too.
     */
    window.EYTSpeech = speechApi;

    if (
        speechApi.__resilientAudioV3Installed
    ) {
        return;
    }

    const state = {
        kokoroHealthy: true,
        failures: 0,
        lastFailure: null,
        nativeSpeaking: false,
        nativeButton: null
    };

    function nativeAvailable() {
        return (
            "speechSynthesis" in window &&
            typeof SpeechSynthesisUtterance !==
                "undefined"
        );
    }

    function cleanText(value) {
        return String(value ?? "")
            .replace(/\u00a0/g, " ")
            .replace(/_{2,}/g, " blank ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function normalizeLang(lang) {
        const value =
            String(
                lang || "en-US"
            ).toLowerCase();

        if (value.startsWith("pt")) {
            return "pt-BR";
        }

        if (value.startsWith("en-gb")) {
            return "en-GB";
        }

        return "en-US";
    }

    function chooseVoice(lang) {
        if (!nativeAvailable()) {
            return null;
        }

        const voices =
            speechSynthesis.getVoices() || [];

        const desired =
            normalizeLang(lang);

        const exact =
            voices.find(
                voice =>
                    String(
                        voice.lang || ""
                    ).toLowerCase() ===
                    desired.toLowerCase()
            );

        if (exact) {
            return exact;
        }

        const prefix =
            desired
                .split("-")[0]
                .toLowerCase();

        const sameLanguage =
            voices.filter(
                voice =>
                    String(
                        voice.lang || ""
                    )
                        .toLowerCase()
                        .startsWith(prefix)
            );

        const preferred = [
            "aria",
            "jenny",
            "guy",
            "sonia",
            "ryan",
            "google",
            "microsoft"
        ];

        return (
            sameLanguage.find(
                voice =>
                    preferred.some(
                        name =>
                            String(
                                voice.name || ""
                            )
                                .toLowerCase()
                                .includes(name)
                    )
            ) ||
            sameLanguage[0] ||
            null
        );
    }

    function resetNativeButton() {
        if (!state.nativeButton) {
            return;
        }

        state.nativeButton
            .classList
            .remove("is-speaking");

        state.nativeButton.setAttribute(
            "aria-pressed",
            "false"
        );

        state.nativeButton = null;
    }

    function stopNative() {
        if (nativeAvailable()) {
            speechSynthesis.cancel();
        }

        state.nativeSpeaking = false;

        resetNativeButton();
    }

    function speakNative(
        text,
        options = {}
    ) {
        if (!nativeAvailable()) {
            console.error(
                "[EYTAudio V3] Native speech unavailable."
            );
            return Promise.resolve(false);
        }

        const content =
            cleanText(text);

        if (!content) {
            return Promise.resolve(false);
        }

        stopNative();

        return new Promise(resolve => {
            const utterance =
                new SpeechSynthesisUtterance(
                    content
                );

            const lang =
                normalizeLang(
                    options.lang
                );

            utterance.lang = lang;

            const voice =
                chooseVoice(lang);

            if (voice) {
                utterance.voice = voice;
            }

            const requestedRate =
                Number(options.rate);

            utterance.rate =
                Number.isFinite(
                    requestedRate
                )
                    ? Math.max(
                        0.75,
                        Math.min(
                            1.12,
                            requestedRate
                        )
                    )
                    : 0.96;

            utterance.pitch = 1;
            utterance.volume = 1;

            if (options.button) {
                state.nativeButton =
                    options.button;

                options.button
                    .classList
                    .add("is-speaking");

                options.button.setAttribute(
                    "aria-pressed",
                    "true"
                );
            }

            utterance.onstart = () => {
                state.nativeSpeaking = true;
            };

            utterance.onend = () => {
                state.nativeSpeaking = false;
                resetNativeButton();
                resolve(true);
            };

            utterance.onerror = event => {
                state.nativeSpeaking = false;
                resetNativeButton();

                if (
                    event.error === "canceled" ||
                    event.error === "interrupted"
                ) {
                    resolve(false);
                    return;
                }

                console.warn(
                    "[EYTAudio V3] Native speech error:",
                    event.error
                );

                resolve(false);
            };

            speechSynthesis.speak(
                utterance
            );
        });
    }

    function errorText(error) {
        return String(
            error?.message ||
            error?.error ||
            error ||
            ""
        );
    }

    function isStructuralFailure(error) {
        const text =
            errorText(error)
                .toLowerCase();

        return (
            text.includes("failed to fetch") ||
            text.includes("cors") ||
            text.includes("onnx") ||
            text.includes("model_quantized") ||
            text.includes("huggingface") ||
            text.includes("network") ||
            text.includes("could not locate")
        );
    }

    function openCircuit(error) {
        if (!state.kokoroHealthy) {
            return;
        }

        state.kokoroHealthy = false;
        state.failures++;
        state.lastFailure =
            errorText(error) ||
            "Kokoro unavailable";

        console.warn(
            "[EYTAudio V3] KOKORO CIRCUIT OPEN:",
            state.lastFailure
        );
    }

    function closeCircuit() {
        state.kokoroHealthy = true;
        state.failures = 0;
        state.lastFailure = null;

        console.info(
            "[EYTAudio V3] Kokoro circuit reset."
        );
    }

    const original = {
        speak:
            speechApi.speak
                .bind(speechApi),

        toggle:
            speechApi.toggle
                .bind(speechApi),

        preload:
            speechApi.preload
                .bind(speechApi),

        preloadMany:
            speechApi.preloadMany
                .bind(speechApi),

        warmup:
            speechApi.warmup
                .bind(speechApi),

        stop:
            speechApi.stop
                .bind(speechApi),

        getAudioState:
            speechApi.getAudioState
                .bind(speechApi)
    };

    /*
     * The original engine catches errors internally and often
     * returns false, so we also listen to its error event.
     */
    let lastInternalError = null;

    window.addEventListener(
        "eyt:speech-error",
        event => {
            const error =
                event?.detail?.error ||
                "Speech error";

            lastInternalError =
                error;

            if (
                isStructuralFailure(error)
            ) {
                openCircuit(error);
            }
        }
    );

    async function resilientSpeak(
        text,
        options = {}
    ) {
        if (
            !state.kokoroHealthy
        ) {
            return speakNative(
                text,
                options
            );
        }

        lastInternalError = null;

        try {
            const result =
                await original.speak(
                    text,
                    options
                );

            if (
                result === false &&
                (
                    lastInternalError ||
                    !state.kokoroHealthy
                )
            ) {
                return speakNative(
                    text,
                    options
                );
            }

            return result;
        }
        catch (error) {
            if (
                isStructuralFailure(error)
            ) {
                openCircuit(error);

                return speakNative(
                    text,
                    options
                );
            }

            throw error;
        }
    }

    async function resilientToggle(
        text,
        button,
        options = {}
    ) {
        if (
            state.nativeSpeaking &&
            state.nativeButton === button
        ) {
            stopNative();
            return false;
        }

        if (
            !state.kokoroHealthy
        ) {
            return speakNative(
                text,
                {
                    ...options,
                    button
                }
            );
        }

        lastInternalError = null;

        try {
            const result =
                await original.toggle(
                    text,
                    button,
                    options
                );

            if (
                result === false &&
                (
                    lastInternalError ||
                    !state.kokoroHealthy
                )
            ) {
                return speakNative(
                    text,
                    {
                        ...options,
                        button
                    }
                );
            }

            return result;
        }
        catch (error) {
            if (
                isStructuralFailure(error)
            ) {
                openCircuit(error);

                return speakNative(
                    text,
                    {
                        ...options,
                        button
                    }
                );
            }

            throw error;
        }
    }

    async function resilientPreload(
        text,
        options = {}
    ) {
        if (
            !state.kokoroHealthy
        ) {
            return false;
        }

        try {
            const result =
                await original.preload(
                    text,
                    options
                );

            if (result === false) {
                openCircuit(
                    "Kokoro preload returned false"
                );
                return false;
            }

            return true;
        }
        catch (error) {
            openCircuit(error);
            return false;
        }
    }

    async function resilientPreloadMany(
        items,
        options = {}
    ) {
        const list =
            Array.isArray(items)
                ? items
                : [];

        if (!list.length) {
            return {
                total: 0,
                loaded: 0,
                failed: 0,
                skipped: 0
            };
        }

        if (
            !state.kokoroHealthy
        ) {
            return {
                total: list.length,
                loaded: 0,
                failed: 0,
                skipped: list.length,
                fallback: "native"
            };
        }

        /*
         * HEALTH PROBE:
         * only ONE neural request is allowed before the
         * mass-preload begins.
         */
        const first =
            list[0];

        const firstText =
            typeof first === "string"
                ? first
                : first?.text;

        const firstOptions =
            typeof first === "string"
                ? options
                : {
                    ...options,
                    ...first
                };

        console.info(
            "[EYTAudio V3] Kokoro health probe..."
        );

        const healthy =
            await resilientPreload(
                firstText,
                firstOptions
            );

        if (
            !healthy ||
            !state.kokoroHealthy
        ) {
            console.warn(
                "[EYTAudio V3] Kokoro preload disabled after health probe. Native fallback ready."
            );

            return {
                total: list.length,
                loaded: 0,
                failed: 1,
                skipped:
                    Math.max(
                        0,
                        list.length - 1
                    ),
                fallback: "native"
            };
        }

        /*
         * Kokoro is alive.
         * Use the ORIGINAL optimized parallel preload for
         * the remaining items.
         */
        if (list.length === 1) {
            return {
                total: 1,
                loaded: 1,
                failed: 0,
                skipped: 0
            };
        }

        const remaining =
            list.slice(1);

        try {
            const result =
                await original.preloadMany(
                    remaining,
                    options
                );

            return result;
        }
        catch (error) {
            openCircuit(error);

            return {
                total: list.length,
                loaded: 1,
                failed: 1,
                skipped:
                    Math.max(
                        0,
                        list.length - 2
                    ),
                fallback: "native"
            };
        }
    }

    function resilientStop() {
        try {
            original.stop();
        }
        catch (_) {
        }

        stopNative();
    }

    speechApi.speak =
        resilientSpeak;

    speechApi.speakEnglish =
        (
            text,
            options = {}
        ) =>
            resilientSpeak(
                text,
                {
                    ...options,
                    lang:
                        options.lang ||
                        "en-US"
                }
            );

    speechApi.speakEnglishSlow =
        (
            text,
            options = {}
        ) =>
            resilientSpeak(
                text,
                {
                    ...options,
                    lang:
                        options.lang ||
                        "en-US",
                    slow: true,
                    rate:
                        options.rate ||
                        0.93
                }
            );

    speechApi.toggle =
        resilientToggle;

    speechApi.toggleEnglish =
        (
            text,
            button,
            options = {}
        ) =>
            resilientToggle(
                text,
                button,
                {
                    ...options,
                    lang:
                        options.lang ||
                        "en-US"
                }
            );

    speechApi.preload =
        resilientPreload;

    speechApi.preloadMany =
        resilientPreloadMany;

    speechApi.stop =
        resilientStop;

    speechApi.getAudioState =
        function() {
            return {
                ...original.getAudioState(),
                kokoroHealthy:
                    state.kokoroHealthy,
                nativeAvailable:
                    nativeAvailable(),
                nativeSpeaking:
                    state.nativeSpeaking,
                failures:
                    state.failures,
                lastFailure:
                    state.lastFailure
            };
        };

    window.EYTAudioHealth = {
        getState() {
            return {
                kokoroHealthy:
                    state.kokoroHealthy,

                failures:
                    state.failures,

                lastFailure:
                    state.lastFailure,

                nativeAvailable:
                    nativeAvailable(),

                nativeSpeaking:
                    state.nativeSpeaking,

                audioState:
                    original.getAudioState()
            };
        },

        retryKokoro() {
            closeCircuit();
            return true;
        },

        forceNative() {
            openCircuit(
                "Native mode manually enabled"
            );
            return true;
        },

        speakNative,

        stopNative
    };

    speechApi.__resilientAudioInstalled =
        true;

    speechApi.__resilientAudioV3Installed =
        true;

    console.info(
        "[EYTAudio V3] Installed successfully."
    );

    console.info(
        "[EYTAudio V3] Native available:",
        nativeAvailable()
    );
})();
/* === EYT RESILIENT AUDIO FALLBACK END === */
