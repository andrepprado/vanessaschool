import fs from "node:fs";
import path from "node:path";

const extensions =
    new Set([
        ".html",
        ".js",
        ".css"
    ]);

const ignored =
    new Set([
        ".git",
        ".vercel",
        "node_modules",
        ".agents",
        "audio",
        "img",
        "models"
    ]);

const suspicious =
    [
        "á",
        "é",
        "í",
        "ó",
        "ú",
        "ã",
        "õ",
        "ç",
        "ê",
        "ô",
        "É",
        "Ó",
        "Ú",
        "Ç",
        "Â ",
        "–",
        "—",
        "“",
        "â€",
        "ï»¿"
    ];

const problems =
    [];

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
                ignored.has(
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

        const file =
            path.join(
                directory,
                entry.name
            );

        const text =
            fs.readFileSync(
                file,
                "utf8"
            );

        const found =
            suspicious.filter(
                item =>
                    text.includes(
                        item
                    )
            );

        if (
            found.length
        ) {
            problems.push({
                file,
                found
            });
        }
    }
}

walk(
    process.cwd()
);

if (
    problems.length
) {
    console.error(
        "Broken UTF-8 sequences remain:"
    );

    for (
        const problem of
        problems
    ) {
        console.error(
            `${problem.file}: ${problem.found.join(", ")}`
        );
    }

    process.exit(1);
}

console.log(
    "No common mojibake sequences found."
);
