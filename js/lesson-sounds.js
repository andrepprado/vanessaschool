const EYTLessonSounds = (() => {
    "use strict";

    const CONFIG = {
        enabled: true,
        volume: 0.78,
        files: {
            correct: "/audio/feedback/correct.wav",
            incorrect: "/audio/feedback/incorrect.wav",
            complete: "/audio/feedback/finish.mp3"
        }
    };

    const buffers = new Map();
    const pendingBuffers = new Map();

    let audioContext = null;
    let currentSource = null;
    let currentGain = null;
    let unlocked = false;
    let preloadStarted = false;

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
                latencyHint: "interactive"
            });

        return audioContext;
    }

    async function resumeContext() {
        const ctx =
            getAudioContext();

        if (!ctx) {
            return null;
        }

        if (ctx.state === "suspended") {
            try {
                await ctx.resume();
            } catch (_) {
            }
        }

        return ctx;
    }

    async function unlock() {
        if (unlocked) {
            return true;
        }

        const ctx =
            await resumeContext();

        if (!ctx) {
            return false;
        }

        try {
            /*
             * Silent buffer started inside a real user gesture.
             * This permanently unlocks WebAudio on browsers/mobile
             * that enforce autoplay restrictions.
             */
            const buffer =
                ctx.createBuffer(
                    1,
                    1,
                    ctx.sampleRate
                );

            const source =
                ctx.createBufferSource();

            const gain =
                ctx.createGain();

            gain.gain.value = 0;

            source.buffer = buffer;

            source.connect(gain);
            gain.connect(ctx.destination);

            source.start(0);
        } catch (_) {
        }

        unlocked =
            ctx.state === "running";

        return unlocked;
    }

    async function loadBuffer(type) {
        if (
            buffers.has(type)
        ) {
            return buffers.get(type);
        }

        if (
            pendingBuffers.has(type)
        ) {
            return pendingBuffers.get(type);
        }

        const file =
            CONFIG.files[type];

        if (!file) {
            return null;
        }

        const promise =
            (
                async () => {
                    const ctx =
                        getAudioContext();

                    if (!ctx) {
                        return null;
                    }

                    const response =
                        await fetch(
                            file,
                            {
                                cache: "force-cache"
                            }
                        );

                    if (!response.ok) {
                        throw new Error(
                            `Feedback audio HTTP ${response.status}: ${file}`
                        );
                    }

                    const arrayBuffer =
                        await response.arrayBuffer();

                    const decoded =
                        await ctx.decodeAudioData(
                            arrayBuffer.slice(0)
                        );

                    buffers.set(
                        type,
                        decoded
                    );

                    return decoded;
                }
            )()
                .catch(
                    error => {
                        console.warn(
                            `[EYTLessonSounds] Could not preload ${type}:`,
                            error
                        );

                        return null;
                    }
                )
                .finally(
                    () => {
                        pendingBuffers.delete(
                            type
                        );
                    }
                );

        pendingBuffers.set(
            type,
            promise
        );

        return promise;
    }

    function stop() {
        if (currentSource) {
            try {
                currentSource.onended =
                    null;

                currentSource.stop();
            } catch (_) {
            }

            try {
                currentSource.disconnect();
            } catch (_) {
            }
        }

        if (currentGain) {
            try {
                currentGain.disconnect();
            } catch (_) {
            }
        }

        currentSource = null;
        currentGain = null;
    }

    async function playBuffer(type) {
        const ctx =
            await resumeContext();

        if (!ctx) {
            return false;
        }

        const buffer =
            await loadBuffer(type);

        if (!buffer) {
            return false;
        }

        stop();

        try {
            const source =
                ctx.createBufferSource();

            const gain =
                ctx.createGain();

            source.buffer =
                buffer;

            gain.gain.setValueAtTime(
                CONFIG.volume,
                ctx.currentTime
            );

            source.connect(gain);
            gain.connect(ctx.destination);

            currentSource =
                source;

            currentGain =
                gain;

            source.onended =
                () => {
                    if (
                        currentSource ===
                        source
                    ) {
                        currentSource =
                            null;
                        currentGain =
                            null;
                    }

                    try {
                        source.disconnect();
                        gain.disconnect();
                    } catch (_) {
                    }
                };

            /*
             * Zero-delay playback once decoded.
             */
            source.start(0);

            return true;
        } catch (error) {
            console.warn(
                `[EYTLessonSounds] AudioBuffer playback failed for ${type}:`,
                error
            );

            stop();

            return false;
        }
    }

    async function playToneSequence(
        notes
    ) {
        const ctx =
            await resumeContext();

        if (!ctx) {
            return false;
        }

        /*
         * No network, no files and no decoder are required here.
         * This is the absolute fallback.
         */
        try {
            const master =
                ctx.createGain();

            master.gain.setValueAtTime(
                CONFIG.volume,
                ctx.currentTime
            );

            master.connect(
                ctx.destination
            );

            const start =
                ctx.currentTime +
                0.005;

            notes.forEach(
                note => {
                    const oscillator =
                        ctx.createOscillator();

                    const gain =
                        ctx.createGain();

                    oscillator.type =
                        note.type ||
                        "sine";

                    oscillator.frequency
                        .setValueAtTime(
                            note.frequency,
                            start +
                            note.delay
                        );

                    gain.gain
                        .setValueAtTime(
                            0.0001,
                            start +
                            note.delay
                        );

                    gain.gain
                        .exponentialRampToValueAtTime(
                            Math.max(
                                0.0002,
                                note.gain ||
                                0.07
                            ),
                            start +
                            note.delay +
                            0.008
                        );

                    gain.gain
                        .exponentialRampToValueAtTime(
                            0.0001,
                            start +
                            note.delay +
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
                        note.delay
                    );

                    oscillator.stop(
                        start +
                        note.delay +
                        note.duration +
                        0.03
                    );
                }
            );

            return true;
        } catch (error) {
            console.warn(
                "[EYTLessonSounds] Tone fallback failed:",
                error
            );

            return false;
        }
    }

    function fallbackCorrect() {
        return playToneSequence([
            {
                frequency: 523.25,
                delay: 0,
                duration: 0.10,
                gain: 0.07
            },
            {
                frequency: 659.25,
                delay: 0.09,
                duration: 0.13,
                gain: 0.075
            },
            {
                frequency: 783.99,
                delay: 0.19,
                duration: 0.17,
                gain: 0.08
            }
        ]);
    }

    function fallbackIncorrect() {
        return playToneSequence([
            {
                frequency: 246.94,
                delay: 0,
                duration: 0.15,
                gain: 0.07,
                type: "triangle"
            },
            {
                frequency: 196,
                delay: 0.11,
                duration: 0.23,
                gain: 0.075,
                type: "triangle"
            }
        ]);
    }

    function fallbackComplete() {
        return playToneSequence([
            {
                frequency: 523.25,
                delay: 0,
                duration: 0.11,
                gain: 0.07
            },
            {
                frequency: 659.25,
                delay: 0.09,
                duration: 0.12,
                gain: 0.075
            },
            {
                frequency: 783.99,
                delay: 0.19,
                duration: 0.13,
                gain: 0.08
            },
            {
                frequency: 1046.5,
                delay: 0.30,
                duration: 0.27,
                gain: 0.085
            }
        ]);
    }

    function fallback(type) {
        if (type === "correct") {
            return fallbackCorrect();
        }

        if (type === "incorrect") {
            return fallbackIncorrect();
        }

        if (type === "complete") {
            return fallbackComplete();
        }

        return Promise.resolve(
            false
        );
    }

    async function play(type) {
        if (!CONFIG.enabled) {
            return false;
        }

        /*
         * Resume again immediately before feedback.
         * On "Verificar", this runs during the user's interaction.
         */
        await resumeContext();

        /*
         * PRIMARY:
         * locally decoded AudioBuffer.
         */
        const played =
            await playBuffer(type);

        if (played) {
            return true;
        }

        /*
         * SECONDARY:
         * completely local synthetic tone.
         *
         * This means correct/incorrect/complete still produce
         * audio even if the audio file, cache or decoder fails.
         */
        return fallback(type);
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

    async function preload() {
        if (preloadStarted) {
            return;
        }

        preloadStarted =
            true;

        const types =
            Object.keys(
                CONFIG.files
            );

        await Promise.allSettled(
            types.map(
                type =>
                    loadBuffer(type)
            )
        );

        console.info(
            `[EYTLessonSounds] Feedback ready: ${buffers.size}/${types.length}`
        );
    }

    function setVolume(value) {
        const number =
            Number(value);

        CONFIG.volume =
            Number.isFinite(number)
                ? Math.max(
                    0,
                    Math.min(
                        1,
                        number
                    )
                )
                : 0.78;
    }

    function setEnabled(enabled) {
        CONFIG.enabled =
            Boolean(enabled);

        if (!CONFIG.enabled) {
            stop();
        }
    }

    function getConfig() {
        return {
            enabled:
                CONFIG.enabled,

            volume:
                CONFIG.volume,

            unlocked,

            contextState:
                audioContext
                    ?.state ||
                "not-created",

            decoded:
                [
                    ...buffers.keys()
                ],

            files: {
                ...CONFIG.files
            }
        };
    }

    /*
     * Begin fetching immediately.
     */
    preload();

    /*
     * Mobile browsers require a real user gesture.
     * Unlock WebAudio as early as possible.
     */
    const unlockEvents = [
        "pointerdown",
        "touchstart",
        "keydown"
    ];

    const handleUnlock =
        () => {
            void unlock();

            unlockEvents
                .forEach(
                    eventName => {
                        window.removeEventListener(
                            eventName,
                            handleUnlock,
                            true
                        );
                    }
                );
        };

    unlockEvents.forEach(
        eventName => {
            window.addEventListener(
                eventName,
                handleUnlock,
                {
                    capture: true,
                    passive: true
                }
            );
        }
    );

    window.addEventListener(
        "pageshow",
        () => {
            void preload();
        }
    );

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
        unlock,
        setVolume,
        setEnabled,
        getConfig
    };
})();
