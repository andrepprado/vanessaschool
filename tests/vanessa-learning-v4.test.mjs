import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source=fs.readFileSync("js/vanessa-learning-v4.js","utf8");
const listeners={};
const context={
 window:{
   addEventListener(){},
   dispatchEvent(){}
 },
 document:{
   readyState:"loading",
   addEventListener(name,fn){listeners[name]=fn;}
 },
 localStorage:{
   getItem(){return null;},
   setItem(){}
 },
 CustomEvent:class {},
 console
};

vm.runInNewContext(source,context);
const app=context.window.VanessaLearningV4;

assert.ok(app);
assert.equal(app.QUESTION_BANK.length,60);
assert.equal(app.UNITS.length,30);
assert.equal(new Set(app.QUESTION_BANK.map(q=>q.text)).size,60);

for(const q of app.QUESTION_BANK){
 assert.equal(q.options.length,4);
 assert.ok(q.options.includes(q.answer));
 assert.ok(app.LEVELS.includes(q.level));
}

const answers=app.QUESTION_BANK.map(q=>q.answer);
const perfect=app.evaluatePlacement(answers);
assert.equal(perfect.score,60);
assert.equal(perfect.assignedLevel,"C2");

const wrong=app.QUESTION_BANK.map(q=>q.options.find(x=>x!==q.answer));
const failed=app.evaluatePlacement(wrong);
assert.equal(failed.score,0);
assert.equal(failed.assignedLevel,"A1");

const a1=app.UNITS.filter(x=>x.level==="A1");
const state={assignedLevel:"A1",completed:[]};

assert.equal(app.isUnlocked(a1[0],state),true);
assert.equal(app.isUnlocked(a1[1],state),false);
state.completed.push(a1[0].id);
assert.equal(app.isUnlocked(a1[1],state),true);

console.log("OK: 60 questoes, 30 unidades, nivelamento e desbloqueio.");