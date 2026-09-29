const EYTSpeech = (() => {
    "use strict";

    const CONFIG = {
        englishLang: "en-GB",
        portugueseLang: "pt-BR",
        englishRate: 0.88,
        portugueseRate: 0.96,
        slowEnglishRate: 0.72,
        englishPitch: 1,
        portuguesePitch: 1,
        volume: 1,
        debug: true,

        dictionaryEndpoint: "https://api.dictionaryapi.dev/api/v2/entries/en/",
        dictionaryTimeout: 2500,

        preferredBritishVoices: [
            "Microsoft Sonia Online (Natural) - English (United Kingdom)",
            "Microsoft Ryan Online (Natural) - English (United Kingdom)",
            "Microsoft Libby Online (Natural) - English (United Kingdom)",
            "Microsoft Thomas Online (Natural) - English (United Kingdom)",
            "Google UK English Female",
            "Google UK English Male",
            "Microsoft Hazel Desktop - English (Great Britain)",
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
    let voiceLoadPromise = null;

    let currentUtterance = null;
    let currentAudio = null;
    let currentButton = null;

    let currentText = "";
    let currentLang = "";
    let currentVoice = null;

    let requestId = 0;

    const dictionaryAudioCache = new Map();

    /* ==========================================================================
       SUPORTE
       ========================================================================== */

    function supportsSpeechSynthesis() {
        return (
            "speechSynthesis" in window &&
            "SpeechSynthesisUtterance" in window
        );
    }

    function isSupported() {
        return (
            supportsSpeechSynthesis() ||
            "Audio" in window
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

    function isPortugueseLang(lang) {
        return normalizeLang(lang)
            .startsWith("pt");
    }

    function isEnglishLang(lang) {
        return normalizeLang(lang)
            .startsWith("en");
    }

    /* ==========================================================================
       VOZ BRITÂNICA
       ========================================================================== */

    function isBritishVoice(voice) {
        if (!voice) {
            return false;
        }

        const lang =
            normalizeLang(
                voice.lang
            );

        const name =
            normalize(
                voice.name
            );

        return (
            lang === "en-gb" ||
            lang.startsWith("en-gb-") ||
            name.includes("united kingdom") ||
            name.includes("great britain") ||
            name.includes("uk english") ||
            name.includes("british english")
        );
    }

    /* ==========================================================================
       CARREGAMENTO DE VOZES
       ========================================================================== */

    function loadVoices() {
        if (!supportsSpeechSynthesis()) {
            voices = [];
            return [];
        }

        const available =
            window.speechSynthesis.getVoices() ||
            [];

        if (available.length) {
            voices = [
                ...available
            ];
        }

        return [
            ...voices
        ];
    }

    function waitForVoices(
        timeout = 2500
    ) {
        if (!supportsSpeechSynthesis()) {
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

                    clearTimeout(
                        timer
                    );

                    window.speechSynthesis
                        .removeEventListener(
                            "voiceschanged",
                            changed
                        );

                    loadVoices();

                    voiceLoadPromise =
                        null;

                    resolve([
                        ...voices
                    ]);
                };

                const changed = () => {
                    if (
                        loadVoices()
                            .length
                    ) {
                        finish();
                    }
                };

                const timer =
                    setTimeout(
                        finish,
                        timeout
                    );

                window.speechSynthesis
                    .addEventListener(
                        "voiceschanged",
                        changed
                    );
            });

        return voiceLoadPromise;
    }

    /* ==========================================================================
       SCORE
       ========================================================================== */

    function preferredVoiceScore(
        voice,
        preferredList
    ) {
        const name =
            normalize(
                voice?.name
            );

        let score =
            0;

        preferredList.forEach(
            (
                preferredName,
                index
            ) => {
                const preferred =
                    normalize(
                        preferredName
                    );

                if (
                    name ===
                    preferred
                ) {
                    score =
                        Math.max(
                            score,
                            10000 -
                            index * 10
                        );
                } else if (
                    name.includes(
                        preferred
                    ) ||
                    preferred.includes(
                        name
                    )
                ) {
                    score =
                        Math.max(
                            score,
                            5000 -
                            index * 10
                        );
                }
            }
        );

        return score;
    }

    function scoreBritishVoice(
        voice
    ) {
        if (
            !voice ||
            !normalizeLang(
                voice.lang
            ).startsWith("en")
        ) {
            return -1000000;
        }

        if (
            !isBritishVoice(
                voice
            )
        ) {
            return -500000;
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
            preferredVoiceScore(
                voice,
                CONFIG
                    .preferredBritishVoices
            );

        if (
            lang === "en-gb"
        ) {
            score +=
                20000;
        } else if (
            lang.startsWith(
                "en-gb"
            )
        ) {
            score +=
                19000;
        } else {
            score +=
                10000;
        }

        if (
            name.includes(
                "natural"
            )
        ) {
            score +=
                2500;
        }

        if (
            name.includes(
                "neural"
            )
        ) {
            score +=
                2500;
        }

        if (
            name.includes(
                "online"
            )
        ) {
            score +=
                1200;
        }

        if (
            name.includes(
                "microsoft"
            )
        ) {
            score +=
                700;
        }

        if (
            name.includes(
                "google"
            )
        ) {
            score +=
                650;
        }

        if (
            voice.default
        ) {
            score +=
                20;
        }

        return score;
    }

    function scoreFallbackEnglishVoice(
        voice
    ) {
        if (
            !voice ||
            !normalizeLang(
                voice.lang
            ).startsWith("en")
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

        if (
            lang === "en-ie"
        ) {
            score +=
                7000;
        } else if (
            lang === "en-au"
        ) {
            score +=
                6500;
        } else if (
            lang === "en-nz"
        ) {
            score +=
                6200;
        } else if (
            lang === "en-ca"
        ) {
            score +=
                5000;
        } else if (
            lang === "en-us"
        ) {
            score +=
                3500;
        } else {
            score +=
                3000;
        }

        if (
            name.includes(
                "natural"
            )
        ) {
            score +=
                1500;
        }

        if (
            name.includes(
                "neural"
            )
        ) {
            score +=
                1500;
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
                20;
        }

        return score;
    }

    function scorePortugueseVoice(
        voice
    ) {
        if (
            !voice ||
            !normalizeLang(
                voice.lang
            ).startsWith("pt")
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
            preferredVoiceScore(
                voice,
                CONFIG
                    .preferredPortugueseVoices
            );

        score +=
            lang === "pt-br"
                ? 3000
                : 1500;

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

    /* ==========================================================================
       SELEÇÃO DE VOZ
       ========================================================================== */

    function getBritishVoices() {
        loadVoices();

        return voices
            .filter(
                isBritishVoice
            )
            .sort(
                (a, b) =>
                    scoreBritishVoice(b) -
                    scoreBritishVoice(a)
            );
    }

    function getEnglishVoices() {
        loadVoices();

        return voices
            .filter(
                voice =>
                    normalizeLang(
                        voice.lang
                    ).startsWith(
                        "en"
                    )
            )
            .sort(
                (a, b) => {
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
                        aBritish
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
                }
            );
    }

    function getPortugueseVoices() {
        loadVoices();

        return voices
            .filter(
                voice =>
                    normalizeLang(
                        voice.lang
                    ).startsWith(
                        "pt"
                    )
            )
            .sort(
                (a, b) =>
                    scorePortugueseVoice(b) -
                    scorePortugueseVoice(a)
            );
    }

    function getBestEnglishVoice() {
        const british =
            getBritishVoices();

        if (
            british.length
        ) {
            return british[0];
        }

        const fallback =
            getEnglishVoices();

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
        lang =
            CONFIG.englishLang
    ) {
        return isPortugueseLang(
            lang
        )
            ? getBestPortugueseVoice()
            : getBestEnglishVoice();
    }

    /* ==========================================================================
       PALAVRAS ISOLADAS
       ========================================================================== */

    function isSingleDictionaryWord(
        text
    ) {
        const value =
            cleanText(text)
                .replace(
                    /[.!?,;:]+$/g,
                    ""
                );

        return /^[A-Za-z]+(?:['-][A-Za-z]+)*$/
            .test(
                value
            );
    }

    function dictionaryWord(
        text
    ) {
        return cleanText(text)
            .replace(
                /[.!?,;:]+$/g,
                ""
            )
            .toLowerCase();
    }

    function normalizeAudioUrl(
        url
    ) {
        const value =
            String(
                url || ""
            ).trim();

        if (!value) {
            return "";
        }

        if (
            value.startsWith(
                "//"
            )
        ) {
            return `https:${value}`;
        }

        return value;
    }

    function looksBritishAudio(
        url
    ) {
        const value =
            normalize(
                url
            );

        return (
            value.includes("-uk.") ||
            value.includes("_uk_") ||
            value.includes("/uk/") ||
            value.includes("-gb.") ||
            value.includes("_gb_") ||
            value.includes("/gb/") ||
            value.includes("en-gb") ||
            value.includes("british")
        );
    }

    /* ==========================================================================
       FETCH
       ========================================================================== */

    async function fetchWithTimeout(
        url,
        timeout
    ) {
        const controller =
            new AbortController();

        const timer =
            setTimeout(
                () =>
                    controller.abort(),
                timeout
            );

        try {
            return await fetch(
                url,
                {
                    method: "GET",
                    headers: {
                        Accept:
                            "application/json"
                    },
                    signal:
                        controller.signal
                }
            );
        } finally {
            clearTimeout(
                timer
            );
        }
    }

    /* ==========================================================================
       ÁUDIO DE DICIONÁRIO
       ========================================================================== */

    async function resolveBritishDictionaryAudio(
        text
    ) {
        if (
            !isSingleDictionaryWord(
                text
            )
        ) {
            return null;
        }

        const word =
            dictionaryWord(
                text
            );

        if (!word) {
            return null;
        }

        if (
            dictionaryAudioCache
                .has(
                    word
                )
        ) {
            return dictionaryAudioCache
                .get(
                    word
                );
        }

        const lookupPromise =
            (async () => {
                try {
                    const response =
                        await fetchWithTimeout(
                            `${CONFIG.dictionaryEndpoint}${encodeURIComponent(word)}`,
                            CONFIG.dictionaryTimeout
                        );

                    if (
                        !response.ok
                    ) {
                        return null;
                    }

                    const data =
                        await response.json();

                    if (
                        !Array.isArray(
                            data
                        )
                    ) {
                        return null;
                    }

                    const audioUrls =
                        [];

                    data.forEach(
                        entry => {
                            (
                                entry
                                    ?.phonetics ||
                                []
                            ).forEach(
                                phonetic => {
                                    const url =
                                        normalizeAudioUrl(
                                            phonetic
                                                ?.audio
                                        );

                                    if (
                                        url &&
                                        !audioUrls
                                            .includes(
                                                url
                                            )
                                    ) {
                                        audioUrls.push(
                                            url
                                        );
                                    }
                                }
                            );
                        }
                    );

                    const british =
                        audioUrls.find(
                            looksBritishAudio
                        );

                    if (
                        CONFIG.debug &&
                        british
                    ) {
                        console.log(
                            `[EYT Speech] Áudio britânico real para "${word}":`,
                            british
                        );
                    }

                    return british ||
                        null;
                } catch (error) {
                    if (
                        CONFIG.debug &&
                        error?.name !==
                        "AbortError"
                    ) {
                        console.warn(
                            `[EYT Speech] Dicionário indisponível para "${word}". Usando TTS en-GB.`,
                            error
                        );
                    }

                    return null;
                }
            })();

        dictionaryAudioCache.set(
            word,
            lookupPromise
        );

        return lookupPromise;
    }

    /* ==========================================================================
       PREPARAÇÃO DE TEXTO
       ========================================================================== */

    function prepareEnglishText(
        text
    ) {
        let value =
            cleanText(
                text
            )
                .replace(
                    /[“”]/g,
                    "\""
                )
                .replace(
                    /[‘’]/g,
                    "'"
                )
                .replace(
                    /[–—]/g,
                    "-"
                )
                .replace(
                    /\u00A0/g,
                    " "
                );

        if (
            /^[A-Za-z]+(?:['-][A-Za-z]+)*$/
                .test(
                    value
                ) &&
            !/[.!?]$/
                .test(
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
       BOTÃO
       ========================================================================== */

    function rememberButtonLabel(
        button
    ) {
        if (!button) {
            return;
        }

        if (
            !button.dataset
                .originalSpeechLabel
        ) {
            button.dataset
                .originalSpeechLabel =
                button.getAttribute(
                    "aria-label"
                ) ||
                "Ouvir pronúncia";
        }

        if (
            !button.dataset
                .originalSpeechTitle
        ) {
            button.dataset
                .originalSpeechTitle =
                button.getAttribute(
                    "title"
                ) ||
                "Ouvir pronúncia";
        }
    }

    function activateButton(
        button
    ) {
        if (!button) {
            return;
        }

        rememberButtonLabel(
            button
        );

        currentButton =
            button;

        button.classList.add(
            "is-speaking"
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

    function resetButton() {
        if (!currentButton) {
            return;
        }

        currentButton
            .classList
            .remove(
                "is-speaking"
            );

        currentButton.setAttribute(
            "aria-label",
            currentButton
                .dataset
                .originalSpeechLabel ||
            "Ouvir pronúncia"
        );

        currentButton.setAttribute(
            "title",
            currentButton
                .dataset
                .originalSpeechTitle ||
            "Ouvir pronúncia"
        );

        currentButton =
            null;
    }

    function clearCurrentState() {
        resetButton();

        currentUtterance =
            null;

        currentAudio =
            null;

        currentText =
            "";

        currentLang =
            "";

        currentVoice =
            null;
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
       PARAR
       ========================================================================== */

    function stop() {
        requestId++;

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

        if (
            supportsSpeechSynthesis()
        ) {
            try {
                window
                    .speechSynthesis
                    .cancel();
            } catch (_) {
                // Ignora.
            }
        }

        clearCurrentState();
    }

    /* ==========================================================================
       REPRODUÇÃO DE ÁUDIO REAL
       ========================================================================== */

    function playRecordedAudio(
        url,
        originalText,
        button,
        requestToken
    ) {
        return new Promise(
            resolve => {
                if (
                    !url ||
                    !(
                        "Audio" in
                        window
                    )
                ) {
                    resolve(
                        false
                    );

                    return;
                }

                const audio =
                    new Audio(
                        url
                    );

                audio.preload =
                    "auto";

                currentAudio =
                    audio;

                currentText =
                    originalText;

                currentLang =
                    CONFIG.englishLang;

                currentVoice =
                    null;

                if (button) {
                    activateButton(
                        button
                    );
                }

                let finished =
                    false;

                const finish =
                    success => {
                        if (
                            finished
                        ) {
                            return;
                        }

                        finished =
                            true;

                        if (
                            currentAudio ===
                            audio
                        ) {
                            clearCurrentState();
                        }

                        resolve(
                            success
                        );
                    };

                audio.addEventListener(
                    "playing",
                    () => {
                        if (
                            requestToken !==
                            requestId
                        ) {
                            return;
                        }

                        dispatchSpeechEvent(
                            "eyt:speech-start",
                            {
                                text:
                                    originalText,

                                spokenText:
                                    originalText,

                                lang:
                                    CONFIG.englishLang,

                                voice:
                                    "British dictionary recording",

                                source:
                                    "dictionary"
                            }
                        );
                    },
                    {
                        once: true
                    }
                );

                audio.addEventListener(
                    "ended",
                    () => {
                        dispatchSpeechEvent(
                            "eyt:speech-end",
                            {
                                text:
                                    originalText,

                                source:
                                    "dictionary"
                            }
                        );

                        finish(
                            true
                        );
                    },
                    {
                        once: true
                    }
                );

                audio.addEventListener(
                    "error",
                    () =>
                        finish(
                            false
                        ),
                    {
                        once: true
                    }
                );

                const playPromise =
                    audio.play();

                if (
                    playPromise &&
                    typeof playPromise
                        .catch ===
                    "function"
                ) {
                    playPromise.catch(
                        () =>
                            finish(
                                false
                            )
                    );
                }
            }
        );
    }

    /* ==========================================================================
       UTTERANCE
       ========================================================================== */

    function createUtterance(
        originalText,
        requestedLang,
        options,
        voice
    ) {
        const portuguese =
            isPortugueseLang(
                requestedLang
            );

        const preparedText =
            portuguese
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

        utterance.lang =
            portuguese
                ? CONFIG
                    .portugueseLang
                : CONFIG
                    .englishLang;

        if (voice) {
            utterance.voice =
                voice;

            if (
                portuguese &&
                voice.lang
            ) {
                utterance.lang =
                    voice.lang;
            } else if (
                !portuguese &&
                isBritishVoice(
                    voice
                )
            ) {
                utterance.lang =
                    CONFIG
                        .englishLang;
            } else if (
                !portuguese &&
                voice.lang
            ) {
                utterance.lang =
                    voice.lang;
            }
        }

        const defaultRate =
            portuguese
                ? CONFIG
                    .portugueseRate
                : CONFIG
                    .englishRate;

        utterance.rate =
            options.slow &&
                !portuguese
                ? CONFIG
                    .slowEnglishRate
                : clamp(
                    options.rate,
                    0.5,
                    1.5,
                    defaultRate
                );

        utterance.pitch =
            clamp(
                options.pitch,
                0.5,
                1.5,
                portuguese
                    ? CONFIG
                        .portuguesePitch
                    : CONFIG
                        .englishPitch
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
            preparedText
        };
    }

    /* ==========================================================================
       SPEECH SYNTHESIS
       ========================================================================== */

    async function speakWithSynthesis(
        originalText,
        requestedLang,
        options,
        button,
        requestToken
    ) {
        if (
            !supportsSpeechSynthesis()
        ) {
            return false;
        }

        await waitForVoices();

        if (
            requestToken !==
            requestId
        ) {
            return false;
        }

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

        if (button) {
            activateButton(
                button
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
                    console.log(
                        "[EYT Speech] TTS:",
                        {
                            text:
                                originalText,

                            lang:
                                utterance.lang,

                            voice:
                                voice
                                    ?.name ||
                                "default",

                            voiceLang:
                                voice
                                    ?.lang ||
                                utterance.lang,

                            british:
                                Boolean(
                                    voice &&
                                    isBritishVoice(
                                        voice
                                    )
                                ),

                            rate:
                                utterance.rate
                        }
                    );
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
                                ?.name ||
                            null,

                        voiceLang:
                            voice
                                ?.lang ||
                            null,

                        source:
                            "speechSynthesis",

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
                    clearCurrentState();
                }

                dispatchSpeechEvent(
                    "eyt:speech-end",
                    {
                        text:
                            originalText,

                        source:
                            "speechSynthesis"
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
                        "[EYT Speech] Erro:",
                        event.error
                    );
                }

                if (
                    currentUtterance ===
                    utterance
                ) {
                    clearCurrentState();
                }

                dispatchSpeechEvent(
                    "eyt:speech-end",
                    {
                        text:
                            originalText,

                        source:
                            "speechSynthesis",

                        error:
                            event.error
                    }
                );
            };

        try {
            window
                .speechSynthesis
                .cancel();

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        60
                    )
            );

            if (
                requestToken !==
                requestId
            ) {
                return false;
            }

            window
                .speechSynthesis
                .speak(
                    utterance
                );

            return true;
        } catch (error) {
            if (
                currentUtterance ===
                utterance
            ) {
                clearCurrentState();
            }

            console.error(
                "[EYT Speech] Não foi possível iniciar o TTS:",
                error
            );

            return false;
        }
    }

    /* ==========================================================================
       FALAR
       ========================================================================== */

    async function speak(
        text,
        options = {}
    ) {
        const originalText =
            cleanText(
                text
            );

        if (
            !originalText ||
            !isSupported()
        ) {
            return false;
        }

        stop();

        const requestToken =
            ++requestId;

        const requestedLang =
            isPortugueseLang(
                options.lang
            )
                ? CONFIG
                    .portugueseLang
                : CONFIG
                    .englishLang;

        const english =
            isEnglishLang(
                requestedLang
            );

        const preferRecorded =
            options
                .preferRecorded !==
            false;

        const button =
            options.button ||
            null;

        /*
         * PALAVRA ISOLADA:
         * tenta primeiro gravação real britânica.
         */

        if (
            english &&
            preferRecorded &&
            isSingleDictionaryWord(
                originalText
            )
        ) {
            const dictionaryUrl =
                await resolveBritishDictionaryAudio(
                    originalText
                );

            if (
                requestToken !==
                requestId
            ) {
                return false;
            }

            if (
                dictionaryUrl
            ) {
                const played =
                    await playRecordedAudio(
                        dictionaryUrl,
                        originalText,
                        button,
                        requestToken
                    );

                if (
                    played ||
                    requestToken !==
                    requestId
                ) {
                    return played;
                }

                clearCurrentState();
            }
        }

        /*
         * FRASE OU SEM ÁUDIO DO DICIONÁRIO:
         * fallback TTS britânico.
         */

        return speakWithSynthesis(
            originalText,
            requestedLang,
            options,
            button,
            requestToken
        );
    }

    /* ==========================================================================
       TOGGLE
       ========================================================================== */

    function toggle(
        text,
        button,
        options = {}
    ) {
        const value =
            cleanText(
                text
            );

        if (
            !value ||
            !isSupported()
        ) {
            return false;
        }

        const sameButton =
            currentButton ===
            button;

        const activeAudio =
            Boolean(
                currentAudio &&
                !currentAudio.paused
            );

        const activeSpeech =
            supportsSpeechSynthesis() &&
            (
                window
                    .speechSynthesis
                    .speaking ||
                window
                    .speechSynthesis
                    .pending
            );

        if (
            sameButton &&
            (
                activeAudio ||
                activeSpeech
            )
        ) {
            stop();

            return false;
        }

        void speak(
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
                    CONFIG
                        .englishLang
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
                    CONFIG
                        .englishLang,

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
                    CONFIG
                        .portugueseLang,

                preferRecorded:
                    false
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
                    CONFIG
                        .englishLang
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
                    CONFIG
                        .portugueseLang,

                preferRecorded:
                    false
            }
        );
    }

    /* ==========================================================================
       STATUS
       ========================================================================== */

    function isSpeaking() {
        const audioPlaying =
            Boolean(
                currentAudio &&
                !currentAudio.paused
            );

        const synthesisPlaying =
            supportsSpeechSynthesis() &&
            (
                window
                    .speechSynthesis
                    .speaking ||
                window
                    .speechSynthesis
                    .pending
            );

        return (
            audioPlaying ||
            synthesisPlaying
        );
    }

    function getVoices() {
        return loadVoices();
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
       DEBUG
       ========================================================================== */

    function debugVoices() {
        loadVoices();

        const british =
            getBritishVoices();

        const english =
            getEnglishVoices();

        const selected =
            getBestEnglishVoice();

        console.group(
            "[EYT Speech] Diagnóstico"
        );

        console.log(
            "Idioma padrão:",
            CONFIG.englishLang
        );

        console.log(
            "Vozes britânicas:",
            british.map(
                voice =>
                    `${voice.name} (${voice.lang})`
            )
        );

        console.log(
            "Vozes inglesas:",
            english.map(
                voice =>
                    `${voice.name} (${voice.lang})`
            )
        );

        console.log(
            "Voz selecionada:",
            selected
                ? `${selected.name} (${selected.lang})`
                : "Nenhuma"
        );

        console.log(
            "Áudio real de dicionário para palavras isoladas: ATIVO"
        );

        console.groupEnd();

        return selected;
    }

    async function testBritishPronunciation() {
        return speakEnglish(
            "Thanks",
            {
                preferRecorded:
                    true
            }
        );
    }

    /* ==========================================================================
       INICIALIZAÇÃO
       ========================================================================== */

    if (
        supportsSpeechSynthesis()
    ) {
        loadVoices();

        window
            .speechSynthesis
            .addEventListener(
                "voiceschanged",
                loadVoices
            );

        [
            100,
            300,
            750,
            1500,
            2500
        ].forEach(
            delay =>
                setTimeout(
                    loadVoices,
                    delay
                )
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
       API
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

        resolveBritishDictionaryAudio,

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