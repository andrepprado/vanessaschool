(function () {
"use strict";

const VERSION = "2026.11.13";
const LEVELS = ["A1","A2","B1","B2","C1","C2"];
const KEY_PREFIX = "vanessa-learning-v4:";
const PASS_SCORE = 70;

const UNITS = [
  ["A1","Greetings","Cumprimentos e apresentações"],
  ["A1","Verb to be","Identidade e informações pessoais"],
  ["A1","Simple present","Rotinas e hábitos"],
  ["A1","Present continuous","Ações acontecendo agora"],
  ["A1","Prepositions","Lugares e posições"],
  ["A2","Simple past","Experiências passadas"],
  ["A2","Future forms","Planos e previsões"],
  ["A2","Comparatives","Comparações"],
  ["A2","Modal verbs","Conselhos e obrigações"],
  ["A2","Everyday conversations","Situações cotidianas"],
  ["B1","Present perfect","Experiências e resultados"],
  ["B1","Conditionals","Possibilidades e consequências"],
  ["B1","Relative clauses","Descrição de pessoas e objetos"],
  ["B1","Passive voice","Foco na ação"],
  ["B1","Reported speech","Relatando informações"],
  ["B2","Advanced conditionals","Hipóteses e situações irreais"],
  ["B2","Past perfect","Sequência de acontecimentos"],
  ["B2","Advanced passive","Estruturas passivas"],
  ["B2","Phrasal verbs","Expressões e combinações verbais"],
  ["B2","Argumentation","Opiniões e argumentos"],
  ["C1","Inversion","Ênfase e inversão"],
  ["C1","Subjunctive","Estruturas formais"],
  ["C1","Mixed conditionals","Hipóteses complexas"],
  ["C1","Academic English","Linguagem acadêmica"],
  ["C1","Advanced discourse","Coesão e argumentação"],
  ["C2","Advanced inversion","Estruturas sofisticadas"],
  ["C2","Nuanced modality","Nuances de possibilidade"],
  ["C2","Formal register","Registro formal"],
  ["C2","Complex structures","Estruturas complexas"],
  ["C2","Mastery review","Revisão e domínio"]
].map((u,i) => ({
  id:"vs-unit-"+String(i+1).padStart(2,"0"),
  level:u[0],
  title:u[1],
  description:u[2]
}));

const QUESTION_BANK = [
["A1","I ___ a student.","am","is","are","be"],
["A1","She ___ my teacher.","is","am","are","be"],
["A1","___ are my friends.","They","He","She","It"],
["A1","I have ___ apple.","an","a","the","some"],
["A1","He is ___ doctor.","a","an","are","some"],
["A1","She ___ English every day.","studies","study","studying","studied"],
["A1","They ___ in Brazil.","live","lives","living","lived"],
["A1","There ___ two chairs.","are","is","am","be"],
["A1","The book is ___ the table.","on","at","to","from"],
["A1","___ is your name?","What","When","Where","Who"],
["A2","Yesterday we ___ a movie.","watched","watch","watching","watches"],
["A2","She ___ to London last year.","went","go","goes","going"],
["A2","He is ___ dinner.","cooking","cook","cooked","cooks"],
["A2","My house is ___ than yours.","bigger","biggest","big","more big"],
["A2","This is the ___ day of my life.","best","better","good","well"],
["A2","I am going ___ study tonight.","to","for","at","in"],
["A2","How ___ books do you have?","many","much","little","any"],
["A2","How ___ water do you drink?","much","many","few","several"],
["A2","She speaks English ___.","well","good","betterly","nice"],
["A2","You ___ wear a seat belt.","must","can to","must to","are"],
["B1","I have ___ my homework.","finished","finish","finishing","finishes"],
["B1","She has lived here ___ 2020.","since","for","during","from"],
["B1","If it rains, we ___ stay home.","will","would","had","were"],
["B1","You ___ see a doctor.","should","should to","ought","must to"],
["B1","I ___ sleeping when you called.","was","am","have","had"],
["B1","The man ___ called is my uncle.","who","where","when","whose"],
["B1","I enjoy ___ books.","reading","read","to reading","reads"],
["B1","She decided ___ early.","to leave","leaving","leave","left"],
["B1","English ___ spoken worldwide.","is","are","has","have"],
["B1","He said he ___ tired.","was","is","were","be"],
["B2","If I were rich, I ___ travel.","would","will","can","had"],
["B2","If I had known, I ___ helped.","would have","will have","had","would"],
["B2","The report ___ completed yesterday.","was","is","has","were"],
["B2","She ___ left before I arrived.","had","has","have","was"],
["B2","She said she ___ seen it.","had","has","have","was"],
["B2","I wish I ___ more time.","had","have","will have","having"],
["B2","___ the rain, we went out.","Despite","Although","However","Because"],
["B2","Please ___ the lights.","turn off","turning off","turns off","turned off"],
["B2","The book, ___ I bought yesterday, is excellent.","which","who","where","whose"],
["B2","He ___ have forgotten the meeting.","might","can to","should to","is"],
["C1","Never ___ I seen such a view.","have","has","had been","am"],
["C1","Hardly ___ she arrived when it started.","had","has","have","was"],
["C1","It is essential that he ___ present.","be","is","was","being"],
["C1","If I had studied, I ___ employed now.","would be","will be","had been","am"],
["C1","It was John ___ solved the problem.","who","which","where","whose"],
["C1","The plan is risky; ___, it may succeed.","nevertheless","because","despite","although"],
["C1","The committee recommended that she ___ appointed.","be","is","was","being"],
["C1","Not only ___ she sing, but she also dances.","does","do","is","has"],
["C1","Were I to accept, I ___ need more time.","would","will","had","have"],
["C1","What I ___ need is more time.","do","does","didn't","doing"],
["C2","No sooner ___ he arrived than it began.","had","has","have","was"],
["C2","___ the objections, the proposal passed.","Notwithstanding","Although","However","Because"],
["C2","Had she known, she ___ differently.","would have acted","will act","acts","had acted"],
["C2","He ___ well have misunderstood the instructions.","may","must to","can to","shall to"],
["C2","Little ___ they know what awaited them.","did","do","had","were"],
["C2","Under no circumstances ___ this be permitted.","should","does","has","is"],
["C2","What matters most ___ accuracy.","is","are","were","have"],
["C2","It is imperative that the matter ___ resolved.","be","is","was","being"],
["C2","Scarcely ___ we begun when the alarm rang.","had","have","has","were"],
["C2","So compelling ___ the evidence that nobody objected.","was","were","has","have"]
].map((q,i) => ({
 id:"VSQ"+String(i+1).padStart(2,"0"),
 level:q[0],
 text:q[1],
 answer:q[2],
 options:q.slice(2)
}));

function shuffle(a) {
 const result=[...a];
 for(let i=result.length-1;i>0;i--){
   const j=Math.floor(Math.random()*(i+1));
   [result[i],result[j]]=[result[j],result[i]];
 }
 return result;
}

function safeText(value) {
 return String(value==null?"":value);
}

function escapeHtml(value) {
 return safeText(value).replace(/[&<>"']/g,c=>({
   "&":"&amp;","<":"&lt;",">":"&gt;",
   '"':"&quot;","'":"&#39;"
 }[c]));
}

async function getAuthenticatedStudent() {
  const candidates = [
    window.EYTSupabase,
    window.EYTSupabaseClient,
    window.supabaseClient,
    window.supabase
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    const client = candidate.client || candidate;

    if (typeof client.auth?.getUser !== "function") continue;

    try {
      const { data, error } = await client.auth.getUser();

      if (!error && data?.user?.id) {
        return {
          id: data.user.id,
          email: data.user.email || "",
          name:
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            data.user.email ||
            "Aluno",
          client
        };
      }
    } catch (error) {
      console.warn("[VanessaSchool] Falha na consulta de sessao:", error);
    }
  }

  return null;
}
function stateKey(id) {
 return KEY_PREFIX+id;
}

function readState(id) {
 try {
   const raw=localStorage.getItem(stateKey(id));
   const value=raw?JSON.parse(raw):{};
   return {
     version:VERSION,
     profileDone:Boolean(value.profileDone),
     tutorialDone:Boolean(value.tutorialDone),
     placement:value.placement||null,
     assignedLevel:LEVELS.includes(value.assignedLevel)?value.assignedLevel:"A1",
     completed:Array.isArray(value.completed)?value.completed:[],
     attempts:value.attempts||{},
     updatedAt:value.updatedAt||null
   };
 } catch(_) {
   return {
     version:VERSION,profileDone:false,tutorialDone:false,
     placement:null,assignedLevel:"A1",completed:[],
     attempts:{},updatedAt:null
   };
 }
}

function saveState(id,state) {
 state.updatedAt=new Date().toISOString();
 localStorage.setItem(stateKey(id),JSON.stringify(state));
 if (activeStudent?.id === id) {
   void saveRemoteState(activeStudent, state);
 }
 window.dispatchEvent(new CustomEvent("vanessa:progress",{detail:{
   level:state.assignedLevel,
   completed:state.completed.length
 }}));
}

let activeStudent = null;

async function loadRemoteState(student) {
  const { data, error } = await student.client
    .from("student_learning_progress")
    .select("state")
    .eq("user_id", student.id)
    .maybeSingle();

  if (error) {
    console.warn("[VanessaSchool] Progresso remoto indisponivel:", error.message);
    return null;
  }

  return data?.state || null;
}

async function saveRemoteState(student, state) {
  const { error } = await student.client
    .from("student_learning_progress")
    .upsert({
      user_id: student.id,
      state,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id" });

  if (error) {
    console.warn("[VanessaSchool] Falha ao sincronizar:", error.message);
    return false;
  }

  return true;
}

async function synchronizeStudent(student) {
  const local = readState(student.id);
  const remote = await loadRemoteState(student);

  if (!remote) return local;

  const merged = {
    ...local,
    ...remote,
    profileDone: true,
    completed: [...new Set([
      ...(local.completed || []),
      ...(remote.completed || [])
    ])]
  };

  const localTime = Date.parse(local.updatedAt || "") || 0;
  const remoteTime = Date.parse(remote.updatedAt || "") || 0;

  if (localTime > remoteTime) {
    merged.placement = local.placement;
    merged.assignedLevel = local.assignedLevel;
    merged.tutorialDone = local.tutorialDone;
  }

  localStorage.setItem(stateKey(student.id), JSON.stringify(merged));
  return merged;
}
function evaluatePlacement(answers) {
 const byLevel={};
 let total=0;
 QUESTION_BANK.forEach((q,i)=>{
   if(!byLevel[q.level])byLevel[q.level]={correct:0,total:0};
   byLevel[q.level].total++;
   if(answers[i]===q.answer){
     total++;
     byLevel[q.level].correct++;
   }
 });
 let assigned="A1";
 for(const level of LEVELS){
   const result=byLevel[level];
   if(result && result.correct/result.total>=0.7){
     assigned=level;
   } else {
     break;
   }
 }
 return {
   score:total,
   total:QUESTION_BANK.length,
   percent:Math.round(total/QUESTION_BANK.length*100),
   byLevel,
   assignedLevel:assigned,
   date:new Date().toISOString()
 };
}

function isUnlocked(unit,state) {
 const levelUnits=UNITS.filter(u=>u.level===state.assignedLevel);
 const index=levelUnits.findIndex(u=>u.id===unit.id);
 if(index<0)return false;
 if(index===0)return true;
 return state.completed.includes(levelUnits[index-1].id);
}

function create(tag,attrs={},children=[]) {
 const el=document.createElement(tag);
 Object.entries(attrs).forEach(([k,v])=>{
   if(k==="text")el.textContent=v;
   else if(k==="class")el.className=v;
   else el.setAttribute(k,v);
 });
 children.forEach(child=>el.append(child));
 return el;
}

function button(label,fn) {
 const b=create("button",{type:"button",class:"vs-btn",text:label});
 b.addEventListener("click",fn);
 return b;
}

function heading(title,description) {
 const fragment=document.createDocumentFragment();
 fragment.append(create("h2",{text:title}));
 fragment.append(create("p",{text:description}));
 return fragment;
}

function renderProfile(root,id,state) {
 root.replaceChildren();
 root.append(heading("Primeiro acesso","Confirme seu nome para iniciar sua jornada."));
 const input=create("input",{
   type:"text",placeholder:"Como prefere ser chamado?",
   maxlength:"100",autocomplete:"name"
 });
 root.append(input);
 root.append(button("Salvar e continuar",()=>{
   const name=input.value.trim();
   if(name.length<2){input.focus();return;}
   state.profileDone=true;
   state.displayName=name;
   saveState(id,state);
   render(root,id,state);
 }));
}

function renderTutorial(root,id,state) {
 root.replaceChildren();
 root.append(heading("Conheça a plataforma",
   "Veja o caminho do aluno antes de começar."));
 const steps=[
   ["1. Entrar","Use o acesso individual fornecido pela Teacher Vanessa."],
   ["2. Nivelamento","Faça o teste de 60 questões ou comece no nível inicial."],
   ["3. Aprender","As unidades são liberadas na ordem dos conteúdos."],
   ["4. Evoluir","Conclua as atividades para liberar a próxima unidade."],
   ["5. Revisar","Volte às atividades anteriores quando precisar."]
 ];
 steps.forEach(([title,description])=>{
   const card=create("section",{class:"vs-card"});
   card.append(create("h3",{text:title}));
   card.append(create("p",{text:description}));
   root.append(card);
 });
 root.append(button("Entendi, continuar",()=>{
   state.tutorialDone=true;
   saveState(id,state);
   render(root,id,state);
 }));
}

function renderPlacement(root,id,state) {
 root.replaceChildren();
 root.append(heading("Teste de nivelamento",
   "60 questões de A1 a C2. Você pode fazer agora ou iniciar no A1."));
 root.append(button("Começar no A1",()=>{
   state.assignedLevel="A1";
   state.placement={skipped:true,date:new Date().toISOString()};
   saveState(id,state);
   render(root,id,state);
 }));
 root.append(button("Iniciar teste de 60 questões",()=>{
   const answers={};
   let index=0;
   const questions=QUESTION_BANK.map(q=>({
     ...q,options:shuffle(q.options)
   }));
   const show=()=>{
     root.replaceChildren();
     const q=questions[index];
     root.append(create("p",{
       text:"Questão "+(index+1)+" de "+questions.length
     }));
     root.append(create("h2",{text:q.text}));
     const choices=create("div",{class:"vs-options"});
     q.options.forEach(option=>{
       choices.append(button(option,()=>{
         answers[index]=option;
         index++;
         if(index<questions.length)show();
         else {
           const result=evaluatePlacement(answers);
           state.placement=result;
           state.assignedLevel=result.assignedLevel;
           saveState(id,state);
           render(root,id,state);
         }
       }));
     });
     root.append(choices);
   };
   show();
 }));
}

function renderUnits(root,id,state) {
 root.replaceChildren();
 root.append(heading("Sua trilha de aprendizagem",
   "Nível "+state.assignedLevel+
   " • Complete uma unidade para liberar a próxima."));
 if(state.placement && !state.placement.skipped){
   root.append(create("p",{
     text:"Resultado do nivelamento: "+
     state.placement.score+"/60 respostas corretas."
   }));
 }
 const list=create("div",{class:"vs-units"});
 UNITS.filter(u=>u.level===state.assignedLevel).forEach(unit=>{
   const unlocked=isUnlocked(unit,state);
   const completed=state.completed.includes(unit.id);
   const card=create("section",{class:"vs-card"});
   card.append(create("h3",{text:unit.title}));
   card.append(create("p",{text:unit.description}));
   card.append(create("p",{text:completed?
     "Concluída":unlocked?"Disponível":"Bloqueada"}));
   if(unlocked){
     card.append(button(completed?"Revisar unidade":"Estudar unidade",()=>{
       renderUnit(root,id,state,unit);
     }));
   }
   list.append(card);
 });
 root.append(list);
 root.append(button("Refazer nivelamento",()=>{
   state.placement=null;
   saveState(id,state);
   render(root,id,state);
 }));
 renderLibrary(root);
}

function renderUnit(root,id,state,unit) {
 root.replaceChildren();
 root.append(heading(unit.title,unit.description));
 root.append(create("p",{text:
   "Estude o conteúdo e pratique com as atividades disponíveis "+
   "na plataforma antes de registrar a conclusão."
 }));
 const existing=UNITS.findIndex(u=>u.id===unit.id);
 const related=QUESTION_BANK.filter(q=>q.level===unit.level);
 const question=related[existing%related.length];
 const questionBox=create("section",{class:"vs-card"});
 questionBox.append(create("h3",{text:"Prática: "+question.text}));
 const feedback=create("p",{text:""});
 const choices=create("div",{class:"vs-options"});
 shuffle(question.options).forEach(option=>{
   choices.append(button(option,()=>{
     if(option===question.answer){
       feedback.textContent="Resposta correta.";
       complete.disabled=false;
     } else {
       feedback.textContent="Tente novamente.";
     }
   }));
 });
 questionBox.append(choices,feedback);
 root.append(questionBox);
 const complete=button("Concluir unidade",()=>{
   if(!state.completed.includes(unit.id)){
     state.completed.push(unit.id);
   }
   saveState(id,state);
   render(root,id,state);
 });
 complete.disabled=true;
 root.append(complete);
 root.append(button("Voltar à trilha",()=>render(root,id,state)));
}

function renderLibrary(root) {
 const section=create("section",{class:"vs-library"});
 section.append(create("h2",{text:"Materiais complementares"}));
 section.append(create("p",{text:
   "Acesse os materiais das plataformas licenciadas com sua própria conta."
 }));
 const sources=[
   ["ESL Brains","https://eslbrains.com/"],
   ["Ellii","https://ellii.com/"]
 ];
 sources.forEach(([name,url])=>{
   const link=create("a",{
     href:url,target:"_blank",rel:"noopener noreferrer",
     class:"vs-source",text:"Abrir "+name
   });
   section.append(link);
 });
 root.append(section);
}

function render(root,id,state) {
 state.profileDone=true;
 if(!state.tutorialDone)return renderTutorial(root,id,state);
 if(!state.placement)return renderPlacement(root,id,state);
 return renderUnits(root,id,state);
}

async function init() {
  const root = document.getElementById("vanessaLearningApp");
  if (!root) return;

  root.replaceChildren();
  root.append(heading(
    "Carregando sua aprendizagem",
    "Identificando sua conta..."
  ));

  const student = await getAuthenticatedStudent();

  if (!student) {
    root.replaceChildren();
    root.append(heading(
      "Acesso necessario",
      "Entre com sua conta atual para continuar."
    ));
    root.append(create("a", {
      href: "acesso.html",
      class: "vs-source",
      text: "Entrar na plataforma"
    }));
    return;
  }

  activeStudent = student;

  const state = await synchronizeStudent(student);
  state.profileDone = true;

  render(root, student.id, state);
}
window.VanessaLearningV4={
 VERSION,LEVELS,UNITS,QUESTION_BANK,
 evaluatePlacement,isUnlocked,init
};

if(document.readyState==="loading"){
 document.addEventListener("DOMContentLoaded",init);
}else{
 init();
}
})();