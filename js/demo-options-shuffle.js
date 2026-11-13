(function () {
  "use strict";

  const GROUP_SELECTORS = [
    "#demoExerciseOptions",
    "#demoQuestionOptions",
    ".demo-exercise-options",
    ".demo-question-options",
    ".demo-answer-options",
    ".demo-options",
    "[data-demo-options]"
  ];

  const processed = new WeakMap();
  let previousSignature = "";
  let questionNumber = 0;

  function getOptions(group) {
    return [...group.children].filter(el =>
      el.matches("button, label, [role='button'], .option, .answer-option")
    );
  }

  function shuffle(items) {
    const result = [...items];

    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  }

  function relabel(items) {
    items.forEach((item, index) => {
      const letter = String.fromCharCode(65 + index);

      const marker = item.querySelector(
        ".option-letter, .answer-letter, [data-option-letter]"
      );

      if (marker) {
        marker.textContent = letter;
      }
    });
  }

  function apply() {
    const groups = document.querySelectorAll(
      GROUP_SELECTORS.join(",")
    );

    groups.forEach(group => {
      const options = getOptions(group);
      if (options.length < 2 || options.length > 8) return;

      const signature = options
        .map(el => el.textContent.trim())
        .join("|");

      if (processed.get(group) === signature) return;

      if (signature !== previousSignature) {
        questionNumber++;
        previousSignature = signature;
      }

      let ordered = shuffle(options);

      // Evita manter a mesma ordem da pergunta original.
      if (ordered.every((item, i) => item === options[i])) {
        ordered = [...options.slice(1), options[0]];
      }

      // Alterna a posicao da primeira resposta original.
      // Isso evita que uma base com gabarito sempre na
      // primeira opcao continue exibindo sempre a letra A.
      if (ordered.length >= 4) {
        const target = (questionNumber - 1) % ordered.length;
        const originalFirst = options[0];
        const current = ordered.indexOf(originalFirst);

        [ordered[current], ordered[target]] =
          [ordered[target], ordered[current]];
      }

      ordered.forEach(option => group.appendChild(option));
      relabel(ordered);

      processed.set(
        group,
        ordered.map(el => el.textContent.trim()).join("|")
      );
    });
  }

  function init() {
    apply();

    let scheduled = false;

    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;

      requestAnimationFrame(() => {
        scheduled = false;
        apply();
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();