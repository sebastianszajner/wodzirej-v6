import{j as e,g as K,o as V,i as Z,c as _,a as A}from"./index-DzGGB2Bn.js";import{Q as J,a}from"./qrcode-CmEn-Zwp.js";import{u as U}from"./useConfirmShake-BUj7TWv1.js";import"./firebase-BC1nocp_.js";function Y({roomId:r,wordCount:d,onClose:p}){const x=K(r);return e.jsxs("div",{className:"live-overlay",children:[e.jsx("style",{children:B}),e.jsxs("div",{className:"live-header",children:[e.jsxs("div",{className:"live-badge",children:[e.jsx("span",{className:"live-dot"}),"LIVE"]}),e.jsxs("span",{className:"live-room-label",children:["Pokój: ",e.jsx("strong",{children:r})]}),e.jsx("button",{className:"live-close-btn",onClick:p,title:"Zakończ sesję",children:"✕ Zakończ"})]}),e.jsxs("div",{className:"live-body",children:[e.jsxs("div",{className:"live-qr-card",children:[e.jsx("div",{className:"live-qr-wrapper",children:e.jsx(J,{value:x,size:220,bgColor:"#ffffff",fgColor:"#0f0f13",level:"M",includeMargin:!0})}),e.jsxs("div",{className:"live-qr-text",children:[e.jsx("p",{className:"live-qr-instruction",children:"Zeskanuj kod QR telefonem"}),e.jsx("p",{className:"live-qr-or",children:"lub wejdź na:"}),e.jsx("p",{className:"live-qr-url",children:x})]})]}),e.jsx("div",{className:"live-stats",children:e.jsxs("div",{className:"live-stat",children:[e.jsx("span",{className:"live-stat-value",children:d}),e.jsx("span",{className:"live-stat-label",children:d===1?"słowo":d<5?"słowa":"słów"})]})})]})]})}const B=`
.live-overlay {
  background: rgba(15, 15, 19, 0.95);
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid rgba(233, 30, 99, 0.3);
}
.live-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.live-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(244, 67, 54, 0.15);
  color: #f44336;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
}
.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f44336;
  animation: live-pulse 1.5s ease-in-out infinite;
}
@keyframes live-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.live-room-label {
  font-size: 14px;
  color: var(--txt-muted);
}
.live-close-btn {
  margin-left: auto;
  padding: 6px 14px;
  border-radius: 8px;
  background: rgba(244, 67, 54, 0.12);
  color: #f44336;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid rgba(244, 67, 54, 0.2);
  transition: all 0.15s;
}
.live-close-btn:hover {
  background: rgba(244, 67, 54, 0.25);
}
.live-body {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
}
.live-qr-card {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: center;
}
.live-qr-wrapper {
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}
.live-qr-text {
  text-align: left;
}
.live-qr-instruction {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
}
.live-qr-or {
  font-size: 13px;
  color: var(--txt-muted);
  margin-bottom: 4px;
}
.live-qr-url {
  font-size: 12px;
  color: var(--accent);
  word-break: break-all;
  font-family: monospace;
  background: var(--input-bg);
  padding: 6px 10px;
  border-radius: 8px;
  max-width: 320px;
}
.live-stats {
  display: flex;
  gap: 16px;
}
.live-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 20px;
  background: var(--panel-bg);
  border-radius: 12px;
}
.live-stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--accent);
}
.live-stat-label {
  font-size: 12px;
  color: var(--txt-muted);
}
`,R=["#e91e63","#ffea09","#4caf50","#2196f3","#ff9800","#9c27b0","#00bcd4","#ff5722","#8bc34a","#e040fb"],I=["0deg","-12deg","12deg","0deg","-8deg","8deg"];let G=0;const W=()=>`wc-${++G}`,w="wodzirej-live-room";function H(){try{const r=localStorage.getItem(w);return r?JSON.parse(r):null}catch{return null}}function X(r,d){localStorage.setItem(w,JSON.stringify({roomId:r,question:d}))}function ee(){localStorage.removeItem(w)}function se(){const r=H(),[d,p]=a.useState([]),[x,b]=a.useState(""),[l,h]=a.useState(r?.question||""),j=a.useRef(null),m=U(),[t,y]=a.useState(r?"live":"local"),[u,k]=a.useState(r?.roomId||null),[v,g]=a.useState([]),[N,z]=a.useState(!1),[S,f]=a.useState(null),$=Z();a.useEffect(()=>{if(t!=="live"||!u)return;const o=V(u,i=>{g(i)});return()=>o()},[t,u]),a.useEffect(()=>{j.current?.focus()},[]);const s=t==="live"?v:d,C=a.useCallback(()=>{const o=x.trim().toLowerCase();o&&(p(i=>i.find(c=>c.word===o)?i.map(c=>c.word===o?{...c,count:c.count+1}:c):[...i,{id:W(),word:o,count:1}]),b(""))},[x]),q=a.useCallback(o=>{t!=="live"&&p(i=>i.map(n=>n.id===o?{...n,count:n.count+1}:n))},[t]),M=a.useCallback(o=>{t!=="live"&&p(i=>i.filter(n=>n.id!==o))},[t]),L=a.useCallback(()=>{p([]),h("")},[]),O=a.useCallback(()=>{s.length!==0&&m.handleClick(L)},[s.length,m,L]),Q=async()=>{if(!l.trim()){f("Wpisz pytanie przed rozpoczęciem sesji live");return}z(!0),f(null);try{const o=await A(l.trim());k(o),y("live"),g([]),X(o,l.trim())}catch(o){f(o instanceof Error?o.message:"Błąd połączenia z Firebase")}finally{z(!1)}},E=async()=>{if(u)try{await _(u)}catch{}ee(),p(v.map(o=>({...o,id:W()}))),y("local"),k(null),g([])},T=a.useMemo(()=>Math.max(1,...s.map(o=>o.count)),[s]),D=a.useMemo(()=>[...s].sort((o,i)=>i.count-o.count),[s]);return e.jsxs("div",{className:"panel wordcloud-panel",style:{overflow:"auto",padding:"16px",flex:1},children:[e.jsx("style",{children:oe}),$&&e.jsxs("div",{className:"wc-mode-toggle",children:[e.jsx("button",{className:`wc-mode-btn ${t==="local"?"active":""}`,onClick:()=>{t==="live"&&E()},disabled:t==="local",children:"✏️ Lokalnie"}),e.jsx("button",{className:`wc-mode-btn wc-mode-live ${t==="live"?"active":""}`,onClick:()=>{t==="local"&&Q()},disabled:t==="live"||N,children:N?"⏳ Łączenie...":"📡 Live (QR)"})]}),S&&e.jsx("div",{className:"wc-live-error",children:S}),t==="live"&&u&&e.jsx(Y,{roomId:u,wordCount:v.length,onClose:E}),t==="local"&&e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"wc-question-row",children:e.jsx("input",{className:"wc-question-input",placeholder:"Pytanie: np. Czym jest dla Was przywództwo?",value:l,onChange:o=>h(o.target.value)})}),l&&e.jsx("div",{className:"wc-question-display",children:l})]}),t==="live"&&l&&e.jsx("div",{className:"wc-question-display",children:l}),t==="local"&&e.jsxs("div",{className:"wc-input-row",children:[e.jsx("input",{ref:j,className:"wc-word-input",placeholder:"Wpisz słowo...",value:x,onChange:o=>b(o.target.value),onKeyDown:o=>{o.key==="Enter"&&C()}}),e.jsx("button",{className:"btn primary",onClick:C,disabled:!x.trim(),children:"Dodaj"}),e.jsx("button",{className:`btn danger ${m.className}`,onClick:O,disabled:s.length===0,children:m.pending?"Na pewno?":"Reset"})]}),e.jsxs("div",{className:"wc-body",children:[e.jsx("div",{className:"wc-cloud-area",children:s.length===0?e.jsxs("div",{className:"wc-empty",children:[e.jsx("span",{className:"wc-empty-icon",children:"☁️"}),e.jsx("p",{children:t==="live"?"Czekam na odpowiedzi uczestników...":"Dodaj słowa, aby zobaczyć chmurę"})]}):e.jsx("div",{className:"wc-cloud",children:s.map((o,i)=>{const c=14+o.count/T*48,P=R[i%R.length],F=I[i%I.length];return e.jsx("span",{className:"wc-word",style:{fontSize:`${c}px`,color:P,transform:`rotate(${F})`,animationDelay:`${i*40}ms`},title:`${o.word}: ${o.count}×`,onClick:()=>q(o.id),children:o.word},o.id)})})}),s.length>0&&e.jsxs("div",{className:"wc-sidebar",children:[e.jsxs("div",{className:"wc-sidebar-title",children:["Słowa (",s.length,")"]}),e.jsx("div",{className:"wc-word-list",children:D.map(o=>e.jsxs("div",{className:"wc-word-item",children:[e.jsx("span",{className:"wc-word-text",onClick:()=>q(o.id),title:t==="local"?"Kliknij, aby dodać +1":void 0,children:o.word}),e.jsxs("span",{className:"wc-word-count",children:[o.count,"×"]}),t==="local"&&e.jsx("button",{className:"wc-word-remove",onClick:()=>M(o.id),title:"Usuń",children:"✕"})]},o.id))})]})]})]})}const oe=`
.wordcloud-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Mode toggle */
.wc-mode-toggle {
  display: flex;
  gap: 4px;
  background: var(--input-bg);
  border-radius: 10px;
  padding: 3px;
  width: fit-content;
}
.wc-mode-btn {
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--txt-muted);
  background: transparent;
  transition: all 0.15s;
  cursor: pointer;
}
.wc-mode-btn.active {
  background: var(--panel-bg);
  color: var(--txt-main);
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
}
.wc-mode-btn:not(.active):hover {
  color: var(--txt-main);
}
.wc-mode-live.active {
  color: #f44336;
}
.wc-live-error {
  padding: 8px 12px;
  background: rgba(244, 67, 54, 0.12);
  color: #f44336;
  border-radius: 8px;
  font-size: 13px;
}

.wc-question-row {
  display: flex;
}
.wc-question-input {
  flex: 1;
  padding: 8px 14px;
  background: var(--input-bg);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  color: var(--txt-main);
  font-size: 13px;
}
.wc-question-input::placeholder { color: var(--txt-muted); }
.wc-question-display {
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  color: var(--accent2);
  padding: 8px 0 0;
}

.wc-input-row {
  display: flex;
  gap: 8px;
}
.wc-word-input {
  flex: 1;
  padding: 8px 14px;
  background: var(--input-bg);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  color: var(--txt-main);
  font-size: 14px;
}
.wc-word-input::placeholder { color: var(--txt-muted); }

.wc-body {
  display: flex;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

.wc-cloud-area {
  flex: 1;
  min-height: 200px;
  background: var(--input-bg);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.wc-empty {
  text-align: center;
  color: var(--txt-muted);
}
.wc-empty-icon { font-size: 48px; display: block; margin-bottom: 8px; }

.wc-cloud {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px 16px;
  padding: 24px;
  max-height: 100%;
  overflow: auto;
}
.wc-word {
  display: inline-block;
  font-weight: 700;
  cursor: pointer;
  transition: transform .15s, opacity .15s;
  user-select: none;
  animation: wc-pop .3s ease-out both;
  line-height: 1.2;
}
.wc-word:hover {
  opacity: .7;
  transform: scale(1.12) !important;
}

@keyframes wc-pop {
  from { opacity: 0; transform: scale(0.3); }
  to   { opacity: 1; }
}

.wc-sidebar {
  width: 180px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.wc-sidebar-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--txt-muted);
  text-transform: uppercase;
  letter-spacing: .5px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--line);
}
.wc-word-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  flex: 1;
}
.wc-word-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 8px;
  background: var(--input-bg);
}
.wc-word-text {
  flex: 1;
  font-size: 13px;
  cursor: pointer;
  color: var(--txt-main);
}
.wc-word-text:hover { color: var(--accent); }
.wc-word-count {
  font-size: 11px;
  color: var(--txt-muted);
  font-weight: 600;
  min-width: 24px;
  text-align: right;
}
.wc-word-remove {
  background: none;
  border: none;
  color: var(--txt-muted);
  font-size: 11px;
  padding: 2px 4px;
  border-radius: 4px;
  cursor: pointer;
}
.wc-word-remove:hover { color: var(--accent); background: rgba(233,30,99,.15); }

@media (max-width: 700px) {
  .wc-body { flex-direction: column; }
  .wc-sidebar { width: 100%; max-height: 150px; }
}
`;export{se as WordCloudPanel};
