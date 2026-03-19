import{j as r}from"./index-DnvNkKCw.js";import{a as i}from"./qrcode-CmEn-Zwp.js";import{u as D}from"./useConfirmShake-BUj7TWv1.js";import"./firebase-BC1nocp_.js";let P=0;const B=()=>`ag-${++P}`;function q(){try{const t=new AudioContext,s=t.createOscillator(),o=t.createGain();s.connect(o),o.connect(t.destination),s.frequency.value=660,s.type="sine",o.gain.setValueAtTime(.3,t.currentTime),o.gain.exponentialRampToValueAtTime(.01,t.currentTime+.6),s.start(t.currentTime),s.stop(t.currentTime+.6),setTimeout(()=>t.close(),1e3)}catch{}}function V(){try{const t=new AudioContext;for(let s=0;s<2;s++){const o=t.createOscillator(),d=t.createGain();o.connect(d),d.connect(t.destination),o.frequency.value=880,o.type="square";const c=t.currentTime+s*.25;d.gain.setValueAtTime(.4,c),d.gain.exponentialRampToValueAtTime(.01,c+.2),o.start(c),o.stop(c+.2)}setTimeout(()=>t.close(),1e3)}catch{}}function O(){try{const t=new AudioContext;[523,659,784].forEach((o,d)=>{const c=t.createOscillator(),g=t.createGain();c.connect(g),g.connect(t.destination),c.frequency.value=o,c.type="sine";const u=t.currentTime+d*.15;g.gain.setValueAtTime(.3,u),g.gain.exponentialRampToValueAtTime(.01,u+.8),c.start(u),c.stop(u+.8)}),setTimeout(()=>t.close(),2e3)}catch{}}function f(t){const s=Math.floor(t/3600),o=Math.floor(t%3600/60),d=t%60;return s>0?`${s}:${o.toString().padStart(2,"0")}:${d.toString().padStart(2,"0")}`:`${o}:${d.toString().padStart(2,"0")}`}function G(t){return t.toLocaleTimeString("pl-PL",{hour:"2-digit",minute:"2-digit"})}function Z(){const[t,s]=i.useState([]),[o,d]=i.useState(""),[c,g]=i.useState(""),[u,A]=i.useState(!0),h=D(),v=i.useRef(null),b=i.useRef({});i.useEffect(()=>{if(u)for(const e of t){if(e.status!=="active"&&e.status!=="done")continue;b.current[e.id]||(b.current[e.id]={warn5:!1,warn1:!1,done:!1});const n=b.current[e.id],a=e.duration*60-e.elapsed;a<=300&&a>60&&!n.warn5&&e.duration>5&&(n.warn5=!0,q()),a<=60&&a>0&&!n.warn1&&e.duration>1&&(n.warn1=!0,V()),a<=0&&!n.done&&(n.done=!0,O())}},[t,u]),i.useEffect(()=>{const e=t.find(n=>n.status==="active");return e&&(v.current=setInterval(()=>{s(n=>n.map(a=>{if(a.id!==e.id||a.status!=="active")return a;const l=a.elapsed+1;return l>=a.duration*60?{...a,elapsed:l,status:"done"}:{...a,elapsed:l}}))},1e3)),()=>{v.current&&clearInterval(v.current)}},[t.find(e=>e.status==="active")?.id]),i.useEffect(()=>{if(t.some(a=>a.status==="active"))return;const n=t.findIndex((a,l)=>{if(a.status!=="done")return!1;const p=t[l+1];return p&&p.status==="pending"});if(n>=0){const a=t[n];a.elapsed>=a.duration*60&&s(l=>l.map((p,M)=>M===n+1?{...p,status:"active"}:p))}},[t]);const w=i.useCallback(()=>{const e=o.trim(),n=parseInt(c,10);!e||!n||n<=0||(s(a=>[...a,{id:B(),title:e,duration:n,status:"pending",elapsed:0}]),d(""),g(""))},[o,c]),T=i.useCallback(e=>{s(n=>n.map(a=>a.id===e?{...a,status:"active",elapsed:0}:a.status==="active"?{...a,status:"done"}:a))},[]),z=i.useCallback(e=>{s(n=>{const a=n.findIndex(l=>l.id===e);return a<0?n:n.map((l,p)=>p===a?{...l,status:"done"}:p===a+1&&l.status==="pending"?{...l,status:"active"}:l)})},[]),$=i.useCallback(e=>{s(n=>n.filter(a=>a.id!==e))},[]),S=i.useCallback(e=>{e<=0||s(n=>{const a=[...n];return[a[e-1],a[e]]=[a[e],a[e-1]],a})},[]),E=i.useCallback(e=>{s(n=>{if(e>=n.length-1)return n;const a=[...n];return[a[e],a[e+1]]=[a[e+1],a[e]],a})},[]),y=i.useCallback(()=>{s([])},[]),I=i.useCallback(()=>{t.length!==0&&h.handleClick(y)},[t.length,h,y]),m=i.useMemo(()=>t.reduce((e,n)=>e+n.duration*60,0),[t]),x=i.useMemo(()=>t.reduce((e,n)=>e+n.elapsed,0),[t]),k=m>0?Math.min(100,x/m*100):0,R=i.useMemo(()=>{const e=new Date,n=m-x;return new Date(e.getTime()+n*1e3)},[m,x]),j=m-x,N=j>0,C=t.some(e=>e.status==="active");return r.jsxs("div",{className:"panel agenda-panel",style:{overflow:"auto",padding:"16px",flex:1},children:[r.jsx("style",{children:U}),t.length>0&&r.jsxs("div",{className:"ag-progress-section",children:[r.jsxs("div",{className:"ag-progress-info",children:[r.jsxs("span",{className:"ag-progress-label",children:["Postęp dnia: ",f(x)," / ",f(m)]}),r.jsx("span",{className:`ag-progress-eta ${!N&&C?"behind":""}`,children:C?N?`Planowany koniec: ${G(R)}`:`Przekroczono czas o ${f(Math.abs(j))}`:`Zaplanowano: ${f(m)}`})]}),r.jsx("div",{className:"ag-progress-bar",children:r.jsx("div",{className:`ag-progress-fill ${k>=100?"over":""}`,style:{width:`${Math.min(100,k)}%`}})})]}),r.jsxs("div",{className:"ag-add-row",children:[r.jsx("input",{className:"ag-title-input",placeholder:"Tytuł bloku...",value:o,onChange:e=>d(e.target.value),onKeyDown:e=>{e.key==="Enter"&&w()}}),r.jsxs("div",{className:"ag-dur-wrap",children:[r.jsx("input",{className:"ag-dur-input",type:"number",min:1,max:480,placeholder:"min",value:c,onChange:e=>g(e.target.value),onKeyDown:e=>{e.key==="Enter"&&w()}}),r.jsx("span",{className:"ag-dur-unit",children:"min"})]}),r.jsx("button",{className:"btn primary",onClick:w,disabled:!o.trim()||!c||parseInt(c)<=0,children:"Dodaj blok"}),r.jsx("button",{className:`btn danger ${h.className}`,onClick:I,disabled:t.length===0,children:h.pending?"Na pewno?":"Reset"}),r.jsx("button",{className:`ag-alarm-toggle ${u?"on":"off"}`,onClick:()=>A(e=>!e),title:u?"Alarmy czasowe włączone":"Alarmy czasowe wyłączone",children:u?"🔔":"🔕"})]}),t.length===0?r.jsxs("div",{className:"ag-empty",children:[r.jsx("div",{className:"ag-empty-icon",children:"📋"}),r.jsx("p",{children:"Dodaj bloki, aby zbudować agendę dnia"})]}):r.jsx("div",{className:"ag-timeline",children:t.map((e,n)=>{const a=e.duration*60,l=a>0?Math.min(100,e.elapsed/a*100):0,p=e.elapsed>a;return r.jsxs("div",{className:`ag-block ag-block--${e.status}`,children:[r.jsxs("div",{className:"ag-block-icon",children:[e.status==="done"&&r.jsx("span",{className:"ag-icon-done",children:"✓"}),e.status==="active"&&r.jsx("span",{className:"ag-icon-active"}),e.status==="pending"&&r.jsx("span",{className:"ag-icon-pending"})]}),r.jsxs("div",{className:"ag-block-content",children:[r.jsxs("div",{className:"ag-block-header",children:[r.jsx("span",{className:"ag-block-title",children:e.title}),r.jsx("span",{className:"ag-block-dur",children:e.status==="active"||e.status==="done"?`${f(e.elapsed)} / ${e.duration} min`:`${e.duration} min`})]}),(e.status==="active"||e.status==="done")&&r.jsx("div",{className:"ag-block-bar",children:r.jsx("div",{className:`ag-block-bar-fill ${p?"over":""}`,style:{width:`${Math.min(100,l)}%`}})})]}),r.jsxs("div",{className:"ag-block-actions",children:[e.status==="pending"&&r.jsx("button",{className:"btn sm primary",onClick:()=>T(e.id),children:"Start"}),e.status==="active"&&r.jsx("button",{className:"btn sm",onClick:()=>z(e.id),children:"Zakończ ▸"}),r.jsxs("div",{className:"ag-reorder",children:[r.jsx("button",{className:"ag-arrow",onClick:()=>S(n),disabled:n===0,title:"W górę",children:"▲"}),r.jsx("button",{className:"ag-arrow",onClick:()=>E(n),disabled:n===t.length-1,title:"W dół",children:"▼"})]}),r.jsx("button",{className:"ag-remove",onClick:()=>$(e.id),title:"Usuń blok",children:"✕"})]})]},e.id)})})]})}const U=`
.agenda-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Progress section */
.ag-progress-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ag-progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.ag-progress-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--txt-muted);
  text-transform: uppercase;
  letter-spacing: .3px;
}
.ag-progress-eta {
  font-size: 12px;
  color: var(--green);
  font-weight: 600;
}
.ag-progress-eta.behind {
  color: var(--accent);
}
.ag-progress-bar {
  height: 6px;
  background: var(--input-bg);
  border-radius: 99px;
  overflow: hidden;
  border: 1px solid var(--line);
}
.ag-progress-fill {
  height: 100%;
  background: var(--green);
  border-radius: 99px;
  transition: width .5s ease;
}
.ag-progress-fill.over {
  background: var(--accent);
}

/* Add row */
.ag-add-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.ag-title-input {
  flex: 1;
  padding: 8px 14px;
  background: var(--input-bg);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  color: var(--txt-main);
  font-size: 13px;
}
.ag-title-input::placeholder { color: var(--txt-muted); }
.ag-dur-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--input-bg);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 0 10px 0 0;
}
.ag-dur-input {
  width: 56px;
  padding: 8px 8px 8px 14px;
  background: transparent;
  border: none;
  color: var(--txt-main);
  font-size: 13px;
  text-align: center;
}
.ag-dur-input::placeholder { color: var(--txt-muted); }
.ag-dur-unit {
  font-size: 11px;
  color: var(--txt-muted);
  font-weight: 600;
}

/* Empty */
.ag-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--txt-muted);
  padding: 40px 0;
}
.ag-empty-icon { font-size: 48px; margin-bottom: 8px; }

/* Timeline */
.ag-timeline {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ag-block {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--input-bg);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  transition: all .2s;
  animation: ag-appear .25s ease-out;
}
@keyframes ag-appear {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.ag-block--active {
  border-color: var(--green);
  box-shadow: 0 0 16px rgba(76,175,80,.12);
}
.ag-block--done {
  opacity: .55;
}

/* Status icons */
.ag-block-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ag-icon-done {
  width: 22px; height: 22px;
  background: var(--green);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
  color: #fff;
}
.ag-icon-active {
  width: 18px; height: 18px;
  background: var(--green);
  border-radius: 50%;
  animation: ag-pulse 1.2s ease-in-out infinite;
}
@keyframes ag-pulse {
  0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(76,175,80,.4); }
  50%      { opacity: .8; transform: scale(1.15); box-shadow: 0 0 8px 4px rgba(76,175,80,.15); }
}
.ag-icon-pending {
  width: 14px; height: 14px;
  border: 2px solid var(--txt-muted);
  border-radius: 50%;
  opacity: .4;
}

/* Block content */
.ag-block-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ag-block-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  justify-content: space-between;
}
.ag-block-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--txt-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ag-block-dur {
  font-size: 12px;
  color: var(--txt-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.ag-block-bar {
  height: 4px;
  background: rgba(255,255,255,.06);
  border-radius: 99px;
  overflow: hidden;
}
.ag-block-bar-fill {
  height: 100%;
  background: var(--green);
  border-radius: 99px;
  transition: width .5s ease;
}
.ag-block-bar-fill.over { background: var(--accent); }

/* Actions */
.ag-block-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.ag-reorder {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.ag-arrow {
  background: none;
  border: none;
  color: var(--txt-muted);
  font-size: 9px;
  padding: 1px 4px;
  cursor: pointer;
  border-radius: 3px;
  line-height: 1;
}
.ag-arrow:hover { color: var(--txt-main); background: rgba(255,255,255,.08); }
.ag-arrow:disabled { opacity: .3; cursor: not-allowed; }
.ag-remove {
  background: none;
  border: none;
  color: var(--txt-muted);
  font-size: 12px;
  padding: 3px 6px;
  cursor: pointer;
  border-radius: 4px;
}
.ag-remove:hover { color: var(--accent); background: rgba(233,30,99,.15); }

/* Alarm toggle */
.ag-alarm-toggle {
  background: none;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  font-size: 16px;
  padding: 6px 10px;
  cursor: pointer;
  transition: all .2s;
  line-height: 1;
}
.ag-alarm-toggle.on {
  border-color: var(--green);
  background: rgba(76,175,80,.1);
}
.ag-alarm-toggle.off {
  opacity: .5;
}
.ag-alarm-toggle:hover { opacity: 1; }
`;export{Z as AgendaPanel};
