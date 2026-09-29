const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";
const KOKORO_MODULE_URL = "https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm";

const RUNTIME = {
    device: "wasm",
    dtype: "q8"
};

const PROFILES = {
    "en-GB": {
        teacher: "bf_emma",
        teacherMale: "bm_george",
        female: "bf_emma",
        male: "bm_george",
        characterFemale: "bf_isabella",
        characterMale: "bm_fable"
    },

    "pt-BR": {
        teacher: "pf_dora",
        teacherMale: "pm_alex",
        female: "pf_dora",
        male: "pm_alex",
        characterFemale: "pf_dora",
        characterMale: "pm_santa"
    }
};

let KokoroTTS = null;
let tts = null;
let initPromise = null;

const originalFetch =
    self.fetch.bind(self);

let fetchPatched =
    false;

function cleanText(value) {
    return String(
        value ?? ""
    )
        .replace(
            /\s+/g,
            " "
        )
        .trim();
}

function normalizeLang(value) {
    return String(
        value || ""
    )
        .toLowerCase()
        .startsWith("pt")
        ? "pt-BR"
        : "en-GB";
}

function clamp(
    value,
    min,
    max,
    fallback
) {
    const number =
        Number(value);

    return Number.isFinite(
        number
    )
        ? Math.min(
            max,
            Math.max(
                min,
                number
            )
        )
        : fallback;
}

function sendStatus(
    status,
    extra = {}
) {
    self.postMessage({
        type:
            "engine-status",

        status,

        device:
            RUNTIME.device,

        dtype:
            RUNTIME.dtype,

        ...extra
    });
}

/* ==========================================================================
   FETCH

   Mantemos o Hugging Face passando pelo domínio da Vanessa School.

   huggingface.co/...
   ↓
   vanessaschool.vercel.app/hf/...
   ========================================================================== */

function patchFetch() {
    if (
        fetchPatched
    ) {
        return;
    }

    fetchPatched =
        true;

    self.fetch =
        async (
            input,
            init
        ) => {
            let originalUrl =
                "";

            try {
                originalUrl =
                    typeof input ===
                        "string"
                        ? input
                        : input instanceof URL
                            ? input.href
                            : input?.url ||
                            "";

                const url =
                    new URL(
                        originalUrl,
                        self.location.origin
                    );

                /*
                 * Arquivos normais do Hugging Face.
                 */

                if (
                    url.hostname ===
                    "huggingface.co"
                ) {
                    const proxyUrl =
                        `${self.location.origin}/hf${url.pathname}${url.search}`;

                    sendStatus(
                        "download-request",
                        {
                            file:
                                url.pathname
                        }
                    );

                    if (
                        input instanceof Request
                    ) {
                        const proxiedRequest =
                            new Request(
                                proxyUrl,
                                input
                            );

                        return originalFetch(
                            proxiedRequest,
                            init
                        );
                    }

                    return originalFetch(
                        proxyUrl,
                        init
                    );
                }

                /*
                 * Demais URLs, incluindo CDN/Xet após redirects.
                 */

                return originalFetch(
                    input,
                    init
                );
            } catch (error) {
                sendStatus(
                    "download-error",
                    {
                        url:
                            originalUrl,

                        message:
                            error?.message ||
                            String(error)
                    }
                );

                throw error;
            }
        };
}

/* ==========================================================================
   KOKORO LIBRARY
   ========================================================================== */

async function loadLibrary() {
    if (
        KokoroTTS
    ) {
        return KokoroTTS;
    }

    patchFetch();

    sendStatus(
        "library-loading"
    );

    const module =
        await import(
            KOKORO_MODULE_URL
        );

    if (
        !module?.KokoroTTS
    ) {
        throw new Error(
            "KokoroTTS não foi encontrado no módulo kokoro-js."
        );
    }

    KokoroTTS =
        module.KokoroTTS;

    sendStatus(
        "library-ready"
    );

    return KokoroTTS;
}

/* ==========================================================================
   MODEL
   ========================================================================== */

async function loadModel() {
    const TTS =
        await loadLibrary();

    sendStatus(
        "model-loading",
        {
            model:
                MODEL_ID
        }
    );

    const instance =
        await TTS
            .from_pretrained(
                MODEL_ID,
                {
                    device:
                        RUNTIME.device,

                    dtype:
                        RUNTIME.dtype,

                    progress_callback:
                        progress => {
                            const status = {
                                file:
                                    progress?.file ||
                                    null,

                                progressStatus:
                                    progress?.status ||
                                    null
                            };

                            if (
                                Number.isFinite(
                                    progress?.progress
                                )
                            ) {
                                status.progress =
                                    progress.progress;
                            }

                            if (
                                Number.isFinite(
                                    progress?.loaded
                                )
                            ) {
                                status.loaded =
                                    progress.loaded;
                            }

                            if (
                                Number.isFinite(
                                    progress?.total
                                )
                            ) {
                                status.total =
                                    progress.total;
                            }

                            sendStatus(
                                "model-progress",
                                status
                            );
                        }
                }
            );

    sendStatus(
        "ready",
        {
            reason:
                "wasm-q8"
        }
    );

    return instance;
}

async function ensureTTS() {
    if (
        tts
    ) {
        return tts;
    }

    if (
        initPromise
    ) {
        return initPromise;
    }

    initPromise =
        loadModel()
            .then(
                instance => {
                    tts =
                        instance;

                    return tts;
                }
            )
            .catch(
                error => {
                    tts =
                        null;

                    initPromise =
                        null;

                    sendStatus(
                        "error",
                        {
                            message:
                                error?.message ||
                                String(error)
                        }
                    );

                    throw error;
                }
            );

    return initPromise;
}

/* ==========================================================================
   VOICE
   ========================================================================== */

function chooseVoice(
    lang,
    persona,
    requestedVoice
) {
    if (
        requestedVoice
    ) {
        return requestedVoice;
    }

    const normalizedLang =
        normalizeLang(
            lang
        );

    const profile =
        PROFILES[
        normalizedLang
        ] ||
        PROFILES[
        "en-GB"
        ];

    return (
        profile[
        persona
        ] ||
        profile.teacher
    );
}

/* ==========================================================================
   GENERATE
   ========================================================================== */

async function generate(
    message
) {
    const engine =
        await ensureTTS();

    const text =
        cleanText(
            message.text
        );

    if (
        !text
    ) {
        throw new Error(
            "Texto vazio para geração de áudio."
        );
    }

    const lang =
        normalizeLang(
            message.lang
        );

    const speed =
        clamp(
            message.speed,
            0.65,
            1.25,
            lang ===
                "pt-BR"
                ? 0.97
                : 0.90
        );

    const persona =
        cleanText(
            message.persona
        ) ||
        "teacher";

    const voice =
        chooseVoice(
            lang,
            persona,
            cleanText(
                message.voice
            )
        );

    sendStatus(
        "voice-loading",
        {
            voice,
            lang
        }
    );

    /*
     * A primeira chamada pode baixar o arquivo .bin da voz.
     */

    sendStatus(
        "generating",
        {
            id:
                message.id,

            voice,
            lang
        }
    );

    const audio =
        await engine
            .generate(
                text,
                {
                    voice,
                    speed
                }
            );

    if (
        !audio ||
        typeof audio.toBlob !==
        "function"
    ) {
        throw new Error(
            "O Kokoro não retornou um objeto de áudio válido."
        );
    }

    const blob =
        audio.toBlob();

    if (
        !blob ||
        blob.size ===
        0
    ) {
        throw new Error(
            "O Kokoro gerou um áudio vazio."
        );
    }

    return {
        blob,

        voice,

        lang,

        runtime: {
            device:
                RUNTIME.device,

            dtype:
                RUNTIME.dtype,

            reason:
                "wasm-q8"
        }
    };
}

/* ==========================================================================
   MESSAGES
   ========================================================================== */

self.addEventListener(
    "message",
    async event => {
        const message =
            event.data ||
            {};

        if (
            message.type ===
            "init"
        ) {
            try {
                await ensureTTS();

                self.postMessage({
                    type:
                        "init-complete",

                    runtime: {
                        device:
                            RUNTIME.device,

                        dtype:
                            RUNTIME.dtype,

                        reason:
                            "wasm-q8"
                    }
                });
            } catch (error) {
                self.postMessage({
                    type:
                        "init-error",

                    error:
                        error?.message ||
                        String(error)
                });
            }

            return;
        }

        if (
            message.type !==
            "generate"
        ) {
            return;
        }

        const id =
            message.id;

        try {
            self.postMessage({
                type:
                    "generation-start",

                id
            });

            const result =
                await generate(
                    message
                );

            self.postMessage({
                type:
                    "generation-complete",

                id,

                blob:
                    result.blob,

                voice:
                    result.voice,

                lang:
                    result.lang,

                runtime:
                    result.runtime
            });
        } catch (error) {
            self.postMessage({
                type:
                    "generation-error",

                id,

                error:
                    error?.message ||
                    String(error)
            });
        }
    }
);

/* ==========================================================================
   READY
   ========================================================================== */

sendStatus(
    "worker-ready",
    {
        model:
            MODEL_ID,

        runtime:
            "wasm-q8"
    }
);