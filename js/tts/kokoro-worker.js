import {
    KokoroTTS
} from "https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm";



/*
 * Same-origin Hugging Face proxy.
 *
 * Keeps the Kokoro runtime exactly as before while avoiding
 * browser CORS restrictions. Model requests are transparently
 * routed through the Vercel CDN.
 */
const EYT_NATIVE_FETCH = self.fetch.bind(self);

self.fetch = function(input, init) {
    try {
        const rawUrl =
            typeof input === "string"
                ? input
                : input instanceof URL
                    ? input.href
                    : input?.url || "";

        if (
            rawUrl.startsWith(
                "https://huggingface.co/"
            )
        ) {
            const original =
                new URL(rawUrl);

            const proxied =
                new URL(
                    "/hf-kokoro" +
                    original.pathname +
                    original.search,
                    self.location.origin
                );

            if (
                typeof input === "string" ||
                input instanceof URL
            ) {
                return EYT_NATIVE_FETCH(
                    proxied.href,
                    init
                );
            }

            const request =
                new Request(
                    proxied.href,
                    input
                );

            return EYT_NATIVE_FETCH(
                request,
                init
            );
        }
    }
    catch (error) {
        console.warn(
            "[EYTKokoro] Proxy rewrite fallback:",
            error
        );
    }

    return EYT_NATIVE_FETCH(
        input,
        init
    );
};
const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";

const RUNTIME = {
    device: "wasm",
    dtype: "q8"
};

const VOICES = {
    "en-US": {
        teacher: "af_heart",
        teacherMale: "am_michael"
    },
    "en-GB": {
        teacher: "bf_emma",
        teacherMale: "bm_george"
    }
};

let ttsPromise = null;

function cleanText(value) {
    return String(value ?? "")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeLang(value) {
    const lang = String(value || "")
        .trim()
        .toLowerCase();

    if (lang.startsWith("en-gb")) {
        return "en-GB";
    }

    return "en-US";
}

function clamp(value, min, max, fallback) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return fallback;
    }

    return Math.min(
        max,
        Math.max(min, number)
    );
}

function postStatus(status, extra = {}) {
    self.postMessage({
        type: "engine-status",
        status,
        model: MODEL_ID,
        device: RUNTIME.device,
        dtype: RUNTIME.dtype,
        ...extra
    });
}

async function getTTS() {
    if (ttsPromise) {
        return ttsPromise;
    }

    postStatus("model-loading");

    ttsPromise = KokoroTTS.from_pretrained(
        MODEL_ID,
        {
            device: RUNTIME.device,
            dtype: RUNTIME.dtype,
            progress_callback: progress => {
                self.postMessage({
                    type: "model-progress",
                    progress
                });
            }
        }
    )
        .then(instance => {
            postStatus("ready");

            return instance;
        })
        .catch(error => {
            ttsPromise = null;

            postStatus(
                "error",
                {
                    error:
                        error?.message ||
                        String(error)
                }
            );

            throw error;
        });

    return ttsPromise;
}

function resolveVoice(lang, persona, requestedVoice) {
    const language = normalizeLang(lang);

    if (
        requestedVoice &&
        Object.values(VOICES)
            .some(group =>
                Object.values(group)
                    .includes(requestedVoice)
            )
    ) {
        return requestedVoice;
    }

    const group =
        VOICES[language] ||
        VOICES["en-US"];

    return (
        group[persona] ||
        group.teacher
    );
}

async function generate(message) {
    const text = cleanText(message.text);

    if (!text) {
        throw new Error(
            "Texto vazio para gera├º├úo de ├íudio."
        );
    }

    const originalLang =
        String(message.lang || "")
            .toLowerCase();

    if (!originalLang.startsWith("en")) {
        throw new Error(
            "O Kokoro deste projeto deve ser usado somente para ingl├¬s."
        );
    }

    const lang =
        normalizeLang(
            message.lang
        );

    const persona =
        cleanText(
            message.persona
        ) ||
        "teacher";

    const requestedVoice =
        cleanText(
            message.voice
        );

    const voice =
        resolveVoice(
            lang,
            persona,
            requestedVoice
        );

    const speed =
        clamp(
            message.speed,
            0.92,
            1.08,
            1.00
        );

    const engine =
        await getTTS();

    postStatus(
        "generating",
        {
            lang,
            voice,
            speed
        }
    );

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
            "O Kokoro n├úo retornou um ├íudio v├ílido."
        );
    }

    const blob =
        audio.toBlob();

    if (
        !(blob instanceof Blob) ||
        blob.size === 0
    ) {
        throw new Error(
            "O Kokoro retornou um ├íudio vazio."
        );
    }

    return {
        blob,
        lang,
        voice,
        speed
    };
}

self.addEventListener(
    "message",
    async event => {
        const message =
            event.data || {};

        if (message.type === "warmup") {
            try {
                await getTTS();

                self.postMessage({
                    type: "warmup-complete"
                });
            } catch (error) {
                self.postMessage({
                    type: "warmup-error",
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

        const id =
            message.id;

        try {
            const result =
                await generate(
                    message
                );

            self.postMessage({
                type: "generation-complete",
                id,
                blob: result.blob,
                lang: result.lang,
                voice: result.voice,
                speed: result.speed,
                runtime: {
                    engine: "kokoro",
                    model: MODEL_ID,
                    device: RUNTIME.device,
                    dtype: RUNTIME.dtype
                }
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

postStatus("worker-ready");