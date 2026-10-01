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

function removeExistingBlock(text) {
    const start =
        text.indexOf(
            startMarker
        );

    if (start < 0) {
        return text;
    }

    const end =
        text.indexOf(
            endMarker,
            start
        );

    if (end < 0) {
        return text;
    }

    return (
        text.slice(
            0,
            start
        ) +
        text.slice(
            end +
            endMarker.length
        )
    );
}

source =
    removeExistingBlock(
        source
    );

const block = `

/* === EYT RESILIENT AUDIO FALLBACK START === */

(() => {
    "use strict";

    /*
     * Audio strategy:
     *
     * 1. Let EYTSpeech use decodedCache / blobCache / IndexedDB first.
     * 2. Let Kokoro generate neural audio when its model is healthy.
     * 3. If Kokoro/model/network fails, open a circuit breaker.
     * 4. While the circuit is open, clicks use browser speech immediately.
     * 5. Cached Kokoro audio remains preferred by the original engine.
     */

    const STATE = {
        kokoroHealthy: true,
        failures: 0,
        maxFailures: 1,
        nativeSpeaking: false,
        lastFailure: null
    };

    function hasNativeSpeech() {
        return (
            typeof window !== "undefined" &&
            "speechSynthesis" in window &&
            typeof SpeechSynthesisUtterance !==
                "undefined"
        );
    }

    function normalizeLanguage(lang) {
        const value =
            String(
                lang || "en-US"
            ).toLowerCase();

        return value.startsWith("pt")
            ? "pt-BR"
            : "en-US";
    }

    function getVoices() {
        if (!hasNativeSpeech()) {
            return [];
        }

        return window.speechSynthesis
            .getVoices() || [];
    }

    function selectVoice(lang) {
        const voices =
            getVoices();

        const desired =
            normalizeLanguage(
                lang
            );

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

        return (
            voices.find(
                voice =>
                    String(
                        voice.lang || ""
                    )
                        .toLowerCase()
                        .startsWith(
                            prefix
                        )
            ) ||
            null
        );
    }

    function sanitizeText(text) {
        return String(
            text ?? ""
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

    function speakNative(
        text,
        options = {}
    ) {
        if (!hasNativeSpeech()) {
            return Promise.reject(
                new Error(
                    "Native browser speech is unavailable."
                )
            );
        }

        const content =
            sanitizeText(
                text
            );

        if (!content) {
            return Promise.resolve();
        }

        return new Promise(
            (
                resolve,
                reject
            ) => {
                try {
                    /*
                     * Cancel only native speech.
                     * This does not clear Kokoro caches.
                     */
                    window.speechSynthesis
                        .cancel();

                    const utterance =
                        new SpeechSynthesisUtterance(
                            content
                        );

                    const lang =
                        normalizeLanguage(
                            options.lang
                        );

                    utterance.lang =
                        lang;

                    const voice =
                        selectVoice(
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
                                0.72,
                                Math.min(
                                    1.12,
                                    requestedRate
                                )
                            )
                            : 0.92;

                    utterance.pitch =
                        1;

                    utterance.volume =
                        1;

                    utterance.onstart =
                        () => {
                            STATE.nativeSpeaking =
                                true;
                        };

                    utterance.onend =
                        () => {
                            STATE.nativeSpeaking =
                                false;

                            resolve();
                        };

                    utterance.onerror =
                        event => {
                            STATE.nativeSpeaking =
                                false;

                            if (
                                event.error ===
                                "interrupted" ||
                                event.error ===
                                "canceled"
                            ) {
                                resolve();
                                return;
                            }

                            reject(
                                new Error(
                                    event.error ||
                                    "Native speech failed."
                                )
                            );
                        };

                    window.speechSynthesis
                        .speak(
                            utterance
                        );
                }
                catch (error) {
                    STATE.nativeSpeaking =
                        false;

                    reject(
                        error
                    );
                }
            }
        );
    }

    function isModelFailure(error) {
        const message =
            String(
                error?.message ||
                error ||
                ""
            ).toLowerCase();

        return (
            message.includes(
                "failed to fetch"
            ) ||
            message.includes(
                "could not locate file"
            ) ||
            message.includes(
                "cors"
            ) ||
            message.includes(
                "model_quantized"
            ) ||
            message.includes(
                "huggingface"
            ) ||
            message.includes(
                "onnx"
            ) ||
            message.includes(
                "network"
            )
        );
    }

    function openCircuit(error) {
        STATE.failures++;

        STATE.lastFailure =
            String(
                error?.message ||
                error ||
                "Unknown Kokoro error"
            );

        if (
            STATE.failures >=
            STATE.maxFailures
        ) {
            STATE.kokoroHealthy =
                false;

            console.warn(
                "[EYTAudio] Kokoro circuit opened. Native fallback enabled for this session.",
                STATE.lastFailure
            );
        }
    }

    function resetCircuit() {
        STATE.kokoroHealthy =
            true;

        STATE.failures =
            0;

        STATE.lastFailure =
            null;

        console.log(
            "[EYTAudio] Kokoro circuit reset."
        );
    }

    function install() {
        if (
            !window.EYTSpeech ||
            typeof window.EYTSpeech.speak !==
                "function"
        ) {
            return false;
        }

        if (
            window.EYTSpeech
                .__resilientAudioInstalled
        ) {
            return true;
        }

        const originalSpeak =
            window.EYTSpeech
                .speak
                .bind(
                    window.EYTSpeech
                );

        const originalPreload =
            typeof window.EYTSpeech.preload ===
            "function"
                ? window.EYTSpeech
                    .preload
                    .bind(
                        window.EYTSpeech
                    )
                : null;

        const originalPreloadMany =
            typeof window.EYTSpeech.preloadMany ===
            "function"
                ? window.EYTSpeech
                    .preloadMany
                    .bind(
                        window.EYTSpeech
                    )
                : null;

        const originalStop =
            typeof window.EYTSpeech.stop ===
            "function"
                ? window.EYTSpeech
                    .stop
                    .bind(
                        window.EYTSpeech
                    )
                : null;

        /*
         * IMPORTANT:
         * We always call the original speak while Kokoro is considered
         * healthy, because the original engine checks:
         *
         * decodedCache -> blobCache -> IndexedDB -> generate
         *
         * Therefore already-cached neural audio stays zero-delay.
         */
        window.EYTSpeech.speak =
            async function(
                text,
                options = {}
            ) {
                if (
                    STATE.kokoroHealthy
                ) {
                    try {
                        const result =
                            await originalSpeak(
                                text,
                                options
                            );

                        /*
                         * A successful neural/cache playback proves
                         * the path is usable.
                         */
                        STATE.failures =
                            0;

                        return result;
                    }
                    catch (error) {
                        if (
                            isModelFailure(
                                error
                            )
                        ) {
                            openCircuit(
                                error
                            );
                        }
                        else {
                            console.warn(
                                "[EYTAudio] Kokoro playback error. Using fallback.",
                                error
                            );
                        }
                    }
                }

                /*
                 * Zero-network fallback.
                 * Starts through browser's local speech service.
                 */
                return speakNative(
                    text,
                    options
                );
            };

        /*
         * Background preload keeps working while Kokoro is healthy.
         *
         * After the first model/network failure we STOP wasting dozens
         * of requests. The user still has immediate native speech.
         */
        if (originalPreload) {
            window.EYTSpeech.preload =
                async function(
                    text,
                    options = {}
                ) {
                    if (
                        !STATE.kokoroHealthy
                    ) {
                        return false;
                    }

                    try {
                        return await originalPreload(
                            text,
                            options
                        );
                    }
                    catch (error) {
                        if (
                            isModelFailure(
                                error
                            )
                        ) {
                            openCircuit(
                                error
                            );

                            return false;
                        }

                        console.warn(
                            "[EYTAudio] Preload failed:",
                            error
                        );

                        return false;
                    }
                };
        }

        if (originalPreloadMany) {
            window.EYTSpeech.preloadMany =
                async function(
                    items,
                    options = {}
                ) {
                    if (
                        !STATE.kokoroHealthy
                    ) {
                        console.warn(
                            "[EYTAudio] Kokoro unavailable. Bulk neural preload skipped."
                        );

                        return [];
                    }

                    try {
                        return await originalPreloadMany(
                            items,
                            options
                        );
                    }
                    catch (error) {
                        if (
                            isModelFailure(
                                error
                            )
                        ) {
                            openCircuit(
                                error
                            );

                            return [];
                        }

                        console.warn(
                            "[EYTAudio] Bulk preload failed:",
                            error
                        );

                        return [];
                    }
                };
        }

        window.EYTSpeech.stop =
            function() {
                try {
                    originalStop?.();
                }
                catch (error) {
                    console.warn(
                        "[EYTAudio] Kokoro stop error:",
                        error
                    );
                }

                if (
                    hasNativeSpeech()
                ) {
                    window.speechSynthesis
                        .cancel();
                }

                STATE.nativeSpeaking =
                    false;
            };

        /*
         * Public diagnostics / manual retry.
         */
        window.EYTAudioHealth = {
            getState() {
                return {
                    kokoroHealthy:
                        STATE.kokoroHealthy,

                    failures:
                        STATE.failures,

                    nativeAvailable:
                        hasNativeSpeech(),

                    nativeSpeaking:
                        STATE.nativeSpeaking,

                    lastFailure:
                        STATE.lastFailure
                };
            },

            retryKokoro() {
                resetCircuit();
            },

            speakNative,

            stopNative() {
                if (
                    hasNativeSpeech()
                ) {
                    window.speechSynthesis
                        .cancel();
                }

                STATE.nativeSpeaking =
                    false;
            }
        };

        window.EYTSpeech
            .__resilientAudioInstalled =
            true;

        console.log(
            "[EYTAudio] Resilient neural/native audio installed."
        );

        return true;
    }

    /*
     * speech.js creates EYTSpeech in the same script.
     * Install immediately when possible; otherwise wait a few ms.
     */
    if (!install()) {
        let attempts =
            0;

        const timer =
            setInterval(
                () => {
                    attempts++;

                    if (
                        install() ||
                        attempts >= 200
                    ) {
                        clearInterval(
                            timer
                        );
                    }
                },
                25
            );
    }

    /*
     * Browser voices can arrive asynchronously.
     */
    if (
        hasNativeSpeech() &&
        typeof window.speechSynthesis
            .addEventListener ===
            "function"
    ) {
        window.speechSynthesis
            .addEventListener(
                "voiceschanged",
                () => {
                    getVoices();
                }
            );
    }
})();

/* === EYT RESILIENT AUDIO FALLBACK END === */
`;

source =
    source.trimEnd() +
    "\n" +
    block +
    "\n";

fs.writeFileSync(
    file,
    source,
    "utf8"
);

console.log(
    "Resilient audio fallback installed."
);
