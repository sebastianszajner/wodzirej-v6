import{x as Q,y as D,z as I,A as P,B as v,j as e,C as T}from"./index-Sv356mhz.js";import{a as i}from"./qrcode-CmEn-Zwp.js";import"./firebase-BC1nocp_.js";function M({sessionId:n}){const[a,c]=i.useState("loading"),[k,f]=i.useState(""),[u,S]=i.useState(""),[o,q]=i.useState(null),[j,b]=i.useState(!1),[r,w]=i.useState(null),[m,z]=i.useState(null),[d,g]=i.useState(!1),[x,E]=i.useState(0),[h,y]=i.useState(0),l=i.useRef(null),R=i.useRef(null);i.useEffect(()=>{(async()=>{try{const s=await Q(n);if(!s.ok){c("error"),f(s.reason);return}c("register")}catch{c("error"),f("Nie udało się połączyć z sesją")}})()},[n]),i.useEffect(()=>{const s=D(n,t=>{t==="closed"&&c("closed")});return()=>s()},[n]),i.useEffect(()=>{if(!o)return;const s=I(n,t=>{t?(w(t),z(null),g(!1),y(t.timeLimit),c("quiz")):(a==="quiz"&&c("lobby"),w(null))});return()=>s()},[n,o,a]),i.useEffect(()=>{if(!o)return;const s=P(n,t=>{E(t[o]||0)});return()=>s()},[n,o]),i.useEffect(()=>{if(!(a!=="quiz"||!r||d))return l.current&&clearInterval(l.current),l.current=setInterval(()=>{y(s=>s<=1?(l.current&&clearInterval(l.current),!d&&o&&r&&(g(!0),v(n,r.id,o,-1,r.timeLimit*1e3,!1).catch(()=>{})),0):s-1)},1e3),()=>{l.current&&clearInterval(l.current)}},[a,r,d,o,n]);const N=async()=>{const s=u.trim();if(!(s.length<2||j)){b(!0);try{const t=await T(n,s);t.ok&&t.participantId?(q(t.participantId),c("lobby")):(f(t.reason||"Błąd rejestracji"),c("error"))}catch{f("Nie udało się dołączyć"),c("error")}finally{b(!1)}}},A=async s=>{if(d||!r||!o)return;z(s),g(!0),l.current&&clearInterval(l.current);const t=(r.timeLimit-h)*1e3,p=s===r.correctIndex;try{await v(n,r.id,o,s,t,p)}catch{}},L=["#e91e63","#2196f3","#ff9800","#4caf50"],C=["▲","◆","●","■"];return e.jsxs("div",{className:"sj-container",children:[e.jsx("style",{children:W}),e.jsx("div",{className:"sj-brand",children:"🎡 Wodzirej"}),a==="loading"&&e.jsxs("div",{className:"sj-center",children:[e.jsx("div",{className:"sj-spinner"}),e.jsx("p",{children:"Łączenie z sesją..."})]}),a==="error"&&e.jsxs("div",{className:"sj-center",children:[e.jsx("div",{className:"sj-icon",children:"❌"}),e.jsx("p",{className:"sj-error-text",children:k})]}),a==="closed"&&e.jsxs("div",{className:"sj-center",children:[e.jsx("div",{className:"sj-icon",children:"🏁"}),e.jsx("p",{className:"sj-big",children:"Sesja zakończona"}),x>0&&e.jsxs("p",{className:"sj-score-final",children:["Twój wynik: ",x," pkt"]}),e.jsx("p",{className:"sj-hint",children:"Dziękujemy za udział!"})]}),a==="register"&&e.jsxs("div",{className:"sj-register",children:[e.jsx("div",{className:"sj-icon",children:"👋"}),e.jsx("p",{className:"sj-big",children:"Dołącz do sesji"}),e.jsx("p",{className:"sj-hint",children:"Wpisz swoje imię (i nazwisko)"}),e.jsxs("div",{className:"sj-input-row",children:[e.jsx("input",{ref:R,type:"text",value:u,onChange:s=>S(s.target.value),onKeyDown:s=>s.key==="Enter"&&N(),placeholder:"Twoje imię...",maxLength:40,autoFocus:!0,className:"sj-input",disabled:j}),e.jsx("button",{className:"sj-btn",onClick:N,disabled:u.trim().length<2||j,children:j?"...":"Dołącz"})]})]}),a==="lobby"&&e.jsxs("div",{className:"sj-center",children:[e.jsx("div",{className:"sj-icon",children:"✅"}),e.jsx("p",{className:"sj-big",children:"Jesteś w grze!"}),e.jsx("p",{className:"sj-name-display",children:u}),x>0&&e.jsxs("p",{className:"sj-score-badge",children:[x," pkt"]}),e.jsx("p",{className:"sj-hint",children:"Czekaj na kolejne pytanie..."}),e.jsx("div",{className:"sj-lobby-pulse"})]}),a==="quiz"&&r&&e.jsxs("div",{className:"sj-quiz",children:[e.jsxs("div",{className:"sj-quiz-timer",children:[e.jsx("div",{className:"sj-timer-bar",children:e.jsx("div",{className:"sj-timer-fill",style:{width:`${h/r.timeLimit*100}%`}})}),e.jsxs("span",{className:"sj-timer-num",children:[h,"s"]})]}),e.jsx("div",{className:"sj-quiz-question",children:r.text}),e.jsx("div",{className:"sj-quiz-options",children:r.options.map((s,t)=>{let p="sj-option";return d&&(t===r.correctIndex?p+=" correct":t===m&&t!==r.correctIndex?p+=" wrong":p+=" dimmed"),e.jsxs("button",{className:p,style:{"--opt-color":L[t]},onClick:()=>A(t),disabled:d,children:[e.jsx("span",{className:"sj-option-shape",children:C[t]}),e.jsx("span",{className:"sj-option-text",children:s})]},t)})}),d&&e.jsx("div",{className:`sj-answer-feedback ${m===r.correctIndex?"correct":"wrong"}`,children:m===r.correctIndex?"✅ Dobrze!":"❌ Źle!"})]}),e.jsxs("div",{className:"sj-room-code",children:["Sesja: ",n]})]})}const W=`
.sj-container {
  min-height: 100dvh;
  background: #0f0f13;
  color: #f0f0f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 20px;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}
.sj-brand {
  font-size: 16px;
  font-weight: 700;
  color: #e91e63;
  margin-bottom: 24px;
}
.sj-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
}
.sj-icon { font-size: 48px; }
.sj-big { font-size: 22px; font-weight: 700; }
.sj-hint { font-size: 14px; color: #888; }
.sj-spinner {
  width: 36px; height: 36px;
  border: 3px solid rgba(255,255,255,0.1);
  border-top-color: #e91e63;
  border-radius: 50%;
  animation: sj-spin 0.8s linear infinite;
}
@keyframes sj-spin { to { transform: rotate(360deg); } }
.sj-error-text { font-size: 18px; font-weight: 600; color: #f44336; }

.sj-register {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  max-width: 400px;
}
.sj-input-row {
  display: flex;
  gap: 8px;
  width: 100%;
}
.sj-input {
  flex: 1;
  padding: 14px 16px;
  background: #1c1c24;
  border: 2px solid rgba(255,255,255,0.09);
  border-radius: 12px;
  color: #f0f0f5;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;
}
.sj-input:focus { border-color: #e91e63; }
.sj-btn {
  padding: 14px 24px;
  background: #e91e63;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}
.sj-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.sj-name-display {
  font-size: 28px;
  font-weight: 800;
  color: #e91e63;
  margin: 8px 0;
}
.sj-score-badge {
  padding: 8px 24px;
  border-radius: 20px;
  background: rgba(255,234,9,0.15);
  color: #ffea09;
  font-size: 18px;
  font-weight: 700;
}
.sj-score-final {
  font-size: 20px;
  font-weight: 700;
  color: #ffea09;
}
.sj-lobby-pulse {
  width: 12px; height: 12px;
  border-radius: 50%;
  background: #4caf50;
  animation: sj-pulse 1.5s ease-in-out infinite;
  margin-top: 12px;
}
@keyframes sj-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.5); }
}

/* Quiz */
.sj-quiz {
  flex: 1;
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.sj-quiz-timer {
  display: flex;
  align-items: center;
  gap: 10px;
}
.sj-timer-bar {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: rgba(255,255,255,0.1);
  overflow: hidden;
}
.sj-timer-fill {
  height: 100%;
  border-radius: 4px;
  background: #e91e63;
  transition: width 1s linear;
}
.sj-timer-num {
  font-size: 18px;
  font-weight: 700;
  color: #e91e63;
  min-width: 40px;
  text-align: right;
}
.sj-quiz-question {
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  padding: 20px;
  background: #1c1c24;
  border-radius: 14px;
  line-height: 1.4;
}
.sj-quiz-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.sj-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  border-radius: 12px;
  background: var(--opt-color);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.15s;
  text-align: left;
}
.sj-option:not(:disabled):hover {
  opacity: 0.9;
  transform: scale(1.02);
}
.sj-option:disabled { cursor: default; }
.sj-option.correct { border-color: #4caf50; box-shadow: 0 0 20px rgba(76,175,80,0.4); }
.sj-option.wrong { border-color: #f44336; opacity: 0.6; }
.sj-option.dimmed { opacity: 0.4; }
.sj-option-shape { font-size: 20px; }
.sj-option-text { flex: 1; }

.sj-answer-feedback {
  text-align: center;
  font-size: 24px;
  font-weight: 800;
  padding: 16px;
  border-radius: 12px;
  animation: sj-pop 0.3s ease-out;
}
.sj-answer-feedback.correct { background: rgba(76,175,80,0.15); color: #4caf50; }
.sj-answer-feedback.wrong { background: rgba(244,67,54,0.15); color: #f44336; }
@keyframes sj-pop { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.sj-room-code {
  margin-top: auto;
  padding-top: 20px;
  font-size: 12px;
  color: #555;
  letter-spacing: 1px;
}

@media (max-width: 400px) {
  .sj-quiz-options { grid-template-columns: 1fr; }
}
`;export{M as SessionJoinView};
