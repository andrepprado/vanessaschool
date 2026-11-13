(function () {
  "use strict";

  function updateTutorial() {
    const headings = [...document.querySelectorAll(
      "h1,h2,h3,h4,strong"
    )];

    const title = headings.find(element =>
      (element.textContent || "").trim()
        .toLowerCase() === "tutorial de acesso"
    );

    if (!title) return;

    let scope = title.parentElement;

    for (let i = 0; i < 5 && scope; i++) {
      const labels = [...scope.querySelectorAll("button")]
        .map(button => (button.textContent || "").trim());

      if (labels.some(label =>
        /pr[oó]xima etapa/i.test(label)
      )) break;

      scope = scope.parentElement;
    }

    if (!scope) return;

    scope.classList.add("vs-tutorial-scope");

    scope.querySelectorAll("button").forEach(button => {
      const label = (button.textContent || "").trim();

      if (/^pr[oó]xima etapa$/i.test(label)) {
        button.dataset.vsRole = "next";
      } else if (/^anterior$/i.test(label)) {
        button.dataset.vsRole = "previous";
      } else if (/^concluir$/i.test(label)) {
        button.dataset.vsRole = "finish";
      }
    });
  }

  function init() {
    updateTutorial();

    const observer = new MutationObserver(() => {
      observer.disconnect();
      updateTutorial();
      observer.observe(document.body, {
        childList: true,
        subtree: true
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