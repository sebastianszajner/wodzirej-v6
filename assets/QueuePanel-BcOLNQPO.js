import{u as D,l as W,j as t,F as K}from"./index-DzGGB2Bn.js";import{a as n}from"./qrcode-CmEn-Zwp.js";import"./firebase-BC1nocp_.js";let L=0;const T=()=>`q-${++L}`;function m(x){const r=Math.floor(x/60),c=x%60;return`${r}:${c.toString().padStart(2,"0")}`}function X(){const x=n.useRef(null),r=D(e=>e.participants),[c,u]=n.useState([]),[o,y]=n.useState(null),[p,f]=n.useState(0),[g,h]=n.useState(!1),[d,k]=n.useState([]),q=n.useRef(null);n.useEffect(()=>(o&&!g?q.current=setInterval(()=>f(e=>e+1),1e3):q.current&&clearInterval(q.current),()=>{q.current&&clearInterval(q.current)}),[o,g]);const I=n.useCallback(e=>{const a=r.find(i=>i.id===e);a&&u(i=>[...i,{id:T(),participantId:e,name:a.text}])},[r]),w=n.useCallback(()=>{if(o&&k(e=>[...e,{participantId:o.participantId,name:o.name,duration:p}]),c.length>0){const[e,...a]=c;y(e),u(a),f(0),h(!1)}else y(null),f(0),h(!1)},[o,p,c]),C=n.useCallback(()=>{o&&(k(e=>[...e,{participantId:o.participantId,name:o.name,duration:p}]),W({participantId:o.participantId,panel:"queue",action:"spoke",data:{duration:p}}),y(null),f(0),h(!1))},[o,p]),S=n.useCallback(()=>{if(r.length===0)return;const e=r[Math.floor(Math.random()*r.length)];u(a=>[...a,{id:T(),participantId:e.id,name:e.text}])},[r]),M=n.useCallback(e=>{e<=0||u(a=>{const i=[...a];return[i[e-1],i[e]]=[i[e],i[e-1]],i})},[]),R=n.useCallback(e=>{u(a=>{if(e>=a.length-1)return a;const i=[...a];return[i[e],i[e+1]]=[i[e+1],i[e]],i})},[]),$=n.useCallback(e=>{u(a=>a.filter(i=>i.id!==e))},[]),N=n.useMemo(()=>{const e={};for(const a of d)e[a.participantId]||(e[a.participantId]={name:a.name,count:0,totalTime:0}),e[a.participantId].count+=1,e[a.participantId].totalTime+=a.duration;return Object.values(e).sort((a,i)=>i.count-a.count)},[d]),[z,E]=n.useState(!1),l=n.useMemo(()=>{if(d.length===0)return null;const e={},a={};for(const s of r)e[s.id]=0,a[s.id]=0;for(const s of d)e[s.participantId]=(e[s.participantId]||0)+s.duration,a[s.participantId]=(a[s.participantId]||0)+1;const i=r.map(s=>({id:s.id,name:s.text||s.first,totalTime:e[s.id]||0,turns:a[s.id]||0,avgPerTurn:a[s.id]>0?Math.round((e[s.id]||0)/a[s.id]):0})),b=Math.max(...i.map(s=>s.totalTime),1),j=i.reduce((s,B)=>s+B.totalTime,0),P=r.length>0?j/r.length:0,v=i.filter(s=>s.totalTime>0).map(s=>s.totalTime),Q=v.length>=2?Math.min(...v)/Math.max(...v):v.length===1?1:0;return{entries:i,maxTime:b,avgTime:P,equityScore:Q}},[d,r]),F=r.length===0;return t.jsxs("div",{className:"panel queue-panel",ref:x,style:{overflow:"auto",padding:"16px",flex:1},children:[t.jsx("style",{children:O}),t.jsx("div",{style:{display:"flex",justifyContent:"flex-end",marginBottom:8},children:t.jsx(K,{targetRef:x})}),F?t.jsxs("div",{className:"q-empty",children:[t.jsx("div",{className:"q-empty-icon",children:"🎤"}),t.jsx("p",{children:"Dodaj uczestników, aby użyć kolejki mówców"})]}):t.jsxs("div",{className:"q-layout",children:[t.jsxs("div",{className:"q-main",children:[t.jsx("div",{className:`q-speaker-box ${o?"active":""}`,children:o?t.jsxs(t.Fragment,{children:[t.jsx("div",{className:"q-speaker-label",children:"Mówi teraz"}),t.jsx("div",{className:"q-speaker-name",children:o.name}),t.jsx("div",{className:`q-speaker-timer ${g?"paused":""}`,children:m(p)}),t.jsxs("div",{className:"q-speaker-controls",children:[t.jsx("button",{className:"btn sm",onClick:()=>h(e=>!e),children:g?"▶ Wznów":"⏸ Pauza"}),t.jsx("button",{className:"btn sm primary",onClick:w,children:"Następny ▸"}),t.jsx("button",{className:"btn sm danger",onClick:C,children:"■ Stop"})]})]}):t.jsxs(t.Fragment,{children:[t.jsx("div",{className:"q-speaker-label",children:"Brak mówcy"}),t.jsx("div",{className:"q-speaker-name",style:{color:"var(--txt-muted)"},children:"—"}),c.length>0&&t.jsx("button",{className:"btn primary",onClick:w,children:"Rozpocznij ▸"})]})}),t.jsxs("div",{className:"q-add-section",children:[t.jsx("div",{className:"q-add-title",children:"Dodaj do kolejki"}),t.jsxs("div",{className:"q-add-grid",children:[r.map(e=>t.jsx("button",{className:"q-add-btn",onClick:()=>I(e.id),title:e.text,children:e.first},e.id)),t.jsx("button",{className:"q-add-btn q-random-btn",onClick:S,title:"Losuj uczestnika",children:"🎲 Losuj"})]})]}),t.jsxs("div",{className:"q-queue-section",children:[t.jsxs("div",{className:"q-queue-title",children:["Kolejka (",c.length,")"]}),c.length===0?t.jsx("div",{className:"q-queue-empty",children:"Kolejka jest pusta"}):t.jsx("div",{className:"q-queue-list",children:c.map((e,a)=>t.jsxs("div",{className:"q-queue-item",children:[t.jsx("span",{className:"q-queue-num",children:a+1}),t.jsx("span",{className:"q-queue-name",children:e.name}),t.jsxs("div",{className:"q-queue-actions",children:[t.jsx("button",{className:"q-queue-arrow",onClick:()=>M(a),disabled:a===0,title:"W górę",children:"▲"}),t.jsx("button",{className:"q-queue-arrow",onClick:()=>R(a),disabled:a===c.length-1,title:"W dół",children:"▼"}),t.jsx("button",{className:"q-queue-remove",onClick:()=>$(e.id),title:"Usuń",children:"✕"})]})]},e.id))})]})]}),t.jsxs("div",{className:"q-sidebar",children:[N.length>0&&t.jsxs("div",{className:"q-stats-section",children:[t.jsx("div",{className:"q-section-title",children:"Kto ile razy mówił"}),t.jsx("div",{className:"q-stats-list",children:N.map(e=>t.jsxs("div",{className:"q-stat-row",children:[t.jsx("span",{className:"q-stat-name",children:e.name}),t.jsxs("span",{className:"q-stat-count",children:[e.count,"×"]}),t.jsx("span",{className:"q-stat-time",children:m(e.totalTime)})]},e.name))})]}),l&&t.jsxs("div",{className:"q-equity-section",children:[t.jsx("button",{className:"q-equity-toggle",onClick:()=>E(e=>!e),children:t.jsxs("span",{children:[z?"▾":"▸"," 📊 Równość głosu"]})}),z&&t.jsxs("div",{className:"q-equity-list",children:[t.jsxs("div",{className:"q-equity-score-row",children:[t.jsx("span",{className:"q-equity-score-label",children:"Wskaźnik równości"}),t.jsx("span",{className:`q-equity-score-value ${l.equityScore>=.7?"good":l.equityScore>=.4?"mid":"low"}`,children:l.equityScore.toFixed(2)})]}),t.jsxs("div",{className:"q-equity-avg-label",children:["Średnia: ",m(Math.round(l.avgTime))]}),l.entries.map(e=>{const a=l.maxTime>0?e.totalTime/l.maxTime*100:0,i=l.avgTime>0?Math.abs(e.totalTime-l.avgTime)/l.avgTime:0,b=e.totalTime===0?"#666":i<=.2?"#4caf50":i<=.5?"#ff9800":"#f44336",j=e.totalTime===0;return t.jsxs("div",{className:"q-equity-row",children:[t.jsxs("div",{className:"q-equity-name",children:[j&&t.jsx("span",{title:"Nie wypowiedział(a) się",style:{marginRight:3},children:"⚠️"}),e.name]}),t.jsxs("div",{className:"q-equity-bar-wrap",children:[t.jsx("div",{className:"q-equity-bar",style:{width:`${Math.max(a,2)}%`,background:b}}),l.maxTime>0&&t.jsx("div",{className:"q-equity-avg-line",style:{left:`${l.avgTime/l.maxTime*100}%`}})]}),t.jsxs("div",{className:"q-equity-detail",children:[t.jsx("span",{className:"q-equity-time",children:m(e.totalTime)}),t.jsxs("span",{className:"q-equity-turns",title:"Liczba wypowiedzi",children:[e.turns,"×"]}),e.turns>0&&t.jsxs("span",{className:"q-equity-avg-turn",title:"Średni czas wypowiedzi",children:["~",m(e.avgPerTurn)]})]})]},e.id)})]})]}),t.jsxs("div",{className:"q-history-section",children:[t.jsxs("div",{className:"q-section-title",children:["Historia (",d.length,")"]}),d.length===0?t.jsx("div",{className:"q-history-empty",children:"Brak historii"}):t.jsx("div",{className:"q-history-list",children:[...d].reverse().map((e,a)=>t.jsxs("div",{className:"q-history-item",children:[t.jsx("span",{className:"q-history-name",children:e.name}),t.jsx("span",{className:"q-history-dur",children:m(e.duration)})]},`${e.participantId}-${a}`))})]})]})]})]})}const O=`
.queue-panel {
  display: flex;
  flex-direction: column;
}

.q-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--txt-muted);
}
.q-empty-icon { font-size: 48px; margin-bottom: 8px; }

.q-layout {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.q-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.q-sidebar {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

/* Speaker box */
.q-speaker-box {
  background: var(--input-bg);
  border: 2px solid var(--line);
  border-radius: var(--radius);
  padding: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: border-color .3s;
}
.q-speaker-box.active {
  border-color: var(--green);
  box-shadow: 0 0 20px rgba(76,175,80,.15);
}
.q-speaker-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--txt-muted);
  font-weight: 700;
}
.q-speaker-name {
  font-size: 28px;
  font-weight: 800;
  color: var(--txt-main);
  letter-spacing: -.3px;
}
.q-speaker-timer {
  font-size: 36px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--green);
  letter-spacing: 1px;
}
.q-speaker-timer.paused {
  color: var(--accent2);
  animation: q-blink 1s ease-in-out infinite;
}
@keyframes q-blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: .4; }
}
.q-speaker-controls {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

/* Add to queue */
.q-add-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.q-add-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--txt-muted);
  font-weight: 700;
}
.q-add-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.q-add-btn {
  padding: 5px 10px;
  font-size: 12px;
  background: var(--input-bg);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--txt-main);
  cursor: pointer;
  transition: background .15s;
}
.q-add-btn:hover { background: rgba(255,255,255,.08); }
.q-random-btn {
  border-color: var(--accent);
  color: var(--accent);
}
.q-random-btn:hover { background: rgba(233,30,99,.12); }

/* Queue list */
.q-queue-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-height: 0;
}
.q-queue-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--txt-muted);
  font-weight: 700;
}
.q-queue-empty {
  color: var(--txt-muted);
  font-size: 12px;
  padding: 8px 0;
}
.q-queue-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}
.q-queue-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--input-bg);
  border: 1px solid var(--line);
  border-radius: 8px;
  animation: q-slide .2s ease-out;
}
@keyframes q-slide {
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
}
.q-queue-num {
  font-size: 11px;
  font-weight: 700;
  color: var(--txt-muted);
  min-width: 18px;
  text-align: center;
}
.q-queue-name {
  flex: 1;
  font-size: 13px;
  color: var(--txt-main);
}
.q-queue-actions {
  display: flex;
  gap: 2px;
}
.q-queue-arrow {
  background: none;
  border: none;
  color: var(--txt-muted);
  font-size: 10px;
  padding: 2px 4px;
  cursor: pointer;
  border-radius: 4px;
}
.q-queue-arrow:hover { color: var(--txt-main); background: rgba(255,255,255,.08); }
.q-queue-arrow:disabled { opacity: .3; cursor: not-allowed; }
.q-queue-remove {
  background: none;
  border: none;
  color: var(--txt-muted);
  font-size: 11px;
  padding: 2px 5px;
  cursor: pointer;
  border-radius: 4px;
}
.q-queue-remove:hover { color: var(--accent); background: rgba(233,30,99,.15); }

/* Sidebar sections */
.q-section-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--txt-muted);
  font-weight: 700;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--line);
}

.q-stats-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.q-stats-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.q-stat-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: var(--input-bg);
  border-radius: 6px;
  font-size: 12px;
}
.q-stat-name { flex: 1; color: var(--txt-main); }
.q-stat-count { color: var(--accent); font-weight: 700; min-width: 24px; text-align: right; }
.q-stat-time { color: var(--txt-muted); font-variant-numeric: tabular-nums; min-width: 36px; text-align: right; }

.q-history-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-height: 0;
}
.q-history-empty {
  color: var(--txt-muted);
  font-size: 12px;
}
.q-history-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow-y: auto;
}
.q-history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background: var(--input-bg);
  border-radius: 6px;
  font-size: 12px;
}
.q-history-name { color: var(--txt-main); }
.q-history-dur { color: var(--txt-muted); font-variant-numeric: tabular-nums; }

/* Equity metrics */
.q-equity-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.q-equity-toggle {
  background: none;
  border: none;
  color: var(--txt-muted);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .5px;
  font-weight: 700;
  cursor: pointer;
  text-align: left;
  padding: 4px 0;
  border-bottom: 1px solid var(--line);
}
.q-equity-toggle:hover { color: var(--txt-main); }
.q-equity-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.q-equity-avg-label {
  font-size: 10px;
  color: var(--txt-muted);
  text-align: right;
  padding: 0 2px;
}
.q-equity-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}
.q-equity-name {
  min-width: 56px;
  max-width: 56px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--txt-main);
}
.q-equity-bar-wrap {
  flex: 1;
  height: 10px;
  background: rgba(255,255,255,.05);
  border-radius: 5px;
  position: relative;
  overflow: hidden;
}
.q-equity-bar {
  height: 100%;
  border-radius: 5px;
  transition: width .3s;
}
.q-equity-avg-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(255,255,255,.4);
  pointer-events: none;
}
.q-equity-detail {
  display: flex;
  gap: 4px;
  align-items: center;
  flex-shrink: 0;
}
.q-equity-time {
  min-width: 32px;
  text-align: right;
  color: var(--txt-muted);
  font-variant-numeric: tabular-nums;
}
.q-equity-turns {
  font-size: 10px;
  color: var(--accent);
  font-weight: 700;
  min-width: 18px;
  text-align: right;
}
.q-equity-avg-turn {
  font-size: 10px;
  color: var(--txt-muted);
  opacity: .7;
  min-width: 28px;
  text-align: right;
}
.q-equity-score-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 6px;
  background: var(--input-bg);
  border-radius: 6px;
  margin-bottom: 2px;
}
.q-equity-score-label {
  font-size: 10px;
  color: var(--txt-muted);
  font-weight: 600;
}
.q-equity-score-value {
  font-size: 14px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.q-equity-score-value.good { color: #4caf50; }
.q-equity-score-value.mid  { color: #ff9800; }
.q-equity-score-value.low  { color: #f44336; }

@media (max-width: 600px) {
  .q-layout { flex-direction: column; gap: 8px; }
  .q-sidebar { width: 100%; max-height: 180px; flex-shrink: 1; }
  .q-speaker-name { font-size: 22px !important; }
}
`;export{X as QueuePanel};
