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

const suspicious = [
    "Ã¡",
    "Ã¢",
    "Ã£",
    "Ã©",
    "Ãª",
    "Ã­",
    "Ã³",
    "Ã´",
    "Ãµ",
    "Ãº",
    "Ã§",
    "ÃÁ",
    "Ã‰",
    "Ã“",
    "Ãš",
    "Ã‡",
    "Âº",
    "Âª",
    "Â°",
    "Â ",
    "â€“",
    "â€”",
    "â€˜",
    "â€™",
    "â€œ",
    "â€¦",
    "â€¢",
    "â†",
    "âœ",
    "ï»¿"
];

const problems = [];

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

        const extension =
            path.extname(
                entry.name
            ).toLowerCase();

        if (!extensions.has(extension)) {
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
                sequence =>
                    text.includes(
                        sequence
                    )
            );

        if (found.length) {
            problems.push({
                file:
                    path.relative(
                        process.cwd(),
                        file
                    ),
                found
            });
        }
    }
}

walk(process.cwd());

if (problems.length) {
    console.error("");
    console.error(
        "Remaining encoding problems:"
    );

    for (const problem of problems) {
        console.error(
            `${problem.file}: ${problem.found.join(", ")}`
        );
    }

    process.exit(1);
}

console.log(
    "Encoding validation OK - no common mojibake sequences found."
);
