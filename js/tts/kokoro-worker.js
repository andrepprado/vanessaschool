import {
    KokoroTTS,
    env
} from "https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm";

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";

const RUNTIME = {
    device: "wasm",
    dtype: "q8"
};

const VOICES = {
    teacher: "bf_emma",
    teacherMale: "bm_george"
};

let tts = null;
let initPromise = null;

function cleanText(value) {
    return String(value ?? "")
        .replace(/\s+/g, " ")
        .trim();
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
    env.wasmPaths = "/models/kokoro/wasm/";
}

async function loadModel() {
    configureEnvironment();

    sendStatus("model-loading", {
        model: MODEL_ID
    });

    const instance = await KokoroTTS.from_pretrained(
        MODEL_ID,
        {
            device: RUNTIME.device,
            dtype: RUNTIME.dtype
        }
    );

    sendStatus("ready", {
        model: MODEL_ID,
        source: "huggingface",
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

    initPromise = loadModel()
        .then(instance => {
            tts = instance;
            return instance;
        })
        .catch(error => {
            tts = null;
            initPromise = null;

            sendStatus("error", {
                message: error?.message || String(error)
            });

            throw error;
        });

    return initPromise;
}

function chooseVoice(persona) {
    return VOICES[persona] || VOICES.teacher;
}

async function generate(message) {
    const text = cleanText(message.text);

    if (!text) {
        throw new Error(
            "Texto vazio para geração de áudio."
        );
    }

    const lang = String(
        message.lang || "en-GB"
    ).toLowerCase();

    if (!lang.startsWith("en")) {
        throw new Error(
            "Kokoro web configurado somente para inglês."
        );
    }

    const engine = await ensureTTS();

    const persona =
        cleanText(message.persona) ||
        "teacher";

    const voice =
        cleanText(message.voice) ||
        chooseVoice(persona);

    const speed = clamp(
        message.speed,
        0.65,
        1.20,
        0.90
    );

    sendStatus("generating", {
        voice,
        lang: "en-GB"
    });

    const audio = await engine.generate(
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
            "O Kokoro não retornou um áudio válido."
        );
    }

    const blob = audio.toBlob();

    if (!blob || blob.size === 0) {
        throw new Error(
            "O Kokoro gerou um áudio vazio."
        );
    }

    return {
        blob,
        voice,
        lang: "en-GB",
        runtime: {
            device: RUNTIME.device,
            dtype: RUNTIME.dtype,
            source: "huggingface"
        }
    };
}

self.addEventListener(
    "message",
    async event => {
        const message = event.data || {};

        if (message.type === "init") {
            try {
                await ensureTTS();

                self.postMessage({
                    type: "init-complete",
                    runtime: {
                        device: RUNTIME.device,
                        dtype: RUNTIME.dtype,
                        source: "huggingface"
                    }
                });
            } catch (error) {
                self.postMessage({
                    type: "init-error",
                    error:
                        error?.message ||
                        String(error)
                });
            }

            return;
        }

        if (message.type !== "generate") {
            return;
        }

        const id = message.id;

        try {
            const result = await generate(
                message
            );

            self.postMessage({
                type: "generation-complete",
                id,
                blob: result.blob,
                voice: result.voice,
                lang: result.lang,
                runtime: result.runtime
            });
        } catch (error) {
            self.postMessage({
                type: "generation-error",
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
    source: "huggingface",
    runtime: "wasm-q8"
});