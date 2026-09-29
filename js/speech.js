const EYTSpeech = (() => {
    "use strict";

    const CONFIG = {
        englishLang: "en-US",
        portugueseLang: "pt-BR",

        englishRate: 0.96,
        portugueseRate: 1.0,
        slowEnglishRate: 0.74,

        pitch: 1,
        volume: 1,

        debug: true,

        preferredEnglishVoices: [
            "Microsoft Ava Online (Natural) - English (United States)",
            "Microsoft Andrew Online (Natural) - English (United States)",
            "Microsoft Emma Online (Natural) - English (United States)",
            "Microsoft Brian Online (Natural) - English (United States)",
            "Microsoft Aria Online (Natural) - English (United States)",
            "Microsoft Jenny Online (Natural) - English (United States)",
            "Microsoft Guy Online (Natural) - English (United States)",
            "Microsoft Ana Online (Natural) - English (United States)",
            "Microsoft Christopher Online (Natural) - English (United States)",
            "Microsoft Eric Online (Natural) - English (United States)",
            "Google US English",
            "Google UK English Female",
            "Google UK English Male",
            "Samantha",
            "Alex",
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
    let voicesLoaded = false;

    /* =========================================================
       SUPORTE
    ========================================================= */

    function isSupported() {
        return (
            "speechSynthesis" in window &&
            "SpeechSynthesisUtterance" in window
        );
    }

    /* =========================================================
       NORMALIZAÇÃO
    ========================================================= */

    function normalize(value) {
        return String(value || "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    function cleanText(value) {
        return String(value ?? "")
            .replace(/\s+/g, " ")
            .trim();
    }

    /* =========================================================
       VOZES
    ========================================================= */

    function loadVoices() {
        if (!isSupported()) {
            voices = [];
            voicesLoaded = false;
            return [];
        }

        const available =
            window.speechSynthesis.getVoices() || [];

        if (available.length) {
            voices = available;
            voicesLoaded = true;
        }

        if (CONFIG.debug && available.length) {
            console.groupCollapsed(
                `[EYT Speech] ${available.length} voice(s) available`
            );

            available.forEach(voice => {
                console.log(
                    `${voice.name} | ${voice.lang} | local: ${voice.localService}`
                );
            });

            console.groupEnd();
        }

        return [...voices];
    }

    function isEnglishVoice(voice) {
        return String(voice?.lang || "")
            .toLowerCase()
            .startsWith("en");
    }

    function isPortugueseVoice(voice) {
        return String(voice?.lang || "")
            .toLowerCase()
            .startsWith("pt");
    }

    function scoreEnglishVoice(voice) {
        if (!isEnglishVoice(voice)) {
            return -100000;
        }

        const name = normalize(voice.name);
        const lang = normalize(voice.lang);

        let score = 0;

        /*
         * O mais importante: a voz PRECISA ser inglesa.
         */

        if (lang === "en-us") {
            score += 1000;
        } else if (lang === "en-gb") {
            score += 850;
        } else if (lang === "en-ca") {
            score += 700;
        } else if (lang === "en-au") {
            score += 650;
        } else {
            score += 500;
        }

        /*
         * Prioriza vozes modernas/naturais quando disponíveis.
         */

        if (name.includes("natural")) {
            score += 500;
        }

        if (name.includes("online")) {
            score += 300;
        }

        if (name.includes("neural")) {
            score += 500;
        }

        /*
         * Microsoft e Google costumam fornecer boas vozes
         * quando o navegador as disponibiliza.
         */

        if (name.includes("microsoft")) {
            score += 160;
        }

        if (name.includes("google")) {
            score += 140;
        }

        /*
         * Preferências explícitas.
         */

        CONFIG.preferredEnglishVoices.forEach(
            (preferredName, index) => {
                const preferred =
                    normalize(preferredName);

                if (name === preferred) {
                    score += 2000 - index;
                } else if (
                    name.includes(preferred) ||
                    preferred.includes(name)
                ) {
                    score += 1000 - index;
                }
            }
        );

        /*
         * Pequeno bônus para a voz default,
         * desde que ela já seja inglesa.
         */

        if (voice.default) {
            score += 20;
        }

        return score;
    }

    function scorePortugueseVoice(voice) {
        if (!isPortugueseVoice(voice)) {
            return -100000;
        }

        const name = normalize(voice.name);
        const lang = normalize(voice.lang);

        let score = 0;

        if (lang === "pt-br") {
            score += 1000;
        } else {
            score += 600;
        }

        if (name.includes("natural")) {
            score += 500;
        }

        if (name.includes("online")) {
            score += 300;
        }

        if (name.includes("neural")) {
            score += 500;
        }

        if (name.includes("microsoft")) {
            score += 160;
        }

        if (name.includes("google")) {
            score += 140;
        }

        CONFIG.preferredPortugueseVoices.forEach(
            (preferredName, index) => {
                const preferred =
                    normalize(preferredName);

                if (name === preferred) {
                    score += 2000 - index;
                } else if (
                    name.includes(preferred) ||
                    preferred.includes(name)
                ) {
                    score += 1000 - index;
                }
            }
        );

        return score;
    }

    function getBestEnglishVoice() {
        loadVoices();

        const candidates = voices
            .filter(isEnglishVoice)
            .map(voice => ({
                voice,
                score: scoreEnglishVoice(voice)
            }))
            .sort((a, b) => b.score - a.score);

        return candidates.length
            ? candidates[0].voice
            : null;
    }

    function getBestPortugueseVoice() {
        loadVoices();

        const candidates = voices
            .filter(isPortugueseVoice)
            .map(voice => ({
                voice,
                score: scorePortugueseVoice(voice)
            }))
            .sort((a, b) => b.score - a.score);

        return candidates.length
            ? candidates[0].voice
            : null;
    }

    function getBestVoice(lang = CONFIG.englishLang) {
        const language =
            String(lang || "")
                .toLowerCase();

        if (language.startsWith("pt")) {
            return getBestPortugueseVoice();
        }

        return getBestEnglishVoice();
    }

    /* =========================================================
       TEXTO PARA PRONÚNCIA
    ========================================================= */

    function prepareEnglishText(text) {
        /*
         * NÃO fazemos substituições como:
         *
         * thanks -> thénks
         * please -> pliz
         *
         * Isso prejudica o sintetizador.
         *
         * A voz recebe a grafia inglesa real.
         */

        let value = cleanText(text);

        if (!value) {
            return "";
        }

        /*
         * Pontuação ajuda alguns motores a interpretar
         * uma palavra isolada como uma unidade completa.
         */

        if (
            /^[A-Za-zÀ-ÿ'-]+$/.test(value) &&
            !/[.!?]$/.test(value)
        ) {
            value += ".";
        }

        return value;
    }

    function preparePortugueseText(text) {
        return cleanText(text);
    }

    /* =========================================================
       BOTÃO ATUAL
    ========================================================= */

    function resetButton() {
        if (!currentButton) {
            return;
        }

        currentButton.classList.remove(
            "is-speaking"
        );

        currentButton.setAttribute(
            "aria-label",
            "Ouvir pronúncia"
        );

        currentButton.setAttribute(
            "title",
            "Ouvir pronúncia"
        );

        currentButton = null;
    }

    function resetState() {
        resetButton();

        currentUtterance = null;
        currentText = "";
        currentLang = "";
    }

    /* =========================================================
       PARAR
    ========================================================= */

    function stop() {
        if (!isSupported()) {
            return;
        }

        window.speechSynthesis.cancel();

        resetState();
    }

    /* =========================================================
       SPEAK
    ========================================================= */

    function speak(text, options = {}) {
        if (!isSupported()) {
            console.warn(
                "[EYT Speech] Speech synthesis is not supported."
            );

            return false;
        }

        const requestedLang =
            options.lang ||
            CONFIG.englishLang;

        const isPortuguese =
            String(requestedLang)
                .toLowerCase()
                .startsWith("pt");

        const originalText =
            cleanText(text);

        if (!originalText) {
            return false;
        }

        const preparedText =
            isPortuguese
                ? preparePortugueseText(originalText)
                : prepareEnglishText(originalText);

        stop();

        /*
         * Recarrega as vozes no momento exato da interação.
         * Isso evita depender apenas da lista obtida no carregamento
         * inicial da página.
         */

        loadVoices();

        const voice =
            getBestVoice(requestedLang);

        const utterance =
            new SpeechSynthesisUtterance(
                preparedText
            );

        /*
         * Mesmo se nenhuma voz específica estiver disponível,
         * mantemos o locale correto para impedir que o navegador
         * trate inglês como português.
         */

        utterance.lang =
            isPortuguese
                ? CONFIG.portugueseLang
                : CONFIG.englishLang;

        if (voice) {
            utterance.voice = voice;

            /*
             * Usa o locale real da voz selecionada.
             */
            utterance.lang =
                voice.lang ||
                utterance.lang;
        }

        if (
            options.rate !== undefined &&
            options.rate !== null
        ) {
            utterance.rate =
                Number(options.rate);
        } else if (
            options.slow === true &&
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
            Number(
                options.pitch ??
                CONFIG.pitch
            );

        utterance.volume =
            Number(
                options.volume ??
                CONFIG.volume
            );

        if (options.button) {
            currentButton =
                options.button;

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

        currentUtterance =
            utterance;

        currentText =
            originalText;

        currentLang =
            utterance.lang;

        utterance.onstart = () => {
            if (CONFIG.debug) {
                console.group(
                    "[EYT Speech] Playback"
                );

                console.log(
                    "Text:",
                    originalText
                );

                console.log(
                    "Speech text:",
                    preparedText
                );

                console.log(
                    "Requested language:",
                    requestedLang
                );

                console.log(
                    "Actual language:",
                    utterance.lang
                );

                console.log(
                    "Voice:",
                    voice
                        ? voice.name
                        : "Browser default English voice"
                );

                console.log(
                    "Voice language:",
                    voice
                        ? voice.lang
                        : utterance.lang
                );

                console.log(
                    "Rate:",
                    utterance.rate
                );

                console.groupEnd();
            }

            window.dispatchEvent(
                new CustomEvent(
                    "eyt:speech-start",
                    {
                        detail: {
                            text: originalText,
                            spokenText:
                                preparedText,
                            lang:
                                utterance.lang,
                            voice:
                                voice
                                    ? voice.name
                                    : null
                        }
                    }
                )
            );
        };

        utterance.onend = () => {
            if (
                currentUtterance ===
                utterance
            ) {
                resetState();
            }

            window.dispatchEvent(
                new CustomEvent(
                    "eyt:speech-end"
                )
            );
        };

        utterance.onerror = event => {
            /*
             * cancel/interrupted são normais quando o aluno
             * troca rapidamente de alternativa.
             */

            if (
                event.error !== "canceled" &&
                event.error !== "interrupted"
            ) {
                console.warn(
                    "[EYT Speech] Playback error:",
                    event.error
                );
            }

            if (
                currentUtterance ===
                utterance
            ) {
                resetState();
            }

            window.dispatchEvent(
                new CustomEvent(
                    "eyt:speech-end"
                )
            );
        };

        /*
         * Pequeno atraso depois do cancel() evita um problema
         * conhecido de alguns navegadores ao substituir uma fala
         * imediatamente.
         */

        window.setTimeout(() => {
            try {
                window.speechSynthesis.speak(
                    utterance
                );
            } catch (error) {
                console.error(
                    "[EYT Speech] Unable to start playback:",
                    error
                );

                resetState();
            }
        }, 25);

        return true;
    }

    /* =========================================================
       TOGGLE
    ========================================================= */

    function toggle(
        text,
        button,
        options = {}
    ) {
        if (!isSupported()) {
            return false;
        }

        const value =
            cleanText(text);

        if (!value) {
            return false;
        }

        const sameButton =
            currentButton === button;

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

        return speak(
            value,
            {
                ...options,
                button
            }
        );
    }

    /* =========================================================
       ATALHOS
    ========================================================= */

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

    /* =========================================================
       STATUS
    ========================================================= */

    function isSpeaking() {
        if (!isSupported()) {
            return false;
        }

        return (
            window.speechSynthesis.speaking ||
            window.speechSynthesis.pending
        );
    }

    function getVoices() {
        loadVoices();
        return [...voices];
    }

    function getEnglishVoices() {
        loadVoices();

        return voices
            .filter(isEnglishVoice)
            .sort(
                (a, b) =>
                    scoreEnglishVoice(b) -
                    scoreEnglishVoice(a)
            );
    }

    function getSelectedEnglishVoice() {
        return getBestEnglishVoice();
    }

    function getSelectedPortugueseVoice() {
        return getBestPortugueseVoice();
    }

    function getConfig() {
        return {
            ...CONFIG
        };
    }

    /* =========================================================
       DIAGNÓSTICO
    ========================================================= */

    function debugVoices() {
        loadVoices();

        const english =
            getEnglishVoices();

        console.group(
            "[EYT Speech] English voice ranking"
        );

        if (!english.length) {
            console.warn(
                "No English voice was exposed by this browser."
            );
        }

        english.forEach(
            (voice, index) => {
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
            "SELECTED:",
            selected
                ? `${selected.name} (${selected.lang})`
                : "Browser default en-US voice"
        );

        console.groupEnd();

        return selected;
    }

    /* =========================================================
       INICIALIZAÇÃO
    ========================================================= */

    if (isSupported()) {
        loadVoices();

        window.speechSynthesis.addEventListener(
            "voiceschanged",
            () => {
                loadVoices();

                if (CONFIG.debug) {
                    const selected =
                        getBestEnglishVoice();

                    if (selected) {
                        console.log(
                            `[EYT Speech] English voice ready: ${selected.name} (${selected.lang})`
                        );
                    }
                }
            }
        );

        window.setTimeout(
            loadVoices,
            250
        );

        window.setTimeout(
            loadVoices,
            750
        );

        window.setTimeout(
            loadVoices,
            1500
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
        getVoices,
        getEnglishVoices,

        getBestVoice,
        getSelectedEnglishVoice,
        getSelectedPortugueseVoice,

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