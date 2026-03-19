import{u as S,b as X,d as ee,j as e,e as D,i as te,n as se,f as ae,h as ie,k as ne,m as re,l as oe,p as le}from"./index-ClsHm2el.js";import{a as c,Q as ce}from"./qrcode-CmEn-Zwp.js";import"./firebase-BC1nocp_.js";const M=20,w=["#e91e63","#2196f3","#ff9800","#4caf50"],C=["▲","◆","●","■"],I="wodzirej-kahoot-session";function de(){try{const h=localStorage.getItem(I);return h?JSON.parse(h):null}catch{return null}}function pe(h){localStorage.setItem(I,JSON.stringify({sessionId:h}))}function he(){localStorage.removeItem(I)}function fe(){const h=S(t=>t.participants),B=S(t=>t.addScore),g=S(t=>t.showToast),W=te(),L=de(),[i,Q]=c.useState(L?.sessionId||null),[x,E]=c.useState([]),[d,m]=c.useState(L?"lobby":"setup"),[n,R]=c.useState([]),[r,b]=c.useState({id:"",text:"",options:["","","",""],correctIndex:0,timeLimit:M}),[p,N]=c.useState(0),[v,A]=c.useState({}),[y,z]=c.useState({}),[q,P]=c.useState(0),k=c.useRef(null);c.useEffect(()=>{if(!i)return;const t=X(i,E);return()=>t()},[i]);const K=async()=>{try{const t=await ae();Q(t),pe(t),m("lobby"),g("Sesja live utworzona — uczestnicy mogą dołączać","success")}catch{g("Błąd tworzenia sesji","error")}},O=async()=>{if(i)try{await ie(i)}catch{}he(),Q(null),m("setup"),E([]),z({}),N(0)},$=()=>{if(!r.text.trim()||r.options.filter(s=>s.trim()).length<2){g("Wpisz pytanie i min. 2 odpowiedzi","error");return}const t={...r,id:se(8),options:r.options.filter(s=>s.trim()),correctIndex:Math.min(r.correctIndex,r.options.filter(s=>s.trim()).length-1)};R(s=>[...s,t]),b({id:"",text:"",options:["","","",""],correctIndex:0,timeLimit:M})},F=t=>{R(s=>s.filter(a=>a.id!==t))},U=()=>{if(n.length===0){g("Dodaj przynajmniej 1 pytanie","error");return}N(0),z({}),m("playing"),T(0)},T=async t=>{if(!i||t>=n.length)return;const s=n[t];A({}),P(s.timeLimit),m("question"),await le(i,s),k.current&&clearInterval(k.current),k.current=setInterval(()=>{P(a=>a<=1?(k.current&&clearInterval(k.current),0):a-1)},1e3)};c.useEffect(()=>{if(!i||d!=="question")return;const t=n[p];if(!t)return;const s=ee(i,t.id,a=>{A(a)});return()=>s()},[i,d,p,n]);const Z=async()=>{k.current&&clearInterval(k.current),i&&await ne(i),m("results")},V=async()=>{const t=n[p],s={...y};for(const[a,o]of Object.entries(v))if(o.correct){const f=500+Math.max(0,Math.round(1e3*(1-o.timeMs/(t.timeLimit*1e3))));s[a]=(s[a]||0)+f}z(s),i&&await re(i,s),m("leaderboard")},H=()=>{const t=p+1;if(t>=n.length){m("final");return}N(t),T(t)},J=()=>{let t=0;for(const s of x){const a=y[s.id];if(!a)continue;const o=h.find(l=>l.first.toLowerCase()===s.name.split(" ")[0].toLowerCase()||l.text.toLowerCase()===s.name.toLowerCase());if(o){const l=Math.round(a/100);if(l>0){for(let f=0;f<l;f++)B(o.id,"inne");t++}}}for(const s of x){const a=y[s.id];if(!a)continue;const o=h.find(l=>l.first.toLowerCase()===s.name.split(" ")[0].toLowerCase()||l.text.toLowerCase()===s.name.toLowerCase());o&&oe({participantId:o.id,panel:"kahoot",action:"quiz_completed",data:{score:a}})}g(t>0?`Zsynchronizowano ${t} wyników z Rankingiem`:"Brak pasujących uczestników (sprawdź imiona)",t>0?"success":"error")},u=n[p],j=Object.keys(v).length,Y=x.length,G=Object.values(v).filter(t=>t.correct).length,_=[...x].map(t=>({...t,score:y[t.id]||0})).sort((t,s)=>s.score-t.score).slice(0,10);return W?e.jsxs("div",{className:"panel kahoot-panel",style:{overflow:"auto",padding:"16px",flex:1},children:[e.jsx("style",{children:xe}),d==="setup"&&e.jsxs("div",{className:"kh-setup",children:[e.jsx("div",{className:"kh-section-title",children:"🧠 Quiz — Przygotuj pytania"}),e.jsxs("div",{className:"kh-editor",children:[e.jsx("input",{className:"kh-q-input",placeholder:"Wpisz pytanie...",value:r.text,onChange:t=>b({...r,text:t.target.value}),onKeyDown:t=>t.key==="Enter"&&$()}),e.jsx("div",{className:"kh-options-grid",children:r.options.map((t,s)=>e.jsxs("div",{className:"kh-option-edit",style:{"--opt-color":w[s]},children:[e.jsx("span",{className:"kh-opt-shape",children:C[s]}),e.jsx("input",{placeholder:`Odpowiedź ${s+1}${s>=2?" (opcja)":""}`,value:t,onChange:a=>{const o=[...r.options];o[s]=a.target.value,b({...r,options:o})}}),e.jsxs("label",{className:"kh-correct-check",title:"Oznacz jako poprawną",children:[e.jsx("input",{type:"radio",name:"correct",checked:r.correctIndex===s,onChange:()=>b({...r,correctIndex:s})}),"✓"]})]},s))}),e.jsxs("div",{className:"kh-editor-bottom",children:[e.jsxs("label",{className:"kh-time-label",children:["Czas:",e.jsx("select",{value:r.timeLimit,onChange:t=>b({...r,timeLimit:Number(t.target.value)}),children:[10,15,20,30,45,60].map(t=>e.jsxs("option",{value:t,children:[t,"s"]},t))})]}),e.jsx("button",{className:"btn primary",onClick:$,children:"+ Dodaj pytanie"})]})]}),n.length>0&&e.jsxs("div",{className:"kh-q-list",children:[e.jsxs("div",{className:"kh-q-list-title",children:["Pytania (",n.length,")"]}),n.map((t,s)=>e.jsxs("div",{className:"kh-q-item",children:[e.jsxs("span",{className:"kh-q-num",children:[s+1,"."]}),e.jsx("span",{className:"kh-q-text",children:t.text}),e.jsxs("span",{className:"kh-q-meta",children:[t.timeLimit,"s · ",t.options.length," odp."]}),e.jsx("button",{className:"kh-q-del",onClick:()=>F(t.id),children:"✕"})]},t.id))]}),e.jsx("div",{className:"kh-setup-actions",children:e.jsx("button",{className:"btn primary",onClick:K,disabled:n.length===0,children:"📡 Rozpocznij sesję live"})})]}),d==="lobby"&&i&&e.jsxs("div",{className:"kh-lobby",children:[e.jsxs("div",{className:"kh-live-badge",children:[e.jsx("span",{className:"kh-live-dot"}),"LIVE — Sesja quiz"]}),e.jsxs("div",{className:"kh-qr-section",children:[e.jsx("div",{className:"kh-qr-card",children:e.jsx(ce,{value:D(i),size:200,bgColor:"#ffffff",fgColor:"#0f0f13",level:"M",includeMargin:!0})}),e.jsxs("div",{className:"kh-qr-info",children:[e.jsx("p",{className:"kh-qr-instruction",children:"Zeskanuj QR telefonem, aby dołączyć"}),e.jsxs("p",{className:"kh-qr-code",children:["Kod: ",e.jsx("strong",{children:i})]}),e.jsx("p",{className:"kh-qr-url",children:D(i)})]})]}),e.jsxs("div",{className:"kh-participants-list",children:[e.jsxs("div",{className:"kh-p-title",children:["Uczestnicy (",x.length,")"]}),e.jsxs("div",{className:"kh-p-chips",children:[x.map(t=>e.jsx("span",{className:"kh-p-chip",children:t.name},t.id)),x.length===0&&e.jsx("span",{className:"kh-p-empty",children:"Czekam na uczestników..."})]})]}),e.jsxs("div",{className:"kh-lobby-actions",children:[e.jsxs("button",{className:"btn primary",onClick:U,disabled:x.length===0||n.length===0,children:["🚀 Start quiz (",n.length," pytań)"]}),e.jsx("button",{className:"btn danger",onClick:O,children:"Zakończ sesję"})]})]}),d==="question"&&u&&e.jsxs("div",{className:"kh-question-view",children:[e.jsxs("div",{className:"kh-q-header",children:[e.jsxs("span",{className:"kh-q-counter",children:["Pytanie ",p+1,"/",n.length]}),e.jsxs("span",{className:"kh-q-timer",style:{color:q<=5?"#f44336":"#ffea09"},children:[q,"s"]}),e.jsxs("span",{className:"kh-q-answered",children:[j,"/",Y," odpowiedzi"]})]}),e.jsx("div",{className:"kh-timer-bar",children:e.jsx("div",{className:"kh-timer-fill",style:{width:`${q/u.timeLimit*100}%`}})}),e.jsx("div",{className:"kh-q-display",children:u.text}),e.jsx("div",{className:"kh-options-display",children:u.options.map((t,s)=>e.jsxs("div",{className:"kh-opt-box",style:{background:w[s]},children:[e.jsx("span",{className:"kh-opt-shape-lg",children:C[s]}),e.jsx("span",{children:t})]},s))}),e.jsx("button",{className:"btn primary kh-show-results",onClick:Z,children:"Pokaż wyniki"})]}),d==="results"&&u&&e.jsxs("div",{className:"kh-results-view",children:[e.jsxs("div",{className:"kh-q-header",children:[e.jsxs("span",{className:"kh-q-counter",children:["Pytanie ",p+1,"/",n.length]}),e.jsxs("span",{className:"kh-result-stat",children:["✅ ",G,"/",j," poprawnych"]})]}),e.jsx("div",{className:"kh-q-display",children:u.text}),e.jsx("div",{className:"kh-results-bars",children:u.options.map((t,s)=>{const a=Object.values(v).filter(f=>f.answerIndex===s).length,o=j>0?a/j*100:0,l=s===u.correctIndex;return e.jsxs("div",{className:`kh-result-bar ${l?"correct":""}`,children:[e.jsxs("div",{className:"kh-rb-label",children:[e.jsx("span",{style:{color:w[s]},children:C[s]}),e.jsx("span",{children:t}),l&&e.jsx("span",{className:"kh-rb-check",children:"✓"})]}),e.jsxs("div",{className:"kh-rb-track",children:[e.jsx("div",{className:"kh-rb-fill",style:{width:`${o}%`,background:w[s]}}),e.jsx("span",{className:"kh-rb-count",children:a})]})]},s)})}),e.jsx("button",{className:"btn primary",onClick:V,children:"📊 Pokaż ranking"})]}),(d==="leaderboard"||d==="final")&&e.jsxs("div",{className:"kh-leaderboard-view",children:[e.jsx("div",{className:"kh-lb-title",children:d==="final"?"🏆 Wyniki końcowe":`📊 Ranking po pytaniu ${p+1}`}),e.jsxs("div",{className:"kh-lb-list",children:[_.map((t,s)=>e.jsxs("div",{className:`kh-lb-row ${s<3?"top":""}`,children:[e.jsx("span",{className:"kh-lb-rank",children:s===0?"🥇":s===1?"🥈":s===2?"🥉":`${s+1}.`}),e.jsx("span",{className:"kh-lb-name",children:t.name}),e.jsxs("span",{className:"kh-lb-score",children:[t.score," pkt"]})]},t.id)),_.length===0&&e.jsx("p",{style:{textAlign:"center",color:"var(--txt-muted)"},children:"Brak wyników"})]}),e.jsxs("div",{className:"kh-lb-actions",children:[d==="leaderboard"&&e.jsx("button",{className:"btn primary",onClick:H,children:p+1<n.length?`Następne pytanie (${p+2}/${n.length})`:"🏆 Pokaż wyniki końcowe"}),d==="final"&&h.length>0&&e.jsx("button",{className:"btn primary",onClick:J,children:"🏆 Dodaj punkty do Rankingu Wodzireja"}),e.jsx("button",{className:"btn danger",onClick:O,children:"Zakończ quiz"})]})]})]}):e.jsxs("div",{className:"panel",style:{padding:24,textAlign:"center",color:"var(--txt-muted)"},children:[e.jsx("p",{style:{fontSize:48},children:"🧠"}),e.jsx("p",{style:{marginTop:12},children:"Quiz wymaga Firebase. Skonfiguruj VITE_FIREBASE_DATABASE_URL w .env.local"})]})}const xe=`
.kahoot-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Setup */
.kh-section-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
}
.kh-editor {
  background: var(--panel-bg);
  border-radius: var(--radius);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.kh-q-input {
  padding: 10px 14px;
  background: var(--input-bg);
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--txt-main);
  font-size: 15px;
  font-weight: 600;
}
.kh-q-input::placeholder { color: var(--txt-muted); }
.kh-options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.kh-option-edit {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--opt-color) 15%, var(--input-bg));
  border: 1px solid color-mix(in srgb, var(--opt-color) 30%, transparent);
}
.kh-opt-shape {
  font-size: 16px;
  color: var(--opt-color);
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}
.kh-option-edit input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--txt-main);
  font-size: 13px;
  outline: none;
}
.kh-option-edit input::placeholder { color: var(--txt-muted); }
.kh-correct-check {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 14px;
  cursor: pointer;
  color: var(--txt-muted);
}
.kh-correct-check:has(input:checked) {
  color: #4caf50;
  font-weight: 700;
}
.kh-correct-check input { width: 14px; height: 14px; cursor: pointer; }
.kh-editor-bottom {
  display: flex;
  align-items: center;
  gap: 12px;
}
.kh-time-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--txt-muted);
}
.kh-time-label select {
  background: var(--input-bg);
  border: 1px solid var(--line);
  color: var(--txt-main);
  border-radius: 6px;
  padding: 4px 8px;
}

/* Question list */
.kh-q-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.kh-q-list-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--txt-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 8px 0 4px;
}
.kh-q-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--panel-bg);
  border-radius: 8px;
}
.kh-q-num { color: var(--txt-muted); font-size: 12px; min-width: 20px; }
.kh-q-text { flex: 1; font-size: 13px; }
.kh-q-meta { font-size: 11px; color: var(--txt-muted); }
.kh-q-del {
  background: none;
  color: var(--txt-muted);
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
}
.kh-q-del:hover { color: #f44336; background: rgba(244,67,54,0.1); }

.kh-setup-actions {
  padding-top: 12px;
}

/* Lobby */
.kh-lobby {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.kh-live-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 20px;
  background: rgba(244,67,54,0.12);
  color: #f44336;
  font-weight: 700;
  font-size: 14px;
  width: fit-content;
}
.kh-live-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: #f44336;
  animation: kh-pulse 1.5s ease-in-out infinite;
}
@keyframes kh-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

.kh-qr-section {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
  padding: 20px;
  background: var(--panel-bg);
  border-radius: var(--radius);
}
.kh-qr-card {
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}
.kh-qr-info { display: flex; flex-direction: column; gap: 6px; }
.kh-qr-instruction { font-size: 16px; font-weight: 700; }
.kh-qr-code { font-size: 14px; color: var(--txt-muted); }
.kh-qr-code strong { color: var(--txt-main); font-size: 18px; letter-spacing: 2px; }
.kh-qr-url {
  font-size: 11px;
  color: var(--accent);
  font-family: monospace;
  background: var(--input-bg);
  padding: 6px 10px;
  border-radius: 8px;
  word-break: break-all;
  max-width: 320px;
}

.kh-participants-list {
  padding: 16px;
  background: var(--panel-bg);
  border-radius: var(--radius);
}
.kh-p-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 10px;
}
.kh-p-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.kh-p-chip {
  padding: 6px 14px;
  border-radius: 20px;
  background: rgba(233,30,99,0.12);
  color: #e91e63;
  font-size: 13px;
  font-weight: 600;
  animation: kh-pop 0.3s ease-out;
}
@keyframes kh-pop { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.kh-p-empty { color: var(--txt-muted); font-size: 13px; }
.kh-lobby-actions {
  display: flex;
  gap: 10px;
}

/* Question view */
.kh-question-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.kh-q-header {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
}
.kh-q-counter { font-weight: 700; }
.kh-q-timer { font-size: 28px; font-weight: 800; }
.kh-q-answered { margin-left: auto; color: var(--txt-muted); }
.kh-timer-bar {
  height: 6px;
  border-radius: 3px;
  background: rgba(255,255,255,0.08);
  overflow: hidden;
}
.kh-timer-fill {
  height: 100%;
  border-radius: 3px;
  background: #ffea09;
  transition: width 1s linear;
}
.kh-q-display {
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  padding: 32px 24px;
  background: var(--panel-bg);
  border-radius: var(--radius);
  line-height: 1.4;
}
.kh-options-display {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.kh-opt-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}
.kh-opt-shape-lg { font-size: 24px; }
.kh-show-results { align-self: center; }

/* Results */
.kh-results-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.kh-result-stat { color: #4caf50; font-weight: 700; }
.kh-results-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.kh-result-bar {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.kh-result-bar.correct {
  background: rgba(76,175,80,0.08);
  border-radius: 10px;
  padding: 8px;
}
.kh-rb-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
}
.kh-rb-check { color: #4caf50; }
.kh-rb-track {
  height: 28px;
  border-radius: 6px;
  background: rgba(255,255,255,0.06);
  position: relative;
  overflow: hidden;
}
.kh-rb-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s ease-out;
  min-width: 2px;
}
.kh-rb-count {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 13px;
  font-weight: 700;
  color: #fff;
}

/* Leaderboard */
.kh-leaderboard-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.kh-lb-title {
  font-size: 24px;
  font-weight: 800;
  text-align: center;
}
.kh-lb-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 500px;
  margin: 0 auto;
  width: 100%;
}
.kh-lb-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--panel-bg);
  border-radius: 10px;
  animation: kh-slide 0.3s ease-out;
}
.kh-lb-row.top { background: rgba(255,234,9,0.08); }
@keyframes kh-slide { from { transform: translateX(-20px); opacity: 0; } to { transform: none; opacity: 1; } }
.kh-lb-rank { font-size: 18px; min-width: 28px; text-align: center; }
.kh-lb-name { flex: 1; font-weight: 600; font-size: 15px; }
.kh-lb-score { font-weight: 700; color: var(--accent2); font-size: 15px; }
.kh-lb-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

@media (max-width: 600px) {
  .kh-options-grid, .kh-options-display { grid-template-columns: 1fr; }
  .kh-q-display { font-size: 18px; padding: 20px 16px; }
}
`;export{fe as KahootPanel};
