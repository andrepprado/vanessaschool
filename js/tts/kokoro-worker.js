import { KokoroTTS } from "https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm";
import { env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.2/+esm";

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";

const RUNTIME = {
    device: "wasm",
    dtype: "q8"
};

const VOICES = {
    "en-GB": {
        teacher: "bf_emma",
        teacherMale: "bm_george"
    },
    "pt-BR": {
        teacher: "pf_dora",
        teacherMale: "pf_dora"
    }
};

let tts = null;
let initPromise = null;

function cleanText(value) {
    return String(value ?? "")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeLang(value) {
    return String(value || "")
        .toLowerCase()
        .startsWith("pt")
        ? "pt-BR"
        : "en-GB";
}

function clamp(value, min, max, fallback) {
    const number = Number(value);

    return Number.isFinite(number)
        ? Math.min(max, Math.max(min, number))
        : fallback;
}

function sendStatus(status, extra = {}) {
    self.postMessage({
        type: "engine-status",
        status,
        device: RUNTIME.device,
        dtype: RUNTIME.dtype,
        ...extra
    });
}

function configureEnvironment() {
    /*
     * PRODUÇÃO:
     *
     * Nenhum modelo é buscado fora do domínio Vanessa School.
     */

    env.allowLocalModels = true;
    env.allowRemoteModels = false;

    /*
     * MODEL_ID será adicionado automaticamente:
     *
     * /models/
     * +
     * onnx-community/Kokoro-82M-v1.0-ONNX
     */

    env.localModelPath = "/models/";

    /*
     * Cache do navegador permanece habilitado.
     */

    env.useBrowserCache = true;

    /*
     * ONNX Runtime WASM servido pelo próprio domínio.
     */

    if (
        env.backends &&
        env.backends.onnx &&
        env.backends.onnx.wasm
    ) {
        env.backends.onnx.wasm.wasmPaths = "/wasm/";
    }
}

async function loadModel() {
    configureEnvironment();

    sendStatus("model-loading", {
        model: MODEL_ID
    });

    const instance =
        await KokoroTTS.from_pretrained(
            MODEL_ID,
            {
                device: RUNTIME.device,
                dtype: RUNTIME.dtype,
                local_files_only: true
            }
        );

    sendStatus("ready", {
        model: MODEL_ID,
        source: "self-hosted",
        runtime: "wasm-q8"
    });

    return instance;
}

async function ensureTTS() {
    if (tts) {
        return tts;
    }

    if (initPromise) {
        return initPromise;
    }

    initPromise =
        loadModel()
            .then(instance => {
                tts = instance;

                return tts;
            })
            .catch(error => {
                tts = null;
                initPromise = null;

                sendStatus("error", {
                    message:
                        error?.message ||
                        String(error)
                });

                throw error;
            });

    return initPromise;
}

function chooseVoice(lang, persona) {
    const normalizedLang =
        normalizeLang(lang);

    const profile =
        VOICES[normalizedLang] ||
        VOICES["en-GB"];

    return (
        profile[persona] ||
        profile.teacher
    );
}

async function generate(message) {
    const engine =
        await ensureTTS();

    const text =
        cleanText(message.text);

    if (!text) {
        throw new Error(
            "Texto vazio para geração de áudio."
        );
    }

    const lang =
        normalizeLang(message.lang);

    const persona =
        cleanText(message.persona) ||
        "teacher";

    const voice =
        cleanText(message.voice) ||
        chooseVoice(
            lang,
            persona
        );

    const speed =
        clamp(
            message.speed,
            0.65,
            1.20,
            lang === "pt-BR"
                ? 0.97
                : 0.90
        );

    sendStatus("generating", {
        voice,
        lang
    });

    const audio =
        await engine.generate(
            text,
            {
                voice,
                speed
            }
        );

    if (
        !audio ||
        typeof audio.toBlob !== "function"
    ) {
        throw new Error(
            "O Kokoro não retornou um objeto de áudio válido."
        );
    }

    const blob =
        audio.toBlob();

    if (
        !blob ||
        blob.size === 0
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
            device: RUNTIME.device,
            dtype: RUNTIME.dtype,
            source: "self-hosted"
        }
    };
}

self.addEventListener(
    "message",
    async event => {
        const message =
            event.data ||
            {};

        if (
            message.type === "init"
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

                        source:
                            "self-hosted"
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

configureEnvironment();

sendStatus("worker-ready", {
    model: MODEL_ID,
    source: "self-hosted",
    runtime: "wasm-q8"
});