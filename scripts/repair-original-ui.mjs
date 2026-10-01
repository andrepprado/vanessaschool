import fs from "node:fs";
import {
    execFileSync
} from "node:child_process";

const BASE_COMMIT =
    "bbd4466";

function gitFile(path) {
    return execFileSync(
        "git",
        [
            "show",
            `${BASE_COMMIT}:${path}`
        ],
        {
            encoding: "utf8",
            maxBuffer:
                20 * 1024 * 1024
        }
    );
}

function write(path, content) {
    fs.writeFileSync(
        path,
        content,
        {
            encoding: "utf8"
        }
    );
}

/* =========================================================
   DASHBOARD ORIGINAL
   ========================================================= */

let dashboard =
    gitFile(
        "dashboard.html"
    );

dashboard =
    dashboard.replace(
        /<link\s+rel="stylesheet"\s+href="css\/style\.css[^"]*">/i,
        '<link rel="stylesheet" href="css/style.css?v=20261001-ui-repair-1">'
    );

dashboard =
    dashboard.replace(
        /href="curso\.html"/g,
        'href="#dashboardPath"'
    );

dashboard =
    dashboard.replace(
        /href="revisar\.html"/g,
        'href="#dashboardPath"'
    );

dashboard =
    dashboard.replace(
        /href="conquistas\.html"/g,
        'href="#dashboardPath"'
    );

dashboard =
    dashboard.replace(
        /href="perfil\.html"/g,
        'href="#dashboardPath"'
    );

const dashboardScripts =
    `
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="js/supabase-client.js?v=20261001-ui-repair-1"></script>
    <script src="js/level-content.js?v=20261001-ui-repair-1"></script>
    <script src="js/student-dashboard.js?v=20261001-ui-repair-1"></script>
`;

dashboard =
    dashboard.replace(
        /<script\s+src="js\/storage\.js"><\/script>[\s\S]*?<script\s+src="js\/dashboard\.js"><\/script>/i,
        dashboardScripts.trim()
    );

write(
    "dashboard.html",
    dashboard
);

/* =========================================================
   ORIGINAL LESSON HTML
   ========================================================= */

let lesson =
    gitFile(
        "licao.html"
    );

lesson =
    lesson.replace(
        /<link\s+rel="stylesheet"\s+href="css\/style\.css[^"]*">/i,
        '<link rel="stylesheet" href="css/style.css?v=20261001-ui-repair-1">'
    );

const lessonScripts =
    `
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="js/supabase-client.js?v=20261001-ui-repair-1"></script>
    <script src="js/level-content.js?v=20261001-ui-repair-1"></script>
    <script src="js/speech.js?v=20260930-instant-1"></script>
    <script src="js/tts-preload.js?v=20260930-instant-1"></script>
    <script src="js/lesson-sounds.js"></script>
    <script src="js/student-lesson-runner.js?v=20261001-ui-repair-1"></script>
    <script src="js/student-lesson-bootstrap.js?v=20261001-ui-repair-1"></script>
`;

lesson =
    lesson.replace(
        /<script\s+src="js\/storage\.js"><\/script>[\s\S]*?<script\s+src="js\/licao\.js[^"]*"><\/script>/i,
        lessonScripts.trim()
    );

write(
    "student-lesson.html",
    lesson
);

/* =========================================================
   RESTORE ORIGINAL LESSON ENGINE + QUESTION AUDIO
   ========================================================= */

let lessonEngine =
    gitFile(
        "js/licao.js"
    );

const questionRowRegex =
    /(<div\s+class="eyt-question-row">\s*<h1\s+class="exercise-question">[\s\S]*?<\/h1>)\s*(<\/div>)/;

if (
    !questionRowRegex.test(
        lessonEngine
    )
) {
    throw new Error(
        "Could not locate original question row in js/licao.js."
    );
}

lessonEngine =
    lessonEngine.replace(
        questionRowRegex,
        `$1

                    \${speechButton(
                        exercise.question,
                        {
                            lang:
                                questionLanguage,
                            rate:
                                questionRate,
                            persona:
                                "teacher",
                            className:
                                "eyt-question-speech",
                            label:
                                "Ouvir pergunta"
                        }
                    )}

                $2`
    );

/*
 * Also restore question audio in the ordinary lesson page.
 */
write(
    "js/licao.js",
    lessonEngine
);

/*
 * Create callable version for authenticated student lesson.
 */
let runner =
    lessonEngine;

const opening =
    'document.addEventListener("DOMContentLoaded", () => {';

if (
    !runner.includes(opening)
) {
    throw new Error(
        "Unexpected original lesson engine wrapper."
    );
}

runner =
    runner.replace(
        opening,
        "window.EYTStudentLessonMain = () => {"
    );

const lastWrapper =
    runner.lastIndexOf(
        "});"
    );

if (lastWrapper < 0) {
    throw new Error(
        "Could not locate final lesson engine wrapper."
    );
}

runner =
    runner.slice(
        0,
        lastWrapper
    ) +
    "};" +
    runner.slice(
        lastWrapper + 3
    );

runner =
    runner.replace(
        /"curso\.html"/g,
        '"dashboard.html#dashboardPath"'
    );

runner =
    runner.replace(
        /'curso\.html'/g,
        "'dashboard.html#dashboardPath'"
    );

write(
    "js/student-lesson-runner.js",
    runner
);

/* =========================================================
   REMOVE TEMPORARY INLINE LEVEL CSS
   ========================================================= */

let css =
    fs.readFileSync(
        "css/style.css",
        "utf8"
    );

function removeMarkedSection(
    source,
    startMarker,
    endMarker
) {
    const start =
        source.indexOf(
            startMarker
        );

    if (start < 0) {
        return source;
    }

    const end =
        source.indexOf(
            endMarker,
            start
        );

    if (end < 0) {
        return source;
    }

    return (
        source.slice(
            0,
            start
        ) +
        source.slice(
            end +
            endMarker.length
        )
    );
}

css =
    removeMarkedSection(
        css,
        "/* === LEVEL EXERCISES START === */",
        "/* === LEVEL EXERCISES END === */"
    );

css =
    removeMarkedSection(
        css,
        "/* === ORIGINAL STUDENT DASHBOARD FIX START === */",
        "/* === ORIGINAL STUDENT DASHBOARD FIX END === */"
    );

const fixCss =
`
/* === ORIGINAL AUTHENTICATED EXPERIENCE START === */

body.app-body {
    min-height: 100vh;
    height: auto !important;
    overflow-x: hidden;
    overflow-y: auto;
}

body.app-body .app-layout {
    min-height: 100vh;
    height: auto !important;
}

body.app-body .app-main {
    min-height: 100vh;
    height: auto !important;
}

body.app-body .dashboard-page {
    min-height: 0 !important;
    height: auto !important;
}

body.app-body #dashboardPath {
    min-height: 0 !important;
    height: auto !important;
}

.student-level-dashboard-badge {
    width: fit-content;
    margin-top: 12px;
    padding: 6px 11px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--magenta-deep);
    background: var(--magenta-soft);
    border-radius: var(--radius-pill);
    font-family: "Space Mono", monospace;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: .05em;
    text-transform: uppercase;
}

/*
 * Speech CSS already contains the original 2-column
 * question layout and .eyt-question-speech button.
 */
.lesson-page .eyt-question-row {
    width: 100%;
}

.lesson-page button.eyt-question-speech {
    display: inline-flex;
}

/* === ORIGINAL AUTHENTICATED EXPERIENCE END === */
`;

css =
    css.trimEnd() +
    "\n\n" +
    fixCss.trim() +
    "\n";

write(
    "css/style.css",
    css
);

console.log(
    "Original dashboard and lesson structure restored."
);
console.log(
    "Question audio button restored."
);
