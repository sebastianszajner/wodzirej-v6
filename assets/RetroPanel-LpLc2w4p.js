import{j as r}from"./index-Sv356mhz.js";import{a}from"./qrcode-CmEn-Zwp.js";import{u as R}from"./useConfirmShake-BUj7TWv1.js";import"./firebase-BC1nocp_.js";const h={ssc:{label:"Zacznij / Przestań / Kontynuuj",columns:[{key:"start",label:"Zacznij",color:"#4caf50"},{key:"stop",label:"Przestań",color:"#e91e63"},{key:"continue",label:"Kontynuuj",color:"#2196f3"}]},gsm:{label:"Cieszę się / Smuci mnie / Złości mnie",columns:[{key:"glad",label:"Cieszę się",color:"#4caf50"},{key:"sad",label:"Smuci mnie",color:"#2196f3"},{key:"mad",label:"Złości mnie",color:"#e91e63"}]},"4l":{label:"4L: Podobało / Nauczyłem / Brakowało / Chcę więcej",columns:[{key:"liked",label:"Podobało się",color:"#4caf50"},{key:"learned",label:"Nauczyłem się",color:"#2196f3"},{key:"lacked",label:"Brakowało mi",color:"#ff9800"},{key:"longedfor",label:"Chcę więcej",color:"#9c27b0"}]}};let P=0;const T=()=>`rc-${++P}`;function E(){const[k,y]=a.useState("ssc"),[n,c]=a.useState([]),[d,p]=a.useState({}),[s,u]=a.useState(!1),m=R(),l=h[k],v=a.useCallback(e=>{const o=(d[e]||"").trim();o&&(c(t=>[...t,{id:T(),column:e,text:o,votes:0}]),p(t=>({...t,[e]:""})))},[d]),C=a.useCallback(e=>{c(o=>o.filter(t=>t.id!==e))},[]),N=a.useCallback(e=>{c(o=>o.map(t=>t.id===e?{...t,votes:t.votes+1}:t))},[]),j=a.useCallback(()=>{c([]),p({}),u(!1)},[]),z=a.useCallback(()=>{n.length!==0&&m.handleClick(j)},[n.length,m,j]),[b,f]=a.useState(null),S=a.useCallback(e=>{if(n.length===0){y(e);return}b===e?(y(e),c([]),p({}),u(!1),f(null)):(f(e),setTimeout(()=>f(null),3e3))},[n.length,b]),x=a.useMemo(()=>{const e={};for(const o of l.columns){const t=n.filter(i=>i.column===o.key);s&&t.sort((i,g)=>g.votes-i.votes),e[o.key]=t}return e},[n,l.columns,s]),$=a.useCallback(()=>{const e=[];s&&e.push(`[Tryb głosowania — posortowane wg głosów]
`);for(const o of l.columns){e.push(`## ${o.label}`);const t=x[o.key];if(t.length===0)e.push(`  (brak kart)
`);else{for(const i of t){const g=s?` [${i.votes} głosów]`:"";e.push(`  - ${i.text}${g}`)}e.push("")}}navigator.clipboard.writeText(e.join(`
`)).catch(()=>{})},[l.columns,x,s]),w=n.length;return r.jsxs("div",{className:"panel retro-panel",style:{overflow:"auto",padding:"16px",flex:1},children:[r.jsx("style",{children:F}),r.jsxs("div",{className:"retro-toolbar",children:[r.jsx("div",{className:"retro-format-btns",children:Object.keys(h).map(e=>r.jsx("button",{className:`btn sm ${e===k?"primary":""} ${b===e?"btn--confirm-shake":""}`,onClick:()=>S(e),children:h[e].label},e))}),r.jsxs("div",{className:"retro-toolbar-actions",children:[r.jsx("button",{className:`btn sm ${s?"primary":""}`,onClick:()=>u(e=>!e),children:s?"✓ Głosowanie":"Głosowanie"}),r.jsx("button",{className:"btn sm",onClick:$,disabled:w===0,children:"Kopiuj do schowka"}),r.jsx("button",{className:`btn sm danger ${m.className}`,onClick:z,disabled:w===0,children:m.pending?"Na pewno?":"Reset"})]})]}),r.jsx("div",{className:"retro-columns",style:{gridTemplateColumns:`repeat(${l.columns.length}, 1fr)`},children:l.columns.map(e=>r.jsxs("div",{className:"retro-column",children:[r.jsxs("div",{className:"retro-col-header",style:{background:e.color},children:[e.label,r.jsx("span",{className:"retro-col-count",children:x[e.key].length})]}),r.jsx("div",{className:"retro-col-cards",children:x[e.key].map(o=>r.jsxs("div",{className:"retro-card",children:[r.jsx("div",{className:"retro-card-text",children:o.text}),r.jsxs("div",{className:"retro-card-actions",children:[s&&r.jsxs("button",{className:"retro-vote-btn",onClick:()=>N(o.id),title:"Głosuj +1",children:[r.jsx("span",{className:"retro-vote-dot",style:{background:e.color}}),r.jsx("span",{className:"retro-vote-num",children:o.votes})]}),r.jsx("button",{className:"retro-del-btn",onClick:()=>C(o.id),title:"Usuń",children:"✕"})]})]},o.id))}),r.jsxs("div",{className:"retro-add-row",children:[r.jsx("input",{className:"retro-add-input",placeholder:"Dodaj kartę...",value:d[e.key]||"",onChange:o=>p(t=>({...t,[e.key]:o.target.value})),onKeyDown:o=>{o.key==="Enter"&&v(e.key)}}),r.jsx("button",{className:"retro-add-btn",style:{background:e.color},onClick:()=>v(e.key),disabled:!(d[e.key]||"").trim(),children:"+"})]})]},e.key))})]})}const F=`
.retro-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.retro-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
}
.retro-format-btns {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.retro-toolbar-actions {
  display: flex;
  gap: 6px;
}

.retro-columns {
  display: grid;
  gap: 10px;
  flex: 1;
  min-height: 0;
  align-items: start;
}

.retro-column {
  display: flex;
  flex-direction: column;
  background: var(--input-bg);
  border-radius: var(--radius);
  border: 1px solid var(--line);
  overflow: hidden;
}

.retro-col-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-weight: 700;
  font-size: 13px;
  color: #fff;
  letter-spacing: .3px;
}
.retro-col-count {
  font-size: 11px;
  background: rgba(0,0,0,.25);
  padding: 1px 7px;
  border-radius: 99px;
  font-weight: 600;
}

.retro-col-cards {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  min-height: 40px;
  max-height: 360px;
  overflow-y: auto;
}

.retro-card {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  background: var(--panel-bg);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 8px 10px;
  animation: retro-slide .2s ease-out;
}
@keyframes retro-slide {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.retro-card-text {
  flex: 1;
  font-size: 13px;
  line-height: 1.4;
  color: var(--txt-main);
  word-break: break-word;
}
.retro-card-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.retro-vote-btn {
  display: flex;
  align-items: center;
  gap: 3px;
  background: rgba(255,255,255,.06);
  border: none;
  border-radius: 6px;
  padding: 3px 7px;
  cursor: pointer;
  color: var(--txt-main);
  font-size: 12px;
  font-weight: 600;
}
.retro-vote-btn:hover { background: rgba(255,255,255,.12); }
.retro-vote-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.retro-vote-num { min-width: 12px; text-align: center; }
.retro-del-btn {
  background: none;
  border: none;
  color: var(--txt-muted);
  font-size: 11px;
  padding: 3px 5px;
  border-radius: 4px;
  cursor: pointer;
}
.retro-del-btn:hover { color: var(--accent); background: rgba(233,30,99,.15); }

.retro-add-row {
  display: flex;
  gap: 6px;
  padding: 8px;
  border-top: 1px solid var(--line);
}
.retro-add-input {
  flex: 1;
  padding: 6px 10px;
  background: var(--panel-bg);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--txt-main);
  font-size: 12px;
}
.retro-add-input::placeholder { color: var(--txt-muted); }
.retro-add-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}
.retro-add-btn:hover { filter: brightness(1.15); }
.retro-add-btn:disabled { opacity: .4; cursor: not-allowed; }

@media (max-width: 600px) {
  .retro-columns { grid-template-columns: 1fr 1fr !important; }
  .retro-col-cards { max-height: 200px; }
}
@media (max-width: 400px) {
  .retro-columns { grid-template-columns: 1fr !important; }
}
`;export{E as RetroPanel};
