(() => {
    "use strict";

    const CONFIG = {
        questionEnglishLang: "en-GB",
        answerEnglishLang: "en-GB",

        questionRate: 0.98,
        answerRate: 0.98,
        wordRate: 0.96,

        initialDelay: 400,
        backgroundConcurrency: 1,
        priorityConcurrency: 2
    };

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
            " inglês",
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

        return portugueseSignals
            .some(
                signal =>
                    value.includes(
                        signal
                    )
            )
            ? "pt-BR"
            : CONFIG
                .questionEnglishLang;
    }

    function push(
        target,
        text,
        options
    ) {
        const value =
            clean(text);

        if (!value) {
            return;
        }

        target.push({
            text:
                value,
            ...options
        });
    }

    function collectLessonAudio(
        lesson
    ) {
        const result = [];

        for (
            const exercise
            of lesson.exercises || []
        ) {
            const question =
                clean(
                    exercise.question
                );

            const questionLang =
                detectLanguage(
                    question
                );

            if (
                questionLang
                    .toLowerCase()
                    .startsWith("en")
            ) {
                push(
                    result,
                    question,
                    {
                        lang:
                            questionLang,
                        rate:
                            CONFIG.questionRate,
                        persona:
                            "teacher"
                    }
                );
            }

            if (
                exercise.type ===
                "multiple"
            ) {
                for (
                    const option
                    of exercise.options || []
                ) {
                    push(
                        result,
                        option,
                        {
                            lang:
                                CONFIG.answerEnglishLang,
                            rate:
                                CONFIG.answerRate,
                            persona:
                                "teacherMale"
                        }
                    );
                }
            }

            if (
                exercise.type ===
                "order"
            ) {
                for (
                    const word
                    of exercise.words || []
                ) {
                    push(
                        result,
                        word,
                        {
                            lang:
                                CONFIG.answerEnglishLang,
                            rate:
                                CONFIG.wordRate,
                            persona:
                                "teacher"
                        }
                    );
                }
            }

            if (
                exercise.answer
            ) {
                push(
                    result,
                    exercise.answer,
                    {
                        lang:
                            CONFIG.answerEnglishLang,
                        rate:
                            CONFIG.answerRate,
                        persona:
                            "teacherMale"
                    }
                );
            }

            for (
                const alternative
                of exercise.alternatives || []
            ) {
                push(
                    result,
                    alternative,
                    {
                        lang:
                            CONFIG.answerEnglishLang,
                        rate:
                            CONFIG.answerRate,
                        persona:
                            "teacherMale"
                    }
                );
            }
        }

        return result;
    }

    function uniqueItems(items) {
        const map =
            new Map();

        for (
            const item
            of items
        ) {
            const key = [
                item.lang,
                item.rate,
                item.persona,
                item.voice || "",
                item.text
            ].join("|");

            if (
                !map.has(key)
            ) {
                map.set(
                    key,
                    item
                );
            }
        }

        return Array.from(
            map.values()
        );
    }

    function getPriorityLesson(
        lessons
    ) {
        const params =
            new URLSearchParams(
                window.location.search
            );

        const id =
            params.get("id");

        if (id) {
            const lesson =
                lessons.find(
                    item =>
                        item.id === id
                );

            if (lesson) {
                return lesson;
            }
        }

        if (
            typeof EYTApp !==
                "undefined" &&
            typeof EYTApp.getNextLesson ===
                "function"
        ) {
            const next =
                EYTApp.getNextLesson();

            if (next) {
                return next;
            }
        }

        return lessons[0] ||
            null;
    }

    async function startPreload() {
        if (
            typeof EYTSpeech ===
                "undefined" ||
            typeof EYTApp ===
                "undefined" ||
            typeof EYTApp.getAllLessons !==
                "function"
        ) {
            return;
        }

        const lessons =
            EYTApp.getAllLessons();

        if (
            !Array.isArray(lessons) ||
            !lessons.length
        ) {
            return;
        }

        console.info(
            "[EYTAudioPreloader] Iniciando cache de áudio..."
        );

        EYTSpeech.warmup();

        const priorityLesson =
            getPriorityLesson(
                lessons
            );

        if (priorityLesson) {
            const priorityItems =
                uniqueItems(
                    collectLessonAudio(
                        priorityLesson
                    )
                );

            if (
                priorityItems.length
            ) {
                console.info(
                    `[EYTAudioPreloader] Prioridade: ${priorityLesson.title} (${priorityItems.length} áudios)`
                );

                await EYTSpeech.preloadMany(
                    priorityItems,
                    {
                        concurrency:
                            CONFIG.priorityConcurrency
                    }
                );
            }
        }

        const remainingLessons =
            lessons.filter(
                lesson =>
                    !priorityLesson ||
                    lesson.id !==
                        priorityLesson.id
            );

        const backgroundItems =
            uniqueItems(
                remainingLessons
                    .flatMap(
                        collectLessonAudio
                    )
            );

        if (
            backgroundItems.length
        ) {
            console.info(
                `[EYTAudioPreloader] Background: ${backgroundItems.length} áudios`
            );

            const result =
                await EYTSpeech.preloadMany(
                    backgroundItems,
                    {
                        concurrency:
                            CONFIG.backgroundConcurrency
                    }
                );

            console.info(
                "[EYTAudioPreloader] Cache concluído:",
                result
            );
        }
    }

    function schedule() {
        const run =
            () => {
                void startPreload();
            };

        if (
            window.location.pathname
                .toLowerCase()
                .includes("licao")
        ) {
            setTimeout(
                run,
                100
            );

            return;
        }

        if (
            "requestIdleCallback" in
            window
        ) {
            requestIdleCallback(
                run,
                {
                    timeout:
                        1500
                }
            );

            return;
        }

        setTimeout(
            run,
            CONFIG.initialDelay
        );
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            schedule,
            {
                once:
                    true
            }
        );
    } else {
        schedule();
    }
})();