const EYTSpeech = (() => {
    "use strict";

    const CONFIG = {
        englishLang: "en-GB",
        portugueseLang: "pt-BR",

        englishRate: 0.88,
        portugueseRate: 0.96,
        slowEnglishRate: 0.70,

        englishPitch: 1,
        portuguesePitch: 1,
        volume: 1,

        debug: true,

        preferredBritishVoices: [
            "Microsoft Sonia Online (Natural) - English (United Kingdom)",
            "Microsoft Ryan Online (Natural) - English (United Kingdom)",
            "Microsoft Libby Online (Natural) - English (United Kingdom)",
            "Microsoft Thomas Online (Natural) - English (United Kingdom)",
            "Microsoft Abbi Online (Natural) - English (United Kingdom)",
            "Microsoft Alfie Online (Natural) - English (United Kingdom)",
            "Microsoft Bella Online (Natural) - English (United Kingdom)",
            "Microsoft Elliot Online (Natural) - English (United Kingdom)",
            "Microsoft Ethan Online (Natural) - English (United Kingdom)",
            "Microsoft Hollie Online (Natural) - English (United Kingdom)",
            "Microsoft Maisie Online (Natural) - English (United Kingdom)",
            "Microsoft Noah Online (Natural) - English (United Kingdom)",
            "Microsoft Oliver Online (Natural) - English (United Kingdom)",
            "Microsoft Olivia Online (Natural) - English (United Kingdom)",
            "Google UK English Female",
            "Google UK English Male",
            "Microsoft Hazel Desktop - English (Great Britain)",
            "Daniel"
        ],

        preferredFallbackEnglishVoices: [
            "Microsoft Ava Online (Natural) - English (United States)",
            "Microsoft Emma Online (Natural) - English (United States)",
            "Microsoft Jenny Online (Natural) - English (United States)",
            "Microsoft Aria Online (Natural) - English (United States)",
            "Google US English",
            "Samantha",
            "Alex"
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

    let speechRequestId = 0;

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

    function isBritishLang(lang) {
        const language = normalizeLang(lang);

        return (
            language === "en-gb" ||
            language.startsWith("en-gb-")
        );
    }

    function isAmericanLang(lang) {
        const language = normalizeLang(lang);

        return (
            language === "en-us" ||
            language.startsWith("en-us-")
        );
    }

    function isAustralianLang(lang) {
        const language = normalizeLang(lang);

        return (
            language === "en-au" ||
            language.startsWith("en-au-")
        );
    }

    function isCanadianLang(lang) {
        const language = normalizeLang(lang);

        return (
            language === "en-ca" ||
            language.startsWith("en-ca-")
        );
    }

    function isIrishLang(lang) {
        const language = normalizeLang(lang);

        return (
            language === "en-ie" ||
            language.startsWith("en-ie-")
        );
    }

    function isNewZealandLang(lang) {
        const language = normalizeLang(lang);

        return (
            language === "en-nz" ||
            language.startsWith("en-nz-")
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
            voices = [...available];
            voicesReady = true;
        }

        return [...voices];
    }

    function waitForVoices(timeout = 2500) {
        if (!isSupported()) {
            return Promise.resolve([]);
        }

        const immediate = loadVoices();

        if (immediate.length) {
            return Promise.resolve(immediate);
        }

        if (voiceLoadPromise) {
            return voiceLoadPromise;
        }

        voiceLoadPromise =
            new Promise(resolve => {
                let finished = false;

                const finish = () => {
                    if (finished) {
                        return;
                    }

                    finished = true;

                    window.clearTimeout(timeoutId);

                    window.speechSynthesis.removeEventListener(
                        "voiceschanged",
                        onVoicesChanged
                    );

                    loadVoices();

                    voiceLoadPromise = null;

                    resolve([...voices]);
                };

                const onVoicesChanged = () => {
                    const available = loadVoices();

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
        ).startsWith("en");
    }

    function isBritishVoice(voice) {
        if (!voice) {
            return false;
        }

        const lang = normalizeLang(voice.lang);
        const name = normalize(voice.name);

        if (isBritishLang(lang)) {
            return true;
        }

        return (
            name.includes("english (united kingdom)") ||
            name.includes("english united kingdom") ||
            name.includes("english (great britain)") ||
            name.includes("english great britain") ||
            name.includes("uk english") ||
            name.includes("british english")
        );
    }

    function isPortugueseVoice(voice) {
        return normalizeLang(
            voice?.lang
        ).startsWith("pt");
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
                voiceName.includes(preferred) ||
                preferred.includes(voiceName)
            ) {
                return (
                    5000 -
                    index * 10
                );
            }
        }

        return 0;
    }

    /* ==========================================================================
       QUALIDADE DAS VOZES BRITÂNICAS
       ========================================================================== */

    function scoreBritishVoice(voice) {
        if (!isEnglishVoice(voice)) {
            return -1000000;
        }

        if (!isBritishVoice(voice)) {
            return -500000;
        }

        const name = normalize(voice.name);
        const lang = normalizeLang(voice.lang);

        let score = 0;

        /*
         * Lista de vozes britânicas conhecidas.
         */

        score += exactPreferredScore(
            voice,
            CONFIG.preferredBritishVoices
        );

        score += partialPreferredScore(
            voice,
            CONFIG.preferredBritishVoices
        );

        /*
         * Locale britânico real recebe prioridade muito alta.
         */

        if (lang === "en-gb") {
            score += 20000;
        } else if (lang.startsWith("en-gb")) {
            score += 19000;
        } else {
            /*
             * Pode acontecer de o nome indicar UK,
             * mesmo que o navegador exponha locale genérico.
             */
            score += 10000;
        }

        /*
         * Vozes Natural / Neural são preferidas.
         */

        if (name.includes("natural")) {
            score += 2500;
        }

        if (name.includes("neural")) {
            score += 2500;
        }

        if (name.includes("online")) {
            score += 1200;
        }

        /*
         * Provedores conhecidos.
         */

        if (name.includes("microsoft")) {
            score += 700;
        }

        if (name.includes("google")) {
            score += 650;
        }

        /*
         * Vozes britânicas conhecidas.
         */

        if (name.includes("sonia")) {
            score += 700;
        }

        if (name.includes("ryan")) {
            score += 680;
        }

        if (name.includes("libby")) {
            score += 660;
        }

        if (name.includes("thomas")) {
            score += 640;
        }

        if (name.includes("daniel")) {
            score += 620;
        }

        if (name.includes("hazel")) {
            score += 600;
        }

        if (name.includes("olivia")) {
            score += 580;
        }

        if (name.includes("oliver")) {
            score += 560;
        }

        if (name.includes("maisie")) {
            score += 540;
        }

        /*
         * Google UK.
         */

        if (
            name.includes("google") &&
            name.includes("uk")
        ) {
            score += 1000;
        }

        if (voice.default) {
            score += 20;
        }

        return score;
    }

    /* ==========================================================================
       FALLBACK DE INGLÊS
       ========================================================================== */

    function scoreFallbackEnglishVoice(voice) {
        if (!isEnglishVoice(voice)) {
            return -1000000;
        }

        const name = normalize(voice.name);
        const lang = normalizeLang(voice.lang);

        let score = 0;

        score += exactPreferredScore(
            voice,
            CONFIG.preferredFallbackEnglishVoices
        );

        score += partialPreferredScore(
            voice,
            CONFIG.preferredFallbackEnglishVoices
        );

        /*
         * Caso não exista en-GB, tentamos manter
         * uma variante relativamente próxima antes
         * de cair diretamente no inglês americano.
         */

        if (isIrishLang(lang)) {
            score += 7000;
        } else if (isAustralianLang(lang)) {
            score += 6500;
        } else if (isNewZealandLang(lang)) {
            score += 6200;
        } else if (isCanadianLang(lang)) {
            score += 5000;
        } else if (isAmericanLang(lang)) {
            score += 4000;
        } else {
            score += 3000;
        }

        if (name.includes("natural")) {
            score += 1500;
        }

        if (name.includes("neural")) {
            score += 1500;
        }

        if (name.includes("online")) {
            score += 700;
        }

        if (name.includes("microsoft")) {
            score += 500;
        }

        if (name.includes("google")) {
            score += 450;
        }

        if (voice.default) {
            score += 20;
        }

        return score;
    }

    /* ==========================================================================
       PORTUGUÊS
       ========================================================================== */

    function scorePortugueseVoice(voice) {
        if (!isPortugueseVoice(voice)) {
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

        let score = 0;

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

        if (lang === "pt-br") {
            score += 3000;
        } else {
            score += 1500;
        }

        if (name.includes("natural")) {
            score += 1400;
        }

        if (name.includes("neural")) {
            score += 1400;
        }

        if (name.includes("online")) {
            score += 700;
        }

        if (name.includes("microsoft")) {
            score += 500;
        }

        if (name.includes("google")) {
            score += 450;
        }

        if (voice.default) {
            score += 30;
        }

        return score;
    }

    /* ==========================================================================
       LISTAS DE VOZES
       ========================================================================== */

    function getBritishVoices() {
        loadVoices();

        return voices
            .filter(isBritishVoice)
            .sort(
                (a, b) =>
                    scoreBritishVoice(b) -
                    scoreBritishVoice(a)
            );
    }

    function getEnglishVoices() {
        loadVoices();

        return voices
            .filter(isEnglishVoice)
            .sort((a, b) => {
                /*
                 * Regra absoluta:
                 * voz britânica vem antes de qualquer outra.
                 */

                const aBritish =
                    isBritishVoice(a);

                const bBritish =
                    isBritishVoice(b);

                if (
                    aBritish &&
                    !bBritish
                ) {
                    return -1;
                }

                if (
                    !aBritish &&
                    bBritish
                ) {
                    return 1;
                }

                if (
                    aBritish &&
                    bBritish
                ) {
                    return (
                        scoreBritishVoice(b) -
                        scoreBritishVoice(a)
                    );
                }

                return (
                    scoreFallbackEnglishVoice(b) -
                    scoreFallbackEnglishVoice(a)
                );
            });
    }

    function getPortugueseVoices() {
        loadVoices();

        return voices
            .filter(isPortugueseVoice)
            .sort(
                (a, b) =>
                    scorePortugueseVoice(b) -
                    scorePortugueseVoice(a)
            );
    }

    /* ==========================================================================
       SELEÇÃO FINAL DE VOZ
       ========================================================================== */

    function getBestEnglishVoice() {
        /*
         * Primeiro procura SOMENTE vozes britânicas.
         *
         * Isso evita o problema anterior:
         * uma Microsoft Natural en-US não pode mais
         * vencer uma voz en-GB apenas por ter mais bônus.
         */

        const britishVoices =
            getBritishVoices();

        if (britishVoices.length) {
            return britishVoices[0];
        }

        /*
         * Somente se NÃO houver nenhuma voz britânica
         * disponível no navegador, usa outro inglês.
         */

        const fallback =
            voices
                .filter(isEnglishVoice)
                .sort(
                    (a, b) =>
                        scoreFallbackEnglishVoice(b) -
                        scoreFallbackEnglishVoice(a)
                );

        return fallback.length
            ? fallback[0]
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
            normalizeLang(lang);

        if (
            language.startsWith("pt")
        ) {
            return getBestPortugueseVoice();
        }

        /*
         * Qualquer pedido de inglês da plataforma
         * usa a política britânica.
         *
         * Isso também protege contra código antigo
         * chamando speak(..., { lang: "en-US" }).
         */

        if (
            language.startsWith("en")
        ) {
            return getBestEnglishVoice();
        }

        return getBestEnglishVoice();
    }

    /* ==========================================================================
       PREPARAÇÃO DO TEXTO
       ========================================================================== */

    function prepareEnglishText(text) {
        let value =
            cleanText(text);

        if (!value) {
            return "";
        }

        /*
         * Não alteramos a ortografia inglesa.
         *
         * "thanks" continua sendo "thanks".
         * "please" continua sendo "please".
         *
         * O sotaque deve vir da voz en-GB,
         * não de escrita fonética artificial.
         */

        value =
            value
                .replace(/[“”]/g, '"')
                .replace(/[‘’]/g, "'");

        /*
         * Normaliza alguns caracteres que podem
         * interferir com determinados sintetizadores.
         */

        value =
            value
                .replace(/[–—]/g, "-")
                .replace(/\u00A0/g, " ");

        /*
         * Palavra isolada recebe pontuação.
         * Isso ajuda o sintetizador a finalizar
         * corretamente o último fonema.
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

    /* ==========================================================================
       ESTADO VISUAL
       ========================================================================== */

    function resetButton() {
        if (!currentButton) {
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

        currentButton = null;
    }

    function activateButton(button) {
        if (!button) {
            return;
        }

        if (
            !button.dataset.originalSpeechLabel
        ) {
            button.dataset.originalSpeechLabel =
                button.getAttribute(
                    "aria-label"
                ) ||
                "Ouvir pronúncia";
        }

        if (
            !button.dataset.originalSpeechTitle
        ) {
            button.dataset.originalSpeechTitle =
                button.getAttribute(
                    "title"
                ) ||
                "Ouvir pronúncia";
        }

        currentButton = button;

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

        currentUtterance = null;
        currentText = "";
        currentLang = "";
        currentVoice = null;
    }

    /* ==========================================================================
       PARAR
       ========================================================================== */

    function stop() {
        /*
         * Incrementa o ID para invalidar qualquer
         * reprodução assíncrona ainda aguardando
         * o carregamento das vozes.
         */

        speechRequestId++;

        if (!isSupported()) {
            resetState();
            return;
        }

        try {
            window.speechSynthesis.cancel();
        } catch (error) {
            if (CONFIG.debug) {
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
         * IMPORTANTE:
         *
         * Todo inglês começa como en-GB.
         */

        utterance.lang =
            isPortuguese
                ? CONFIG.portugueseLang
                : CONFIG.englishLang;

        /*
         * Se encontramos uma voz, aplicamos
         * explicitamente a voz.
         */

        if (voice) {
            utterance.voice = voice;

            /*
             * Para inglês britânico, mantemos en-GB.
             *
             * Para fallback, usamos o locale real
             * porque o navegador precisa casar
             * corretamente a voz selecionada.
             */

            if (
                !isPortuguese &&
                isBritishVoice(voice)
            ) {
                utterance.lang =
                    CONFIG.englishLang;
            } else if (
                voice.lang
            ) {
                utterance.lang =
                    voice.lang;
            }
        }

        /*
         * Velocidade.
         */

        if (
            options.rate !== undefined &&
            options.rate !== null
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
        if (!isSupported()) {
            console.warn(
                "[EYT Speech] SpeechSynthesis não é suportado neste navegador."
            );

            return false;
        }

        const originalText =
            cleanText(text);

        if (!originalText) {
            return false;
        }

        /*
         * Português respeita pt-BR.
         *
         * Qualquer pedido em inglês é normalizado
         * para inglês britânico.
         */

        const requestedOptionLang =
            options.lang ||
            CONFIG.englishLang;

        const normalizedRequestedLang =
            normalizeLang(
                requestedOptionLang
            );

        const requestedLang =
            normalizedRequestedLang.startsWith("pt")
                ? CONFIG.portugueseLang
                : CONFIG.englishLang;

        /*
         * Invalida fala anterior.
         */

        stop();

        const requestId =
            ++speechRequestId;

        /*
         * Aguarda carregamento das vozes.
         */

        await waitForVoices();

        /*
         * Se outra reprodução foi solicitada enquanto
         * aguardávamos, esta solicitação morre aqui.
         */

        if (
            requestId !==
            speechRequestId
        ) {
            return false;
        }

        /*
         * Cancela apenas a fila nativa do navegador,
         * sem invalidar o requestId atual.
         */

        try {
            window.speechSynthesis.cancel();
        } catch (error) {
            if (CONFIG.debug) {
                console.warn(
                    "[EYT Speech] Falha ao limpar fila:",
                    error
                );
            }
        }

        resetState();

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

        if (options.button) {
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

                if (CONFIG.debug) {
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
                        "Voz britânica:",
                        voice
                            ? isBritishVoice(voice)
                            : false
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

                        voiceLang:
                            voice
                                ? voice.lang
                                : null,

                        british:
                            voice
                                ? isBritishVoice(voice)
                                : false,

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
                    event.error !== "canceled" &&
                    event.error !== "interrupted"
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
         * Chromium/Edge podem ignorar speak()
         * imediatamente após cancel().
         */

        window.setTimeout(
            () => {
                if (
                    requestId !==
                    speechRequestId
                ) {
                    return;
                }

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
            80
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
        if (!isSupported()) {
            return false;
        }

        const value =
            cleanText(text);

        if (!value) {
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

                /*
                 * Sempre britânico.
                 */

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
            ...CONFIG,

            preferredBritishVoices: [
                ...CONFIG.preferredBritishVoices
            ],

            preferredFallbackEnglishVoices: [
                ...CONFIG.preferredFallbackEnglishVoices
            ],

            preferredPortugueseVoices: [
                ...CONFIG.preferredPortugueseVoices
            ]
        };
    }

    /* ==========================================================================
       DIAGNÓSTICO
       ========================================================================== */

    function debugVoices() {
        loadVoices();

        const british =
            getBritishVoices();

        const english =
            getEnglishVoices();

        console.group(
            "[EYT Speech] British English"
        );

        console.log(
            "Idioma padrão do curso:",
            CONFIG.englishLang
        );

        if (!british.length) {
            console.warn(
                "ATENÇÃO: o navegador não disponibilizou nenhuma voz en-GB. Será necessário usar uma voz inglesa de fallback."
            );
        } else {
            console.log(
                `Vozes britânicas encontradas: ${british.length}`
            );

            british.forEach(
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
                                scoreBritishVoice(
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
        }

        console.groupEnd();

        console.group(
            "[EYT Speech] Todas as vozes inglesas"
        );

        if (!english.length) {
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

                        british:
                            isBritishVoice(
                                voice
                            ),

                        score:
                            isBritishVoice(
                                voice
                            )
                                ? scoreBritishVoice(
                                    voice
                                )
                                : scoreFallbackEnglishVoice(
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

        console.log(
            "É BRITÂNICA:",
            selected
                ? isBritishVoice(
                    selected
                )
                : false
        );

        console.groupEnd();

        return selected;
    }

    /* ==========================================================================
       TESTE DE PRONÚNCIA
       ========================================================================== */

    async function testBritishPronunciation() {
        await waitForVoices();

        const selected =
            getBestEnglishVoice();

        console.group(
            "[EYT Speech] Teste de pronúncia britânica"
        );

        console.log(
            "Voz selecionada:",
            selected
                ? selected.name
                : "Nenhuma"
        );

        console.log(
            "Locale:",
            selected
                ? selected.lang
                : CONFIG.englishLang
        );

        console.log(
            "Britânica:",
            selected
                ? isBritishVoice(
                    selected
                )
                : false
        );

        console.groupEnd();

        return speakEnglish(
            "Thanks. Please. Thank you very much. Could you please help me?"
        );
    }

    /* ==========================================================================
       INICIALIZAÇÃO
       ========================================================================== */

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
                            `[EYT Speech] British English voice ready: ${selected.name} (${selected.lang})`
                        );
                    }
                }
            }
        );

        /*
         * Chromium pode popular a lista de vozes
         * em momentos diferentes.
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

    /* ==========================================================================
       API PÚBLICA
       ========================================================================== */

    return {
        isSupported,
        isSpeaking,

        loadVoices,
        waitForVoices,

        getVoices,
        getBritishVoices,
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
        testBritishPronunciation,
        getConfig
    };
})();