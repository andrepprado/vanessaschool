import fs from "node:fs";

const file = "js/speech.js";

let source = fs.readFileSync(
    file,
    "utf8"
);

const oldStart =
    "/* === EYT RESILIENT AUDIO FALLBACK START === */";

const oldEnd =
    "/* === EYT RESILIENT AUDIO FALLBACK END === */";

function removeBlock(text) {
    const start =
        text.indexOf(oldStart);

    if (start < 0) {
        return text;
    }

    const end =
        text.indexOf(
            oldEnd,
            start
        );

    if (end < 0) {
        throw new Error(
            "Existing fallback start found without end marker."
        );
    }

    return (
        text.slice(0, start) +
        text.slice(
            end +
            oldEnd.length
        )
    );
}

source = removeBlock(source);

const block = String.raw`
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
`;

source =
    source.trimEnd() +
    "\n\n" +
    block.trim() +
    "\n";

fs.writeFileSync(
    file,
    source,
    "utf8"
);

console.log(
    "Audio failover V3 installed."
);