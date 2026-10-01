import fs from "node:fs";
import path from "node:path";

const root =
    process.cwd();

const extensions =
    new Set([
        ".html",
        ".js",
        ".css",
        ".json"
    ]);

const ignoredDirectories =
    new Set([
        ".git",
        ".vercel",
        "node_modules",
        ".agents",
        "audio",
        "img",
        "models"
    ]);

const characters = [
    "á",
    "à",
    "â",
    "ã",
    "ä",
    "Á",
    "À",
    "Â",
    "Ã",
    "Ä",
    "é",
    "è",
    "ê",
    "ë",
    "É",
    "È",
    "Ê",
    "Ë",
    "í",
    "ì",
    "î",
    "ï",
    "Í",
    "Ì",
    "Î",
    "Ï",
    "ó",
    "ò",
    "ô",
    "õ",
    "ö",
    "Ó",
    "Ò",
    "Ô",
    "Õ",
    "Ö",
    "ú",
    "ù",
    "û",
    "ü",
    "Ú",
    "Ù",
    "Û",
    "Ü",
    "ç",
    "Ç",
    "ñ",
    "Ñ",
    "º",
    "ª",
    "°",
    "–",
    "—",
    "“",
    "”",
    "‘",
    "’",
    "…"
];

const replacements =
    [];

for (
    const character of
    characters
) {
    const badOnce =
        Buffer
            .from(
                character,
                "utf8"
            )
            .toString(
                "latin1"
            );

    const badTwice =
        Buffer
            .from(
                badOnce,
                "utf8"
            )
            .toString(
                "latin1"
            );

    replacements.push(
        [
            badTwice,
            character
        ]
    );

    replacements.push(
        [
            badOnce,
            character
        ]
    );
}

/*
 * Frequent UTF-8/Windows artifacts.
 */
replacements.push(
    [
        "Â ",
        " "
    ],
    [
        "Â ",
        " "
    ],
    [
        "ï»¿",
        ""
    ]
);

function repairText(
    text
) {
    let repaired =
        text;

    /*
     * Multiple passes also handle double encoding.
     */
    for (
        let pass = 0;
        pass < 3;
        pass++
    ) {
        let changed =
            false;

        for (
            const [
                wrong,
                right
            ] of replacements
        ) {
            if (
                wrong &&
                repaired.includes(
                    wrong
                )
            ) {
                repaired =
                    repaired
                        .split(
                            wrong
                        )
                        .join(
                            right
                        );

                changed =
                    true;
            }
        }

        if (!changed) {
            break;
        }
    }

    return repaired;
}

function ensureCharset(
    html
) {
    if (
        /<meta\s+charset=/i
            .test(
                html
            )
    ) {
        return html.replace(
            /<meta\s+charset=["'][^"']+["']\s*\/?>/i,
            '<meta charset="UTF-8">'
        );
    }

    return html.replace(
        /<head([^>]*)>/i,
        '<head$1>\n<meta charset="UTF-8">'
    );
}

let scanned = 0;
let changed = 0;

function walk(
    directory
) {
    for (
        const entry of
        fs.readdirSync(
            directory,
            {
                withFileTypes:
                    true
            }
        )
    ) {
        if (
            entry.isDirectory()
        ) {
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

        const filePath =
            path.join(
                directory,
                entry.name
            );

        const extension =
            path.extname(
                entry.name
            ).toLowerCase();

        if (
            !extensions.has(
                extension
            )
        ) {
            continue;
        }

        scanned++;

        const original =
            fs.readFileSync(
                filePath,
                "utf8"
            );

        let repaired =
            repairText(
                original
            );

        if (
            extension ===
            ".html"
        ) {
            repaired =
                ensureCharset(
                    repaired
                );
        }

        if (
            repaired !==
            original
        ) {
            fs.writeFileSync(
                filePath,
                repaired,
                "utf8"
            );

            changed++;

            console.log(
                `UTF-8 fixed: ${
                    path.relative(
                        root,
                        filePath
                    )
                }`
            );
        }
    }
}

walk(
    root
);

console.log("");
console.log(
    `UTF-8 scan complete: ${scanned} files checked, ${changed} repaired.`
);
