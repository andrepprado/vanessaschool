const EYTLessonSounds = (() => {
    "use strict";

    const CONFIG = {
        enabled: true,
        volume: 0.72,

        files: {
            correct:
                "audio/feedback/correct.wav",

            incorrect:
                "audio/feedback/incorrect.wav",

            complete:
                "audio/feedback/complete.mp3"
        }
    };

    const audioElements =
        new Map();

    let audioContext =
        null;

    let currentAudio =
        null;

    /* ==========================================================================
       WEB AUDIO
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
            new AudioContextClass();

        return audioContext;
    }

    /* ==========================================================================
       ARQUIVOS
       ========================================================================== */

    function getAudio(
        type
    ) {
        if (
            !CONFIG.files[
            type
            ]
        ) {
            return null;
        }

        if (
            !audioElements
                .has(
                    type
                )
        ) {
            const audio =
                new Audio(
                    CONFIG.files[
                    type
                    ]
                );

            audio.preload =
                "auto";

            audio.volume =
                CONFIG.volume;

            audioElements.set(
                type,
                audio
            );
        }

        return audioElements
            .get(
                type
            );
    }

    /* ==========================================================================
       STOP
       ========================================================================== */

    function stop() {
        if (
            currentAudio
        ) {
            try {
                currentAudio.pause();

                currentAudio.currentTime =
                    0;
            } catch (_) {
                // Ignora.
            }
        }

        currentAudio =
            null;
    }

    /* ==========================================================================
       FALLBACK DE SOM
       ========================================================================== */

    function playToneSequence(
        notes
    ) {
        const ctx =
            getAudioContext();

        if (!ctx) {
            return false;
        }

        if (
            ctx.state ===
            "suspended"
        ) {
            void ctx.resume();
        }

        const master =
            ctx.createGain();

        master.gain.value =
            Math.min(
                0.22,
                CONFIG.volume *
                0.22
            );

        master.connect(
            ctx.destination
        );

        const start =
            ctx.currentTime +
            0.01;

        notes.forEach(
            note => {
                const oscillator =
                    ctx.createOscillator();

                const gain =
                    ctx.createGain();

                oscillator.type =
                    note.type ||
                    "sine";

                oscillator
                    .frequency
                    .setValueAtTime(
                        note.frequency,
                        start +
                        note.offset
                    );

                gain
                    .gain
                    .setValueAtTime(
                        0.0001,
                        start +
                        note.offset
                    );

                gain
                    .gain
                    .exponentialRampToValueAtTime(
                        note.gain ||
                        0.7,
                        start +
                        note.offset +
                        0.012
                    );

                gain
                    .gain
                    .exponentialRampToValueAtTime(
                        0.0001,
                        start +
                        note.offset +
                        note.duration
                    );

                oscillator.connect(
                    gain
                );

                gain.connect(
                    master
                );

                oscillator.start(
                    start +
                    note.offset
                );

                oscillator.stop(
                    start +
                    note.offset +
                    note.duration +
                    0.03
                );
            }
        );

        return true;
    }

    /* ==========================================================================
       FALLBACK CORRETO
       ========================================================================== */

    function fallbackCorrect() {
        return playToneSequence([
            {
                frequency:
                    659.25,

                offset:
                    0,

                duration:
                    0.11,

                gain:
                    0.55
            },
            {
                frequency:
                    783.99,

                offset:
                    0.09,

                duration:
                    0.16,

                gain:
                    0.72
            }
        ]);
    }

    /* ==========================================================================
       FALLBACK ERRO
       ========================================================================== */

    function fallbackIncorrect() {
        return playToneSequence([
            {
                frequency:
                    392,

                offset:
                    0,

                duration:
                    0.12,

                gain:
                    0.50,

                type:
                    "triangle"
            },
            {
                frequency:
                    293.66,

                offset:
                    0.10,

                duration:
                    0.19,

                gain:
                    0.68,

                type:
                    "triangle"
            }
        ]);
    }

    /* ==========================================================================
       FALLBACK CONCLUSÃO
       ========================================================================== */

    function fallbackComplete() {
        return playToneSequence([
            {
                frequency:
                    523.25,

                offset:
                    0,

                duration:
                    0.12,

                gain:
                    0.46
            },
            {
                frequency:
                    659.25,

                offset:
                    0.10,

                duration:
                    0.14,

                gain:
                    0.54
            },
            {
                frequency:
                    783.99,

                offset:
                    0.21,

                duration:
                    0.22,

                gain:
                    0.68
            }
        ]);
    }

    function fallback(
        type
    ) {
        if (
            type ===
            "correct"
        ) {
            return fallbackCorrect();
        }

        if (
            type ===
            "incorrect"
        ) {
            return fallbackIncorrect();
        }

        if (
            type ===
            "complete"
        ) {
            return fallbackComplete();
        }

        return false;
    }

    /* ==========================================================================
       PLAY
       ========================================================================== */

    async function play(
        type
    ) {
        if (
            !CONFIG.enabled
        ) {
            return false;
        }

        stop();

        const audio =
            getAudio(
                type
            );

        if (!audio) {
            return fallback(
                type
            );
        }

        currentAudio =
            audio;

        audio.volume =
            CONFIG.volume;

        try {
            audio.currentTime =
                0;

            await audio.play();

            return true;
        } catch (_) {
            currentAudio =
                null;

            return fallback(
                type
            );
        }
    }

    function playCorrect() {
        return play(
            "correct"
        );
    }

    function playIncorrect() {
        return play(
            "incorrect"
        );
    }

    function playComplete() {
        return play(
            "complete"
        );
    }

    /* ==========================================================================
       PRELOAD
       ========================================================================== */

    function preload() {
        Object
            .keys(
                CONFIG.files
            )
            .forEach(
                type => {
                    const audio =
                        getAudio(
                            type
                        );

                    try {
                        audio?.load();
                    } catch (_) {
                        // Ignora.
                    }
                }
            );
    }

    /* ==========================================================================
       CONFIG
       ========================================================================== */

    function setVolume(
        value
    ) {
        const volume =
            Math.max(
                0,
                Math.min(
                    1,
                    Number(
                        value
                    ) || 0
                )
            );

        CONFIG.volume =
            volume;

        audioElements.forEach(
            audio => {
                audio.volume =
                    volume;
            }
        );
    }

    function setEnabled(
        enabled
    ) {
        CONFIG.enabled =
            Boolean(
                enabled
            );

        if (
            !CONFIG.enabled
        ) {
            stop();
        }
    }

    function getConfig() {
        return {
            enabled:
                CONFIG.enabled,

            volume:
                CONFIG.volume,

            files: {
                ...CONFIG.files
            }
        };
    }

    /* ==========================================================================
       START
       ========================================================================== */

    preload();

    window.addEventListener(
        "pagehide",
        stop
    );

    return {
        play,

        playCorrect,
        playIncorrect,
        playComplete,

        stop,
        preload,

        setVolume,
        setEnabled,

        getConfig
    };
})(); 