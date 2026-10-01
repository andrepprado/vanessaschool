import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const files = [
    "js/data.js",
    "js/level-content.js"
];

const phrases = new Set();

const excludedKeys = new Set([
    "id",
    "type",
    "icon",
    "className",
    "persona",
    "lang",
    "language",
    "audio",
    "audioFile",
    "correctIndex",
    "xp",
    "number",
    "unit"
]);

function normalize(value) {
    return String(value ?? "")
        .replace(/\u00a0/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function looksSpeakable(value) {
    const text = normalize(value);

    if (!text) {
        return false;
    }

    if (text.length < 1 || text.length > 500) {
        return false;
    }

    if (/^(multiple|translation|fill|order|choice)$/i.test(text)) {
        return false;
    }

    if (/^(bi-|unit-|lesson-|a1-|a2-|b1-|b2-|c1-)/i.test(text)) {
        return false;
    }

    if (/^[a-z0-9_-]+$/i.test(text) && text.includes("-")) {
        return false;
    }

    if (!/[A-Za-z]/.test(text)) {
        return false;
    }

    return true;
}

function collectAllStrings(value, key = "") {
    if (typeof value === "string") {
        if (
            !excludedKeys.has(key) &&
            looksSpeakable(value)
        ) {
            phrases.add(
                normalize(value)
            );
        }

        return;
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            collectAllStrings(
                item,
                key
            );
        }

        return;
    }

    if (
        value &&
        typeof value === "object"
    ) {
        for (const [
            childKey,
            childValue
        ] of Object.entries(value)) {
            collectAllStrings(
                childValue,
                childKey
            );
        }
    }
}

function collectExercises(value) {
    if (!value) {
        return;
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            collectExercises(item);
        }

        return;
    }

    if (typeof value !== "object") {
        return;
    }

    for (const [
        key,
        child
    ] of Object.entries(value)) {
        if (
            key === "exercises" &&
            Array.isArray(child)
        ) {
            for (const exercise of child) {
                collectAllStrings(
                    exercise
                );
            }
        }

        collectExercises(child);
    }
}

function loadProjectFile(file) {
    const source =
        fs.readFileSync(
            file,
            "utf8"
        );

    const context = {
        window: {},
        globalThis: {},
        console
    };

    context.globalThis =
        context;

    vm.createContext(
        context
    );

    const capture = `

;globalThis.__EYT_CAPTURE__ = {
    data:
        typeof EYTData !== "undefined"
            ? EYTData
            : (
                typeof window !== "undefined"
                    ? window.EYTData
                    : null
            ),

    levelContent:
        typeof EYTLevelContent !== "undefined"
            ? EYTLevelContent
            : (
                typeof window !== "undefined"
                    ? window.EYTLevelContent
                    : null
            )
};
`;

    try {
        vm.runInContext(
            source + capture,
            context,
            {
                filename: file
            }
        );

        const captured =
            context.__EYT_CAPTURE__ ||
            {};

        collectExercises(
            captured.data
        );

        collectExercises(
            captured.levelContent
        );
    }
    catch (error) {
        console.warn(
            `VM parse warning for ${file}:`,
            error.message
        );

        /*
         * Fallback for plain JS data files.
         */
        const regex =
            /(?:question|answer|text|sentence|prompt)\s*:\s*["'`]([^"'`]{1,500})["'`]/g;

        let match;

        while (
            (
                match =
                    regex.exec(source)
            )
        ) {
            if (
                looksSpeakable(
                    match[1]
                )
            ) {
                phrases.add(
                    normalize(
                        match[1]
                    )
                );
            }
        }
    }
}

for (const file of files) {
    if (
        fs.existsSync(file)
    ) {
        loadProjectFile(file);
    }
}

const output =
    Array.from(phrases)
        .sort(
            (
                a,
                b
            ) =>
                a.localeCompare(b)
        );

if (!output.length) {
    throw new Error(
        "No lesson audio phrases were found."
    );
}

fs.mkdirSync(
    "audio/static",
    {
        recursive: true
    }
);

fs.writeFileSync(
    "audio/static/phrases.json",
    JSON.stringify(
        output,
        null,
        2
    ),
    "utf8"
);

console.log(
    `Found ${output.length} unique lesson audio phrases.`
);
