import fs from "node:fs";
import path from "node:path";

const extensions = new Set([
    ".html",
    ".js",
    ".css",
    ".json"
]);

const ignoredDirectories = new Set([
    ".git",
    ".vercel",
    "node_modules",
    ".agents",
    "audio",
    "img",
    "models"
]);

/*
 * Explicit mojibake replacements.
 * These cover Windows-1252 / UTF-8 double-decoding artifacts
 * without touching correctly encoded Portuguese text.
 */
const replacements = new Map([
    ["á", "á"],
    ["Ã ", "à"],
    ["â", "â"],
    ["ã", "ã"],
    ["ä", "ä"],
    ["ÃÁ", "Á"],
    ["À", "À"],
    ["Â", "Â"],
    ["Ã", "Ã"],
    ["Ä", "Ä"],

    ["é", "é"],
    ["è", "è"],
    ["ê", "ê"],
    ["ë", "ë"],
    ["É", "É"],
    ["È", "È"],
    ["Ê", "Ê"],
    ["Ë", "Ë"],

    ["í", "í"],
    ["ì", "ì"],
    ["î", "î"],
    ["ï", "ï"],
    ["ÃÍ", "Í"],
    ["Ì", "Ì"],
    ["Î", "Î"],
    ["ÃÏ", "Ï"],

    ["ó", "ó"],
    ["ò", "ò"],
    ["ô", "ô"],
    ["õ", "õ"],
    ["ö", "ö"],
    ["Ó", "Ó"],
    ["Ò", "Ò"],
    ["Ô", "Ô"],
    ["Õ", "Õ"],
    ["Ö", "Ö"],

    ["ú", "ú"],
    ["ù", "ù"],
    ["û", "û"],
    ["ü", "ü"],
    ["Ú", "Ú"],
    ["Ù", "Ù"],
    ["Û", "Û"],
    ["Ü", "Ü"],

    ["ç", "ç"],
    ["Ç", "Ç"],
    ["ñ", "ñ"],
    ["Ñ", "Ñ"],

    ["º", "º"],
    ["ª", "ª"],
    ["°", "°"],
    ["·", "·"],
    ["Â ", " "],
    ["Â", ""],

    ["–", "–"],
    ["—", "—"],
    ["‘", "‘"],
    ["’", "’"],
    ["“", "“"],
    ["â€\u009d", "”"],
    ["…", "…"],
    ["•", "•"],
    ["â†’", "→"],
    ["â†", "←"],
    ["âœ“", "✓"],
    ["âœ”", "✔"],
    ["âœ•", "✕"],

    ["ï»¿", ""]
]);

function repair(text) {
    let output = text;

    for (let pass = 0; pass < 4; pass++) {
        const before = output;

        for (const [wrong, right] of replacements) {
            output = output.split(wrong).join(right);
        }

        if (output === before) {
            break;
        }
    }

    return output;
}

function ensureHtmlCharset(text) {
    if (/<meta\s+charset=/i.test(text)) {
        return text.replace(
            /<meta\s+charset=["'][^"']+["']\s*\/?>/i,
            '<meta charset="UTF-8">'
        );
    }

    return text.replace(
        /<head([^>]*)>/i,
        '<head$1>\n<meta charset="UTF-8">'
    );
}

let checked = 0;
let changed = 0;

function walk(directory) {
    for (
        const entry of fs.readdirSync(
            directory,
            {
                withFileTypes: true
            }
        )
    ) {
        if (entry.isDirectory()) {
            if (
                ignoredDirectories.has(
                    entry.name
                )
            ) {
                continue;
            }

            walk(
                path.join(
                    directory,
                    entry.name
                )
            );

            continue;
        }

        const file =
            path.join(
                directory,
                entry.name
            );

        const extension =
            path.extname(
                entry.name
            ).toLowerCase();

        if (!extensions.has(extension)) {
            continue;
        }

        checked++;

        const original =
            fs.readFileSync(
                file,
                "utf8"
            );

        let repaired =
            repair(original);

        if (extension === ".html") {
            repaired =
                ensureHtmlCharset(
                    repaired
                );
        }

        if (repaired !== original) {
            fs.writeFileSync(
                file,
                repaired,
                "utf8"
            );

            changed++;

            console.log(
                `Fixed: ${path.relative(process.cwd(), file)}`
            );
        }
    }
}

walk(process.cwd());

console.log("");
console.log(
    `UTF-8 repair: ${checked} files checked, ${changed} changed.`
);
