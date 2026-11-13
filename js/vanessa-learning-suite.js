(function () {
"use strict";

const KEY = "vanessa_learning_suite_v1";
const LEVELS = ["A1","A2","B1","B2","C1","C2"];

const TOPICS = [
  ["A1","Verb to be","am","is","are"],
  ["A1","Personal pronouns","I","he","they"],
  ["A1","Articles","a","an","the"],
  ["A1","Simple present","work","works","working"],
  ["A1","There is / There are","is","are","am"],
  ["A2","Simple past","went","go","going"],
  ["A2","Present continuous","studying","study","studied"],
  ["A2","Comparatives","bigger","biggest","big"],
  ["A2","Future with going to","going","went","gone"],
  ["A2","Countable nouns","many","much","little"],
  ["B1","Present perfect","have","had","has"],
  ["B1","First conditional","will","would","had"],
  ["B1","Modal verbs","should","mustn't","couldn't"],
  ["B1","Past continuous","was","is","has"],
  ["B1","Relative clauses","who","where","when"],
  ["B2","Passive voice","was","has","had"],
  ["B2","Second conditional","would","will","had"],
  ["B2","Reported speech","had","has","have"],
  ["B2","Past perfect","had","have","was"],
  ["B2","Gerunds","reading","read","reads"],
  ["C1","Inversion","had","have","has"],
  ["C1","Mixed conditionals","would","will","can"],
  ["C1","Subjunctive","be","is","was"],
  ["C1","Advanced connectors","nevertheless","because","although"],
  ["C1","Cleft sentences","was","is","were"],
  ["C2","Formal register","notwithstanding","despite of","because of"],
  ["C2","Advanced inversion","should","would","will"],
  ["C2","Nuanced modality","might","must","will"],
  ["C2","Emphasis","what","that","which"],
  ["C2","Complex structures","had","have","has"]
];

const SENTENCES = [
  ["She ___ a teacher.","is"],
  ["___ am from Brazil.","I"],
  ["He bought ___ umbrella.","an"],
  ["My brother ___ every day.","works"],
  ["There ___ a book on the desk.","is"],
  ["Yesterday I ___ to school.","went"],
  ["They are ___ English now.","studying"],
  ["This house is ___ than mine.","bigger"],
  ["We are ___ to travel tomorrow.","going"],
  ["How ___ apples do you need?","many"],
  ["I ___ already finished my homework.","have"],
  ["If it rains, I ___ stay home.","will"],
  ["You ___ see a doctor if you feel ill.","should"],
  ["I ___ watching TV when she called.","was"],
  ["The woman ___ lives here is a doctor.","who"],
  ["The letter ___ sent yesterday.","was"],
  ["If I had more time, I ___ travel.","would"],
  ["She said she ___ seen the film.","had"],
  ["They ___ left before I arrived.","had"],
  ["I enjoy ___ novels.","reading"],
  ["___ I known, I would have acted.","had"],
  ["If I had studied medicine, I ___ be a doctor now.","would"],
  ["It is essential that he ___ present.","be"],
  ["The plan is risky; ___, it may succeed.","nevertheless"],
  ["It ___ John who solved the problem.","was"],
  ["___ the difficulties, the project proceeded.","notwithstanding"],
  ["___ you need assistance, contact us.","should"],
  ["The evidence ___ suggest another explanation.","might"],
  ["___ I need is a clear answer.","what"],
  ["No sooner ___ she arrived than it started raining.","had"]
];

const QUESTIONS = [];

const QUESTION_BANK = [
["A1","Verb to be","I ___ a student.","am","is","are","be"],
["A1","Verb to be","She ___ my teacher.","is","am","are","be"],
["A1","Pronouns","___ are my friends.","They","He","She","It"],
["A1","Articles","I have ___ apple.","an","a","the","some"],
["A1","Articles","He is ___ doctor.","a","an","are","some"],
["A1","Simple present","She ___ English every day.","studies","study","studying","studied"],
["A1","Simple present","They ___ in Brazil.","live","lives","living","lived"],
["A1","There is / There are","There ___ two chairs.","are","is","am","be"],
["A1","Prepositions","The book is ___ the table.","on","at","to","from"],
["A1","Questions","___ is your name?","What","When","Where","Who"],

["A2","Simple past","Yesterday we ___ a movie.","watched","watch","watching","watches"],
["A2","Simple past","She ___ to London last year.","went","go","goes","going"],
["A2","Present continuous","He is ___ dinner.","cooking","cook","cooked","cooks"],
["A2","Comparatives","My house is ___ than yours.","bigger","biggest","big","more big"],
["A2","Superlatives","This is the ___ day of my life.","best","better","good","well"],
["A2","Future","I am going ___ study tonight.","to","for","at","in"],
["A2","Countable nouns","How ___ books do you have?","many","much","little","any"],
["A2","Uncountable nouns","How ___ water do you drink?","much","many","few","several"],
["A2","Adverbs","She speaks English ___.","well","good","betterly","nice"],
["A2","Modal verbs","You ___ wear a seat belt.","must","can to","must to","are"],

["B1","Present perfect","I have ___ my homework.","finished","finish","finishing","finishes"],
["B1","Present perfect","She has lived here ___ 2020.","since","for","during","from"],
["B1","Conditionals","If it rains, we ___ stay home.","will","would","had","were"],
["B1","Modals","You ___ see a doctor.","should","should to","ought","must to"],
["B1","Past continuous","I ___ sleeping when you called.","was","am","have","had"],
["B1","Relative clauses","The man ___ called is my uncle.","who","where","when","whose"],
["B1","Gerunds","I enjoy ___ books.","reading","read","to reading","reads"],
["B1","Infinitives","She decided ___ early.","to leave","leaving","leave","left"],
["B1","Passive voice","English ___ spoken worldwide.","is","are","has","have"],
["B1","Reported speech","He said he ___ tired.","was","is","were","be"],

["B2","Second conditional","If I were rich, I ___ travel.","would","will","can","had"],
["B2","Third conditional","If I had known, I ___ helped.","would have","will have","had","would"],
["B2","Passive voice","The report ___ completed yesterday.","was","is","has","were"],
["B2","Past perfect","She ___ left before I arrived.","had","has","have","was"],
["B2","Reported speech","She said she ___ seen it.","had","has","have","was"],
["B2","Wish","I wish I ___ more time.","had","have","will have","having"],
["B2","Despite","___ the rain, we went out.","Despite","Although","However","Because"],
["B2","Phrasal verbs","Please ___ the lights.","turn off","turning off","turns off","turned off"],
["B2","Relative clauses","The book, ___ I bought yesterday, is excellent.","which","who","where","whose"],
["B2","Modals of deduction","He ___ have forgotten the meeting.","might","can to","should to","is"],

["C1","Inversion","Never ___ I seen such a view.","have","has","had been","am"],
["C1","Inversion","Hardly ___ she arrived when it started.","had","has","have","was"],
["C1","Subjunctive","It is essential that he ___ present.","be","is","was","being"],
["C1","Mixed conditionals","If I had studied, I ___ employed now.","would be","will be","had been","am"],
["C1","Cleft sentences","It was John ___ solved the problem.","who","which","where","whose"],
["C1","Advanced connectors","The plan is risky; ___, it may succeed.","nevertheless","because","despite","although"],
["C1","Formal English","The committee recommended that she ___ appointed.","be","is","was","being"],
["C1","Inversion","Not only ___ she sing, but she also dances.","does","do","is","has"],
["C1","Conditionals","Were I to accept, I ___ need more time.","would","will","had","have"],
["C1","Emphasis","What I ___ need is more time.","do","does","didn't","doing"],

["C2","Inversion","No sooner ___ he arrived than it began.","had","has","have","was"],
["C2","Formal register","___ the objections, the proposal passed.","Notwithstanding","Although","However","Because"],
["C2","Conditionals","Had she known, she ___ differently.","would have acted","will act","acts","had acted"],
["C2","Nuanced modality","He ___ well have misunderstood the instructions.","may","must to","can to","shall to"],
["C2","Advanced grammar","Little ___ they know what awaited them.","did","do","had","were"],
["C2","Inversion","Under no circumstances ___ this be permitted.","should","does","has","is"],
["C2","Emphasis","What matters most ___ accuracy.","is","are","were","have"],
["C2","Formal structures","It is imperative that the matter ___ resolved.","be","is","was","being"],
["C2","Complex structures","Scarcely ___ we begun when the alarm rang.","had","have","has","were"],
["C2","Advanced inversion","So compelling ___ the evidence that nobody objected.","was","were","has","have"]
];

QUESTION_BANK.forEach((row,index) => {
  QUESTIONS.push({
    id:"Q"+String(index+1).padStart(2,"0"),
    level:row[0],
    topic:row[1],
    question:row[2],
    options:row.slice(3),
    answer:row[3]
  });
});
const CONTENT = [
  ["A1","Greetings and introductions"],
  ["A1","Verb to be"],
  ["A1","Articles and pronouns"],
  ["A1","Simple present"],
  ["A1","There is / There are"],
  ["A2","Simple past"],
  ["A2","Present continuous"],
  ["A2","Comparatives and superlatives"],
  ["A2","Future plans"],
  ["A2","Countable and uncountable nouns"],
  ["B1","Present perfect"],
  ["B1","First conditional"],
  ["B1","Modal verbs"],
  ["B1","Past continuous"],
  ["B1","Relative clauses"],
  ["B2","Passive voice"],
  ["B2","Second conditional"],
  ["B2","Reported speech"],
  ["B2","Past perfect"],
  ["B2","Gerunds and infinitives"],
  ["C1","Inversion"],
  ["C1","Mixed conditionals"],
  ["C1","Subjunctive"],
  ["C1","Advanced connectors"],
  ["C1","Cleft sentences"],
  ["C2","Formal register"],
  ["C2","Advanced inversion"],
  ["C2","Nuanced modality"],
  ["C2","Emphasis"],
  ["C2","Complex structures"]
];

function getUserId() {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch (_) {}

  const raw = user && (user.uid || user.id || user.email);
  return String(raw || sessionStorage.getItem("vanessa_user_id") || "guest");
}

function stateKey() { return KEY + "_" + getUserId(); }

function load() {
  try { return JSON.parse(localStorage.getItem(stateKey()) || "{}"); }
  catch (_) { return {}; }
}

function save(value) {
  localStorage.setItem(stateKey(), JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",
    '"':"&quot;","'":"&#39;"
  })[c]);
}

function levelFromScore(percent) {
  if (percent >= 90) return "C2";
  if (percent >= 75) return "C1";
  if (percent >= 60) return "B2";
  if (percent >= 45) return "B1";
  if (percent >= 30) return "A2";
  return "A1";
}

function createStyles() {
  if (document.getElementById("vanessa-suite-style")) return;
  const style = document.createElement("style");
  style.id = "vanessa-suite-style";
  style.textContent = `
    #vanessa-suite {
      font-family:system-ui,Arial,sans-serif;
      color:#173a40;
      max-width:1100px;
      margin:28px auto;
      padding:20px;
      background:#f6faf9;
      border:1px solid #d6e7e3;
      border-radius:16px;
    }
    #vanessa-suite * {box-sizing:border-box}
    #vanessa-suite h2 {margin:0 0 8px}
    #vanessa-suite h3 {margin:16px 0 8px}
    #vanessa-suite p {line-height:1.55}
    #vanessa-suite .vs-actions {
      display:flex;gap:10px;flex-wrap:wrap;margin:16px 0;
    }
    #vanessa-suite button {
      border:0;border-radius:9px;
      background:#008d83;color:white;
      padding:11px 15px;cursor:pointer;
      font-size:14px;font-weight:600;
    }
    #vanessa-suite button:disabled {
      background:#aebbb9;cursor:not-allowed;
    }
    #vanessa-suite .vs-secondary {background:#174b55}
    #vanessa-suite .vs-card {
      background:white;border:1px solid #d8e7e5;
      border-radius:12px;padding:16px;margin:12px 0;
    }
    #vanessa-suite .vs-options {
      display:grid;gap:9px;margin:15px 0;
    }
    #vanessa-suite .vs-option {
      display:flex;align-items:center;gap:9px;
      padding:10px;border:1px solid #d7e4e2;
      border-radius:8px;
    }
    #vanessa-suite .vs-option input {accent-color:#008d83}
    #vanessa-suite .vs-grid {
      display:grid;
      grid-template-columns:repeat(auto-fit,minmax(240px,1fr));
      gap:12px;
    }
    #vanessa-suite .vs-muted {color:#607777;font-size:13px}
    #vanessa-suite a {color:#006d68;overflow-wrap:anywhere}
    #vanessa-suite .vs-progress {
      background:#d7e8e5;height:10px;border-radius:8px;
      overflow:hidden;margin:12px 0;
    }
    #vanessa-suite .vs-progress span {
      display:block;height:100%;background:#008d83;
    }
  `;
  document.head.appendChild(style);
}

function el(tag, attrs = {}, text = "") {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v]) => {
    if (k === "className") node.className = v;
    else node.setAttribute(k,v);
  });
  if (text) node.textContent = text;
  return node;
}

function renderPlacement(root) {
  const s = load();
  let index = 0;
  const answers = {};

  root.innerHTML = `
    <h2>Teste de nivelamento</h2>
    <p>60 questões de inglês, do A1 ao C2.
       O teste é opcional e pode ser realizado após o login.</p>
    <div class="vs-progress"><span id="vs-bar"></span></div>
    <div id="vs-question"></div>
    <div class="vs-actions">
      <button id="vs-prev" class="vs-secondary">Anterior</button>
      <button id="vs-next">Próxima</button>
      <button id="vs-finish" style="display:none">Finalizar teste</button>
      <button id="vs-cancel" class="vs-secondary">Voltar</button>
    </div>
  `;

  function draw() {
    const q = QUESTIONS[index];
    const box = root.querySelector("#vs-question");
    root.querySelector("#vs-bar").style.width =
      ((index + 1) / QUESTIONS.length * 100) + "%";

    box.innerHTML = "";
    box.appendChild(el("p",{className:"vs-muted"},
      `Questão ${index+1} de ${QUESTIONS.length} · ${q.level} · ${q.topic}`));
    box.appendChild(el("h3",{},q.question));

    const options = el("div",{className:"vs-options"});
    q.options.forEach((option,i) => {
      const label = el("label",{className:"vs-option"});
      const input = el("input",{type:"radio",name:"vs-answer",value:String(i)});
      input.checked = answers[q.id] === option;
      input.addEventListener("change",() => {
        answers[q.id] = option;
      });
      label.appendChild(input);
      label.appendChild(el("span",{},option));
      options.appendChild(label);
    });
    box.appendChild(options);

    root.querySelector("#vs-prev").disabled = index === 0;
    root.querySelector("#vs-next").style.display =
      index === QUESTIONS.length-1 ? "none" : "";
    root.querySelector("#vs-finish").style.display =
      index === QUESTIONS.length-1 ? "" : "none";
  }

  root.querySelector("#vs-prev").onclick = () => {
    if (index > 0) {index--;draw();}
  };
  root.querySelector("#vs-next").onclick = () => {
    if (!answers[QUESTIONS[index].id]) {
      alert("Selecione uma resposta.");
      return;
    }
    index++;draw();
  };
  root.querySelector("#vs-cancel").onclick = () => renderHome(root);
  root.querySelector("#vs-finish").onclick = () => {
    if (!answers[QUESTIONS[index].id]) {
      alert("Selecione uma resposta.");
      return;
    }

    const correct = QUESTIONS.reduce((sum,q) =>
      sum + (answers[q.id] === q.answer ? 1 : 0),0);
    const percent = Math.round(correct / QUESTIONS.length * 100);
    const level = levelFromScore(percent);

    s.placement = {
      correct,total:QUESTIONS.length,percent,level,
      date:new Date().toISOString()
    };
    s.level = level;
    save(s);
    renderHome(root);
  };

  draw();
}

function renderLessons(root) {
  const s = load();
  const level = s.level || "A1";
  const current = LEVELS.indexOf(level);
  const completed = s.completed || [];

  root.innerHTML = `
    <h2>Trilha de aprendizagem</h2>
    <p>Nível atual: <strong>${escapeHtml(level)}</strong>.
       Conclua os tópicos na sequência para desbloquear os próximos.</p>
    <div class="vs-grid" id="vs-lessons"></div>
    <div class="vs-actions">
      <button id="vs-back" class="vs-secondary">Voltar</button>
    </div>
  `;

  const grid = root.querySelector("#vs-lessons");

  CONTENT.forEach(([lvl,topic],i) => {
    const levelIndex = LEVELS.indexOf(lvl);
    if (levelIndex > current) return;

    const id = `${lvl}-${i}`;
    const previous = CONTENT[i-1];
    const previousId = previous ? `${previous[0]}-${i-1}` : null;

    const unlocked = i === 0 ||
      completed.includes(id) ||
      (previousId && completed.includes(previousId)) ||
      (levelIndex === current &&
       CONTENT.findIndex(x => x[0] === lvl) === i);

    const card = el("div",{className:"vs-card"});
    card.appendChild(el("h3",{},`${lvl} · ${topic}`));
    card.appendChild(el("p",{className:"vs-muted"},
      completed.includes(id) ? "Concluído" :
      unlocked ? "Disponível" : "Bloqueado"));

    const button = el("button",{},completed.includes(id) ?
      "Concluído" : unlocked ? "Marcar como estudado" : "Bloqueado");

    button.disabled = !unlocked || completed.includes(id);
    button.onclick = () => {
      const currentState = load();
      currentState.completed = [...new Set([
        ...(currentState.completed || []),id
      ])];
      save(currentState);
      renderLessons(root);
    };
    card.appendChild(button);
    grid.appendChild(card);
  });

  root.querySelector("#vs-back").onclick = () => renderHome(root);
}

function renderCatalog(root) {
  const catalog = window.VANESSA_ESLBRAINS_CATALOG || [];

  root.innerHTML = `
    <h2>Biblioteca complementar</h2>
    <p>Referências ESL Brains organizadas para consulta.
       Os materiais abrem no site de origem.</p>
    <input id="vs-search" type="search"
      placeholder="Pesquisar tema ou aula"
      style="width:100%;padding:12px;border:1px solid #ccdcd9;border-radius:8px">
    <div id="vs-results"></div>
    <div class="vs-actions">
      <button id="vs-back" class="vs-secondary">Voltar</button>
    </div>
  `;

  function draw(term) {
    const results = root.querySelector("#vs-results");
    results.innerHTML = "";

    catalog.filter(item =>
      (item.titulo || "").toLowerCase().includes(term.toLowerCase())
    ).forEach(item => {
      const card = el("div",{className:"vs-card"});
      card.appendChild(el("h3",{},item.titulo || item.slug));
      const link = el("a",{
        href:item.url,target:"_blank",rel:"noopener noreferrer"
      },"Abrir material no ESL Brains");
      card.appendChild(link);
      results.appendChild(card);
    });

    if (!results.children.length) {
      results.appendChild(el("p",{},"Nenhuma referência encontrada."));
    }
  }

  root.querySelector("#vs-search").addEventListener("input",e =>
    draw(e.target.value));
  root.querySelector("#vs-back").onclick = () => renderHome(root);
  draw("");
}

function renderTutorial(root) {
  const steps = [
    ["1. Acesse sua conta",
     "Entre com suas credenciais na página de login."],
    ["2. Complete seu perfil",
     "Confira seus dados e informações de estudante."],
    ["3. Faça o nivelamento, se desejar",
     "O teste é opcional e ajuda a sugerir seu nível de inglês."],
    ["4. Acesse sua trilha",
     "Estude os tópicos na ordem indicada."],
    ["5. Acompanhe o progresso",
     "Marque os tópicos estudados para liberar os seguintes."],
    ["6. Consulte a biblioteca",
     "Use os materiais complementares disponíveis."]
  ];

  let index = 0;
  function draw() {
    root.innerHTML = `
      <h2>Tutorial de acesso</h2>
      <p class="vs-muted">Etapa ${index+1} de ${steps.length}</p>
      <div class="vs-card">
        <h3>${escapeHtml(steps[index][0])}</h3>
        <p>${escapeHtml(steps[index][1])}</p>
      </div>
      <div class="vs-actions">
        <button id="vs-prev" class="vs-secondary">Anterior</button>
        <button id="vs-next">Próxima etapa</button>
        <button id="vs-exit" class="vs-secondary">Concluir</button>
      </div>
    `;
    root.querySelector("#vs-prev").disabled = index === 0;
    root.querySelector("#vs-next").disabled = index === steps.length-1;
    root.querySelector("#vs-prev").onclick = () => {index--;draw();};
    root.querySelector("#vs-next").onclick = () => {index++;draw();};
    root.querySelector("#vs-exit").onclick = () => {
      const s = load();
      s.tutorialSeen = true;
      save(s);
      renderHome(root);
    };
  }
  draw();
}

function renderHome(root) {
  const s = load();
  const level = s.level || "A1";
  const completed = (s.completed || []).length;

  root.innerHTML = `
    <h2>VanessaSchool · Minha aprendizagem</h2>
    <p>Bem-vindo! Nível atual:
       <strong>${escapeHtml(level)}</strong></p>
    <p class="vs-muted">Tópicos concluídos: ${completed}</p>
    ${s.placement ? `
      <div class="vs-card">
        <strong>Último nivelamento</strong>
        <p>${s.placement.correct}/${s.placement.total}
           respostas corretas · ${s.placement.percent}% ·
           nível sugerido ${escapeHtml(s.placement.level)}</p>
      </div>` : `
      <div class="vs-card">
        O teste de nivelamento é opcional.
        Você pode começar a estudar no nível A1.
      </div>`}
    <div class="vs-actions">
      <button id="vs-placement">Teste de nivelamento</button>
      <button id="vs-lessons">Minha trilha</button>
      <button id="vs-catalog">Biblioteca complementar</button>
      <button id="vs-tutorial" class="vs-secondary">Como utilizar</button>
    </div>
  `;

  root.querySelector("#vs-placement").onclick = () =>
    renderPlacement(root);
  root.querySelector("#vs-lessons").onclick = () =>
    renderLessons(root);
  root.querySelector("#vs-catalog").onclick = () =>
    renderCatalog(root);
  root.querySelector("#vs-tutorial").onclick = () =>
    renderTutorial(root);
}

function init() {
  if (document.getElementById("vanessa-suite")) return;
  createStyles();

  const root = el("section",{id:"vanessa-suite"});
  root.setAttribute("aria-label","Aprendizagem VanessaSchool");

  const target = document.querySelector("main") || document.body;
  target.appendChild(root);

  const s = load();
  if (!s.tutorialSeen) renderTutorial(root);
  else renderHome(root);
}

window.VanessaLearningSuite = {
  init,
  questions:QUESTIONS,
  levels:LEVELS,
  getProgress:load
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded",init);
} else {
  init();
}
})();