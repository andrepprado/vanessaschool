import { KokoroTTS } from "https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm";

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";

const PROFILES = {
    "en-GB": {
        female: "bf_emma",
        male: "bm_george",
        teacher: "bf_emma",
        teacherMale: "bm_george",
        characterFemale: "bf_isabella",
        characterMale: "bm_fable"
    },

    "pt-BR": {
        female: "pf_dora",
        male: "pm_alex",
        teacher: "pf_dora",
        teacherMale: "pm_alex",
        characterFemale: "pf_dora",
        characterMale: "pm_santa"
    }
};

let tts = null;

let initPromise = null;

let runtime = null;

function cleanText(value) {
    return String(
        value ??
        ""
    )
        .replace(
            /\s+/g,
            " "
        )
        .trim();
}

function normalizeLang(value) {
    return String(
        value ||
        ""
    )
        .toLowerCase()
        .startsWith(
            "pt"
        )
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
        Number(
            value
        );

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

async function hasWebGPU() {
    try {
        if (
            !self.navigator
                ?.gpu
        ) {
            return false;
        }

        const adapter =
            await self
                .navigator
                .gpu
                .requestAdapter({
                    powerPreference:
                        "high-performance"
                });

        return Boolean(
            adapter
        );
    } catch (_) {
        return false;
    }
}

async function loadModel(
    device,
    dtype
) {
    self.postMessage({
        type:
            "engine-status",

        status:
            "loading",

        device,

        dtype
    });

    const instance =
        await KokoroTTS
            .from_pretrained(
                MODEL_ID,
                {
                    device,
                    dtype
                }
            );

    runtime = {
        device,
        dtype
    };

    self.postMessage({
        type:
            "engine-status",

        status:
            "ready",

        device,

        dtype
    });

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
                const gpuAvailable =
                    await hasWebGPU();

                if (
                    gpuAvailable
                ) {
                    try {
                        tts =
                            await loadModel(
                                "webgpu",
                                "fp32"
                            );

                        return tts;
                    } catch (
                    error
                    ) {
                        self.postMessage({
                            type:
                                "engine-status",

                            status:
                                "fallback",

                            from:
                                "webgpu",

                            to:
                                "wasm",

                            message:
                                error
                                    ?.message ||
                                String(
                                    error
                                )
                        });
                    }
                }

                tts =
                    await loadModel(
                        "wasm",
                        "q8"
                    );

                return tts;
            }
        )()
            .catch(
                error => {
                    initPromise =
                        null;

                    tts =
                        null;

                    runtime =
                        null;

                    throw error;
                }
            );

    return initPromise;
}

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
        profile
            .teacher
    );
}

async function generate(
    message
) {
    const engine =
        await ensureTTS();

    const text =
        cleanText(
            message.text
        );

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

    if (
        !text
    ) {
        throw new Error(
            "Texto vazio para geração de áudio."
        );
    }

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
            } catch (
            error
            ) {
                self.postMessage({
                    type:
                        "init-error",

                    error:
                        error
                            ?.message ||
                        String(
                            error
                        )
                });
            }

            return;
        }

        if (
            message.type ===
            "generate"
        ) {
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
            } catch (
            error
            ) {
                self.postMessage({
                    type:
                        "generation-error",

                    id,

                    error:
                        error
                            ?.message ||
                        String(
                            error
                        )
                });
            }
        }
    }
);