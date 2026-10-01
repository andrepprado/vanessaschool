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
        "Ã¡",
        "Ã©",
        "Ã­",
        "Ã³",
        "Ãº",
        "Ã£",
        "Ãµ",
        "Ã§",
        "Ãª",
        "Ã´",
        "Ã‰",
        "Ã“",
        "Ãš",
        "Ã‡",
        "Â ",
        "â€“",
        "â€”",
        "â€œ",
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
