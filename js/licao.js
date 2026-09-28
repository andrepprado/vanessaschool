let currentLesson = null;
let currentExerciseIndex = 0;
let lessonXP = 0;
let correctAnswers = 0;
let selectedAnswer = null;
let answerChecked = false;
let orderedWords = [];

document.addEventListener("DOMContentLoaded", () => {
    const usuario = EYTApp.requireUser();

    if (!usuario) {
        return;
    }

    const params =
        new URLSearchParams(window.location.search);

    const lessonId = params.get("id");

    currentLesson =
        EYTData.licoes[lessonId];

    if (!currentLesson) {
        window.location.href = "curso.html";
        return;
    }

    if (!EYTApp.isLessonUnlocked(lessonId)) {
        window.location.href = "curso.html";
        return;
    }

    document.title =
        `${currentLesson.titulo} | English in Your Time`;

    showIntro();

    document
        .getElementById("startLessonButton")
        .addEventListener("click", startLesson);

    document
        .getElementById("checkAnswerButton")
        .addEventListener("click", checkOrContinue);

    document
        .getElementById("closeLesson")
        .addEventListener("click", () => {
            const sair = confirm(
                "Deseja sair da lição? Seu progresso atual será salvo."
            );

            if (sair) {
                saveCurrentProgress();
                window.location.href = "curso.html";
            }
        });
});

function showIntro() {
    document
        .getElementById("lessonIntro")
        .classList.remove("hidden");

    document.getElementById("introTitle").textContent =
        currentLesson.titulo;

    document.getElementById(
        "introDescription"
    ).textContent =
        currentLesson.descricao;

    document.getElementById(
        "introExercises"
    ).textContent =
        currentLesson.exercicios.length;

    document.getElementById("introXp").textContent =
        currentLesson.xp;
}

function startLesson() {
    document
        .getElementById("lessonIntro")
        .classList.add("hidden");

    document
        .getElementById("exerciseArea")
        .classList.remove("hidden");

    document
        .getElementById("answerFooter")
        .classList.remove("hidden");

    renderExercise();
}

function renderExercise() {
    selectedAnswer = null;
    answerChecked = false;
    orderedWords = [];

    const exercise =
        currentLesson.exercicios[currentExerciseIndex];

    updateProgress();

    const typeNames = {
        multipla_escolha: "MULTIPLE CHOICE",
        traducao: "TRANSLATE",
        completar: "COMPLETE",
        ordenar: "PUT IN ORDER"
    };

    document.getElementById(
        "exerciseType"
    ).textContent =
        typeNames[exercise.tipo] || "EXERCISE";

    document.getElementById(
        "exerciseQuestion"
    ).textContent =
        exercise.pergunta;

    document.getElementById(
        "exerciseInstruction"
    ).textContent =
        exercise.instrucao || "";

    document.getElementById(
        "answerFeedback"
    ).innerHTML = "";

    const button =
        document.getElementById("checkAnswerButton");

    button.textContent = "VERIFICAR";
    button.disabled = true;
    button.className = "btn btn-primary";

    const content =
        document.getElementById("exerciseContent");

    content.innerHTML = "";

    if (exercise.tipo === "multipla_escolha") {
        renderMultipleChoice(exercise, content);
        return;
    }

    if (
        exercise.tipo === "traducao" ||
        exercise.tipo === "completar"
    ) {
        renderTextInput(exercise, content);
        return;
    }

    if (exercise.tipo === "ordenar") {
        renderOrdering(exercise, content);
    }
}

function renderMultipleChoice(exercise, container) {
    const wrapper = document.createElement("div");
    wrapper.className = "options-grid";

    exercise.alternativas.forEach((option, index) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "option-card";

        button.innerHTML = `
            <span class="option-letter">
                ${String.fromCharCode(65 + index)}
            </span>

            <span>${EYTApp.escapeHTML(option)}</span>
        `;

        button.addEventListener("click", () => {
            if (answerChecked) {
                return;
            }

            document
                .querySelectorAll(".option-card")
                .forEach(item =>
                    item.classList.remove("selected")
                );

            button.classList.add("selected");

            selectedAnswer = option;

            document.getElementById(
                "checkAnswerButton"
            ).disabled = false;
        });

        wrapper.appendChild(button);
    });

    container.appendChild(wrapper);
}

function renderTextInput(exercise, container) {
    const wrapper = document.createElement("div");
    wrapper.className = "text-answer-wrapper";

    if (exercise.instrucao) {
        const prompt = document.createElement("div");
        prompt.className = "translation-prompt";
        prompt.textContent = exercise.instrucao;
        wrapper.appendChild(prompt);
    }

    const input = document.createElement("input");

    input.type = "text";
    input.className = "text-answer";
    input.id = "textAnswer";
    input.placeholder = "Digite sua resposta...";
    input.autocomplete = "off";

    input.addEventListener("input", () => {
        selectedAnswer = input.value;

        document.getElementById(
            "checkAnswerButton"
        ).disabled =
            !input.value.trim();
    });

    input.addEventListener("keydown", event => {
        if (
            event.key === "Enter" &&
            input.value.trim()
        ) {
            checkOrContinue();
        }
    });

    wrapper.appendChild(input);
    container.appendChild(wrapper);

    setTimeout(() => input.focus(), 100);
}

function renderOrdering(exercise, container) {
    const wrapper = document.createElement("div");
    wrapper.className = "ordering-wrapper";

    const answerArea = document.createElement("div");
    answerArea.className = "ordered-answer";
    answerArea.id = "orderedAnswer";

    const wordsArea = document.createElement("div");
    wordsArea.className = "word-bank";
    wordsArea.id = "wordBank";

    const shuffled = [...exercise.palavras]
        .sort(() => Math.random() - 0.5);

    shuffled.forEach((word, index) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "word-chip";
        button.textContent = word;
        button.dataset.word = word;
        button.dataset.id = String(index);

        button.addEventListener("click", () => {
            if (answerChecked) {
                return;
            }

            if (button.classList.contains("used")) {
                return;
            }

            button.classList.add("used");

            orderedWords.push({
                word,
                sourceId: button.dataset.id
            });

            updateOrderedAnswer();
        });

        wordsArea.appendChild(button);
    });

    wrapper.appendChild(answerArea);
    wrapper.appendChild(wordsArea);

    container.appendChild(wrapper);
}

function updateOrderedAnswer() {
    const answerArea =
        document.getElementById("orderedAnswer");

    answerArea.innerHTML = "";

    orderedWords.forEach((item, index) => {
        const chip = document.createElement("button");

        chip.type = "button";
        chip.className = "word-chip selected-word";
        chip.textContent = item.word;

        chip.addEventListener("click", () => {
            if (answerChecked) {
                return;
            }

            const source =
                document.querySelector(
                    `.word-chip[data-id="${item.sourceId}"]`
                );

            if (source) {
                source.classList.remove("used");
            }

            orderedWords.splice(index, 1);

            updateOrderedAnswer();
        });

        answerArea.appendChild(chip);
    });

    selectedAnswer =
        orderedWords.map(item => item.word).join(" ");

    document.getElementById(
        "checkAnswerButton"
    ).disabled =
        orderedWords.length === 0;
}

function checkOrContinue() {
    if (answerChecked) {
        nextExercise();
        return;
    }

    checkAnswer();
}

function checkAnswer() {
    const exercise =
        currentLesson.exercicios[currentExerciseIndex];

    if (
        selectedAnswer === null ||
        String(selectedAnswer).trim() === ""
    ) {
        return;
    }

    const normalizedAnswer =
        EYTApp.normalizeText(selectedAnswer);

    const accepted =
        exercise.respostasAceitas
            ? exercise.respostasAceitas.map(
                resposta =>
                    EYTApp.normalizeText(resposta)
            )
            : [
                EYTApp.normalizeText(
                    exercise.resposta
                )
            ];

    const correct =
        accepted.includes(normalizedAnswer);

    answerChecked = true;

    EYTStorage.registerAnswer(correct);

    if (correct) {
        correctAnswers += 1;
        lessonXP += exercise.xp || 10;

        EYTStorage.addXP(exercise.xp || 10);

        EYTStorage.removeMistake(
            currentLesson.id,
            exercise.id
        );
    } else {
        EYTStorage.addMistake(
            currentLesson.id,
            exercise
        );
    }

    showAnswerFeedback(exercise, correct);

    document.getElementById(
        "lessonXp"
    ).textContent =
        lessonXP;

    const button =
        document.getElementById("checkAnswerButton");

    button.disabled = false;
    button.textContent =
        currentExerciseIndex ===
            currentLesson.exercicios.length - 1
            ? "FINALIZAR"
            : "CONTINUAR";

    button.className =
        correct
            ? "btn btn-success"
            : "btn btn-primary";

    saveCurrentProgress();
}

function showAnswerFeedback(exercise, correct) {
    const feedback =
        document.getElementById("answerFeedback");

    if (correct) {
        feedback.innerHTML = `
            <div class="feedback-message correct">
                <div class="feedback-icon">✓</div>

                <div>
                    <strong>Excellent!</strong>
                    <p>
                        ${EYTApp.escapeHTML(
            exercise.explicacao || "Resposta correta."
        )}
                    </p>
                </div>
            </div>
        `;
    } else {
        feedback.innerHTML = `
            <div class="feedback-message incorrect">
                <div class="feedback-icon">!</div>

                <div>
                    <strong>Almost there!</strong>
                    <p>
                        Resposta correta:
                        <b>${EYTApp.escapeHTML(exercise.resposta)}</b>.
                        ${EYTApp.escapeHTML(exercise.explicacao || "")}
                    </p>
                </div>
            </div>
        `;
    }

    if (exercise.tipo === "multipla_escolha") {
        document
            .querySelectorAll(".option-card")
            .forEach(button => {
                const optionText =
                    button
                        .querySelector("span:last-child")
                        .textContent;

                if (
                    EYTApp.normalizeText(optionText) ===
                    EYTApp.normalizeText(exercise.resposta)
                ) {
                    button.classList.add("correct");
                }

                if (
                    button.classList.contains("selected") &&
                    !correct
                ) {
                    button.classList.add("incorrect");
                }
            });
    }

    const textInput =
        document.getElementById("textAnswer");

    if (textInput) {
        textInput.disabled = true;

        textInput.classList.add(
            correct ? "correct-input" : "incorrect-input"
        );
    }
}

function nextExercise() {
    currentExerciseIndex += 1;

    if (
        currentExerciseIndex >=
        currentLesson.exercicios.length
    ) {
        finishLesson();
        return;
    }

    renderExercise();
}

function updateProgress() {
    const total =
        currentLesson.exercicios.length;

    const atual =
        currentExerciseIndex + 1;

    const percentual =
        Math.round(
            (currentExerciseIndex / total) * 100
        );

    document.getElementById(
        "lessonProgressBar"
    ).style.width =
        `${percentual}%`;

    document.getElementById(
        "lessonProgressText"
    ).textContent =
        `${atual} / ${total}`;
}

function saveCurrentProgress() {
    EYTStorage.saveLessonProgress(
        currentLesson.id,
        Math.min(
            currentExerciseIndex + 1,
            currentLesson.exercicios.length
        ),
        currentLesson.exercicios.length
    );
}

function finishLesson() {
    EYTStorage.completeLesson(currentLesson.id);
    EYTApp.evaluateAchievements();

    const progress =
        EYTStorage.getProgress();

    const accuracy =
        Math.round(
            (
                correctAnswers /
                currentLesson.exercicios.length
            ) * 100
        );

    document
        .getElementById("exerciseArea")
        .classList.add("hidden");

    document
        .getElementById("answerFooter")
        .classList.add("hidden");

    document
        .getElementById("lessonComplete")
        .classList.remove("hidden");

    document.getElementById(
        "lessonProgressBar"
    ).style.width = "100%";

    document.getElementById(
        "lessonProgressText"
    ).textContent =
        `${currentLesson.exercicios.length} / ${currentLesson.exercicios.length}`;

    document.getElementById(
        "completeLessonName"
    ).textContent =
        currentLesson.titulo;

    document.getElementById(
        "completeXp"
    ).textContent =
        `${lessonXP} XP`;

    document.getElementById(
        "completeAccuracy"
    ).textContent =
        `${accuracy}%`;

    document.getElementById(
        "completeStreak"
    ).textContent =
        progress.streak;
}