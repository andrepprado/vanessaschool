import fs from "node:fs";

const file =
    "js/speech.js";

let source =
    fs.readFileSync(
        file,
        "utf8"
    );

const startMarker =
    "/* === EYT RESILIENT AUDIO FALLBACK START === */";

const endMarker =
    "/* === EYT RESILIENT AUDIO FALLBACK END === */";

const start =
    source.indexOf(
        startMarker
    );

const end =
    source.indexOf(
        endMarker
    );

if (
    start < 0 ||
    end < 0
) {
    throw new Error(
        "Existing resilient audio block was not found."
    );
}

const before =
    source.slice(
        0,
        start
    );

const after =
    source.slice(
        end +
        endMarker.length
    );

const replacement = `
/* === EYT RESILIENT AUDIO FALLBACK START === */

(() => {
    "use strict";

    /*
     * ========================================================
     * RESILIENT ZERO-DELAY AUDIO V2
     * ========================================================
     *
     * IMPORTANT:
     *
     * The original EYTSpeech engine deliberately catches
     * generation errors and returns false.
     *
     * Therefore failover CANNOT depend exclusively on catch().
     *
     * This layer:
     *
     * 1. Keeps the original cache architecture.
     * 2. Detects false returns from Kokoro.
     * 3. Detects eyt:speech-error events.
     * 4. Stops bulk preload after structural failure.
     * 5. Uses native speech instantly while Kokoro is down.
     */

    const STATE = {
        kokoroHealthy: true,
        failures: 0,
        lastFailure: null,
        lastSpeechError: null,
        nativeSpeaking: false,
        nativeButton: null,
        nativeUtterance: null
    };

    function normalizeLanguage(
        lang
    ) {
        const value =
            String(
                lang ||
                "en-US"
            )
                .trim()
                .toLowerCase();

        if (
            value.startsWith(
                "pt"
            )
        ) {
            return "pt-BR";
        }

        if (
            value.startsWith(
                "en-gb"
            )
        ) {
            return "en-GB";
        }

        return "en-US";
    }

    function isEnglish(
        options = {}
    ) {
        return !normalizeLanguage(
            options.lang
        ).startsWith(
            "pt"
        );
    }

    function hasNativeSpeech() {
        return (
            typeof window !==
                "undefined" &&
            "speechSynthesis" in
                window &&
            typeof SpeechSynthesisUtterance !==
                "undefined"
        );
    }

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
                /_{2,}/g,
                " blank "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();
    }

    function getVoices() {
        if (
            !hasNativeSpeech()
        ) {
            return [];
        }

        return window
            .speechSynthesis
            .getVoices() || [];
    }

    function chooseNativeVoice(
        lang
    ) {
        const voices =
            getVoices();

        const normalized =
            normalizeLanguage(
                lang
            );

        const exact =
            voices.find(
                voice =>
                    String(
                        voice.lang ||
                        ""
                    )
                        .toLowerCase() ===
                    normalized
                        .toLowerCase()
            );

        if (exact) {
            return exact;
        }

        const prefix =
            normalized
                .split("-")[0]
                .toLowerCase();

        const sameLanguage =
            voices.filter(
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

        if (
            !sameLanguage.length
        ) {
            return null;
        }

        /*
         * Prefer higher quality voices when the browser
         * provides names such as Microsoft / Google.
         */
        const preferredNames = [
            "aria",
            "jenny",
            "guy",
            "sara",
            "sonia",
            "ryan",
            "google",
            "microsoft"
        ];

        return (
            sameLanguage.find(
                voice =>
                    preferredNames.some(
                        name =>
                            String(
                                voice.name ||
                                ""
                            )
                                .toLowerCase()
                                .includes(
                                    name
                                )
                    )
            ) ||
            sameLanguage[0]
        );
    }

    function resetNativeButton() {
        const button =
            STATE.nativeButton;

        if (button) {
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
                button.dataset
                    .speechLabel ||
                "Ouvir áudio";

            button.setAttribute(
                "aria-label",
                original
            );

            button.setAttribute(
                "title",
                original
            );
        }

        STATE.nativeButton =
            null;
    }

    function stopNative() {
        if (
            hasNativeSpeech()
        ) {
            try {
                window
                    .speechSynthesis
                    .cancel();
            }
            catch (_) {
            }
        }

        STATE.nativeSpeaking =
            false;

        STATE.nativeUtterance =
            null;

        resetNativeButton();
    }

    function activateNativeButton(
        button
    ) {
        if (!button) {
            return;
        }

        if (
            !button.dataset
                .eytOriginalLabel
        ) {
            button.dataset
                .eytOriginalLabel =
                button.getAttribute(
                    "aria-label"
                ) ||
                button.getAttribute(
                    "title"
                ) ||
                "Ouvir áudio";
        }

        resetNativeButton();

        STATE.nativeButton =
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
            "Parar áudio"
        );

        button.setAttribute(
            "title",
            "Parar áudio"
        );
    }

    function speakNative(
        text,
        options = {}
    ) {
        if (
            !hasNativeSpeech()
        ) {
            return Promise.resolve(
                false
            );
        }

        const value =
            cleanText(
                text
            );

        if (!value) {
            return Promise.resolve(
                false
            );
        }

        stopNative();

        return new Promise(
            resolve => {
                try {
                    const utterance =
                        new SpeechSynthesisUtterance(
                            value
                        );

                    const lang =
                        normalizeLanguage(
                            options.lang
                        );

                    utterance.lang =
                        lang;

                    const voice =
                        chooseNativeVoice(
                            lang
                        );

                    if (voice) {
                        utterance.voice =
                            voice;
                    }

                    const requestedRate =
                        Number(
                            options.rate
                        );

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

                    utterance.pitch =
                        1;

                    utterance.volume =
                        1;

                    STATE.nativeUtterance =
                        utterance;

                    activateNativeButton(
                        options.button ||
                        null
                    );

                    utterance.onstart =
                        () => {
                            STATE.nativeSpeaking =
                                true;

                            window.dispatchEvent(
                                new CustomEvent(
                                    "eyt:speech-start",
                                    {
                                        detail: {
                                            text:
                                                value,
                                            lang,
                                            engine:
                                                "native-fallback",
                                            cached:
                                                false
                                        }
                                    }
                                )
                            );
                        };

                    utterance.onend =
                        () => {
                            STATE.nativeSpeaking =
                                false;

                            STATE.nativeUtterance =
                                null;

                            resetNativeButton();

                            window.dispatchEvent(
                                new CustomEvent(
                                    "eyt:speech-end",
                                    {
                                        detail: {
                                            text:
                                                value,
                                            lang,
                                            engine:
                                                "native-fallback"
                                        }
                                    }
                                )
                            );

                            resolve(
                                true
                            );
                        };

                    utterance.onerror =
                        event => {
                            STATE.nativeSpeaking =
                                false;

                            STATE.nativeUtterance =
                                null;

                            resetNativeButton();

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

                            console.warn(
                                "[EYTAudio] Native fallback error:",
                                event.error
                            );

                            resolve(
                                false
                            );
                        };

                    window
                        .speechSynthesis
                        .speak(
                            utterance
                        );
                }
                catch (error) {
                    console.warn(
                        "[EYTAudio] Native fallback error:",
                        error
                    );

                    STATE.nativeSpeaking =
                        false;

                    STATE.nativeUtterance =
                        null;

                    resetNativeButton();

                    resolve(
                        false
                    );
                }
            }
        );
    }

    function failureText(
        error
    ) {
        if (
            error &&
            typeof error ===
                "object"
        ) {
            return String(
                error.message ||
                error.error ||
                error.detail?.error ||
                error
            );
        }

        return String(
            error ||
            ""
        );
    }

    function isStructuralFailure(
        error
    ) {
        const message =
            failureText(
                error
            )
                .toLowerCase();

        return (
            message.includes(
                "failed to fetch"
            ) ||
            message.includes(
                "cors"
            ) ||
            message.includes(
                "model_quantized"
            ) ||
            message.includes(
                "could not locate file"
            ) ||
            message.includes(
                "huggingface"
            ) ||
            message.includes(
                "onnx"
            ) ||
            message.includes(
                "network"
            ) ||
            message.includes(
                "tempo excedido"
            )
        );
    }

    function markKokoroFailure(
        error
    ) {
        STATE.failures++;

        STATE.lastFailure =
            failureText(
                error
            ) ||
            "Kokoro unavailable";

        STATE.kokoroHealthy =
            false;

        console.warn(
            "[EYTAudio] Kokoro unavailable. Circuit OPEN. Native audio enabled.",
            STATE.lastFailure
        );
    }

    function resetKokoro() {
        STATE.kokoroHealthy =
            true;

        STATE.failures =
            0;

        STATE.lastFailure =
            null;

        STATE.lastSpeechError =
            null;

        console.info(
            "[EYTAudio] Kokoro circuit reset."
        );
    }

    /*
     * The ORIGINAL speech() catches its own error,
     * dispatches this event and returns false.
     *
     * This event is therefore essential to distinguish:
     *
     * - toggle-off -> false
     * - real Kokoro failure -> false + speech-error
     */
    window.addEventListener(
        "eyt:speech-error",
        event => {
            const message =
                event?.detail?.error ||
                "Speech error";

            STATE.lastSpeechError =
                message;

            if (
                isStructuralFailure(
                    message
                )
            ) {
                markKokoroFailure(
                    message
                );
            }
        }
    );

    function install() {
        if (
            !window.EYTSpeech
        ) {
            return false;
        }

        if (
            window.EYTSpeech
                .__resilientAudioV2Installed
        ) {
            return true;
        }

        const original = {
            speak:
                window.EYTSpeech
                    .speak
                    .bind(
                        window.EYTSpeech
                    ),

            toggle:
                window.EYTSpeech
                    .toggle
                    .bind(
                        window.EYTSpeech
                    ),

            stop:
                window.EYTSpeech
                    .stop
                    .bind(
                        window.EYTSpeech
                    ),

            preload:
                window.EYTSpeech
                    .preload
                    .bind(
                        window.EYTSpeech
                    ),

            preloadMany:
                window.EYTSpeech
                    .preloadMany
                    .bind(
                        window.EYTSpeech
                    ),

            warmup:
                window.EYTSpeech
                    .warmup
                    .bind(
                        window.EYTSpeech
                    ),

            getAudioState:
                window.EYTSpeech
                    .getAudioState
                    .bind(
                        window.EYTSpeech
                    )
        };

        async function resilientSpeak(
            text,
            options = {}
        ) {
            if (
                isEnglish(
                    options
                ) &&
                !STATE.kokoroHealthy
            ) {
                return speakNative(
                    text,
                    options
                );
            }

            STATE.lastSpeechError =
                null;

            let result =
                false;

            try {
                result =
                    await original.speak(
                        text,
                        options
                    );
            }
            catch (error) {
                STATE.lastSpeechError =
                    error;

                if (
                    isEnglish(
                        options
                    ) &&
                    isStructuralFailure(
                        error
                    )
                ) {
                    markKokoroFailure(
                        error
                    );
                }
            }

            if (
                result !== false
            ) {
                return result;
            }

            if (
                !isEnglish(
                    options
                )
            ) {
                return false;
            }

            /*
             * If original speech failed rather than being
             * intentionally stopped, use fallback now.
             */
            if (
                !STATE.kokoroHealthy ||
                STATE.lastSpeechError
            ) {
                return speakNative(
                    text,
                    options
                );
            }

            return false;
        }

        async function resilientToggle(
            text,
            button,
            options = {}
        ) {
            /*
             * Clicking the SAME native button while speaking
             * behaves exactly like the Kokoro toggle:
             * stop playback.
             */
            if (
                STATE.nativeSpeaking &&
                STATE.nativeButton ===
                    button
            ) {
                stopNative();

                return false;
            }

            /*
             * If native fallback is already speaking another
             * sentence, stop it before the new one.
             */
            if (
                STATE.nativeSpeaking
            ) {
                stopNative();
            }

            if (
                isEnglish(
                    options
                ) &&
                !STATE.kokoroHealthy
            ) {
                return speakNative(
                    text,
                    {
                        ...options,
                        button
                    }
                );
            }

            STATE.lastSpeechError =
                null;

            let result =
                false;

            try {
                result =
                    await original.toggle(
                        text,
                        button,
                        options
                    );
            }
            catch (error) {
                STATE.lastSpeechError =
                    error;

                if (
                    isStructuralFailure(
                        error
                    )
                ) {
                    markKokoroFailure(
                        error
                    );
                }
            }

            if (
                result !== false
            ) {
                return result;
            }

            /*
             * false + no speech error means user probably
             * clicked the same Kokoro button to stop.
             */
            if (
                STATE.kokoroHealthy &&
                !STATE.lastSpeechError
            ) {
                return false;
            }

            if (
                isEnglish(
                    options
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

            return false;
        }

        async function resilientPreload(
            text,
            options = {}
        ) {
            if (
                !isEnglish(
                    options
                )
            ) {
                return true;
            }

            if (
                !STATE.kokoroHealthy
            ) {
                return false;
            }

            let result =
                false;

            try {
                result =
                    await original.preload(
                        text,
                        options
                    );
            }
            catch (error) {
                markKokoroFailure(
                    error
                );

                return false;
            }

            /*
             * ORIGINAL preload catches its own exception
             * and returns false.
             *
             * This was the reason V1 did not open the circuit.
             */
            if (
                result === false
            ) {
                markKokoroFailure(
                    "Kokoro preload returned false"
                );

                return false;
            }

            return true;
        }

        async function resilientPreloadMany(
            items,
            options = {}
        ) {
            const source =
                Array.isArray(
                    items
                )
                    ? items
                    : [];

            const unique =
                new Map();

            for (
                const rawItem of
                source
            ) {
                if (!rawItem) {
                    continue;
                }

                const item =
                    typeof rawItem ===
                    "string"
                        ? {
                            text:
                                rawItem
                        }
                        : {
                            ...rawItem
                        };

                const text =
                    cleanText(
                        item.text
                    );

                if (!text) {
                    continue;
                }

                const lang =
                    normalizeLanguage(
                        item.lang ||
                        options.lang ||
                        "en-US"
                    );

                if (
                    lang.startsWith(
                        "pt"
                    )
                ) {
                    continue;
                }

                const rate =
                    Number(
                        item.rate ||
                        options.rate ||
                        0.98
                    );

                const persona =
                    item.persona ||
                    options.persona ||
                    "teacher";

                const key =
                    [
                        lang,
                        rate,
                        persona,
                        text
                    ].join(
                        "|"
                    );

                if (
                    !unique.has(
                        key
                    )
                ) {
                    unique.set(
                        key,
                        {
                            ...item,
                            text,
                            lang,
                            rate,
                            persona,
                            priority:
                                item.priority ||
                                options.priority ||
                                "background"
                        }
                    );
                }
            }

            const queue =
                Array.from(
                    unique.values()
                );

            if (
                !queue.length
            ) {
                return {
                    total: 0,
                    loaded: 0,
                    failed: 0,
                    skipped: 0
                };
            }

            if (
                !STATE.kokoroHealthy
            ) {
                return {
                    total:
                        queue.length,
                    loaded:
                        0,
                    failed:
                        0,
                    skipped:
                        queue.length,
                    fallback:
                        "native"
                };
            }

            /*
             * HEALTH PROBE
             *
             * Test ONE item before launching parallel preload.
             *
             * If the model cannot load, we stop here instead
             * of firing another 78 failing requests.
             */
            const first =
                queue.shift();

            const firstSuccess =
                await resilientPreload(
                    first.text,
                    first
                );

            if (
                !firstSuccess ||
                !STATE.kokoroHealthy
            ) {
                console.warn(
                    "[EYTAudio] Neural preload aborted after health probe. Native fallback remains available."
                );

                return {
                    total:
                        queue.length +
                        1,
                    loaded:
                        0,
                    failed:
                        1,
                    skipped:
                        queue.length,
                    fallback:
                        "native"
                };
            }

            let loaded =
                1;

            let failed =
                0;

            let skipped =
                0;

            let index =
                0;

            const concurrency =
                Math.max(
                    1,
                    Math.min(
                        Number(
                            options.concurrency
                        ) || 6,
                        6
                    )
                );

            async function runner() {
                while (
                    STATE.kokoroHealthy
                ) {
                    const position =
                        index++;

                    if (
                        position >=
                        queue.length
                    ) {
                        return;
                    }

                    const item =
                        queue[
                            position
                        ];

                    const success =
                        await resilientPreload(
                            item.text,
                            item
                        );

                    if (success) {
                        loaded++;
                    }
                    else {
                        failed++;

                        if (
                            !STATE.kokoroHealthy
                        ) {
                            return;
                        }
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

            if (
                index <
                queue.length
            ) {
                skipped =
                    queue.length -
                    index;
            }

            return {
                total:
                    queue.length +
                    1,
                loaded,
                failed,
                skipped,
                fallback:
                    STATE.kokoroHealthy
                        ? null
                        : "native"
            };
        }

        function resilientWarmup() {
            if (
                !STATE.kokoroHealthy
            ) {
                return false;
            }

            try {
                return original
                    .warmup();
            }
            catch (error) {
                markKokoroFailure(
                    error
                );

                return false;
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

        window.EYTSpeech.speak =
            resilientSpeak;

        window.EYTSpeech.speakEnglish =
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

        window.EYTSpeech.speakEnglishSlow =
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
                        slow:
                            true,
                        rate:
                            options.rate ||
                            0.93
                    }
                );

        window.EYTSpeech.toggle =
            resilientToggle;

        window.EYTSpeech.toggleEnglish =
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

        window.EYTSpeech.preload =
            resilientPreload;

        window.EYTSpeech.preloadMany =
            resilientPreloadMany;

        window.EYTSpeech.warmup =
            resilientWarmup;

        window.EYTSpeech.stop =
            resilientStop;

        const originalGetAudioState =
            original.getAudioState;

        window.EYTSpeech.getAudioState =
            function() {
                return {
                    ...originalGetAudioState(),
                    kokoroHealthy:
                        STATE.kokoroHealthy,
                    nativeAvailable:
                        hasNativeSpeech(),
                    nativeSpeaking:
                        STATE.nativeSpeaking,
                    failures:
                        STATE.failures,
                    lastFailure:
                        STATE.lastFailure
                };
            };

        window.EYTAudioHealth = {
            getState() {
                return {
                    kokoroHealthy:
                        STATE.kokoroHealthy,

                    failures:
                        STATE.failures,

                    lastFailure:
                        STATE.lastFailure,

                    lastSpeechError:
                        STATE.lastSpeechError,

                    nativeAvailable:
                        hasNativeSpeech(),

                    nativeSpeaking:
                        STATE.nativeSpeaking,

                    originalAudioState:
                        original
                            .getAudioState()
                };
            },

            retryKokoro() {
                resetKokoro();

                return true;
            },

            forceNative() {
                STATE.kokoroHealthy =
                    false;

                STATE.lastFailure =
                    "Native mode manually enabled";

                return true;
            },

            speakNative,

            stopNative
        };

        window.EYTSpeech
            .__resilientAudioInstalled =
            true;

        window.EYTSpeech
            .__resilientAudioV2Installed =
            true;

        console.info(
            "[EYTAudio] Resilient Audio V2 installed."
        );

        return true;
    }

    if (
        !install()
    ) {
        let attempts =
            0;

        const timer =
            setInterval(
                () => {
                    attempts++;

                    if (
                        install() ||
                        attempts >=
                            200
                    ) {
                        clearInterval(
                            timer
                        );
                    }
                },
                25
            );
    }

    if (
        hasNativeSpeech() &&
        typeof window
            .speechSynthesis
            .addEventListener ===
            "function"
    ) {
        window
            .speechSynthesis
            .addEventListener(
                "voiceschanged",
                getVoices
            );
    }
})();

/* === EYT RESILIENT AUDIO FALLBACK END === */
`;

source =
    (
        before.trimEnd() +
        "\n\n" +
        replacement.trim() +
        "\n" +
        after.trimStart()
    ).trimEnd() +
    "\n";

fs.writeFileSync(
    file,
    source,
    "utf8"
);

console.log(
    "Resilient Audio V2 installed in js/speech.js."
);