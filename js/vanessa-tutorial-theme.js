(function () {
  "use strict";

  const primary = new Set(["Próxima etapa", "Proxima etapa"]);
  const secondary = new Set(["Anterior", "Concluir"]);

  function apply() {
    document.querySelectorAll("button").forEach(button => {
      const label = (button.textContent || "").trim();

      if (primary.has(label)) {
        button.classList.add("vanessa-tutorial-primary");
      }

      if (secondary.has(label)) {
        button.classList.add("vanessa-tutorial-secondary");
      }
    });
  }

  function start() {
    apply();

    const observer = new MutationObserver(apply);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();