document.addEventListener(
    "DOMContentLoaded",
    () => {
        const root =
            document.getElementById(
                "demoUnits"
            );

        if (
            !window.EYTData ||
            !EYTData.course ||
            !Array.isArray(
                EYTData.course.units
            )
        ) {
            root.innerHTML =
                '<div class="student-empty-state">Conteúdo demonstrativo indisponível.</div>';
            return;
        }

        root.innerHTML =
            EYTData.course.units
                .map(
                    unit => `
                        <article class="demo-unit-card">
                            <div class="demo-unit-number">
                                ${unit.number}
                            </div>

                            <div>
                                <span class="eyebrow">
                                    UNIT ${unit.number}
                                </span>

                                <h3>
                                    ${escapeHtml(
                                        unit.title
                                    )}
                                </h3>

                                <p>
                                    ${escapeHtml(
                                        unit.description
                                    )}
                                </p>

                                <div class="demo-lesson-list">
                                    ${unit.lessons
                                        .map(
                                            lesson => `
                                                <span>
                                                    <i class="bi bi-check-circle"></i>
                                                    ${escapeHtml(
                                                        lesson.title
                                                    )}
                                                </span>
                                            `
                                        )
                                        .join("")}
                                </div>
                            </div>
                        </article>
                    `
                )
                .join("");
    }
);

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}