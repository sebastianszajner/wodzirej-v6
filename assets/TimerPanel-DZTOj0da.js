import{j as e}from"./index-DzGGB2Bn.js";import{a as n}from"./qrcode-CmEn-Zwp.js";import"./firebase-BC1nocp_.js";const Ce=[1,2,3,5,10,15];function he(){try{const t=new AudioContext,d=t.createOscillator(),i=t.createGain();d.connect(i),i.connect(t.destination),d.frequency.value=880,d.type="sine",i.gain.setValueAtTime(.5,t.currentTime),i.gain.exponentialRampToValueAtTime(.01,t.currentTime+.8),d.start(t.currentTime),d.stop(t.currentTime+.8);const m=t.createOscillator(),p=t.createGain();m.connect(p),p.connect(t.destination),m.frequency.value=1100,m.type="sine",p.gain.setValueAtTime(.5,t.currentTime+.3),p.gain.exponentialRampToValueAtTime(.01,t.currentTime+1.2),m.start(t.currentTime+.3),m.stop(t.currentTime+1.2);const h=t.createOscillator(),r=t.createGain();h.connect(r),r.connect(t.destination),h.frequency.value=1320,h.type="sine",r.gain.setValueAtTime(.6,t.currentTime+.7),r.gain.exponentialRampToValueAtTime(.01,t.currentTime+2),h.start(t.currentTime+.7),h.stop(t.currentTime+2)}catch{}}function fe(){try{const t=new AudioContext,d=t.createOscillator(),i=t.createGain();d.connect(i),i.connect(t.destination),d.frequency.value=660,d.type="sine",i.gain.setValueAtTime(.4,t.currentTime),i.gain.exponentialRampToValueAtTime(.01,t.currentTime+.5),d.start(t.currentTime),d.stop(t.currentTime+.5);const m=t.createOscillator(),p=t.createGain();m.connect(p),p.connect(t.destination),m.frequency.value=880,m.type="sine",p.gain.setValueAtTime(.4,t.currentTime+.25),p.gain.exponentialRampToValueAtTime(.01,t.currentTime+.8),m.start(t.currentTime+.25),m.stop(t.currentTime+.8)}catch{}}function F(t){const d=Math.floor(t/60),i=t%60;return`${String(d).padStart(2,"0")}:${String(i).padStart(2,"0")}`}function Pe(){const[t,d]=n.useState("timer"),[i,m]=n.useState(300),[p,h]=n.useState(300),[r,v]=n.useState("idle"),[_,H]=n.useState(!1),[K,J]=n.useState(""),R=n.useRef(null),y=n.useRef(!1),[f,be]=n.useState(25),[S,je]=n.useState(5),[g,ke]=n.useState(4),[b,V]=n.useState(1),[j,P]=n.useState("work"),[Z,I]=n.useState(1500),[c,N]=n.useState("idle"),[Q,w]=n.useState(1500),M=n.useRef(null),u=n.useCallback(()=>{R.current&&(clearInterval(R.current),R.current=null)},[]),x=n.useCallback(()=>{M.current&&(clearInterval(M.current),M.current=null)},[]),O=n.useCallback(()=>{h(s=>s<=1?(u(),v("finished"),y.current||(y.current=!0,he()),0):s-1)},[u]),X=n.useRef(b),ee=n.useRef(j),te=n.useRef(g),ne=n.useRef(f),se=n.useRef(S);n.useEffect(()=>{X.current=b},[b]),n.useEffect(()=>{ee.current=j},[j]),n.useEffect(()=>{te.current=g},[g]),n.useEffect(()=>{ne.current=f},[f]),n.useEffect(()=>{se.current=S},[S]);const D=n.useCallback(()=>{I(s=>{if(s<=1){const a=ee.current,T=X.current,$=te.current;if(a==="work"){if(T>=$)return x(),N("finished"),he(),0;fe(),P("break");const W=se.current*60;return w(W),W}else{fe(),V(we=>we+1),P("work");const W=ne.current*60;return w(W),W}}return s-1})},[x]),ie=n.useCallback(()=>{i<=0||(y.current=!1,h(i),v("running"),u(),R.current=setInterval(O,1e3))},[i,O,u]),re=n.useCallback(()=>{u(),v("paused")},[u]),ae=n.useCallback(()=>{v("running"),u(),R.current=setInterval(O,1e3)},[O,u]),L=n.useCallback(()=>{u(),h(i),v("idle"),y.current=!1},[i,u]),ce=s=>{u();const a=s*60;m(a),h(a),v("idle"),y.current=!1},le=()=>{const s=parseInt(K,10);s>0&&s<=180&&(ce(s),J(""))},oe=n.useCallback(()=>{const s=f*60;V(1),P("work"),I(s),w(s),N("running"),x(),M.current=setInterval(D,1e3)},[f,D,x]),de=n.useCallback(()=>{x(),N("paused")},[x]),ue=n.useCallback(()=>{N("running"),x(),M.current=setInterval(D,1e3)},[D,x]),U=n.useCallback(()=>{x();const s=f*60;V(1),P("work"),I(s),w(s),N("idle")},[f,x]);n.useEffect(()=>()=>{u(),x()},[u,x]);const l=t==="intervals",G=i>0?p/i:0,ve=Math.round(G*100);let q="#4caf50";G<=.25?q="#e91e63":G<=.5&&(q="#ffea09"),r==="finished"&&(q="#e91e63");const me=Q>0?Z/Q:0,ye=Math.round(me*100),C=c==="finished"?"#e91e63":j==="work"?"#4caf50":"#2196f3",B=l?Z:p,Ne=l?me:G,z=l?C:q,k=l?c:r,o=_?320:200,A=_?10:8,E=(o-A)/2,Y=2*Math.PI*E,pe=Y*(1-Ne),xe=s=>{if(s===t)return;u(),x(),v("idle"),N("idle"),h(i);const a=f*60;V(1),P("work"),I(a),w(a),y.current=!1,d(s)};return _?e.jsxs("div",{className:"panel timer-panel",style:{overflow:"auto",padding:"16px",flex:1},children:[e.jsx("style",{children:ge}),e.jsxs("div",{className:"timer-fullscreen-overlay",children:[e.jsx("button",{className:"btn timer-exit-fs",onClick:()=>H(!1),title:"Zamknij pełny ekran",children:"×"}),l&&k!=="idle"&&e.jsxs("div",{className:"timer-int-phase-badge",style:{background:C},children:[j==="work"?"🔨 Praca":"☕ Przerwa"," — Runda ",b,"/",g]}),e.jsxs("div",{className:"timer-ring-wrap",style:{width:o,height:o},children:[e.jsxs("svg",{width:o,height:o,className:"timer-ring-svg",children:[e.jsx("circle",{cx:o/2,cy:o/2,r:E,fill:"none",stroke:"rgba(255,255,255,0.08)",strokeWidth:A}),e.jsx("circle",{cx:o/2,cy:o/2,r:E,fill:"none",stroke:z,strokeWidth:A,strokeLinecap:"round",strokeDasharray:Y,strokeDashoffset:pe,style:{transform:"rotate(-90deg)",transformOrigin:"50% 50%",transition:"stroke-dashoffset 0.4s linear, stroke 0.3s"}})]}),e.jsx("div",{className:"timer-ring-label",style:{color:z,fontSize:72},children:F(B)})]}),k==="finished"&&e.jsx("div",{className:"timer-finished-label",children:l?"Wszystkie rundy zakończone!":"Czas minął!"}),e.jsxs("div",{className:"timer-controls",style:{marginTop:32},children:[!l&&e.jsxs(e.Fragment,{children:[r==="idle"&&e.jsx("button",{className:"btn primary",onClick:ie,children:"Start"}),r==="running"&&e.jsx("button",{className:"btn",onClick:re,children:"Pauza"}),r==="paused"&&e.jsxs(e.Fragment,{children:[e.jsx("button",{className:"btn primary",onClick:ae,children:"Wznów"}),e.jsx("button",{className:"btn",onClick:L,children:"Reset"})]}),r==="finished"&&e.jsx("button",{className:"btn",onClick:L,children:"Reset"})]}),l&&e.jsxs(e.Fragment,{children:[c==="idle"&&e.jsx("button",{className:"btn primary",onClick:oe,children:"Start"}),c==="running"&&e.jsx("button",{className:"btn",onClick:de,children:"Pauza"}),c==="paused"&&e.jsxs(e.Fragment,{children:[e.jsx("button",{className:"btn primary",onClick:ue,children:"Wznów"}),e.jsx("button",{className:"btn",onClick:U,children:"Reset"})]}),c==="finished"&&e.jsx("button",{className:"btn",onClick:U,children:"Reset"})]})]})]})]}):e.jsxs("div",{className:"panel timer-panel",style:{overflow:"auto",padding:"16px",flex:1},children:[e.jsx("style",{children:ge}),e.jsxs("div",{className:"timer-mode-toggle",children:[e.jsxs("button",{className:`btn timer-mode-btn${t==="timer"?" active":""}`,onClick:()=>xe("timer"),children:["⏱️ Timer",t==="timer"&&e.jsx("span",{style:{fontSize:10,opacity:.7,marginLeft:4},children:"●"})]}),e.jsxs("button",{className:`btn timer-mode-btn${t==="intervals"?" active":""}`,onClick:()=>xe("intervals"),children:["🔄 Interwały",t==="intervals"&&e.jsx("span",{style:{fontSize:10,opacity:.7,marginLeft:4},children:"●"})]})]}),!l&&e.jsxs("div",{className:"timer-section",children:[e.jsxs("div",{className:"timer-section-title",children:["Czas",r==="idle"&&e.jsxs("span",{style:{marginLeft:8,color:"var(--accent)",fontWeight:700},children:["→ ",F(i)]})]}),e.jsxs("div",{className:"timer-presets",children:[Ce.map(s=>{const a=i===s*60;return e.jsxs("button",{className:`btn timer-preset-btn${a?" active":""}`,onClick:()=>ce(s),disabled:r==="running",style:a?{background:"var(--accent)",color:"#fff",borderColor:"var(--accent)",boxShadow:"0 0 12px rgba(233,30,99,0.4)",transform:"scale(1.05)"}:void 0,children:[s," min"]},s)}),e.jsxs("div",{className:"timer-custom-row",children:[e.jsx("input",{type:"number",className:"timer-custom-input",placeholder:"min",min:1,max:180,value:K,onChange:s=>J(s.target.value),onKeyDown:s=>s.key==="Enter"&&le(),disabled:r==="running"}),e.jsx("button",{className:"btn",onClick:le,disabled:r==="running"||!K,children:"Ustaw"})]})]})]}),l&&e.jsxs("div",{className:"timer-section",children:[e.jsx("div",{className:"timer-section-title",children:"Ustawienia interwałów"}),e.jsxs("div",{className:"timer-int-config",children:[e.jsxs("div",{className:"timer-int-config-row",children:[e.jsx("label",{className:"timer-int-label",children:"🔨 Praca:"}),e.jsx("input",{type:"number",className:"timer-int-input",min:1,max:120,value:f,onChange:s=>{const a=Math.max(1,Math.min(120,parseInt(s.target.value)||1));be(a),c==="idle"&&(I(a*60),w(a*60))},disabled:c==="running"}),e.jsx("span",{className:"timer-int-unit",children:"min"})]}),e.jsxs("div",{className:"timer-int-config-row",children:[e.jsx("label",{className:"timer-int-label",children:"☕ Przerwa:"}),e.jsx("input",{type:"number",className:"timer-int-input",min:1,max:60,value:S,onChange:s=>{const a=Math.max(1,Math.min(60,parseInt(s.target.value)||1));je(a)},disabled:c==="running"}),e.jsx("span",{className:"timer-int-unit",children:"min"})]}),e.jsxs("div",{className:"timer-int-config-row",children:[e.jsx("label",{className:"timer-int-label",children:"🔁 Rundy:"}),e.jsx("input",{type:"number",className:"timer-int-input",min:1,max:20,value:g,onChange:s=>{const a=Math.max(1,Math.min(20,parseInt(s.target.value)||1));ke(a)},disabled:c==="running"})]})]})]}),l&&c!=="idle"&&e.jsxs("div",{className:"timer-int-phase-bar",style:{background:`${C}22`,borderColor:C},children:[e.jsx("span",{className:"timer-int-phase-label",style:{color:C},children:j==="work"?"🔨 Praca":"☕ Przerwa"}),e.jsxs("span",{className:"timer-int-round-label",children:["Runda ",b,"/",g]})]}),e.jsxs("div",{className:"timer-display-area",children:[e.jsxs("div",{className:"timer-ring-wrap",style:{width:o,height:o},children:[e.jsxs("svg",{width:o,height:o,className:"timer-ring-svg",children:[e.jsx("circle",{cx:o/2,cy:o/2,r:E,fill:"none",stroke:"rgba(255,255,255,0.08)",strokeWidth:A}),e.jsx("circle",{cx:o/2,cy:o/2,r:E,fill:"none",stroke:z,strokeWidth:A,strokeLinecap:"round",strokeDasharray:Y,strokeDashoffset:pe,style:{transform:"rotate(-90deg)",transformOrigin:"50% 50%",transition:"stroke-dashoffset 0.4s linear, stroke 0.3s"}})]}),e.jsxs("div",{className:`timer-ring-label${k==="running"&&B<=30?" timer-ring-label--warning":""}${k==="running"&&B<=10?" timer-ring-label--critical":""}`,style:{color:z},children:[F(B),k==="idle"&&e.jsx("div",{style:{fontSize:11,color:"var(--txt-muted)",marginTop:2},children:l?`${f}m praca / ${S}m przerwa`:"Gotowy"}),k==="running"&&e.jsx("div",{style:{fontSize:11,color:z,marginTop:2,opacity:.7},children:l?j==="work"?"🔨 Praca":"☕ Przerwa":"▶ Odliczam"}),k==="paused"&&e.jsx("div",{style:{fontSize:11,color:"#ffea09",marginTop:2},children:"⏸ Pauza"})]})]}),k==="finished"&&e.jsx("div",{className:"timer-finished-label",style:{animation:"ptsPop 0.5s var(--ease-bounce)"},children:l?"🎉 Wszystkie rundy zakończone!":"🔔 Czas minął!"})]}),e.jsx("div",{className:"timer-progress-bar-wrap",children:e.jsx("div",{className:"timer-progress-bar",style:{width:`${l?ye:ve}%`,background:z}})}),l&&c!=="idle"&&e.jsx("div",{className:"timer-int-round-dots",children:Array.from({length:g},(s,a)=>{const T=a+1;let $="rgba(255,255,255,0.1)";return T<b?$="#4caf50":T===b&&($=C),e.jsx("div",{className:`timer-int-dot${T===b?" current":""}`,style:{background:$},title:`Runda ${T}`},a)})}),e.jsxs("div",{className:"timer-controls",children:[!l&&e.jsxs(e.Fragment,{children:[r==="idle"&&e.jsx("button",{className:"btn primary",onClick:ie,disabled:i<=0,children:"Start"}),r==="running"&&e.jsx("button",{className:"btn",onClick:re,children:"Pauza"}),r==="paused"&&e.jsxs(e.Fragment,{children:[e.jsx("button",{className:"btn primary",onClick:ae,children:"Wznów"}),e.jsx("button",{className:"btn",onClick:L,children:"Reset"})]}),r==="finished"&&e.jsx("button",{className:"btn",onClick:L,children:"Reset"})]}),l&&e.jsxs(e.Fragment,{children:[c==="idle"&&e.jsx("button",{className:"btn primary",onClick:oe,children:"Start"}),c==="running"&&e.jsx("button",{className:"btn",onClick:de,children:"Pauza"}),c==="paused"&&e.jsxs(e.Fragment,{children:[e.jsx("button",{className:"btn primary",onClick:ue,children:"Wznów"}),e.jsx("button",{className:"btn",onClick:U,children:"Reset"})]}),c==="finished"&&e.jsx("button",{className:"btn",onClick:U,children:"Reset"})]}),e.jsx("button",{className:"btn timer-fs-btn",onClick:()=>H(!0),title:"Pełny ekran",children:"⛶"})]}),e.jsxs("div",{className:"timer-info",children:[!l&&e.jsxs(e.Fragment,{children:[r==="idle"&&e.jsx("span",{children:"Wybierz czas i naciśnij Start"}),r==="running"&&e.jsx("span",{children:"Odliczam..."}),r==="paused"&&e.jsxs("span",{children:["Zatrzymano — ",F(p)," zostało"]}),r==="finished"&&e.jsx("span",{children:"Koniec! Czas minął."})]}),l&&e.jsxs(e.Fragment,{children:[c==="idle"&&e.jsx("span",{children:"Ustaw interwały i naciśnij Start"}),c==="running"&&e.jsxs("span",{children:[j==="work"?"Pracujesz":"Odpoczywasz"," — runda ",b,"/",g]}),c==="paused"&&e.jsxs("span",{children:["Pauza — ",F(Z)," zostało (",j==="work"?"praca":"przerwa",")"]}),c==="finished"&&e.jsxs("span",{children:["Ukończono wszystkie ",g," rund!"]})]})]})]})}const ge=`
.timer-mode-toggle {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}
.timer-mode-btn {
  flex: 1;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  background: var(--input-bg);
  color: var(--txt-muted);
  transition: all 0.2s;
  border: 2px solid transparent;
}
.timer-mode-btn.active {
  background: rgba(233, 30, 99, 0.15);
  color: var(--accent);
  border-color: var(--accent);
}
.timer-mode-btn:hover:not(.active) {
  background: rgba(255,255,255,0.08);
}
.timer-int-config {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0;
}
.timer-int-config-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.timer-int-label {
  font-size: 13px;
  color: var(--txt-muted);
  min-width: 90px;
}
.timer-int-input {
  width: 60px;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.1);
  background: var(--input-bg);
  color: var(--txt-main);
  font-size: 14px;
  text-align: center;
  outline: none;
}
.timer-int-input:focus {
  border-color: var(--accent);
}
.timer-int-unit {
  font-size: 12px;
  color: var(--txt-muted);
}
.timer-int-phase-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  border-radius: 10px;
  border: 2px solid;
  margin-bottom: 12px;
}
.timer-int-phase-label {
  font-weight: 700;
  font-size: 15px;
}
.timer-int-round-label {
  font-size: 13px;
  color: var(--txt-muted);
  font-weight: 600;
}
.timer-int-phase-badge {
  padding: 8px 20px;
  border-radius: 24px;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 16px;
}
.timer-int-round-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 8px 0;
}
.timer-int-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  transition: all 0.3s;
}
.timer-int-dot.current {
  box-shadow: 0 0 8px rgba(255,255,255,0.3);
  transform: scale(1.2);
}
@keyframes timerUrgent {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.5; }
}
.timer-ring-label--warning {
  animation: timerUrgent 1s ease-in-out infinite;
}
.timer-ring-label--critical {
  animation: timerUrgent 0.4s ease-in-out infinite;
}
.timer-preset-btn {
  transition: all 0.2s ease;
}
.timer-preset-btn.active {
  font-weight: 700;
}
`;export{Pe as TimerPanel};
