const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";
const KOKORO_MODULE_URL = "https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm";

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
let runtime = null;

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

    return Number.isFinite(number)
        ? Math.min(
            max,
            Math.max(
                min,
                number
            )
        )
        : fallback;
}

function isMobileDevice() {
    const userAgent =
        String(
            self.navigator?.userAgent ||
            ""
        );

    return /Android|iPhone|iPad|iPod|Mobile/i
        .test(
            userAgent
        );
}

function postStatus(
    status,
    extra = {}
) {
    self.postMessage({
        type:
            "engine-status",

        status,

        ...extra
    });
}

/* ==========================================================================
   FETCH PROXY

   Todo acesso ao Hugging Face é redirecionado para /hf/ no domínio
   da própria Vanessa School.

   Browser:
   /hf/onnx-community/...

   Vercel:
   https://huggingface.co/onnx-community/...
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
            let urlString =
                "";

            try {
                urlString =
                    typeof input ===
                        "string"
                        ? input
                        : input instanceof URL
                            ? input.href
                            : input?.url ||
                            "";

                const url =
                    new URL(
                        urlString,
                        self.location.origin
                    );

                if (
                    url.hostname ===
                    "huggingface.co"
                ) {
                    const proxyUrl =
                        `${self.location.origin}/hf${url.pathname}${url.search}`;

                    if (
                        input instanceof
                        Request
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

                return originalFetch(
                    input,
                    init
                );
            } catch (error) {
                postStatus(
                    "fetch-error",
                    {
                        url:
                            urlString,

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
   BIBLIOTECA
   ========================================================================== */

async function loadKokoroModule() {
    if (
        KokoroTTS
    ) {
        return KokoroTTS;
    }

    patchFetch();

    postStatus(
        "library-loading",
        {
            url:
                KOKORO_MODULE_URL
        }
    );

    const module =
        await import(
            KOKORO_MODULE_URL
        );

    KokoroTTS =
        module.KokoroTTS;

    if (
        !KokoroTTS
    ) {
        throw new Error(
            "KokoroTTS não foi exportado pelo módulo kokoro-js."
        );
    }

    postStatus(
        "library-ready"
    );

    return KokoroTTS;
}

/* ==========================================================================
   WEBGPU
   ========================================================================== */

async function hasWebGPU() {
    try {
        if (
            !self.navigator?.gpu
        ) {
            return false;
        }

        /*
         * Não usamos powerPreference.
         *
         * O Chromium atualmente ignora essa opção
         * no Windows e gera apenas um warning.
         */

        const adapter =
            await self
                .navigator
                .gpu
                .requestAdapter();

        return Boolean(
            adapter
        );
    } catch (_) {
        return false;
    }
}

/* ==========================================================================
   RUNTIME

   Mobile:
   WASM + Q4

   Desktop com GPU:
   WebGPU + FP32

   Desktop sem GPU:
   WASM + Q4
   ========================================================================== */

async function selectRuntime() {
    const mobile =
        isMobileDevice();

    if (
        mobile
    ) {
        return {
            device:
                "wasm",

            dtype:
                "q4",

            reason:
                "mobile"
        };
    }

    const gpu =
        await hasWebGPU();

    if (
        gpu
    ) {
        return {
            device:
                "webgpu",

            dtype:
                "fp32",

            reason:
                "webgpu"
        };
    }

    return {
        device:
            "wasm",

        dtype:
            "q4",

        reason:
            "fallback"
    };
}

/* ==========================================================================
   MODELO
   ========================================================================== */

async function loadModel(
    device,
    dtype,
    reason
) {
    const TTS =
        await loadKokoroModule();

    postStatus(
        "model-loading",
        {
            device,
            dtype,
            reason,
            model:
                MODEL_ID
        }
    );

    const instance =
        await TTS
            .from_pretrained(
                MODEL_ID,
                {
                    device,
                    dtype,

                    progress_callback:
                        progress => {
                            const payload = {
                                device,
                                dtype
                            };

                            if (
                                progress &&
                                typeof progress ===
                                "object"
                            ) {
                                if (
                                    progress.status !=
                                    null
                                ) {
                                    payload.progressStatus =
                                        progress.status;
                                }

                                if (
                                    progress.file !=
                                    null
                                ) {
                                    payload.file =
                                        progress.file;
                                }

                                if (
                                    Number.isFinite(
                                        progress.progress
                                    )
                                ) {
                                    payload.progress =
                                        progress.progress;
                                }

                                if (
                                    Number.isFinite(
                                        progress.loaded
                                    )
                                ) {
                                    payload.loaded =
                                        progress.loaded;
                                }

                                if (
                                    Number.isFinite(
                                        progress.total
                                    )
                                ) {
                                    payload.total =
                                        progress.total;
                                }
                            }

                            postStatus(
                                "model-progress",
                                payload
                            );
                        }
                }
            );

    runtime = {
        device,
        dtype,
        reason
    };

    postStatus(
        "ready",
        runtime
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
        (
            async () => {
                const preferred =
                    await selectRuntime();

                try {
                    tts =
                        await loadModel(
                            preferred.device,
                            preferred.dtype,
                            preferred.reason
                        );

                    return tts;
                } catch (error) {
                    /*
                     * WebGPU falhou?
                     *
                     * Faz nova tentativa completa com
                     * WASM Q4.
                     */

                    if (
                        preferred.device ===
                        "webgpu"
                    ) {
                        postStatus(
                            "fallback",
                            {
                                from:
                                    "webgpu",

                                to:
                                    "wasm",

                                message:
                                    error?.message ||
                                    String(error)
                            }
                        );

                        tts =
                            await loadModel(
                                "wasm",
                                "q4",
                                "webgpu-failed"
                            );

                        return tts;
                    }

                    throw error;
                }
            }
        )()
            .catch(
                error => {
                    tts =
                        null;

                    runtime =
                        null;

                    initPromise =
                        null;

                    postStatus(
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
   VOZ
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

    const language =
        normalizeLang(
            lang
        );

    const profile =
        PROFILES[
        language
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

    postStatus(
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

    const blob =
        audio.toBlob();

    if (
        !(blob instanceof Blob) ||
        blob.size ===
        0
    ) {
        throw new Error(
            "O Kokoro retornou um áudio vazio."
        );
    }

    return {
        blob,
        voice,
        lang,

        runtime:
            runtime
                ? {
                    ...runtime
                }
                : null
    };
}

/* ==========================================================================
   MENSAGENS
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

                    runtime
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