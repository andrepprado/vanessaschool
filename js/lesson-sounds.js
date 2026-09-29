const EYTLessonSounds = (() => {
    "use strict";

    const CONFIG = {
        enabled: true,
        volume: 0.72,
        files: {
            correct: "audio/feedback/correct.wav",
            incorrect: "audio/feedback/incorrect.wav",
            complete: "audio/feedback/finish.mp3"
        }
    };

    const audioElements = new Map();

    let audioContext = null;
    let currentAudio = null;

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

        audioContext = new AudioContextClass();

        return audioContext;
    }

    function getAudio(type) {
        const file = CONFIG.files[type];

        if (!file) {
            return null;
        }

        if (!audioElements.has(type)) {
            const audio = new Audio(file);

            audio.preload = "auto";
            audio.volume = CONFIG.volume;

            audioElements.set(type, audio);
        }

        return audioElements.get(type);
    }

    function stop() {
        if (currentAudio) {
            try {
                currentAudio.pause();
                currentAudio.currentTime = 0;
            } catch (_) {
            }
        }

        currentAudio = null;
    }

    async function ensureAudioContext() {
        const ctx = getAudioContext();

        if (!ctx) {
            return null;
        }

        try {
            if (ctx.state === "suspended") {
                await ctx.resume();
            }
        } catch (_) {
        }

        return ctx;
    }

    async function playToneSequence(notes) {
        const ctx = await ensureAudioContext();

        if (!ctx) {
            return false;
        }

        const start = ctx.currentTime + 0.02;

        notes.forEach(note => {
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();

            oscillator.type = note.type || "sine";

            oscillator.frequency.setValueAtTime(
                note.frequency,
                start + note.delay
            );

            gain.gain.setValueAtTime(
                0.0001,
                start + note.delay
            );

            gain.gain.exponentialRampToValueAtTime(
                Math.max(
                    0.0002,
                    note.gain || 0.06
                ),
                start + note.delay + 0.012
            );

            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                start + note.delay + note.duration
            );

            oscillator.connect(gain);
            gain.connect(ctx.destination);

            oscillator.start(
                start + note.delay
            );

            oscillator.stop(
                start +
                note.delay +
                note.duration +
                0.03
            );
        });

        return true;
    }

    function fallbackCorrect() {
        return playToneSequence([
            {
                frequency: 523.25,
                delay: 0,
                duration: 0.11,
                gain: 0.045
            },
            {
                frequency: 659.25,
                delay: 0.10,
                duration: 0.14,
                gain: 0.05
            },
            {
                frequency: 783.99,
                delay: 0.22,
                duration: 0.18,
                gain: 0.055
            }
        ]);
    }

    function fallbackIncorrect() {
        return playToneSequence([
            {
                frequency: 246.94,
                delay: 0,
                duration: 0.16,
                gain: 0.04,
                type: "triangle"
            },
            {
                frequency: 196,
                delay: 0.12,
                duration: 0.24,
                gain: 0.045,
                type: "triangle"
            }
        ]);
    }

    function fallbackComplete() {
        return playToneSequence([
            {
                frequency: 523.25,
                delay: 0,
                duration: 0.13,
                gain: 0.04
            },
            {
                frequency: 659.25,
                delay: 0.11,
                duration: 0.13,
                gain: 0.045
            },
            {
                frequency: 783.99,
                delay: 0.22,
                duration: 0.14,
                gain: 0.05
            },
            {
                frequency: 1046.5,
                delay: 0.35,
                duration: 0.28,
                gain: 0.055
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

        return false;
    }

    async function play(type) {
        if (!CONFIG.enabled) {
            return false;
        }

        stop();

        const audio = getAudio(type);

        if (!audio) {
            return fallback(type);
        }

        currentAudio = audio;
        audio.volume = CONFIG.volume;

        try {
            audio.currentTime = 0;

            await audio.play();

            return true;
        } catch (_) {
            currentAudio = null;

            return fallback(type);
        }
    }

    function playCorrect() {
        return play("correct");
    }

    function playIncorrect() {
        return play("incorrect");
    }

    function playComplete() {
        return play("complete");
    }

    function preload() {
        Object.keys(CONFIG.files).forEach(type => {
            const audio = getAudio(type);

            try {
                audio?.load();
            } catch (_) {
            }
        });
    }

    function setVolume(value) {
        const number = Number(value);

        CONFIG.volume = Number.isFinite(number)
            ? Math.max(0, Math.min(1, number))
            : 0.72;

        audioElements.forEach(audio => {
            audio.volume = CONFIG.volume;
        });
    }

    function setEnabled(enabled) {
        CONFIG.enabled = Boolean(enabled);

        if (!CONFIG.enabled) {
            stop();
        }
    }

    function getConfig() {
        return {
            enabled: CONFIG.enabled,
            volume: CONFIG.volume,
            files: {
                ...CONFIG.files
            }
        };
    }

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