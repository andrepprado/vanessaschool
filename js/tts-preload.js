(() => {
    "use strict";

    const CONFIG = {
        englishLang: "en-US",
        answerRate: 0.98,
        wordRate: 0.96,
        questionRate: 0.98,
        backgroundDelay: 1200
    };

    const alreadyPrepared = new Set();
    let scanTimer = null;

    function clean(value) {
        return String(value ?? "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function detectLanguage(text) {
        const value =
            clean(text)
                .toLowerCase();

        const portugueseSignals = [
            "como ",
            "qual ",
            "quais ",
            "traduza",
            "tradução",
            "complete",
            "organize",
            "você",
            "vocês",
            "português",
            "significa",
            "se diz",
            "para o inglês",
            "para inglês",
            "frase",
            "número",
            "cor ",
            "dia ",
            "depois de",
            "antes de",
            "escolha",
            "família",
            "rotina",
            "manhã",
            "tarde",
            "noite",
            "resposta",
            "palavra"
        ];

        return portugueseSignals.some(
            signal =>
                value.includes(signal)
        )
            ? "pt-BR"
            : CONFIG.englishLang;
    }

    function preloadSpeechButton(button) {
        if (
            typeof EYTSpeech === "undefined"
        ) {
            return;
        }

        const text =
            clean(
                button.dataset.speech
            );

        if (!text) {
            return;
        }

        const lang =
            button.dataset.speechLang ||
            CONFIG.englishLang;

        if (
            String(lang)
                .toLowerCase()
                .startsWith("pt")
        ) {
            return;
        }

        const parsedRate =
            Number(
                button.dataset.speechRate
            );

        const rate =
            Number.isFinite(parsedRate)
                ? parsedRate
                : CONFIG.answerRate;

        const persona =
            button.dataset.speechPersona ||
            "teacher";

        const key = [
            lang,
            rate,
            persona,
            text
        ].join("|");

        if (
            alreadyPrepared.has(key)
        ) {
            return;
        }

        alreadyPrepared.add(key);

        void EYTSpeech.preload(
            text,
            {
                lang,
                rate,
                persona,
                priority: "current"
            }
        );
    }

    function scanVisibleAudio() {
        document
            .querySelectorAll(
                "[data-speech]"
            )
            .forEach(
                preloadSpeechButton
            );
    }

    function scheduleScan() {
        clearTimeout(scanTimer);

        scanTimer =
            setTimeout(
                scanVisibleAudio,
                10
            );
    }

    function collectBackgroundAudio() {
        if (
            typeof EYTApp === "undefined" ||
            typeof EYTApp.getAllLessons !==
                "function" ||
            typeof EYTSpeech === "undefined"
        ) {
            return [];
        }

        const result = [];

        function push(
            text,
            rate,
            persona
        ) {
            const value =
                clean(text);

            if (!value) {
                return;
            }

            result.push({
                text: value,
                lang:
                    CONFIG.englishLang,
                rate,
                persona,
                priority:
                    "background"
            });
        }

        for (
            const lesson
            of EYTApp.getAllLessons()
        ) {
            for (
                const exercise
                of lesson.exercises || []
            ) {
                if (
                    detectLanguage(
                        exercise.question
                    ) === CONFIG.englishLang
                ) {
                    push(
                        exercise.question,
                        CONFIG.questionRate,
                        "teacher"
                    );
                }

                for (
                    const option
                    of exercise.options || []
                ) {
                    push(
                        option,
                        CONFIG.answerRate,
                        "teacherMale"
                    );
                }

                for (
                    const word
                    of exercise.words || []
                ) {
                    push(
                        word,
                        CONFIG.wordRate,
                        "teacher"
                    );
                }

                if (exercise.answer) {
                    push(
                        exercise.answer,
                        CONFIG.answerRate,
                        "teacherMale"
                    );
                }

                for (
                    const item
                    of exercise.alternatives || []
                ) {
                    push(
                        item,
                        CONFIG.answerRate,
                        "teacherMale"
                    );
                }
            }
        }

        return result;
    }

    function startBackgroundPreload() {
        if (
            typeof EYTSpeech ===
            "undefined"
        ) {
            return;
        }

        EYTSpeech.warmup();

        scanVisibleAudio();

        setTimeout(
            () => {
                const items =
                    collectBackgroundAudio();

                if (!items.length) {
                    return;
                }

                console.info(
                    `[EYTAudio] Pré-carregando ${items.length} áudios em background`
                );

                void EYTSpeech
                    .preloadMany(
                        items,
                        {
                            concurrency: 6,
                            priority:
                                "background"
                        }
                    )
                    .then(result => {
                        console.info(
                            "[EYTAudio] Cache pronto:",
                            result
                        );
                    });
            },
            CONFIG.backgroundDelay
        );
    }

    /*
     * pointerdown acontece ANTES do click.
     * Quando o click chegar, AudioContext já estará acordado.
     */
    document.addEventListener(
        "pointerdown",
        () => {
            if (
                typeof EYTSpeech !==
                "undefined"
            ) {
                void EYTSpeech.unlockAudio();
            }
        },
        {
            capture: true,
            passive: true
        }
    );

    const observer =
        new MutationObserver(
            scheduleScan
        );

    function init() {
        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );

        startBackgroundPreload();
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            init,
            {
                once: true
            }
        );
    } else {
        init();
    }
})();