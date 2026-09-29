const EYTSpeech = (() => {
    "use strict";

    const CONFIG = {
        englishLang: "en-US",
        portugueseLang: "pt-BR",

        englishRate: 0.90,
        portugueseRate: 0.96,
        slowEnglishRate: 0.72,

        englishPitch: 1,
        portuguesePitch: 1,
        volume: 1,

        debug: true,

        preferredEnglishVoices: [
            "Microsoft Ava Online (Natural) - English (United States)",
            "Microsoft Emma Online (Natural) - English (United States)",
            "Microsoft Jenny Online (Natural) - English (United States)",
            "Microsoft Aria Online (Natural) - English (United States)",
            "Microsoft Andrew Online (Natural) - English (United States)",
            "Microsoft Brian Online (Natural) - English (United States)",
            "Microsoft Guy Online (Natural) - English (United States)",
            "Microsoft Christopher Online (Natural) - English (United States)",
            "Microsoft Eric Online (Natural) - English (United States)",
            "Microsoft Ana Online (Natural) - English (United States)",
            "Google US English",
            "Samantha",
            "Alex",
            "Google UK English Female",
            "Google UK English Male",
            "Daniel"
        ],

        preferredPortugueseVoices: [
            "Microsoft Francisca Online (Natural) - Portuguese (Brazil)",
            "Microsoft Antonio Online (Natural) - Portuguese (Brazil)",
            "Google português do Brasil",
            "Luciana"
        ]
    };

    let voices = [];
    let currentUtterance = null;
    let currentButton = null;
    let currentText = "";
    let currentLang = "";
    let currentVoice = null;

    let voicesReady = false;
    let voiceLoadPromise = null;

    /* ==========================================================================
       SUPORTE
       ========================================================================== */

    function isSupported() {
        return (
            "speechSynthesis" in window &&
            "SpeechSynthesisUtterance" in window
        );
    }

    /* ==========================================================================
       UTILITÁRIOS
       ========================================================================== */

    function cleanText(value) {
        return String(value ?? "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function normalize(value) {
        return String(value ?? "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    function normalizeLang(value) {
        return String(value || "")
            .trim()
            .toLowerCase()
            .replace(/_/g, "-");
    }

    function clamp(value, min, max, fallback) {
        const number = Number(value);

        if (!Number.isFinite(number)) {
            return fallback;
        }

        return Math.min(
            max,
            Math.max(
                min,
                number
            )
        );
    }

    /* ==========================================================================
       VOZES
       ========================================================================== */

    function loadVoices() {
        if (!isSupported()) {
            voices = [];
            voicesReady = false;
            return [];
        }

        const available =
            window.speechSynthesis.getVoices() || [];

        if (available.length) {
            voices = available;
            voicesReady = true;
        }

        return [...voices];
    }

    function waitForVoices(timeout = 1500) {
        if (!isSupported()) {
            return Promise.resolve([]);
        }

        const immediate =
            loadVoices();

        if (immediate.length) {
            return Promise.resolve(
                immediate
            );
        }

        if (voiceLoadPromise) {
            return voiceLoadPromise;
        }

        voiceLoadPromise =
            new Promise(resolve => {
                let finished =
                    false;

                const finish = () => {
                    if (finished) {
                        return;
                    }

                    finished =
                        true;

                    window.clearTimeout(
                        timeoutId
                    );

                    window.speechSynthesis.removeEventListener(
                        "voiceschanged",
                        onVoicesChanged
                    );

                    loadVoices();

                    voiceLoadPromise =
                        null;

                    resolve(
                        [...voices]
                    );
                };

                const onVoicesChanged = () => {
                    const available =
                        loadVoices();

                    if (available.length) {
                        finish();
                    }
                };

                const timeoutId =
                    window.setTimeout(
                        finish,
                        timeout
                    );

                window.speechSynthesis.addEventListener(
                    "voiceschanged",
                    onVoicesChanged
                );
            });

        return voiceLoadPromise;
    }

    function isEnglishVoice(voice) {
        return normalizeLang(
            voice?.lang
        ).startsWith(
            "en"
        );
    }

    function isPortugueseVoice(voice) {
        return normalizeLang(
            voice?.lang
        ).startsWith(
            "pt"
        );
    }

    function exactPreferredScore(
        voice,
        preferredList
    ) {
        const voiceName =
            normalize(
                voice?.name
            );

        for (
            let index = 0;
            index < preferredList.length;
            index++
        ) {
            const preferred =
                normalize(
                    preferredList[index]
                );

            if (
                voiceName ===
                preferred
            ) {
                return (
                    10000 -
                    index * 10
                );
            }
        }

        return 0;
    }

    function partialPreferredScore(
        voice,
        preferredList
    ) {
        const voiceName =
            normalize(
                voice?.name
            );

        for (
            let index = 0;
            index < preferredList.length;
            index++
        ) {
            const preferred =
                normalize(
                    preferredList[index]
                );

            if (
                voiceName.includes(
                    preferred
                ) ||
                preferred.includes(
                    voiceName
                )
            ) {
                return (
                    5000 -
                    index * 10
                );
            }
        }

        return 0;
    }

    function scoreEnglishVoice(
        voice
    ) {
        if (
            !isEnglishVoice(
                voice
            )
        ) {
            return -1000000;
        }

        const name =
            normalize(
                voice.name
            );

        const lang =
            normalizeLang(
                voice.lang
            );

        let score =
            0;

        score +=
            exactPreferredScore(
                voice,
                CONFIG.preferredEnglishVoices
            );

        score +=
            partialPreferredScore(
                voice,
                CONFIG.preferredEnglishVoices
            );

        /*
         * Prioridade de idioma.
         *
         * O curso está configurado para inglês americano.
         */

        if (
            lang ===
            "en-us"
        ) {
            score +=
                3000;
        } else if (
            lang.startsWith(
                "en-us"
            )
        ) {
            score +=
                2900;
        } else if (
            lang ===
            "en-ca"
        ) {
            score +=
                1800;
        } else if (
            lang ===
            "en-gb"
        ) {
            score +=
                1500;
        } else if (
            lang ===
            "en-au"
        ) {
            score +=
                1300;
        } else {
            score +=
                1000;
        }

        /*
         * Vozes modernas.
         */

        if (
            name.includes(
                "natural"
            )
        ) {
            score +=
                1400;
        }

        if (
            name.includes(
                "neural"
            )
        ) {
            score +=
                1400;
        }

        if (
            name.includes(
                "online"
            )
        ) {
            score +=
                700;
        }

        /*
         * Provedores.
         */

        if (
            name.includes(
                "microsoft"
            )
        ) {
            score +=
                500;
        }

        if (
            name.includes(
                "google"
            )
        ) {
            score +=
                450;
        }

        /*
         * Vozes conhecidas.
         */

        if (
            name.includes(
                "ava"
            )
        ) {
            score +=
                350;
        }

        if (
            name.includes(
                "emma"
            )
        ) {
            score +=
                330;
        }

        if (
            name.includes(
                "jenny"
            )
        ) {
            score +=
                320;
        }

        if (
            name.includes(
                "aria"
            )
        ) {
            score +=
                310;
        }

        if (
            name.includes(
                "samantha"
            )
        ) {
            score +=
                300;
        }

        /*
         * Pequeno bônus para voz default,
         * desde que ela seja inglesa.
         */

        if (
            voice.default
        ) {
            score +=
                30;
        }

        return score;
    }

    function scorePortugueseVoice(
        voice
    ) {
        if (
            !isPortugueseVoice(
                voice
            )
        ) {
            return -1000000;
        }

        const name =
            normalize(
                voice.name
            );

        const lang =
            normalizeLang(
                voice.lang
            );

        let score =
            0;

        score +=
            exactPreferredScore(
                voice,
                CONFIG.preferredPortugueseVoices
            );

        score +=
            partialPreferredScore(
                voice,
                CONFIG.preferredPortugueseVoices
            );

        if (
            lang ===
            "pt-br"
        ) {
            score +=
                3000;
        } else {
            score +=
                1500;
        }

        if (
            name.includes(
                "natural"
            )
        ) {
            score +=
                1400;
        }

        if (
            name.includes(
                "neural"
            )
        ) {
            score +=
                1400;
        }

        if (
            name.includes(
                "online"
            )
        ) {
            score +=
                700;
        }

        if (
            name.includes(
                "microsoft"
            )
        ) {
            score +=
                500;
        }

        if (
            name.includes(
                "google"
            )
        ) {
            score +=
                450;
        }

        if (
            voice.default
        ) {
            score +=
                30;
        }

        return score;
    }

    function getEnglishVoices() {
        loadVoices();

        return voices
            .filter(
                isEnglishVoice
            )
            .sort(
                (a, b) =>
                    scoreEnglishVoice(b) -
                    scoreEnglishVoice(a)
            );
    }

    function getPortugueseVoices() {
        loadVoices();

        return voices
            .filter(
                isPortugueseVoice
            )
            .sort(
                (a, b) =>
                    scorePortugueseVoice(b) -
                    scorePortugueseVoice(a)
            );
    }

    function getBestEnglishVoice() {
        const candidates =
            getEnglishVoices();

        return candidates.length
            ? candidates[0]
            : null;
    }

    function getBestPortugueseVoice() {
        const candidates =
            getPortugueseVoices();

        return candidates.length
            ? candidates[0]
            : null;
    }

    function getBestVoice(
        lang = CONFIG.englishLang
    ) {
        const language =
            normalizeLang(
                lang
            );

        if (
            language.startsWith(
                "pt"
            )
        ) {
            return getBestPortugueseVoice();
        }

        return getBestEnglishVoice();
    }

    /* ==========================================================================
       PREPARAÇÃO DO TEXTO
       ========================================================================== */

    function prepareEnglishText(
        text
    ) {
        let value =
            cleanText(
                text
            );

        if (
            !value
        ) {
            return "";
        }

        /*
         * IMPORTANTE:
         *
         * A palavra permanece escrita em inglês.
         *
         * Não usamos:
         *
         * thanks -> tenks
         * thanks -> thénks
         * please -> pliz
         *
         * Isso faria o sintetizador interpretar outra palavra.
         */

        /*
         * Aspas tipográficas podem gerar pausas estranhas
         * em alguns mecanismos.
         */

        value =
            value
                .replace(
                    /[“”]/g,
                    '"'
                )
                .replace(
                    /[‘’]/g,
                    "'"
                );

        /*
         * Uma palavra isolada recebe pontuação final.
         *
         * Isso ajuda especialmente os motores do Chromium
         * a finalizar corretamente o último fonema.
         */

        if (
            /^[A-Za-z'-]+$/.test(
                value
            ) &&
            !/[.!?]$/.test(
                value
            )
        ) {
            value +=
                ".";
        }

        return value;
    }

    function preparePortugueseText(
        text
    ) {
        return cleanText(
            text
        );
    }

    /* ==========================================================================
       ESTADO VISUAL
       ========================================================================== */

    function resetButton() {
        if (
            !currentButton
        ) {
            return;
        }

        currentButton.classList.remove(
            "is-speaking"
        );

        currentButton.setAttribute(
            "aria-label",
            currentButton.dataset.originalSpeechLabel ||
            "Ouvir pronúncia"
        );

        currentButton.setAttribute(
            "title",
            currentButton.dataset.originalSpeechTitle ||
            "Ouvir pronúncia"
        );

        currentButton =
            null;
    }

    function activateButton(
        button
    ) {
        if (
            !button
        ) {
            return;
        }

        if (
            !button.dataset
                .originalSpeechLabel
        ) {
            button.dataset.originalSpeechLabel =
                button.getAttribute(
                    "aria-label"
                ) ||
                "Ouvir pronúncia";
        }

        if (
            !button.dataset
                .originalSpeechTitle
        ) {
            button.dataset.originalSpeechTitle =
                button.getAttribute(
                    "title"
                ) ||
                "Ouvir pronúncia";
        }

        currentButton =
            button;

        currentButton.classList.add(
            "is-speaking"
        );

        currentButton.setAttribute(
            "aria-label",
            "Parar áudio"
        );

        currentButton.setAttribute(
            "title",
            "Parar áudio"
        );
    }

    function resetState() {
        resetButton();

        currentUtterance =
            null;

        currentText =
            "";

        currentLang =
            "";

        currentVoice =
            null;
    }

    /* ==========================================================================
       PARAR
       ========================================================================== */

    function stop() {
        if (
            !isSupported()
        ) {
            return;
        }

        try {
            window.speechSynthesis.cancel();
        } catch (error) {
            if (
                CONFIG.debug
            ) {
                console.warn(
                    "[EYT Speech] Falha ao cancelar fala:",
                    error
                );
            }
        }

        resetState();
    }

    /* ==========================================================================
       EVENTOS
       ========================================================================== */

    function dispatchSpeechEvent(
        name,
        detail = {}
    ) {
        window.dispatchEvent(
            new CustomEvent(
                name,
                {
                    detail
                }
            )
        );
    }

    /* ==========================================================================
       EXECUTAR FALA
       ========================================================================== */

    function createUtterance(
        originalText,
        requestedLang,
        options,
        voice
    ) {
        const normalizedLanguage =
            normalizeLang(
                requestedLang
            );

        const isPortuguese =
            normalizedLanguage.startsWith(
                "pt"
            );

        const preparedText =
            isPortuguese
                ? preparePortugueseText(
                    originalText
                )
                : prepareEnglishText(
                    originalText
                );

        const utterance =
            new SpeechSynthesisUtterance(
                preparedText
            );

        /*
         * Define primeiro o idioma desejado.
         */

        utterance.lang =
            isPortuguese
                ? CONFIG.portugueseLang
                : CONFIG.englishLang;

        /*
         * Se uma voz adequada realmente existir,
         * usa essa voz e o locale real dela.
         */

        if (
            voice
        ) {
            utterance.voice =
                voice;

            if (
                voice.lang
            ) {
                utterance.lang =
                    voice.lang;
            }
        }

        /*
         * Velocidade.
         *
         * Inglês levemente abaixo de 1.0 melhora
         * a clareza para quem está aprendendo.
         */

        if (
            options.rate !==
            undefined &&
            options.rate !==
            null
        ) {
            utterance.rate =
                clamp(
                    options.rate,
                    0.5,
                    1.5,
                    isPortuguese
                        ? CONFIG.portugueseRate
                        : CONFIG.englishRate
                );
        } else if (
            options.slow ===
            true &&
            !isPortuguese
        ) {
            utterance.rate =
                CONFIG.slowEnglishRate;
        } else {
            utterance.rate =
                isPortuguese
                    ? CONFIG.portugueseRate
                    : CONFIG.englishRate;
        }

        utterance.pitch =
            clamp(
                options.pitch,
                0.5,
                1.5,
                isPortuguese
                    ? CONFIG.portuguesePitch
                    : CONFIG.englishPitch
            );

        utterance.volume =
            clamp(
                options.volume,
                0,
                1,
                CONFIG.volume
            );

        return {
            utterance,
            preparedText,
            isPortuguese
        };
    }

    async function speak(
        text,
        options = {}
    ) {
        if (
            !isSupported()
        ) {
            console.warn(
                "[EYT Speech] SpeechSynthesis não é suportado neste navegador."
            );

            return false;
        }

        const originalText =
            cleanText(
                text
            );

        if (
            !originalText
        ) {
            return false;
        }

        const requestedLang =
            options.lang ||
            CONFIG.englishLang;

        /*
         * Cancela qualquer áudio anterior antes
         * de preparar o próximo.
         */

        stop();

        /*
         * Espera o navegador disponibilizar as vozes.
         *
         * No Chromium a lista pode estar vazia nos
         * primeiros milissegundos após carregar a página.
         */

        await waitForVoices();

        /*
         * O aluno pode ter iniciado outra fala enquanto
         * aguardávamos as vozes. Cancela novamente.
         */

        stop();

        const voice =
            getBestVoice(
                requestedLang
            );

        const {
            utterance,
            preparedText
        } =
            createUtterance(
                originalText,
                requestedLang,
                options,
                voice
            );

        currentUtterance =
            utterance;

        currentText =
            originalText;

        currentLang =
            utterance.lang;

        currentVoice =
            voice;

        if (
            options.button
        ) {
            activateButton(
                options.button
            );
        }

        utterance.onstart =
            () => {
                if (
                    currentUtterance !==
                    utterance
                ) {
                    return;
                }

                if (
                    CONFIG.debug
                ) {
                    console.group(
                        "[EYT Speech] Reprodução"
                    );

                    console.log(
                        "Texto original:",
                        originalText
                    );

                    console.log(
                        "Texto enviado:",
                        preparedText
                    );

                    console.log(
                        "Idioma solicitado:",
                        requestedLang
                    );

                    console.log(
                        "Idioma usado:",
                        utterance.lang
                    );

                    console.log(
                        "Voz:",
                        voice
                            ? voice.name
                            : "voz padrão do navegador"
                    );

                    console.log(
                        "Voz locale:",
                        voice
                            ? voice.lang
                            : utterance.lang
                    );

                    console.log(
                        "Velocidade:",
                        utterance.rate
                    );

                    console.log(
                        "Pitch:",
                        utterance.pitch
                    );

                    console.groupEnd();
                }

                dispatchSpeechEvent(
                    "eyt:speech-start",
                    {
                        text:
                            originalText,
                        spokenText:
                            preparedText,
                        lang:
                            utterance.lang,
                        voice:
                            voice
                                ? voice.name
                                : null,
                        rate:
                            utterance.rate
                    }
                );
            };

        utterance.onend =
            () => {
                if (
                    currentUtterance ===
                    utterance
                ) {
                    resetState();
                }

                dispatchSpeechEvent(
                    "eyt:speech-end",
                    {
                        text:
                            originalText
                    }
                );
            };

        utterance.onerror =
            event => {
                if (
                    event.error !==
                    "canceled" &&
                    event.error !==
                    "interrupted"
                ) {
                    console.warn(
                        "[EYT Speech] Erro de reprodução:",
                        event.error
                    );
                }

                if (
                    currentUtterance ===
                    utterance
                ) {
                    resetState();
                }

                dispatchSpeechEvent(
                    "eyt:speech-end",
                    {
                        text:
                            originalText,
                        error:
                            event.error
                    }
                );
            };

        /*
         * Pequeno atraso depois do cancel().
         *
         * Chromium/Brave/Edge podem ignorar um speak()
         * executado imediatamente após cancel().
         */

        window.setTimeout(
            () => {
                if (
                    currentUtterance !==
                    utterance
                ) {
                    return;
                }

                try {
                    window.speechSynthesis.speak(
                        utterance
                    );
                } catch (error) {
                    console.error(
                        "[EYT Speech] Não foi possível iniciar o áudio:",
                        error
                    );

                    if (
                        currentUtterance ===
                        utterance
                    ) {
                        resetState();
                    }
                }
            },
            60
        );

        return true;
    }

    /* ==========================================================================
       TOGGLE
       ========================================================================== */

    function toggle(
        text,
        button,
        options = {}
    ) {
        if (
            !isSupported()
        ) {
            return false;
        }

        const value =
            cleanText(
                text
            );

        if (
            !value
        ) {
            return false;
        }

        const sameButton =
            currentButton ===
            button;

        const currentlySpeaking =
            window.speechSynthesis.speaking ||
            window.speechSynthesis.pending;

        if (
            sameButton &&
            currentlySpeaking
        ) {
            stop();
            return false;
        }

        speak(
            value,
            {
                ...options,
                button
            }
        );

        return true;
    }

    /* ==========================================================================
       ATALHOS
       ========================================================================== */

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

    /* ==========================================================================
       STATUS
       ========================================================================== */

    function isSpeaking() {
        if (
            !isSupported()
        ) {
            return false;
        }

        return (
            window.speechSynthesis.speaking ||
            window.speechSynthesis.pending
        );
    }

    function getVoices() {
        loadVoices();

        return [
            ...voices
        ];
    }

    function getSelectedEnglishVoice() {
        return getBestEnglishVoice();
    }

    function getSelectedPortugueseVoice() {
        return getBestPortugueseVoice();
    }

    function getCurrentVoice() {
        return currentVoice;
    }

    function getConfig() {
        return {
            ...CONFIG
        };
    }

    /* ==========================================================================
       DIAGNÓSTICO
       ========================================================================== */

    function debugVoices() {
        loadVoices();

        const english =
            getEnglishVoices();

        console.group(
            "[EYT Speech] Ranking das vozes inglesas"
        );

        if (
            !english.length
        ) {
            console.warn(
                "Nenhuma voz inglesa foi disponibilizada pelo navegador."
            );
        }

        english.forEach(
            (
                voice,
                index
            ) => {
                console.log(
                    `${index + 1}. ${voice.name}`,
                    {
                        lang:
                            voice.lang,
                        score:
                            scoreEnglishVoice(
                                voice
                            ),
                        local:
                            voice.localService,
                        default:
                            voice.default
                    }
                );
            }
        );

        const selected =
            getBestEnglishVoice();

        console.log(
            "VOZ SELECIONADA:",
            selected
                ? `${selected.name} (${selected.lang})`
                : "Nenhuma voz inglesa específica disponível"
        );

        console.groupEnd();

        return selected;
    }

    /* ==========================================================================
       INICIALIZAÇÃO
       ========================================================================== */

    if (
        isSupported()
    ) {
        loadVoices();

        window.speechSynthesis.addEventListener(
            "voiceschanged",
            () => {
                loadVoices();

                if (
                    CONFIG.debug
                ) {
                    const selected =
                        getBestEnglishVoice();

                    if (
                        selected
                    ) {
                        console.log(
                            `[EYT Speech] Voz inglesa pronta: ${selected.name} (${selected.lang})`
                        );
                    }
                }
            }
        );

        /*
         * Chromium pode preencher a lista em momentos diferentes.
         */

        [
            100,
            300,
            750,
            1500,
            2500
        ].forEach(
            delay => {
                window.setTimeout(
                    loadVoices,
                    delay
                );
            }
        );
    }

    window.addEventListener(
        "pagehide",
        stop
    );

    window.addEventListener(
        "beforeunload",
        stop
    );

    return {
        isSupported,
        isSpeaking,

        loadVoices,
        waitForVoices,

        getVoices,
        getEnglishVoices,
        getPortugueseVoices,

        getBestVoice,
        getSelectedEnglishVoice,
        getSelectedPortugueseVoice,
        getCurrentVoice,

        speak,
        speakEnglish,
        speakEnglishSlow,
        speakPortuguese,

        toggle,
        toggleEnglish,
        togglePortuguese,

        stop,

        debugVoices,
        getConfig
    };
})();