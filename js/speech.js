const EYTSpeech = (() => {
    const CONFIG = {
        englishLang: "en-US",
        portugueseLang: "pt-BR",
        englishRate: 0.82,
        portugueseRate: 0.95,
        pitch: 1,
        volume: 1
    };

    let voices = [];
    let currentUtterance = null;
    let currentButton = null;
    let currentText = "";
    let currentLang = "";

    function isSupported() {
        return (
            "speechSynthesis" in window &&
            "SpeechSynthesisUtterance" in window
        );
    }

    function loadVoices() {
        if (!isSupported()) return [];

        voices = window.speechSynthesis.getVoices() || [];

        return voices;
    }

    function normalizeLanguage(lang) {
        return String(lang || "")
            .trim()
            .toLowerCase();
    }

    function getVoice(lang) {
        if (!voices.length) {
            loadVoices();
        }

        const target = normalizeLanguage(lang);

        if (!target) {
            return null;
        }

        const exact = voices.find(voice =>
            normalizeLanguage(voice.lang) === target
        );

        if (exact) {
            return exact;
        }

        const languagePrefix = target.split("-")[0];

        const sameLanguage = voices.find(voice =>
            normalizeLanguage(voice.lang)
                .startsWith(languagePrefix)
        );

        return sameLanguage || null;
    }

    function cleanText(text) {
        return String(text ?? "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function resetButton() {
        if (!currentButton) return;

        currentButton.classList.remove("is-speaking");
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

    function stop() {
        if (!isSupported()) return;

        window.speechSynthesis.cancel();

        resetState();
    }

    function speak(text, options = {}) {
        const value = cleanText(text);

        if (!value) {
            return false;
        }

        if (!isSupported()) {
            console.warn(
                "Síntese de voz não suportada neste navegador."
            );

            return false;
        }

        stop();

        const lang =
            options.lang ||
            CONFIG.englishLang;

        const isPortuguese =
            normalizeLanguage(lang)
                .startsWith("pt");

        const utterance =
            new SpeechSynthesisUtterance(value);

        utterance.lang = lang;

        utterance.rate =
            Number(
                options.rate ??
                (
                    isPortuguese
                        ? CONFIG.portugueseRate
                        : CONFIG.englishRate
                )
            );

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

        const voice = getVoice(lang);

        if (voice) {
            utterance.voice = voice;
        }

        if (options.button) {
            currentButton = options.button;

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

        currentUtterance = utterance;
        currentText = value;
        currentLang = lang;

        utterance.onend = () => {
            if (currentUtterance === utterance) {
                resetState();
            }
        };

        utterance.onerror = event => {
            if (
                event.error !== "canceled" &&
                event.error !== "interrupted"
            ) {
                console.warn(
                    "Não foi possível reproduzir a narração:",
                    event.error
                );
            }

            if (currentUtterance === utterance) {
                resetState();
            }
        };

        window.speechSynthesis.speak(
            utterance
        );

        return true;
    }

    function toggle(text, button, options = {}) {
        const value = cleanText(text);
        const lang =
            options.lang ||
            CONFIG.englishLang;

        const sameAudio =
            currentButton === button &&
            currentText === value &&
            currentLang === lang &&
            (
                window.speechSynthesis.speaking ||
                window.speechSynthesis.pending
            );

        if (sameAudio) {
            stop();
            return false;
        }

        return speak(
            value,
            {
                ...options,
                lang,
                button
            }
        );
    }

    function speakEnglish(text, options = {}) {
        return speak(
            text,
            {
                ...options,
                lang: CONFIG.englishLang
            }
        );
    }

    function speakPortuguese(text, options = {}) {
        return speak(
            text,
            {
                ...options,
                lang: CONFIG.portugueseLang
            }
        );
    }

    function toggleEnglish(text, button, options = {}) {
        return toggle(
            text,
            button,
            {
                ...options,
                lang: CONFIG.englishLang
            }
        );
    }

    function togglePortuguese(text, button, options = {}) {
        return toggle(
            text,
            button,
            {
                ...options,
                lang: CONFIG.portugueseLang
            }
        );
    }

    function getVoices() {
        return [...voices];
    }

    function getConfig() {
        return {
            ...CONFIG
        };
    }

    loadVoices();

    if (isSupported()) {
        window.speechSynthesis.addEventListener(
            "voiceschanged",
            loadVoices
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
        loadVoices,
        getVoices,
        getConfig,
        speak,
        speakEnglish,
        speakPortuguese,
        toggle,
        toggleEnglish,
        togglePortuguese,
        stop
    };
})();