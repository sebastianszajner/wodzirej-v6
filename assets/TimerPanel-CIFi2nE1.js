import{j as e}from"./index-ClsHm2el.js";import{a as n}from"./qrcode-CmEn-Zwp.js";import"./firebase-BC1nocp_.js";const Ce=[1,2,3,5,10,15];function he(){try{const t=new AudioContext,d=t.createOscillator(),r=t.createGain();d.connect(r),r.connect(t.destination),d.frequency.value=880,d.type="sine",r.gain.setValueAtTime(.5,t.currentTime),r.gain.exponentialRampToValueAtTime(.01,t.currentTime+.8),d.start(t.currentTime),d.stop(t.currentTime+.8);const m=t.createOscillator(),x=t.createGain();m.connect(x),x.connect(t.destination),m.frequency.value=1100,m.type="sine",x.gain.setValueAtTime(.5,t.currentTime+.3),x.gain.exponentialRampToValueAtTime(.01,t.currentTime+1.2),m.start(t.currentTime+.3),m.stop(t.currentTime+1.2);const h=t.createOscillator(),i=t.createGain();h.connect(i),i.connect(t.destination),h.frequency.value=1320,h.type="sine",i.gain.setValueAtTime(.6,t.currentTime+.7),i.gain.exponentialRampToValueAtTime(.01,t.currentTime+2),h.start(t.currentTime+.7),h.stop(t.currentTime+2)}catch{}}function fe(){try{const t=new AudioContext,d=t.createOscillator(),r=t.createGain();d.connect(r),r.connect(t.destination),d.frequency.value=660,d.type="sine",r.gain.setValueAtTime(.4,t.currentTime),r.gain.exponentialRampToValueAtTime(.01,t.currentTime+.5),d.start(t.currentTime),d.stop(t.currentTime+.5);const m=t.createOscillator(),x=t.createGain();m.connect(x),x.connect(t.destination),m.frequency.value=880,m.type="sine",x.gain.setValueAtTime(.4,t.currentTime+.25),x.gain.exponentialRampToValueAtTime(.01,t.currentTime+.8),m.start(t.currentTime+.25),m.stop(t.currentTime+.8)}catch{}}function G(t){const d=Math.floor(t/60),r=t%60;return`${String(d).padStart(2,"0")}:${String(r).padStart(2,"0")}`}function Pe(){const[t,d]=n.useState("timer"),[r,m]=n.useState(300),[x,h]=n.useState(300),[i,k]=n.useState("idle"),[L,Y]=n.useState(!1),[U,H]=n.useState(""),R=n.useRef(null),v=n.useRef(!1),[f,ge]=n.useState(25),[F,je]=n.useState(5),[b,ke]=n.useState(4),[g,V]=n.useState(1),[j,T]=n.useState("work"),[_,z]=n.useState(1500),[a,y]=n.useState("idle"),[J,N]=n.useState(1500),S=n.useRef(null),u=n.useCallback(()=>{R.current&&(clearInterval(R.current),R.current=null)},[]),p=n.useCallback(()=>{S.current&&(clearInterval(S.current),S.current=null)},[]),W=n.useCallback(()=>{h(s=>s<=1?(u(),k("finished"),v.current||(v.current=!0,he()),0):s-1)},[u]),Q=n.useRef(g),X=n.useRef(j),ee=n.useRef(b),te=n.useRef(f),ne=n.useRef(F);n.useEffect(()=>{Q.current=g},[g]),n.useEffect(()=>{X.current=j},[j]),n.useEffect(()=>{ee.current=b},[b]),n.useEffect(()=>{te.current=f},[f]),n.useEffect(()=>{ne.current=F},[F]);const O=n.useCallback(()=>{z(s=>{if(s<=1){const l=X.current,C=Q.current,A=ee.current;if(l==="work"){if(C>=A)return p(),y("finished"),he(),0;fe(),T("break");const E=ne.current*60;return N(E),E}else{fe(),V(we=>we+1),T("work");const E=te.current*60;return N(E),E}}return s-1})},[p]),se=n.useCallback(()=>{r<=0||(v.current=!1,h(r),k("running"),u(),R.current=setInterval(W,1e3))},[r,W,u]),ie=n.useCallback(()=>{u(),k("paused")},[u]),re=n.useCallback(()=>{k("running"),u(),R.current=setInterval(W,1e3)},[W,u]),$=n.useCallback(()=>{u(),h(r),k("idle"),v.current=!1},[r,u]),ae=s=>{u();const l=s*60;m(l),h(l),k("idle"),v.current=!1},ce=()=>{const s=parseInt(U,10);s>0&&s<=180&&(ae(s),H(""))},le=n.useCallback(()=>{const s=f*60;V(1),T("work"),z(s),N(s),y("running"),p(),S.current=setInterval(O,1e3)},[f,O,p]),oe=n.useCallback(()=>{p(),y("paused")},[p]),de=n.useCallback(()=>{y("running"),p(),S.current=setInterval(O,1e3)},[O,p]),D=n.useCallback(()=>{p();const s=f*60;V(1),T("work"),z(s),N(s),y("idle")},[f,p]);n.useEffect(()=>()=>{u(),p()},[u,p]);const c=t==="intervals",q=r>0?x/r:0,ve=Math.round(q*100);let B="#4caf50";q<=.25?B="#e91e63":q<=.5&&(B="#ffea09"),i==="finished"&&(B="#e91e63");const ue=J>0?_/J:0,ye=Math.round(ue*100),w=a==="finished"?"#e91e63":j==="work"?"#4caf50":"#2196f3",me=c?_:x,Ne=c?ue:q,P=c?w:B,K=c?a:i,o=L?320:200,I=L?10:8,M=(o-I)/2,Z=2*Math.PI*M,xe=Z*(1-Ne),pe=s=>{if(s===t)return;u(),p(),k("idle"),y("idle"),h(r);const l=f*60;V(1),T("work"),z(l),N(l),v.current=!1,d(s)};return L?e.jsxs("div",{className:"panel timer-panel",style:{overflow:"auto",padding:"16px",flex:1},children:[e.jsx("style",{children:be}),e.jsxs("div",{className:"timer-fullscreen-overlay",children:[e.jsx("button",{className:"btn timer-exit-fs",onClick:()=>Y(!1),title:"Zamknij pełny ekran",children:"×"}),c&&K!=="idle"&&e.jsxs("div",{className:"timer-int-phase-badge",style:{background:w},children:[j==="work"?"🔨 Praca":"☕ Przerwa"," — Runda ",g,"/",b]}),e.jsxs("div",{className:"timer-ring-wrap",style:{width:o,height:o},children:[e.jsxs("svg",{width:o,height:o,className:"timer-ring-svg",children:[e.jsx("circle",{cx:o/2,cy:o/2,r:M,fill:"none",stroke:"rgba(255,255,255,0.08)",strokeWidth:I}),e.jsx("circle",{cx:o/2,cy:o/2,r:M,fill:"none",stroke:P,strokeWidth:I,strokeLinecap:"round",strokeDasharray:Z,strokeDashoffset:xe,style:{transform:"rotate(-90deg)",transformOrigin:"50% 50%",transition:"stroke-dashoffset 0.4s linear, stroke 0.3s"}})]}),e.jsx("div",{className:"timer-ring-label",style:{color:P,fontSize:72},children:G(me)})]}),K==="finished"&&e.jsx("div",{className:"timer-finished-label",children:c?"Wszystkie rundy zakończone!":"Czas minął!"}),e.jsxs("div",{className:"timer-controls",style:{marginTop:32},children:[!c&&e.jsxs(e.Fragment,{children:[i==="idle"&&e.jsx("button",{className:"btn primary",onClick:se,children:"Start"}),i==="running"&&e.jsx("button",{className:"btn",onClick:ie,children:"Pauza"}),i==="paused"&&e.jsxs(e.Fragment,{children:[e.jsx("button",{className:"btn primary",onClick:re,children:"Wznów"}),e.jsx("button",{className:"btn",onClick:$,children:"Reset"})]}),i==="finished"&&e.jsx("button",{className:"btn",onClick:$,children:"Reset"})]}),c&&e.jsxs(e.Fragment,{children:[a==="idle"&&e.jsx("button",{className:"btn primary",onClick:le,children:"Start"}),a==="running"&&e.jsx("button",{className:"btn",onClick:oe,children:"Pauza"}),a==="paused"&&e.jsxs(e.Fragment,{children:[e.jsx("button",{className:"btn primary",onClick:de,children:"Wznów"}),e.jsx("button",{className:"btn",onClick:D,children:"Reset"})]}),a==="finished"&&e.jsx("button",{className:"btn",onClick:D,children:"Reset"})]})]})]})]}):e.jsxs("div",{className:"panel timer-panel",style:{overflow:"auto",padding:"16px",flex:1},children:[e.jsx("style",{children:be}),e.jsxs("div",{className:"timer-mode-toggle",children:[e.jsx("button",{className:`btn timer-mode-btn${t==="timer"?" active":""}`,onClick:()=>pe("timer"),children:"⏱️ Timer"}),e.jsx("button",{className:`btn timer-mode-btn${t==="intervals"?" active":""}`,onClick:()=>pe("intervals"),children:"🔄 Interwały"})]}),!c&&e.jsxs("div",{className:"timer-section",children:[e.jsx("div",{className:"timer-section-title",children:"Czas"}),e.jsxs("div",{className:"timer-presets",children:[Ce.map(s=>e.jsxs("button",{className:`btn timer-preset-btn${r===s*60&&i==="idle"?" active":""}`,onClick:()=>ae(s),disabled:i==="running",children:[s," min"]},s)),e.jsxs("div",{className:"timer-custom-row",children:[e.jsx("input",{type:"number",className:"timer-custom-input",placeholder:"min",min:1,max:180,value:U,onChange:s=>H(s.target.value),onKeyDown:s=>s.key==="Enter"&&ce(),disabled:i==="running"}),e.jsx("button",{className:"btn",onClick:ce,disabled:i==="running"||!U,children:"Ustaw"})]})]})]}),c&&e.jsxs("div",{className:"timer-section",children:[e.jsx("div",{className:"timer-section-title",children:"Ustawienia interwałów"}),e.jsxs("div",{className:"timer-int-config",children:[e.jsxs("div",{className:"timer-int-config-row",children:[e.jsx("label",{className:"timer-int-label",children:"🔨 Praca:"}),e.jsx("input",{type:"number",className:"timer-int-input",min:1,max:120,value:f,onChange:s=>{const l=Math.max(1,Math.min(120,parseInt(s.target.value)||1));ge(l),a==="idle"&&(z(l*60),N(l*60))},disabled:a==="running"}),e.jsx("span",{className:"timer-int-unit",children:"min"})]}),e.jsxs("div",{className:"timer-int-config-row",children:[e.jsx("label",{className:"timer-int-label",children:"☕ Przerwa:"}),e.jsx("input",{type:"number",className:"timer-int-input",min:1,max:60,value:F,onChange:s=>{const l=Math.max(1,Math.min(60,parseInt(s.target.value)||1));je(l)},disabled:a==="running"}),e.jsx("span",{className:"timer-int-unit",children:"min"})]}),e.jsxs("div",{className:"timer-int-config-row",children:[e.jsx("label",{className:"timer-int-label",children:"🔁 Rundy:"}),e.jsx("input",{type:"number",className:"timer-int-input",min:1,max:20,value:b,onChange:s=>{const l=Math.max(1,Math.min(20,parseInt(s.target.value)||1));ke(l)},disabled:a==="running"})]})]})]}),c&&a!=="idle"&&e.jsxs("div",{className:"timer-int-phase-bar",style:{background:`${w}22`,borderColor:w},children:[e.jsx("span",{className:"timer-int-phase-label",style:{color:w},children:j==="work"?"🔨 Praca":"☕ Przerwa"}),e.jsxs("span",{className:"timer-int-round-label",children:["Runda ",g,"/",b]})]}),e.jsxs("div",{className:"timer-display-area",children:[e.jsxs("div",{className:"timer-ring-wrap",style:{width:o,height:o},children:[e.jsxs("svg",{width:o,height:o,className:"timer-ring-svg",children:[e.jsx("circle",{cx:o/2,cy:o/2,r:M,fill:"none",stroke:"rgba(255,255,255,0.08)",strokeWidth:I}),e.jsx("circle",{cx:o/2,cy:o/2,r:M,fill:"none",stroke:P,strokeWidth:I,strokeLinecap:"round",strokeDasharray:Z,strokeDashoffset:xe,style:{transform:"rotate(-90deg)",transformOrigin:"50% 50%",transition:"stroke-dashoffset 0.4s linear, stroke 0.3s"}})]}),e.jsx("div",{className:"timer-ring-label",style:{color:P},children:G(me)})]}),K==="finished"&&e.jsx("div",{className:"timer-finished-label",children:c?"Wszystkie rundy zakończone!":"Czas minął!"})]}),e.jsx("div",{className:"timer-progress-bar-wrap",children:e.jsx("div",{className:"timer-progress-bar",style:{width:`${c?ye:ve}%`,background:P}})}),c&&a!=="idle"&&e.jsx("div",{className:"timer-int-round-dots",children:Array.from({length:b},(s,l)=>{const C=l+1;let A="rgba(255,255,255,0.1)";return C<g?A="#4caf50":C===g&&(A=w),e.jsx("div",{className:`timer-int-dot${C===g?" current":""}`,style:{background:A},title:`Runda ${C}`},l)})}),e.jsxs("div",{className:"timer-controls",children:[!c&&e.jsxs(e.Fragment,{children:[i==="idle"&&e.jsx("button",{className:"btn primary",onClick:se,disabled:r<=0,children:"Start"}),i==="running"&&e.jsx("button",{className:"btn",onClick:ie,children:"Pauza"}),i==="paused"&&e.jsxs(e.Fragment,{children:[e.jsx("button",{className:"btn primary",onClick:re,children:"Wznów"}),e.jsx("button",{className:"btn",onClick:$,children:"Reset"})]}),i==="finished"&&e.jsx("button",{className:"btn",onClick:$,children:"Reset"})]}),c&&e.jsxs(e.Fragment,{children:[a==="idle"&&e.jsx("button",{className:"btn primary",onClick:le,children:"Start"}),a==="running"&&e.jsx("button",{className:"btn",onClick:oe,children:"Pauza"}),a==="paused"&&e.jsxs(e.Fragment,{children:[e.jsx("button",{className:"btn primary",onClick:de,children:"Wznów"}),e.jsx("button",{className:"btn",onClick:D,children:"Reset"})]}),a==="finished"&&e.jsx("button",{className:"btn",onClick:D,children:"Reset"})]}),e.jsx("button",{className:"btn timer-fs-btn",onClick:()=>Y(!0),title:"Pełny ekran",children:"⛶"})]}),e.jsxs("div",{className:"timer-info",children:[!c&&e.jsxs(e.Fragment,{children:[i==="idle"&&e.jsx("span",{children:"Wybierz czas i naciśnij Start"}),i==="running"&&e.jsx("span",{children:"Odliczam..."}),i==="paused"&&e.jsxs("span",{children:["Zatrzymano — ",G(x)," zostało"]}),i==="finished"&&e.jsx("span",{children:"Koniec! Czas minął."})]}),c&&e.jsxs(e.Fragment,{children:[a==="idle"&&e.jsx("span",{children:"Ustaw interwały i naciśnij Start"}),a==="running"&&e.jsxs("span",{children:[j==="work"?"Pracujesz":"Odpoczywasz"," — runda ",g,"/",b]}),a==="paused"&&e.jsxs("span",{children:["Pauza — ",G(_)," zostało (",j==="work"?"praca":"przerwa",")"]}),a==="finished"&&e.jsxs("span",{children:["Ukończono wszystkie ",b," rund!"]})]})]})]})}const be=`
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
`;export{Pe as TimerPanel};
