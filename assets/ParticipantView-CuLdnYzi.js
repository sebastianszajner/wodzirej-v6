import{t as y,v as z,j as e,w as N}from"./index-DnvNkKCw.js";import{a as s}from"./qrcode-CmEn-Zwp.js";import"./firebase-BC1nocp_.js";function P({roomId:o}){const[r,a]=s.useState("loading"),[h,v]=s.useState(""),[g,x]=s.useState(""),[d,l]=s.useState(""),[n,b]=s.useState([]),[p,u]=s.useState(!1),m=s.useRef(null);s.useEffect(()=>{let t=null;return(async()=>{try{const i=await y(o);if(!i.ok){a("error"),x(i.reason);return}v(i.question),a("ready"),t=z(o,c=>{c==="closed"&&a("closed")})}catch{a("error"),x("Nie udało się połączyć z sesją")}})(),()=>{t?.()}},[o]);const f=async()=>{const t=d.trim();if(!(!t||p)){u(!0);try{const i=new Promise((c,w)=>setTimeout(()=>w(new Error("timeout")),1e4));await Promise.race([N(o,t),i]),b(c=>[t,...c]),l(""),m.current?.focus()}catch{l(t)}finally{u(!1)}}},j=t=>{t.key==="Enter"&&(t.preventDefault(),f())};return e.jsxs("div",{className:"pv-container",children:[e.jsx("style",{children:S}),e.jsx("div",{className:"pv-brand",children:"🎡 Wodzirej"}),r==="loading"&&e.jsxs("div",{className:"pv-center",children:[e.jsx("div",{className:"pv-spinner"}),e.jsx("p",{children:"Łączenie z sesją..."})]}),r==="error"&&e.jsxs("div",{className:"pv-center",children:[e.jsx("div",{className:"pv-icon",children:"❌"}),e.jsx("p",{className:"pv-error-text",children:g}),e.jsx("p",{className:"pv-hint",children:"Sprawdź kod pokoju i spróbuj ponownie"})]}),r==="closed"&&e.jsxs("div",{className:"pv-center",children:[e.jsx("div",{className:"pv-icon",children:"🏁"}),e.jsx("p",{className:"pv-closed-text",children:"Sesja została zakończona"}),e.jsx("p",{className:"pv-hint",children:"Dziękujemy za udział!"}),n.length>0&&e.jsxs("div",{className:"pv-sent-summary",children:["Wysłano ",n.length," ",n.length===1?"słowo":n.length<5?"słowa":"słów"]})]}),r==="ready"&&e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"pv-question",children:h}),e.jsxs("div",{className:"pv-input-row",children:[e.jsx("input",{ref:m,type:"text",value:d,onChange:t=>l(t.target.value),onKeyDown:j,placeholder:"Wpisz słowo...",maxLength:40,autoFocus:!0,className:"pv-input",disabled:p}),e.jsx("button",{className:"pv-send-btn",onClick:f,disabled:!d.trim()||p,children:p?"...":"Wyślij"})]}),n.length>0&&e.jsxs("div",{className:"pv-sent-list",children:[e.jsxs("div",{className:"pv-sent-title",children:["Twoje odpowiedzi (",n.length,")"]}),e.jsx("div",{className:"pv-sent-chips",children:n.map((t,i)=>e.jsxs("span",{className:"pv-sent-chip",children:["✓ ",t]},i))})]}),e.jsxs("div",{className:"pv-room-code",children:["Pokój: ",o]})]})]})}const S=`
.pv-container {
  min-height: 100dvh;
  background: #0f0f13;
  color: #f0f0f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 20px;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}
.pv-brand {
  font-size: 16px;
  font-weight: 700;
  color: #e91e63;
  margin-bottom: 24px;
}
.pv-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
}
.pv-icon { font-size: 48px; }
.pv-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255,255,255,0.1);
  border-top-color: #e91e63;
  border-radius: 50%;
  animation: pv-spin 0.8s linear infinite;
}
@keyframes pv-spin { to { transform: rotate(360deg); } }
.pv-error-text { font-size: 18px; font-weight: 600; color: #f44336; }
.pv-closed-text { font-size: 18px; font-weight: 600; }
.pv-hint { font-size: 14px; color: #888; }
.pv-sent-summary {
  margin-top: 8px;
  padding: 8px 16px;
  border-radius: 10px;
  background: rgba(76, 175, 80, 0.15);
  color: #4caf50;
  font-size: 14px;
  font-weight: 600;
}
.pv-question {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 24px;
  padding: 16px;
  background: #1c1c24;
  border-radius: 14px;
  width: 100%;
  max-width: 400px;
  line-height: 1.4;
}
.pv-input-row {
  display: flex;
  gap: 8px;
  width: 100%;
  max-width: 400px;
  margin-bottom: 20px;
}
.pv-input {
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
.pv-input:focus {
  border-color: #e91e63;
}
.pv-send-btn {
  padding: 14px 24px;
  background: #e91e63;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
  white-space: nowrap;
}
.pv-send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.pv-send-btn:not(:disabled):hover {
  opacity: 0.85;
}
.pv-sent-list {
  width: 100%;
  max-width: 400px;
}
.pv-sent-title {
  font-size: 12px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}
.pv-sent-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.pv-sent-chip {
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(76, 175, 80, 0.12);
  color: #4caf50;
  font-size: 13px;
  font-weight: 500;
}
.pv-room-code {
  margin-top: auto;
  padding-top: 20px;
  font-size: 12px;
  color: #555;
  letter-spacing: 1px;
}
`;export{P as ParticipantView};
