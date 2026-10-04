import{r as i,u as Xe,j as e}from"./index-LnzBLEPA.js";const Qe=1900,Ge=1500,qe=[[440,610,.13],[650,520,.12],[540,840,.26]],He=[[560,560,.12],[700,1e3,.3]],Ie=[{transform:"rotate(0deg)"},{transform:"rotate(-9deg)",offset:.22},{transform:"rotate(-9deg)",offset:.4},{transform:"rotate(8deg)",offset:.62},{transform:"rotate(8deg)",offset:.78},{transform:"rotate(0deg)"}],me=[{transform:"translateY(0)"},{transform:"translateY(-7px)",offset:.35},{transform:"translateY(0)",offset:.7},{transform:"translateY(-3px)",offset:.85},{transform:"translateY(0)"}],Oe=[{transform:"rotate(0deg)"},{transform:"rotate(-3deg)"},{transform:"rotate(3deg)"},{transform:"rotate(-2deg)"},{transform:"rotate(0deg)"}],$e=[{transform:"translateX(0)"},{transform:"translateX(-3px)"},{transform:"translateX(3px)"},{transform:"translateX(-2px)"},{transform:"translateX(0)"}],_e=[{transform:"rotate(0deg)"},{transform:"rotate(36deg)",offset:.38},{transform:"rotate(30deg)",offset:.55},{transform:"rotate(38deg)",offset:.7},{transform:"rotate(0deg)"}],Ve=[{transform:"scaleX(1)"},{transform:"scaleX(2.05)",offset:.38},{transform:"scaleX(1.8)",offset:.55},{transform:"scaleX(2.1)",offset:.7},{transform:"scaleX(1)"}],Ze=[{transform:"translateX(0)"},{transform:"translateX(32px)",offset:.38},{transform:"translateX(24px)",offset:.55},{transform:"translateX(33px)",offset:.7},{transform:"translateX(0)"}],Ue=[{transform:"rotate(0deg)"},{transform:"rotate(3deg)",offset:.4},{transform:"rotate(2deg)",offset:.6},{transform:"rotate(0deg)"}],ge=["#8d939a","#b5652b","#3f7f86","#d6ae62","#6b4a32","#a7aeb5"],E={x:-14,y:193},O=-46,Ke=-20,$=194;function Je(){const l=typeof window<"u"?window.AudioContext||window.webkitAudioContext:null;let s=null,d=null,u=!1,w=null,g=0,v=null;const h=()=>{if(!l||u)return null;if(!s)try{s=new l,d=s.createGain(),d.gain.value=.6,d.connect(s.destination)}catch{return s=null,null}return s.state==="suspended"&&s.resume().catch(()=>{}),s},y=n=>{if(v&&v.sampleRate===n.sampleRate)return v;const o=Math.floor(n.sampleRate*1.5);v=n.createBuffer(1,o,n.sampleRate);const f=v.getChannelData(0);for(let p=0;p<o;p++)f[p]=Math.random()*2-1;return v},b=({type:n="sine",f0:o,f1:f=o,at:p=0,dur:r=.2,vol:x=.06,attack:C=.008,lp:z=0})=>{const W=h();if(!W)return;const k=W.currentTime+p,N=W.createOscillator();N.type=n,N.frequency.setValueAtTime(o,k),f!==o&&N.frequency.exponentialRampToValueAtTime(f,k+r*.85);const B=W.createGain();B.gain.setValueAtTime(1e-4,k),B.gain.exponentialRampToValueAtTime(x,k+C),B.gain.exponentialRampToValueAtTime(1e-4,k+r);let L=N;if(z){const D=W.createBiquadFilter();D.type="lowpass",D.frequency.value=z,N.connect(D),L=D}L.connect(B),B.connect(d),N.start(k),N.stop(k+r+.05)},m=({at:n=0,dur:o=.08,vol:f=.1,type:p="bandpass",freq:r=1400,q:x=1})=>{const C=h();if(!C)return;const z=C.currentTime+n,W=C.createBufferSource();W.buffer=y(C);const k=C.createBiquadFilter();k.type=p,k.frequency.value=r,k.Q.value=x;const N=C.createGain();N.gain.setValueAtTime(f,z),N.gain.exponentialRampToValueAtTime(1e-4,z+o),W.connect(k),k.connect(N),N.connect(d),W.start(z,Math.random()*1.2),W.stop(z+o+.02)},A=()=>{if(!w)return;const n=w;if(w=null,!s)return;const o=s.currentTime;try{n.g.gain.cancelScheduledValues(o),n.g.gain.setTargetAtTime(1e-4,o,.05),n.o.stop(o+.3),n.o2.stop(o+.3)}catch{}},R=()=>{g&&clearInterval(g),g=0};return{unlock(){h()},setMuted(n){u=n,n&&(A(),R()),d&&(d.gain.value=n?0:.6)},humStart(){const n=h();if(!n||w)return;const o=n.currentTime,f=n.createOscillator();f.type="sawtooth",f.frequency.value=70;const p=n.createOscillator();p.type="sine",p.frequency.value=150;const r=n.createBiquadFilter();r.type="lowpass",r.frequency.value=480,r.Q.value=3;const x=n.createGain();x.gain.setValueAtTime(1e-4,o),x.gain.exponentialRampToValueAtTime(.045,o+.12),f.connect(r),p.connect(r),r.connect(x),x.connect(d),f.start(o),p.start(o),w={o:f,o2:p,f:r,g:x}},humSet(n){if(!w||!s)return;const o=s.currentTime;w.o.frequency.setTargetAtTime(70+n*120,o,.06),w.o2.frequency.setTargetAtTime(150+n*380,o,.06),w.f.frequency.setTargetAtTime(480+n*1800,o,.06)},humStop:A,chime(){[[784,0],[1046.5,.08],[1318.5,.16],[1568,.26]].forEach(([n,o])=>{b({f0:n,at:o,dur:1.2,vol:.055,attack:.012}),b({f0:n*2,at:o,dur:.45,vol:.012,attack:.005})})},chirp(n){let o=0;for(const[f,p,r]of n)b({type:"square",f0:f,f1:p,at:o,dur:r,vol:.035,lp:1700}),b({type:"triangle",f0:f*2,f1:p*2,at:o,dur:r,vol:.018}),o+=r+.05},pop(){b({f0:380,f1:920,dur:.18,vol:.06})},clank(){m({dur:.1,vol:.18,freq:700+Math.random()*700,q:1.6}),b({type:"triangle",f0:1500+Math.random()*900,f1:1300,at:.01,dur:.18,vol:.03}),m({at:.09,dur:.06,vol:.07,freq:2400,q:2})},crackleStart(){g||!h()||(g=setInterval(()=>{Math.random()<.65&&m({dur:.02+Math.random()*.025,vol:.035+Math.random()*.05,type:"highpass",freq:2800+Math.random()*2e3,q:.8})},45))},crackleStop:R,bloom(){[523.25,659.25,783.99,1046.5,1318.5].forEach((n,o)=>b({f0:n,at:o*.07,dur:2.6,vol:.032,attack:.15})),m({dur:1.1,vol:.05,type:"lowpass",freq:1200,q:.5})},close(){A(),R();const n=s;s=null,d=null,v=null;try{const o=n&&n.close();o&&o.catch&&o.catch(()=>{})}catch{}}}}function et(l){let s=l;return()=>(s=s*16807%2147483647,(s-1)/2147483646)}function Ne(l,{count:s,minH:d,maxH:u,minW:w,maxW:g,start:v,gap:h}){const y=et(l);let b=v,m="";for(let A=0;A<s;A++){const R=w+y()*(g-w),o=600-(d+y()*(u-d));let f=600;for(;f>o+2;){const p=Math.max(10,Math.min(R*(.36+y()*.34),f-o)),r=R*(.86+y()*.2),x=b+(R-r)/2+(y()-.5)*R*.14;m+=`M${x.toFixed(1)} ${f.toFixed(1)}h${r.toFixed(1)}v${(-p-.6).toFixed(1)}h${(-r).toFixed(1)}z`,f-=p}b+=R*(h[0]+y()*(h[1]-h[0]))}return m}const tt=Ne(7,{count:24,minH:150,maxH:360,minW:54,maxW:104,start:-60,gap:[.7,1.4]}),at=Ne(19,{count:15,minH:70,maxH:240,minW:80,maxW:150,start:-40,gap:[.9,1.9]}),rt=Array.from({length:56},(l,s)=>{const d=Math.abs(Math.sin(s*12.9898)*43758.5453)%1,u=Math.abs(Math.sin(s*78.233)*12345.6789)%1;return{left:(d*98+1).toFixed(2)+"%",top:(u*60+1).toFixed(2)+"%",size:(1+s%3*.6).toFixed(1)+"px",delay:(s*.61%6).toFixed(2)+"s",dur:(3.4+s%5*1.1).toFixed(1)+"s",op:(.35+s%4*.17).toFixed(2)}}),st=Array.from({length:18},(l,s)=>({top:(30+Math.abs(Math.sin(s*45.164)*9631.71)%1*55).toFixed(1)+"%",size:(1.5+s%4*.8).toFixed(1)+"px",delay:(-(s*1.9%24)).toFixed(1)+"s",dur:(16+s%6*2.5).toFixed(1)+"s"})),ot=Array.from({length:8},(l,s)=>{const d=s*Math.PI/4;return{x1:82+Math.cos(d)*6.4,y1:152+Math.sin(d)*6.4,x2:82+Math.cos(d)*8.6,y2:152+Math.sin(d)*8.6}}),Me="M36 212 L64 212 Q68 212 68.5 216 L73 291 Q73 296 68 296 L24 296 Q19 296 19.5 291 L31 216 Q31.5 212 36 212 Z",nt=[222,231,240,249,258,267,276,285,294],it="M118 34 L87 27 Q76 25 76 36 L77 68 Q78 78 88 78 L118 78 Q126 78 126 70 L126 42 Q126 35 118 34 Z",_="translate(260 0) scale(-1 1)";function ye(){return e.jsxs("g",{children:[e.jsx("path",{d:Me,fill:"#3f3b35",stroke:"#24221e",strokeWidth:"2"}),e.jsx("g",{clipPath:"url(#wl-treadclip)",stroke:"#2a2723",strokeWidth:"3.2",children:nt.map(l=>e.jsx("line",{x1:"10",y1:l,x2:"80",y2:l},l))}),e.jsx("rect",{x:"33",y:"207",width:"34",height:"9",rx:"3.5",fill:"#5d5850",stroke:"#2a2723",strokeWidth:"1.5"})]})}function be(){return e.jsxs("g",{children:[e.jsx("path",{d:it,fill:"url(#wl-eyeg)",stroke:"#7f796f",strokeWidth:"2.5",strokeLinejoin:"round"}),e.jsx("circle",{cx:"101",cy:"54",r:"19.5",fill:"#6d6860"}),e.jsx("circle",{cx:"101",cy:"54",r:"16",fill:"url(#wl-lens)"}),e.jsx("circle",{cx:"101",cy:"54",r:"9.5",fill:"none",stroke:"#5c6880",strokeWidth:"2.2"}),e.jsx("circle",{cx:"101",cy:"54",r:"5",fill:"#07090c"}),e.jsx("circle",{cx:"95",cy:"48",r:"3.8",fill:"#fff",opacity:".92"}),e.jsx("circle",{cx:"107",cy:"60",r:"1.8",fill:"#fff",opacity:".55"}),e.jsxs("g",{clipPath:"url(#wl-lensclip)",children:[e.jsx("rect",{className:"wl-lid",x:"82",y:"36",width:"38",height:"37",fill:"#c9c3b8"}),e.jsx("ellipse",{className:"wl-lidb",cx:"101",cy:"84",rx:"24",ry:"14",fill:"#c9c3b8"})]})]})}function ke(){return e.jsxs("g",{children:[e.jsx("rect",{x:"12",y:"191",width:"22",height:"29",rx:"6",fill:"#9c978d",stroke:"#57524a",strokeWidth:"2"}),e.jsx("rect",{x:"14",y:"189.5",width:"18",height:"6",rx:"2",fill:"#77726a"}),e.jsx("line",{x1:"23",y1:"205",x2:"23",y2:"219",stroke:"#57524a",strokeWidth:"1.8",strokeLinecap:"round"}),e.jsx("rect",{x:"31",y:"200",width:"7",height:"12",rx:"3",fill:"#8c877d",stroke:"#57524a",strokeWidth:"1.6"})]})}function je(){return e.jsx("rect",{x:"30",y:"189",width:"31",height:"14",rx:"3",fill:"#8c877d",stroke:"#57524a",strokeWidth:"2",vectorEffect:"non-scaling-stroke"})}function ve(){return e.jsxs("g",{children:[e.jsx("rect",{x:"-27",y:"-5",width:"57",height:"5",rx:"2",fill:"#3a2416"}),e.jsx("path",{d:"M-24 -4 L-24 -18 Q-24 -22 -19 -22 L8 -22 Q22 -21 27 -12 Q29 -8 28 -4 Z",fill:"#7d4b2b",stroke:"#4b2a17",strokeWidth:"1.6",strokeLinejoin:"round"}),e.jsx("path",{d:"M-13 -52 L9 -52 L10 -20 L-15 -20 Z",fill:"#86522f",stroke:"#4b2a17",strokeWidth:"1.6",strokeLinejoin:"round"}),e.jsxs("g",{stroke:"#e2d3b0",strokeWidth:"1.5",strokeLinecap:"round",children:[e.jsx("line",{x1:"-9",y1:"-45",x2:"5",y2:"-41"}),e.jsx("line",{x1:"-9",y1:"-41",x2:"5",y2:"-45"}),e.jsx("line",{x1:"-9",y1:"-35",x2:"5",y2:"-31"}),e.jsx("line",{x1:"-9",y1:"-31",x2:"5",y2:"-35"})]}),e.jsx("path",{d:"M-20 -15 Q-9 -18 3 -16",fill:"none",stroke:"#fff",strokeOpacity:".2",strokeWidth:"2",strokeLinecap:"round"}),e.jsx("rect",{x:"-15",y:"-56",width:"26",height:"6",rx:"2",fill:"#6e4124",stroke:"#4b2a17",strokeWidth:"1.4"}),e.jsx("path",{d:"M-2 -54 C-2 -61 -1 -68 -2 -77",fill:"none",stroke:"#4e9a4c",strokeWidth:"2.4",strokeLinecap:"round"}),e.jsx("path",{className:"wl-leaf wl-leaf-3",d:"M-2 -63 C3 -68 10 -68 13 -63 C9 -59 3 -59 -2 -63 Z",fill:"#86cf73",stroke:"#4e9a4c",strokeWidth:"1"}),e.jsx("path",{className:"wl-leaf wl-leaf-1",d:"M-2 -74 C-8 -82 -17 -82 -21 -76 C-15 -70 -7 -70 -2 -74 Z",fill:"#7cc66b",stroke:"#4e9a4c",strokeWidth:"1"}),e.jsx("path",{className:"wl-leaf wl-leaf-2",d:"M-2 -76 C4 -85 13 -86 18 -80 C12 -73 4 -72 -2 -76 Z",fill:"#8fd67a",stroke:"#4e9a4c",strokeWidth:"1"}),e.jsx("ellipse",{cx:"-2",cy:"-55",rx:"11",ry:"3.2",fill:"#3d281a"})]})}function lt(){return e.jsxs("g",{className:"wl-eve",children:[e.jsx("ellipse",{className:"wl-eve-hover",cx:"-80",cy:"291",rx:"28",ry:"5",fill:"#8fd8ff"}),e.jsx("ellipse",{cx:"-114",cy:"212",rx:"8",ry:"31",transform:"rotate(7 -114 212)",fill:"url(#wl-eveg)",stroke:"#b6c1d0",strokeWidth:"1"}),e.jsx("path",{d:"M-80 168 C-56 168 -46 186 -47 206 C-48 232 -62 262 -80 262 C-98 262 -112 232 -113 206 C-114 186 -104 168 -80 168 Z",fill:"url(#wl-eveg)",stroke:"#b6c1d0",strokeWidth:"1"}),e.jsx("path",{d:"M-101 182 Q-93 173 -81 172",fill:"none",stroke:"#fff",strokeWidth:"3",strokeLinecap:"round",opacity:".85"}),e.jsx("ellipse",{cx:"-33",cy:"189",rx:"22",ry:"7.5",transform:"rotate(13.4 -33 189)",fill:"url(#wl-eveg)",stroke:"#b6c1d0",strokeWidth:"1"}),e.jsxs("g",{className:"wl-eve-head",children:[e.jsx("ellipse",{cx:"-80",cy:"142",rx:"30",ry:"20",fill:"url(#wl-eveg)",stroke:"#b6c1d0",strokeWidth:"1"}),e.jsx("ellipse",{cx:"-78",cy:"144",rx:"24",ry:"14",fill:"#0a0d13"}),e.jsx("path",{d:"M-96 139 Q-89 132 -77 132",fill:"none",stroke:"#fff",strokeOpacity:".22",strokeWidth:"2",strokeLinecap:"round"}),e.jsxs("g",{filter:"url(#wl-glow)",stroke:"#6fd6ff",strokeWidth:"3.4",strokeLinecap:"round",fill:"none",children:[e.jsx("path",{d:"M-91 148 Q-86 140 -81 148"}),e.jsx("path",{d:"M-75 148 Q-70 140 -65 148"})]})]})]})}function ct(){return e.jsxs("g",{children:[e.jsx("path",{className:"wl-mound",d:"M228 296 C238 262 262 226 296 210 C326 204 352 238 374 296 Z",fill:"url(#wl-moundg)"}),e.jsx("circle",{cx:"336",cy:"266",r:"13",fill:"none",stroke:"#2b2826",strokeWidth:"7"}),e.jsx("circle",{cx:"336",cy:"266",r:"4.5",fill:"#57534d"}),e.jsx("rect",{x:"350",y:"277",width:"18",height:"18",rx:"1.5",fill:"#8a7650",stroke:"#5a4a30",strokeWidth:"1.4"}),e.jsx("path",{d:"M352 283h14M352 289h14",stroke:"#6d5c3c",strokeWidth:"1.2"}),e.jsx("g",{className:"wl-pi wl-pi-a",children:e.jsxs("g",{transform:"rotate(-8 263 259)",children:[e.jsx("rect",{x:"252",y:"250",width:"22",height:"19",rx:"2",fill:"#a06e3f",stroke:"#5a3a1e",strokeWidth:"1.5"}),e.jsx("path",{d:"M254 253 L271 266",stroke:"#5a3a1e",strokeWidth:"1.3"})]})}),e.jsx("path",{className:"wl-pi wl-pi-b",d:"M280 232 l4 -6 l4 6 l4 -6 l4 6 l4 -6",fill:"none",stroke:"#a7aeb5",strokeWidth:"2",strokeLinejoin:"round"}),e.jsx("g",{className:"wl-pi wl-pi-c",children:e.jsxs("g",{transform:"rotate(14 314 244)",children:[e.jsx("rect",{x:"308",y:"236",width:"12",height:"17",rx:"2",fill:"#3f7f86",stroke:"#23484c",strokeWidth:"1.4"}),e.jsx("ellipse",{cx:"314",cy:"236.5",rx:"6",ry:"2",fill:"#5ea3aa"})]})}),e.jsx("g",{className:"wl-pi wl-pi-d",children:e.jsx("rect",{x:"266",y:"214",width:"48",height:"7",rx:"3.5",fill:"#8d9398",stroke:"#5b6166",strokeWidth:"1.4",transform:"rotate(-14 290 217.5)"})}),e.jsxs("g",{className:"wl-pi wl-pi-e",children:[e.jsx("path",{d:"M290 207 C287 201 282 200 279 203 C283 207 287 208 290 207 Z",fill:"#7cc66b",stroke:"#4e9a4c",strokeWidth:".8"}),e.jsx("path",{d:"M290 207 C293 200 298 199 301 202 C297 207 293 208 290 207 Z",fill:"#8fd67a",stroke:"#4e9a4c",strokeWidth:".8"}),e.jsx("path",{className:"wl-glint",d:"M302 184 Q303 193 312 194 Q303 195 302 204 Q301 195 292 194 Q301 193 302 184 Z",fill:"#fff6d8"})]})]})}const dt=()=>e.jsxs("svg",{viewBox:"0 0 24 24","aria-hidden":"true",focusable:"false",children:[e.jsx("circle",{cx:"12",cy:"12",r:"4.4",fill:"currentColor"}),e.jsx("g",{stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",children:[0,45,90,135,180,225,270,315].map(l=>{const s=l*Math.PI/180;return e.jsx("line",{x1:12+Math.cos(s)*7.4,y1:12+Math.sin(s)*7.4,x2:12+Math.cos(s)*10,y2:12+Math.sin(s)*10},l)})})]}),ft=()=>e.jsxs("svg",{viewBox:"0 0 24 24","aria-hidden":"true",focusable:"false",children:[e.jsx("path",{d:"M11 3 Q12 10.5 19 11.5 Q12 12.5 11 20 Q10 12.5 3 11.5 Q10 10.5 11 3 Z",fill:"currentColor"}),e.jsx("path",{d:"M19 2.5 Q19.4 5 21.5 5.4 Q19.4 5.8 19 8.3 Q18.6 5.8 16.5 5.4 Q18.6 5 19 2.5 Z",fill:"currentColor"})]}),pt=()=>e.jsxs("svg",{viewBox:"0 0 24 24","aria-hidden":"true",focusable:"false",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M8 13V6.6a1.4 1.4 0 0 1 2.8 0V12"}),e.jsx("path",{d:"M10.8 11.5V5.2a1.4 1.4 0 0 1 2.8 0v6.3"}),e.jsx("path",{d:"M13.6 11.6V6.4a1.4 1.4 0 0 1 2.8 0v7.2c0 4-2.5 6.9-6.2 6.9-2.5 0-4-1.2-5.3-3.2l-2-3.4a1.4 1.4 0 0 1 2.3-1.6L8 15"})]}),ht=({off:l})=>e.jsxs("svg",{viewBox:"0 0 24 24","aria-hidden":"true",focusable:"false",width:"18",height:"18",children:[e.jsx("path",{d:"M4 9.5h3.2L12 5.5v13l-4.8-4H4z",fill:"currentColor"}),l?e.jsx("path",{d:"M16 9.5l5 5m0-5l-5 5",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round"}):e.jsx("path",{d:"M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round"})]});function xt({sfx:l,reduced:s,onReplay:d}){const u=i.useRef(null),w=i.useRef(null),g=i.useRef(null),v=i.useRef(null),h=i.useRef(null),y=i.useRef(null),b=i.useRef(null),m=i.useRef(null),A=i.useRef(null),R=i.useRef(null),n=i.useRef(null),o=i.useRef(null),f=i.useRef(null),p=i.useRef([]),[r,x]=i.useState("off"),[C,z]=i.useState(!1),[W,k]=i.useState(!1),[N,B]=i.useState(0),[L,D]=i.useState(0),[Y,Q]=i.useState(null),[Re,K]=i.useState(!1),J=i.useRef([]),G=i.useRef({active:!1,kind:null,p:0,raf:0,last:0,arcAt:0}),V=i.useRef(!1),ee=i.useRef(0),Z=i.useRef(0),te=i.useRef(!1),S=(t,a,c)=>{J.current.push(setTimeout(t,s?c??Math.round(a*.35):a))},T=(t,a,c)=>!s&&t&&t.animate?t.animate(a,c):null,q=(t,a)=>{var c;return(c=u.current)==null?void 0:c.style.setProperty(t,String(a))};i.useEffect(()=>{const t=G.current,a=J.current;return()=>{a.forEach(clearTimeout),cancelAnimationFrame(t.raf),t.active=!1,l.humStop(),l.crackleStop()}},[l]);const ae=(t,a)=>{const c=g.current;if(!(!c||s))for(let M=0;M<t;M++){const j=document.createElement("span");a(j),j.setAttribute("aria-hidden","true"),c.appendChild(j),j.addEventListener("animationend",()=>j.remove(),{once:!0})}},Ce=()=>ae(7,t=>{const a=4+Math.random()*7;t.className="wl-bit",t.style.width=a+"px",t.style.height=(Math.random()>.5?a:a*.45)+"px",t.style.borderRadius=Math.random()>.5?"50%":"2px",t.style.background=ge[Math.random()*ge.length|0],t.style.left=94+Math.random()*14+"%",t.style.top=74+Math.random()*6+"%",t.style.setProperty("--dx",(Math.random()*2-.5)*50+"px"),t.style.setProperty("--dy",-(30+Math.random()*60)+"px"),t.style.setProperty("--rot",Math.random()*720-360+"deg")}),We=()=>ae(16,t=>{t.className="wl-mote",t.style.left=-9+Math.random()*7+"%",t.style.top=61+Math.random()*6+"%",t.style.setProperty("--dx",(Math.random()*2-1)*70+"px"),t.style.setProperty("--dy",-(90+Math.random()*220)+"px"),t.style.animationDelay=Math.random()*.5+"s",t.style.animationDuration=1.8+Math.random()*1.6+"s"}),Se=()=>{const t=v.current,a=w.current,c=u.current;if(!t||!a||!c||s)return;const M=a.getBoundingClientRect(),j=c.getBoundingClientRect();t.style.setProperty("--fx",M.left-j.left+M.width*(-16/260)+"px"),t.style.setProperty("--fy",M.top-j.top+M.height*($/300)+"px"),t.classList.remove("is-on"),t.offsetWidth,t.classList.add("is-on")},re=(t,a)=>{var I,fe,pe,he;const c=G.current,M=performance.now();if(!a&&M-c.arcAt<50)return;c.arcAt=M;const j=O+(Ke-O)*t;(I=o.current)==null||I.setAttribute("cx",j.toFixed(1)),(fe=o.current)==null||fe.setAttribute("r",(7+t*8).toFixed(1)),(pe=f.current)==null||pe.setAttribute("cx",j.toFixed(1)),(he=f.current)==null||he.setAttribute("r",(15+t*16).toFixed(1)),p.current.forEach((xe,Fe)=>{if(!xe)return;const ue=[];for(let X=0;X<=6;X++){const we=X/6,De=E.x+(j-E.x)*we,Pe=E.y+($-E.y)*we,Ye=X===0||X===6?0:(Math.random()*2-1)*(2.5+Fe*1.5);ue.push(`${De.toFixed(1)},${(Pe+Ye).toFixed(1)}`)}xe.setAttribute("points",ue.join(" "))})},se=(t,a)=>{if(t==="charge"){q("--c",a.toFixed(4)),l.humSet(a);const c=a>=1?3:a>=.68?2:a>=.34?1:0;c!==Z.current&&(Z.current=c,B(c)),!te.current&&a>=.6&&(te.current=!0,k(!0))}else q("--h",a.toFixed(4)),re(a)},Le=()=>{q("--c",1),Z.current=3,B(3),l.chime(),x("waking"),S(()=>T(b.current,Ie,{duration:1500,easing:"ease-in-out"}),1750,300),S(()=>{Q("Am-ru-tha!"),l.chirp(qe),T(y.current,me,{duration:650,easing:"ease-out"})},2600,500),S(()=>Q(null),4500,2400),S(()=>x("dig"),4600,2500)},Ae=()=>{x("tada"),l.pop(),S(()=>{Q("Ta-da!"),l.chirp(He),T(y.current,me,{duration:650,easing:"ease-out"})},560,200),S(()=>Q(null),2700,2200),S(()=>x("reach"),3e3,2400)},oe=()=>{if(r!=="dig"||V.current)return;l.unlock(),V.current=!0;const t=ee.current+1;ee.current=t;const a={duration:780,easing:"cubic-bezier(.4,0,.3,1)"};T(m.current,_e,a),T(A.current,Ve,a),T(R.current,Ze,a),T(y.current,Ue,a),S(()=>{l.clank(),Ce(),T(n.current,$e,{duration:340}),D(t)},300,0),S(()=>{V.current=!1,t>=3&&Ae()},820,200)},ze=()=>{q("--h",1),l.bloom(),Se(),We(),x("spark"),S(()=>T(y.current,Oe,{duration:900,easing:"ease-in-out"}),500,0),S(()=>x("done"),1500,300)},F=(t=!1)=>{const a=G.current;if(a.active&&(a.active=!1,cancelAnimationFrame(a.raf),K(!1),a.kind==="charge"?l.humStop():l.crackleStop(),t)){const c=a.kind;a.p=0,a.kind=null,c==="charge"?Le():ze()}},ne=t=>{const a=G.current;if(a.active||(t==="charge"?r!=="off":r!=="reach"))return;l.unlock(),a.kind!==t&&(a.kind=t,a.p=0),a.active=!0,a.last=0,K(!0),t==="charge"?(z(!0),l.humStart()):(l.crackleStart(),re(a.p,!0)),a.p=Math.min(.999,a.p+.03),se(t,a.p);const c=t==="charge"?Qe:Ge,M=j=>{if(!a.active)return;const I=a.last?Math.min(64,j-a.last):16;if(a.last=j,a.p=Math.min(1,a.p+I/c),se(t,a.p),a.p>=1){F(!0);return}a.raf=requestAnimationFrame(M)};a.raf=requestAnimationFrame(M)},H=i.useRef(null);H.current=()=>F(!1),i.useEffect(()=>{const t=()=>{var c;return(c=H.current)==null?void 0:c.call(H)},a=()=>{document.visibilityState==="hidden"&&t()};return window.addEventListener("blur",t),document.addEventListener("visibilitychange",a),()=>{window.removeEventListener("blur",t),document.removeEventListener("visibilitychange",a)}},[]),i.useEffect(()=>{var t;r==="done"&&((t=h.current)==null||t.focus({preventScroll:!0}))},[r]);const ie=t=>({onPointerDown:a=>{if(!(a.button>0)){a.preventDefault();try{a.currentTarget.setPointerCapture(a.pointerId)}catch{}ne(t)}},onPointerUp:()=>F(),onPointerCancel:()=>F(),onLostPointerCapture:()=>F(),onKeyDown:a=>{a.key!==" "&&a.key!=="Enter"||(a.preventDefault(),a.repeat||ne(t))},onKeyUp:a=>{a.key!==" "&&a.key!=="Enter"||(a.preventDefault(),F())},onBlur:()=>F()}),Te=r!=="off",P=r==="off"||r==="waking"?"charge":r==="dig"||r==="tada"?"dig":"hand",le=r==="waking"||r==="tada"||r==="spark",Be=["wl-scene",Te?"wl-on":"wl-off",r==="off"&&C&&"is-charging",r==="waking"&&"is-waking",r==="dig"&&"is-dig",r==="tada"&&"is-tada has-boot",(r==="reach"||r==="spark"||r==="done")&&"has-gboot is-reach",(r==="spark"||r==="done")&&"is-eve is-happy is-night",r==="done"&&"is-done",Re&&"is-holding"].filter(Boolean).join(" "),U=r==="off"?"He’s been asleep all night. He runs on sunlight.":r==="waking"?"Good morning, WALL·E.":r==="dig"?L===0?"He’s found something in that heap, and it’s for you. Help him dig it out.":L===1?"Keep going.":L===2?"One more.":"There it is…":"That’s his whole talk — one word and a plant in a boot. Yours is going to be even better.",ce=r==="off"?C?W?"Almost there…":"Keep holding":"Hold to charge him":r==="waking"?"Fully charged":r==="dig"?"Tap to help him dig":r==="tada"?"Found it":r==="reach"?"Hold his hand":"Holding on",Ee=le?{}:P==="dig"?{onClick:oe}:ie(P),de=t=>t.preventDefault();return e.jsxs("div",{ref:u,className:Be,children:[e.jsx("div",{className:"wl-sky wl-sky-dawn","aria-hidden":"true"}),e.jsx("div",{className:"wl-sky wl-sky-day","aria-hidden":"true"}),e.jsx("div",{className:"wl-sky wl-sky-night","aria-hidden":"true"}),e.jsx("div",{className:"wl-stars","aria-hidden":"true",children:rt.map((t,a)=>e.jsx("span",{className:"wl-star",style:{left:t.left,top:t.top,width:t.size,height:t.size,animationDelay:t.delay,animationDuration:t.dur,"--op":t.op}},a))}),e.jsx("div",{className:"wl-sun","aria-hidden":"true",children:e.jsx("span",{className:"wl-rays"})}),e.jsxs("div",{className:"wl-skyline","aria-hidden":"true",children:[e.jsxs("svg",{viewBox:"0 0 1600 600",preserveAspectRatio:"xMidYMax slice",focusable:"false",children:[e.jsx("path",{className:"wl-far",d:tt}),e.jsx("path",{className:"wl-near",d:at})]}),e.jsx("div",{className:"wl-haze"})]}),e.jsxs("div",{className:"wl-ground","aria-hidden":"true",children:[e.jsx("span",{className:"wl-ground-day"}),e.jsx("span",{className:"wl-ground-night"})]}),e.jsx("div",{className:"wl-dust","aria-hidden":"true",children:st.map((t,a)=>e.jsx("span",{style:{top:t.top,width:t.size,height:t.size,animationDelay:t.delay,animationDuration:t.dur}},a))}),e.jsx("div",{className:"wl-actors",children:e.jsxs("div",{ref:w,className:"wl-bot",children:[e.jsxs("svg",{className:"wl-svg",viewBox:"0 0 260 300","aria-hidden":"true",focusable:"false",children:[e.jsxs("defs",{children:[e.jsxs("linearGradient",{id:"wl-bodyg",x1:"0",y1:"0",x2:"0",y2:"1",children:[e.jsx("stop",{offset:"0",stopColor:"#f3c455"}),e.jsx("stop",{offset:".55",stopColor:"#e4a93c"}),e.jsx("stop",{offset:"1",stopColor:"#c98c27"})]}),e.jsxs("linearGradient",{id:"wl-eyeg",x1:"0",y1:"0",x2:"0",y2:"1",children:[e.jsx("stop",{offset:"0",stopColor:"#e7e3db"}),e.jsx("stop",{offset:"1",stopColor:"#b3ada2"})]}),e.jsxs("radialGradient",{id:"wl-lens",cx:".4",cy:".35",r:".75",children:[e.jsx("stop",{offset:"0",stopColor:"#4d5870"}),e.jsx("stop",{offset:".45",stopColor:"#1d222c"}),e.jsx("stop",{offset:"1",stopColor:"#0a0c10"})]}),e.jsxs("linearGradient",{id:"wl-panelg",x1:"0",y1:"0",x2:"1",y2:"1",children:[e.jsx("stop",{offset:"0",stopColor:"#3a5687"}),e.jsx("stop",{offset:"1",stopColor:"#1b2640"})]}),e.jsxs("linearGradient",{id:"wl-moundg",x1:"0",y1:"0",x2:"0",y2:"1",children:[e.jsx("stop",{offset:"0",stopColor:"#8a6446"}),e.jsx("stop",{offset:"1",stopColor:"#4d3523"})]}),e.jsxs("radialGradient",{id:"wl-eveg",cx:".36",cy:".3",r:".8",children:[e.jsx("stop",{offset:"0",stopColor:"#ffffff"}),e.jsx("stop",{offset:".6",stopColor:"#eef2f7"}),e.jsx("stop",{offset:"1",stopColor:"#c3cdda"})]}),e.jsxs("radialGradient",{id:"wl-orbg",children:[e.jsx("stop",{offset:"0",stopColor:"#ffffff"}),e.jsx("stop",{offset:".35",stopColor:"#c4ecff"}),e.jsx("stop",{offset:"1",stopColor:"#7fd4ff",stopOpacity:"0"})]}),e.jsxs("filter",{id:"wl-glow",filterUnits:"userSpaceOnUse",x:"-220",y:"-60",width:"700",height:"420",children:[e.jsx("feGaussianBlur",{stdDeviation:"2.2",result:"b"}),e.jsxs("feMerge",{children:[e.jsx("feMergeNode",{in:"b"}),e.jsx("feMergeNode",{in:"SourceGraphic"})]})]}),e.jsx("clipPath",{id:"wl-treadclip",children:e.jsx("path",{d:Me})}),e.jsx("clipPath",{id:"wl-lensclip",children:e.jsx("circle",{cx:"101",cy:"54",r:"16.4"})}),e.jsx("clipPath",{id:"wl-panelclip",children:e.jsx("rect",{x:"72",y:"88",width:"116",height:"34",rx:"3"})})]}),e.jsx("ellipse",{className:"wl-shadow",cx:"130",cy:"297",rx:"118",ry:"7"}),e.jsx(lt,{}),e.jsxs("g",{className:"wl-treads",children:[e.jsx("g",{className:"wl-tread-l",children:e.jsx(ye,{})}),e.jsx("g",{className:"wl-tread-r",children:e.jsx("g",{transform:_,children:e.jsx(ye,{})})})]}),e.jsx("rect",{x:"68",y:"252",width:"124",height:"34",rx:"5",fill:"#2f2c28"}),e.jsx("g",{className:"wl-upper",children:e.jsxs("g",{ref:y,className:"wl-upper-in",children:[e.jsxs("g",{className:"wl-panel",children:[e.jsx("rect",{x:"72",y:"88",width:"116",height:"34",rx:"3",fill:"url(#wl-panelg)",stroke:"#4b4f57",strokeWidth:"2"}),e.jsxs("g",{stroke:"#6b86b8",strokeOpacity:".6",strokeWidth:"1.2",children:[e.jsx("line",{x1:"110.7",y1:"89",x2:"110.7",y2:"121"}),e.jsx("line",{x1:"149.3",y1:"89",x2:"149.3",y2:"121"}),e.jsx("line",{x1:"73",y1:"105",x2:"187",y2:"105"})]}),e.jsx("g",{clipPath:"url(#wl-panelclip)",children:e.jsx("g",{transform:"skewX(-20)",children:e.jsx("rect",{className:"wl-panel-glint",x:"0",y:"80",width:"18",height:"50",fill:"#fff",opacity:".35"})})})]}),e.jsx("g",{className:"wl-headpose",children:e.jsx("g",{ref:b,className:"wl-headlook",children:e.jsxs("g",{className:"wl-headidle",children:[e.jsx("rect",{x:"125",y:"74",width:"10",height:"56",rx:"2",fill:"#5f5a52",stroke:"#3d3a35",strokeWidth:"1.5"}),e.jsx("circle",{cx:"130",cy:"101",r:"7.5",fill:"#75716a",stroke:"#46423c",strokeWidth:"2"}),e.jsxs("g",{transform:"translate(130 101) scale(1.12) translate(-130 -101)",children:[e.jsx("rect",{x:"112",y:"66",width:"36",height:"12",rx:"4",fill:"#706b63",stroke:"#46423c",strokeWidth:"2"}),e.jsx(be,{}),e.jsx("g",{transform:_,children:e.jsx(be,{})})]})]})})}),e.jsxs("g",{className:"wl-body",children:[e.jsx("rect",{x:"56",y:"124",width:"148",height:"140",rx:"8",fill:"url(#wl-bodyg)",stroke:"#8e6119",strokeWidth:"2.5"}),e.jsx("rect",{x:"57",y:"128",width:"10",height:"134",rx:"4",fill:"#000",opacity:".08"}),e.jsx("rect",{x:"193",y:"128",width:"10",height:"134",rx:"4",fill:"#000",opacity:".14"}),e.jsx("ellipse",{cx:"76",cy:"252",rx:"13",ry:"5",fill:"#8a4a1a",opacity:".3"}),e.jsx("ellipse",{cx:"192",cy:"236",rx:"6",ry:"9",fill:"#8a4a1a",opacity:".22"}),e.jsx("path",{d:"M174 164 q2 10 -1 18",fill:"none",stroke:"#8a4a1a",strokeOpacity:".28",strokeWidth:"3",strokeLinecap:"round"}),e.jsx("rect",{x:"108",y:"172",width:"84",height:"80",rx:"5",fill:"#000",fillOpacity:".05",stroke:"#9a6a1c",strokeWidth:"2.4"}),e.jsx("rect",{x:"120",y:"168",width:"12",height:"7",rx:"2",fill:"#9a6a1c"}),e.jsx("rect",{x:"168",y:"168",width:"12",height:"7",rx:"2",fill:"#9a6a1c"}),e.jsx("rect",{x:"136",y:"238",width:"28",height:"6",rx:"3",fill:"#8e6119"}),[[114,178],[186,178],[114,246],[186,246]].map(([t,a])=>e.jsx("circle",{cx:t,cy:a,r:"2",fill:"#9a6a1c"},`${t}-${a}`)),e.jsx("path",{d:"M150 204 q6 -3 12 0",fill:"none",stroke:"#b07a22",strokeOpacity:".5",strokeWidth:"1.6",strokeLinecap:"round"}),e.jsxs("g",{stroke:"#96661c",strokeWidth:"3",strokeLinecap:"round",children:[e.jsx("line",{x1:"160",y1:"146",x2:"190",y2:"146"}),e.jsx("line",{x1:"160",y1:"153",x2:"190",y2:"153"}),e.jsx("line",{x1:"160",y1:"160",x2:"190",y2:"160"})]}),e.jsx("rect",{x:"68",y:"140",width:"28",height:"66",rx:"4",fill:"#2a251b",stroke:"#17140e",strokeWidth:"2"}),e.jsxs("g",{className:`wl-sunicon${C?" is-lit":""}`,children:[e.jsx("circle",{cx:"82",cy:"152",r:"4.2"}),ot.map((t,a)=>e.jsx("line",{x1:t.x1,y1:t.y1,x2:t.x2,y2:t.y2},a))]}),[0,1,2].map(t=>e.jsx("rect",{className:`wl-bar${N>t?" is-lit":""}`,x:"73",y:190-t*13,width:"18",height:"9",rx:"1.6"},t)),e.jsx("circle",{cx:"82",cy:"224",r:"5",fill:"#c8432f",stroke:"#7d2417",strokeWidth:"1.5"}),e.jsx("circle",{cx:"80.5",cy:"222.5",r:"1.6",fill:"#ffb3a3"}),e.jsx("rect",{x:"52",y:"118",width:"156",height:"12",rx:"4",fill:"#c98f2a",stroke:"#8e6119",strokeWidth:"2"})]}),e.jsxs("g",{className:"wl-arm wl-arm-l",children:[e.jsx("g",{className:"wl-beam wl-beam-l",children:e.jsx(je,{})}),e.jsx("g",{className:"wl-hand wl-hand-l",children:e.jsx(ke,{})}),e.jsx("circle",{cx:"58",cy:"196",r:"7.5",fill:"#6e6a61",stroke:"#46423c",strokeWidth:"2"})]}),e.jsx("g",{className:"wl-arm wl-arm-r",children:e.jsxs("g",{ref:m,className:"wl-arm-in-r",children:[e.jsx("g",{ref:A,className:"wl-beam wl-beam-r",children:e.jsx("g",{transform:_,children:e.jsx(je,{})})}),e.jsxs("g",{ref:R,className:"wl-hand wl-hand-r",children:[e.jsx("g",{className:"wl-held",children:e.jsx("g",{transform:"translate(238 252)",children:e.jsx(ve,{})})}),e.jsx("g",{transform:_,children:e.jsx(ke,{})})]}),e.jsx("circle",{cx:"202",cy:"196",r:"7.5",fill:"#6e6a61",stroke:"#46423c",strokeWidth:"2"})]})})]})}),e.jsx("g",{transform:"translate(160 296)",children:e.jsx("g",{className:"wl-gboot",children:e.jsx(ve,{})})}),e.jsx("g",{ref:n,className:`wl-pile${L>=1?" d1":""}${L>=2?" d2":""}${L>=3?" d3":""}`,children:e.jsx(ct,{})}),e.jsxs("g",{className:"wl-fx",children:[e.jsx("circle",{ref:f,className:"wl-halo",cx:O,cy:$,r:"15",fill:"url(#wl-orbg)"}),e.jsx("circle",{ref:o,className:"wl-orb",cx:O,cy:$,r:"7",fill:"url(#wl-orbg)"}),e.jsx("g",{className:"wl-arcs",filter:"url(#wl-glow)",fill:"none",stroke:"#e2f6ff",strokeWidth:"1.4",strokeLinejoin:"round",strokeLinecap:"round",children:[0,1,2].map(t=>e.jsx("polyline",{ref:a=>{p.current[t]=a},points:`${E.x},${E.y} ${E.x},${E.y}`},t))})]})]}),Y&&e.jsx("div",{className:"wl-bubble","aria-hidden":"true",children:Y},Y),r==="dig"&&e.jsx("button",{type:"button",className:"wl-spot wl-pilespot",onClick:oe,"aria-label":"Dig in the heap"}),r==="reach"&&e.jsx("button",{type:"button",className:"wl-spot wl-handspot","aria-label":"Hold his hand",onContextMenu:de,...ie("hand")}),e.jsx("div",{ref:g,className:"wl-fxhost","aria-hidden":"true"})]})}),e.jsxs("header",{className:"wl-copy",children:[r==="done"?e.jsxs("div",{className:"wl-final",children:[e.jsxs("p",{className:"wl-f-eyebrow wl-in",style:{animationDelay:"0.1s"},children:[e.jsx("span",{"aria-hidden":"true",children:"✓ "}),"Message delivered"]}),e.jsx("h1",{ref:h,tabIndex:-1,className:"wl-f-title",children:"The stage is yours, Amrutha."}),e.jsx("p",{className:"wl-f-line wl-in",style:{animationDelay:"1s"},children:"All the best for your talk at the Tech Summit."}),e.jsx("p",{className:"wl-f-line wl-f-soft wl-in",style:{animationDelay:"1.7s"},children:"If the room feels big, pretend it’s just me in the front row."}),e.jsx("p",{className:"wl-f-te wl-in",style:{animationDelay:"2.5s"},children:"Adaragottey!"})]}):e.jsxs("div",{className:`wl-acts${r==="spark"?" is-leaving":""}`,children:[e.jsx("p",{className:"wl-eyebrow",children:"For Amrutha"}),e.jsx("h1",{className:"wl-title",children:"Someone small has a message for you."}),e.jsx("p",{className:"wl-caption",children:U},U)]}),e.jsxs("p",{className:"wl-sr","aria-live":"polite",children:[r==="done"?"":U,Y?` He says: ${Y}`:""]})]}),e.jsx("div",{className:"wl-dock",children:r==="done"?e.jsxs("div",{className:"wl-dock-in wl-in",style:{animationDelay:"3.1s"},children:[e.jsx("p",{className:"wl-foot",children:"Tech Summit · AWS · fully charged, and rooting for you"}),e.jsx("button",{type:"button",className:"wl-replay",onClick:d,children:"Watch it again"})]}):e.jsxs("div",{className:`wl-dock-in${r==="spark"?" is-leaving":""}`,children:[e.jsxs("button",{type:"button",className:`wl-act wl-act-${P}`,"aria-disabled":le||void 0,"aria-label":ce,onContextMenu:de,...Ee,children:[e.jsxs("svg",{className:"wl-ring",viewBox:"0 0 120 120","aria-hidden":"true",focusable:"false",children:[e.jsx("circle",{className:"wl-ring-bg",cx:"60",cy:"60",r:"56"}),e.jsx("circle",{className:"wl-ring-fg",cx:"60",cy:"60",r:"56",pathLength:"100"})]}),e.jsx("span",{className:"wl-act-disc",children:P==="charge"?e.jsx(dt,{}):P==="dig"?e.jsx(ft,{}):e.jsx(pt,{})})]}),e.jsx("p",{className:"wl-act-label","aria-hidden":"true",children:ce}),P==="dig"&&e.jsx("div",{className:"wl-dots","aria-hidden":"true",children:[0,1,2].map(t=>e.jsx("i",{className:L>t?"on":""},t))})]})}),e.jsx("div",{ref:v,className:"wl-flash","aria-hidden":"true"})]})}function yt({onBack:l}){var b;const[s,d]=i.useState(0),[u,w]=i.useState(!1),g=i.useMemo(()=>Je(),[]),v=i.useMemo(()=>{var m;return typeof window<"u"&&!!((m=window.matchMedia)!=null&&m.call(window,"(prefers-reduced-motion: reduce)").matches)},[]),h=(b=Xe())==null?void 0:b.setSuppressed;i.useEffect(()=>(h==null||h(!0),()=>h==null?void 0:h(!1)),[h]),i.useEffect(()=>()=>g.close(),[g]),i.useEffect(()=>{g.setMuted(u)},[g,u]);const y=i.useCallback(()=>d(m=>m+1),[]);return e.jsxs("div",{className:"wl-root",children:[e.jsx("style",{children:ut}),e.jsx(xt,{sfx:g,reduced:v,onReplay:y},s),e.jsxs("button",{type:"button",onClick:l,className:"wl-chip wl-back",title:"Back",children:[e.jsx("svg",{width:"16",height:"16",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:2.4,"aria-hidden":"true",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 19l-7-7 7-7"})}),e.jsx("span",{className:"wl-chip-t",children:"Back"})]}),e.jsxs("button",{type:"button",onClick:()=>w(m=>!m),className:"wl-chip wl-sound","aria-pressed":!u,"aria-label":"Sound",title:u?"Sound off":"Sound on",children:[e.jsx(ht,{off:u}),e.jsx("span",{className:"wl-chip-t",children:u?"Sound off":"Sound on"})]})]})}const ut=`
  .wl-root {
    position: fixed; inset: 0; z-index: 300;
    overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain;
    background: #1d1626; color: #fff2de;
    -webkit-tap-highlight-color: transparent;
  }
  .wl-scene {
    --c: 0; --h: 0;
    --ground: clamp(150px, 27vh, 250px);
    --rw: clamp(150px, min(44vw, 30vh), 270px);
    position: relative; width: 100%;
    height: 100vh; height: 100dvh; min-height: 560px;
    overflow: hidden;
    font-family: 'Sora', system-ui, sans-serif;
    -webkit-user-select: none; user-select: none; -webkit-touch-callout: none;
  }

  /* ---------- sky: pre-dawn, then his smoggy amber day, then night ---------- */
  .wl-sky { position: absolute; inset: 0; pointer-events: none; }
  .wl-sky-dawn { background: linear-gradient(180deg, #211a30 0%, #3a2840 30%, #67404a 58%, #9e5e4d 80%, #bf7c52 100%); }
  .wl-sky-day {
    opacity: var(--c);
    background:
      radial-gradient(60% 40% at 68% 82%, rgba(255,214,140,.55) 0%, rgba(255,190,110,0) 70%),
      linear-gradient(180deg, #48291f 0%, #74412a 26%, #ad6636 52%, #d8914f 76%, #ecb067 100%);
  }
  .wl-sky-night {
    opacity: 0; transition: opacity 1.8s ease;
    background:
      radial-gradient(80% 40% at 50% 100%, rgba(120,90,170,.35) 0%, transparent 70%),
      linear-gradient(180deg, #04060f 0%, #0a1027 38%, #141a3d 66%, #2a2550 100%);
  }
  .is-night .wl-sky-night { opacity: 1; }

  .wl-stars { position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity 2.4s ease .5s; }
  .is-night .wl-stars { opacity: 1; }
  .wl-star { position: absolute; border-radius: 50%; background: #e8efff; opacity: var(--op); animation: wlTwinkle 4s ease-in-out infinite; }

  .wl-sun {
    position: absolute; left: 74%; bottom: calc(var(--ground) + 9vh);
    width: min(30vmin, 240px); aspect-ratio: 1; border-radius: 50%; pointer-events: none;
    transform: translate(-50%, calc((1 - var(--c)) * 26vh));
    opacity: calc(.4 + var(--c) * .6);
    background: radial-gradient(circle, #fffaf0 0 15%, #ffe6b0 23%, rgba(255,205,130,.6) 37%, rgba(255,170,90,.18) 55%, rgba(255,160,80,0) 70%);
  }
  .wl-rays {
    position: absolute; inset: -70%; border-radius: 50%;
    background: repeating-conic-gradient(from 0deg, rgba(255,226,170,.16) 0deg 5deg, transparent 5deg 16deg);
    -webkit-mask-image: radial-gradient(circle, #000 18%, transparent 66%);
    mask-image: radial-gradient(circle, #000 18%, transparent 66%);
    opacity: calc(var(--c) * .85);
    animation: wlSpin 80s linear infinite;
  }
  .is-night .wl-sun { opacity: 0; transform: translate(-50%, 26vh); transition: opacity 1.4s ease, transform 1.8s ease; }

  .wl-skyline { position: absolute; left: 0; right: 0; bottom: calc(var(--ground) - 1px); height: 44vh; pointer-events: none; }
  .wl-skyline svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
  /* The towers warm with the sky. color-mix follows --c every frame; the
     plain fill before it is the fallback where color-mix is missing. */
  .wl-far { fill: #4a2f42; fill: color-mix(in srgb, #b4805e calc(var(--c) * 100%), #4a2f42); opacity: .92; }
  .wl-near { fill: #2e1e2b; fill: color-mix(in srgb, #744832 calc(var(--c) * 100%), #2e1e2b); }
  .is-night .wl-far { fill: #161c40; transition: fill 1.8s ease; }
  .is-night .wl-near { fill: #0b1029; transition: fill 1.8s ease; }
  .wl-haze { position: absolute; left: 0; right: 0; bottom: 0; height: 45%; background: linear-gradient(to top, rgba(236,170,100,.5), rgba(236,170,100,0)); opacity: var(--c); }
  .is-night .wl-haze { opacity: 0; transition: opacity 1.2s ease; }

  .wl-ground {
    position: absolute; left: 0; right: 0; bottom: 0; height: var(--ground); pointer-events: none;
    background: linear-gradient(180deg, #4a2f37 0%, #34212a 45%, #241820 100%);
  }
  .wl-ground > span { position: absolute; inset: 0; }
  .wl-ground-day {
    opacity: var(--c);
    background:
      radial-gradient(60% 30% at 50% 0%, rgba(255,220,160,.25), transparent 70%),
      linear-gradient(180deg, #9a6638 0%, #7c4d2b 32%, #5a361f 100%);
  }
  .wl-ground-night {
    opacity: 0; transition: opacity 1.8s ease;
    background:
      radial-gradient(50% 30% at 42% 0%, rgba(140,200,255,.12), transparent 70%),
      linear-gradient(180deg, #1c1934 0%, #12101f 50%, #0b0a14 100%);
  }
  .is-night .wl-ground-night { opacity: 1; }
  .wl-ground::after {
    content: ''; position: absolute; inset: 0;
    background:
      radial-gradient(28% 18% at 18% 38%, rgba(0,0,0,.14), transparent 70%),
      radial-gradient(22% 16% at 84% 62%, rgba(0,0,0,.12), transparent 70%),
      radial-gradient(30% 14% at 60% 86%, rgba(0,0,0,.1), transparent 70%);
  }
  .wl-ground::before {
    content: ''; position: absolute; left: 0; right: 0; top: 0; height: 2px; z-index: 1;
    background: linear-gradient(90deg, transparent, rgba(255,226,180,.35), transparent);
    opacity: calc(.3 + var(--c) * .7);
  }
  .is-night .wl-ground::before { opacity: .25; }

  .wl-dust { position: absolute; inset: 0; pointer-events: none; overflow: hidden; transition: opacity 1s ease; }
  .is-night .wl-dust { opacity: 0; }
  .wl-dust span { position: absolute; left: -4vw; border-radius: 50%; background: #f6d7a8; opacity: 0; animation: wlDrift 20s linear infinite; }

  /* ---------- the actors ---------- */
  .wl-actors {
    position: absolute; left: 50%; bottom: calc(var(--ground) - 16px); width: var(--rw); z-index: 3;
    transform: translateX(-50%);
    transition: transform 1.3s cubic-bezier(.45,.05,.3,1);
  }
  /* Make room on his left for her. */
  .is-reach .wl-actors { transform: translateX(calc(-50% + var(--rw) * .17)); }
  .wl-bot { position: relative; width: 100%; aspect-ratio: 260 / 300; }
  .is-charging .wl-bot { filter: drop-shadow(0 0 calc(var(--c) * 16px) rgba(255,196,92,.5)); }
  .wl-svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }

  /* Every origin below is in the robot's drawing units. */
  .wl-svg g, .wl-svg rect, .wl-svg path, .wl-svg ellipse { transform-box: view-box; }

  .wl-shadow { fill: #1a0f08; opacity: .3; transform-origin: 130px 297px; transition: transform .6s ease; }
  .wl-off .wl-shadow { transform: scaleX(.74); }

  .wl-treads { transform-origin: 130px 296px; transition: transform .55s cubic-bezier(.3,1.25,.5,1); }
  .wl-off .wl-treads { transform: scaleY(.56); }
  .wl-tread-l, .wl-tread-r { transition: transform .55s cubic-bezier(.3,1.25,.5,1); }
  .wl-off .wl-tread-l { transform: translateX(20px); }
  .wl-off .wl-tread-r { transform: translateX(-20px); }

  .wl-upper { transition: transform .62s cubic-bezier(.3,1.35,.5,1); }
  .is-waking .wl-upper { transition-delay: .12s; }
  .wl-off .wl-upper { transform: translateY(32px); }
  .wl-upper-in { transform-origin: 130px 296px; }

  .wl-panel { transform-origin: 130px 122px; transform: scaleY(0); transition: transform .3s ease; }
  .is-charging .wl-panel { transform: scaleY(1); transition: transform .45s cubic-bezier(.3,1.4,.5,1); }
  .wl-panel-glint { animation: wlGlintX 2.4s ease-in-out infinite; }

  .wl-headpose { transition: transform .7s cubic-bezier(.3,1.45,.5,1); }
  .is-waking .wl-headpose { transition-delay: .78s; }
  .wl-off .wl-headpose { transform: translateY(108px); }
  .wl-headlook, .wl-headidle { transform-origin: 130px 112px; }
  .wl-on .wl-headidle { animation: wlIdle 7s ease-in-out 4s infinite; }

  .wl-lid { transform-origin: 101px 36px; transform: scaleY(1); }
  .wl-on .wl-lid { animation: wlOpen .32s ease-out 1.45s both, wlBlink 5.4s ease-in-out 3.4s infinite; }
  .wl-lidb { transition: transform .5s ease; }
  .is-happy .wl-lidb { transform: translateY(-12px); }

  .wl-sunicon { fill: #5b4e24; stroke: #5b4e24; stroke-width: 1.6; stroke-linecap: round; transition: fill .3s, stroke .3s; }
  .wl-sunicon.is-lit { fill: #ffd54a; stroke: #ffd54a; }
  .wl-bar { fill: #463c20; transition: fill .2s; }
  .wl-bar.is-lit { fill: #ffd84d; filter: url(#wl-glow); }

  .wl-arm { transition: transform .55s cubic-bezier(.3,1.3,.5,1), opacity .35s ease; }
  .is-waking .wl-arm { transition-delay: .5s; }
  .wl-arm-l { transform-origin: 58px 196px; }
  .wl-arm-r, .wl-arm-in-r { transform-origin: 202px 196px; }
  .wl-off .wl-arm-l { transform: translateX(26px) scale(.8); opacity: 0; }
  .wl-off .wl-arm-r { transform: translateX(-26px) scale(.8); opacity: 0; }
  .is-tada .wl-arm-l { transform: translate(0, -44px) rotate(58deg); }
  .is-tada .wl-arm-r { transform: translate(0, -44px) rotate(-58deg); }
  .is-reach .wl-arm-l { transform: rotate(10deg); transition-duration: .8s; }
  .wl-beam-l { transform-origin: 60px 196px; transition: transform .8s cubic-bezier(.3,1.2,.5,1); }
  .wl-beam-r { transform-origin: 200px 196px; }
  .is-reach .wl-beam-l { transform: scaleX(1.87); }
  .wl-hand-l { transition: transform .8s cubic-bezier(.3,1.2,.5,1); }
  .is-reach .wl-hand-l { transform: translateX(-26px); }

  /* The boot in his hand pops in, then counter-rotates as the arm goes
     up so it stays upright. It vanishes the instant it is set down. */
  .wl-held { transform-origin: 237px 206px; opacity: 0; transform: scale(.3); }
  .has-boot .wl-held { opacity: 1; transform: none; transition: opacity .2s ease, transform .4s cubic-bezier(.3,1.5,.5,1); }
  .is-tada .wl-held { transform: rotate(58deg); transition: opacity .2s ease, transform .55s cubic-bezier(.3,1.3,.5,1); }

  .wl-leaf { transform: scale(0); transition: transform .5s cubic-bezier(.3,1.6,.5,1); }
  .wl-leaf-1 { transform-origin: -2px -74px; }
  .wl-leaf-2 { transform-origin: -2px -76px; }
  .wl-leaf-3 { transform-origin: -2px -63px; }
  .is-tada .wl-held .wl-leaf-1 { transform: none; transition-delay: .7s; }
  .is-tada .wl-held .wl-leaf-2 { transform: none; transition-delay: .9s; }
  .wl-gboot .wl-leaf-1, .wl-gboot .wl-leaf-2 { transform: none; }
  .is-done .wl-gboot .wl-leaf-3 { transform: none; transition-delay: 1.6s; }

  /* Starts exactly where the raised boot is, then travels to the ground. */
  .wl-gboot { opacity: 0; transform: translate(70px, -122px); }
  .has-gboot .wl-gboot { opacity: 1; transform: none; transition: transform .75s cubic-bezier(.45,.05,.35,1), opacity .12s ease; }

  .wl-eve { opacity: 0; transform-origin: -14px 194px; transform: scale(.35); }
  .is-eve .wl-eve { opacity: 1; transform: none; transition: opacity .9s ease .1s, transform 1.1s cubic-bezier(.2,.9,.3,1.12) .1s; }
  .wl-eve-head { transform-origin: -80px 142px; }
  .is-eve .wl-eve-head { animation: wlFloat 3.6s ease-in-out 1.6s infinite; }
  .wl-eve-hover { opacity: .35; transform-origin: -80px 291px; animation: wlHover 3.6s ease-in-out infinite; }

  .wl-mound { transform-origin: 300px 296px; transition: transform .45s cubic-bezier(.3,1.3,.5,1); }
  .wl-pile.d1 .wl-mound { transform: scaleY(.93); }
  .wl-pile.d2 .wl-mound { transform: scaleY(.86); }
  .wl-pile.d3 .wl-mound { transform: scaleY(.8); }
  .wl-pi { transition: opacity .25s ease, transform .45s ease; }
  .wl-pile.d1 .wl-pi-a, .wl-pile.d1 .wl-pi-b, .wl-pile.d2 .wl-pi-c, .wl-pile.d2 .wl-pi-d, .wl-pile.d3 .wl-pi-e { opacity: 0; }
  .wl-pile.d1 .wl-pi-e { transform: translateY(6px); }
  .wl-pile.d2 .wl-pi-e { transform: translateY(12px); }
  .wl-glint { transform-origin: 302px 194px; animation: wlGlint 2.2s ease-in-out infinite; }
  .is-night .wl-pile { opacity: .75; transition: opacity 1.6s ease; }

  .wl-fx { opacity: 0; transition: opacity .5s ease; }
  .is-reach .wl-fx { opacity: 1; }
  .is-eve .wl-fx { opacity: 0; transition: opacity .7s ease .3s; }
  .wl-halo { opacity: .45; }
  .wl-svg .wl-orb { transform-box: fill-box; transform-origin: center; }
  .is-reach:not(.is-holding):not(.is-eve) .wl-orb { animation: wlPulse 1.6s ease-in-out infinite; }
  .wl-arcs { opacity: 0; transition: opacity .15s; }
  .is-holding .wl-arcs { opacity: 1; }

  /* ---------- overlays on the robot ---------- */
  .wl-bubble {
    position: absolute; left: 58%; bottom: 93%; z-index: 4;
    padding: 9px 15px 10px; border-radius: 18px;
    background: #fff6e6; color: #2b1a0d;
    font: 700 clamp(15px, 1.2vw + 9px, 19px)/1 'Sora', system-ui, sans-serif; letter-spacing: .02em;
    white-space: nowrap; box-shadow: 0 10px 28px rgba(30,12,4,.3);
    transform-origin: 12% 100%;
    animation: wlPop .45s cubic-bezier(.3,1.6,.5,1) both;
  }
  .wl-bubble::after {
    content: ''; position: absolute; left: 16px; bottom: -6px; width: 13px; height: 13px;
    background: #fff6e6; transform: rotate(45deg); border-radius: 2px;
  }
  .wl-spot {
    position: absolute; z-index: 3; border: 0; padding: 0; margin: 0;
    background: transparent; cursor: pointer; border-radius: 16px;
    touch-action: none; -webkit-user-select: none; user-select: none;
  }
  .wl-spot:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(255,236,200,.85); }
  .wl-pilespot { left: 88%; top: 64%; width: 55%; height: 36%; }
  .wl-handspot { left: -11.5%; top: 64.7%; width: 72px; height: 72px; transform: translate(-50%, -50%); border-radius: 50%; }
  .wl-handspot::before {
    content: ''; position: absolute; inset: 12px; border-radius: 50%;
    border: 2px solid rgba(143,220,255,.75);
    animation: wlRing 1.8s ease-out infinite;
  }
  .is-holding .wl-handspot::before { animation: none; opacity: 0; }
  .wl-fxhost { position: absolute; inset: 0; pointer-events: none; z-index: 4; overflow: visible; }
  .wl-bit { position: absolute; will-change: transform, opacity; animation: wlBit .9s cubic-bezier(.2,.7,.3,1) forwards; }
  .wl-mote {
    position: absolute; width: 4px; height: 4px; border-radius: 50%;
    background: #e6f7ff; box-shadow: 0 0 8px #8fd8ff, 0 0 2px #fff;
    opacity: 0; will-change: transform, opacity;
    animation: wlMote 2.6s ease-out forwards;
  }
  .wl-flash {
    position: absolute; inset: 0; z-index: 7; pointer-events: none; opacity: 0;
    background: radial-gradient(circle at var(--fx, 50%) var(--fy, 62%), rgba(235,248,255,.95) 0%, rgba(160,220,255,.45) 14%, rgba(120,190,255,0) 42%);
  }
  .wl-flash.is-on { animation: wlFlash 1.2s ease-out forwards; }

  /* ---------- words ---------- */
  .wl-copy { position: absolute; left: 0; right: 0; top: clamp(64px, 9vh, 92px); padding: 0 22px; text-align: center; z-index: 5; pointer-events: none; }
  .wl-acts.is-leaving, .wl-dock-in.is-leaving { animation: wlLeave .5s ease forwards; }
  .wl-eyebrow {
    margin: 0 0 12px;
    font: 500 11px/1.4 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .32em; text-transform: uppercase;
    color: #f2cf9c;
  }
  .wl-title {
    margin: 0 auto; max-width: 17ch;
    font-family: 'Newsreader', Georgia, serif; font-weight: 500;
    font-size: clamp(1.55rem, 5.4vw, 2.75rem); line-height: 1.12;
    color: #fff3e2; text-wrap: balance; text-shadow: 0 2px 22px rgba(20,8,4,.35);
  }
  .wl-caption {
    margin: 14px auto 0; max-width: 29rem;
    font-size: clamp(.95rem, 2.4vw, 1.1rem); line-height: 1.55;
    color: #f7e3c6; text-wrap: pretty; text-shadow: 0 1px 14px rgba(30,12,6,.5);
    animation: wlUp .6s cubic-bezier(.22,.61,.36,1) both;
  }
  .wl-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

  .wl-final { max-width: 46rem; margin: 0 auto; }
  .wl-in { opacity: 0; animation: wlUp .9s cubic-bezier(.22,.61,.36,1) forwards; }
  .wl-f-eyebrow {
    margin: 0 0 14px;
    font: 500 11px/1.4 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .3em; text-transform: uppercase;
    color: #93dcff;
  }
  .wl-f-title {
    margin: 0 auto 14px; max-width: 30ch; outline: none;
    font-family: 'Newsreader', Georgia, serif; font-weight: 500;
    font-size: clamp(1.9rem, 6.6vw, 3.3rem); line-height: 1.08; text-wrap: balance;
    background: linear-gradient(100deg, #fff7e8 0%, #ffe2a6 30%, #ffffff 52%, #cfeeff 76%, #fff7e8 100%);
    background-size: 220% auto;
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent; color: transparent;
    opacity: 0;
    animation: wlUp .9s cubic-bezier(.22,.61,.36,1) .35s forwards, wlShine 6s linear 1.6s infinite;
  }
  .wl-f-line { margin: 0 auto; max-width: 38rem; font-size: clamp(1rem, 2.6vw, 1.18rem); line-height: 1.55; color: #eef2ff; text-wrap: pretty; }
  .wl-f-soft { margin-top: 6px; color: #c9d4f0; }
  .wl-f-te {
    margin: 14px 0 0;
    font-family: 'Newsreader', Georgia, serif; font-style: italic;
    font-size: clamp(1.45rem, 4.4vw, 2.05rem); line-height: 1.2;
    color: #ffd36b; text-shadow: 0 0 24px rgba(255,200,90,.35);
  }

  /* ---------- the one button ---------- */
  .wl-dock {
    position: absolute; left: 0; right: 0; bottom: 0; height: var(--ground); z-index: 6;
    display: flex; align-items: center; justify-content: center;
    padding: 26px 16px 18px;
  }
  .wl-dock-in { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .wl-act {
    position: relative; width: 84px; height: 84px; border-radius: 50%;
    border: 0; padding: 0; margin: 0; background: transparent; cursor: pointer;
    touch-action: none; -webkit-user-select: none; user-select: none; outline: none;
    transition: transform .2s ease, opacity .3s ease;
  }
  .wl-act:focus-visible { box-shadow: 0 0 0 3px rgba(255,236,200,.85); }
  .wl-act[aria-disabled="true"] { cursor: default; opacity: .72; }
  .is-holding .wl-act { transform: scale(.95); }
  .wl-ring { position: absolute; inset: -8px; width: calc(100% + 16px); height: calc(100% + 16px); transform: rotate(-90deg); overflow: visible; }
  .wl-ring-bg { fill: none; stroke: rgba(255,240,215,.18); stroke-width: 5; }
  .wl-ring-fg {
    fill: none; stroke: #ffd36b; stroke-width: 5; stroke-linecap: round;
    stroke-dasharray: 100; stroke-dashoffset: calc(100 - var(--p, 0) * 100);
  }
  .wl-act-charge { --p: var(--c); }
  .wl-act-hand { --p: var(--h); }
  .wl-act-hand .wl-ring-fg { stroke: #8fdcff; }
  .wl-act-dig .wl-ring { display: none; }
  .wl-act-disc {
    position: absolute; inset: 4px; border-radius: 50%;
    display: grid; place-items: center; color: #4a2a0c;
    background: radial-gradient(circle at 35% 30%, #fff1c4, #ffd36b 45%, #f29a32 100%);
    box-shadow: 0 8px 26px rgba(255,170,70,.35), inset 0 -6px 14px rgba(160,70,10,.35), inset 0 3px 8px rgba(255,255,255,.55);
  }
  .wl-act:not([aria-disabled="true"]) .wl-act-disc { animation: wlBreathe 2.6s ease-in-out infinite; }
  .is-holding .wl-act .wl-act-disc { animation: none; }
  .wl-act-dig .wl-act-disc {
    color: #3b230f;
    background: radial-gradient(circle at 35% 30%, #fbe7c8, #e0b47a 50%, #b07a44 100%);
    box-shadow: 0 8px 24px rgba(120,70,30,.35), inset 0 -6px 14px rgba(90,50,20,.35), inset 0 3px 8px rgba(255,255,255,.5);
  }
  .wl-act-hand .wl-act-disc {
    color: #0b2a3d;
    background: radial-gradient(circle at 35% 30%, #ffffff, #c8eeff 45%, #7fd0ff 100%);
    box-shadow: 0 8px 26px rgba(110,200,255,.35), inset 0 -6px 14px rgba(40,120,180,.3), inset 0 3px 8px rgba(255,255,255,.6);
  }
  .wl-act-disc svg { width: 38px; height: 38px; }
  .wl-act-label { margin: 6px 0 0; font: 600 14px/1.3 'Sora', system-ui, sans-serif; color: #fff0d8; letter-spacing: .01em; }
  .wl-dots { display: flex; gap: 8px; }
  .wl-dots i { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,240,215,.25); transition: background .25s; }
  .wl-dots i.on { background: #ffd36b; }

  .wl-foot {
    margin: 0 0 6px; text-align: center;
    font: 500 10px/1.6 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .24em; text-transform: uppercase;
    color: #a9b4d6;
  }
  .wl-replay {
    min-height: 44px; padding: 0 22px; border-radius: 999px; cursor: pointer;
    font: 600 14px/1 'Sora', system-ui, sans-serif; color: #e8eeff;
    background: rgba(255,255,255,.06); border: 1px solid rgba(200,215,255,.28);
    transition: background .2s ease, transform .2s ease;
  }
  .wl-replay:hover { background: rgba(255,255,255,.12); transform: translateY(-1px); }
  .wl-replay:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(200,225,255,.7); }

  /* ---------- corner chips ---------- */
  .wl-chip {
    position: fixed; top: 16px; z-index: 20;
    display: inline-flex; align-items: center; gap: 6px; height: 40px; padding: 0 14px;
    border-radius: 999px; cursor: pointer;
    font: 500 14px/1 'Sora', system-ui, sans-serif; color: #fbe9cf;
    background: rgba(20,12,10,.35); border: 1px solid rgba(255,226,180,.22);
    -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
    transition: transform .2s ease;
  }
  .wl-chip::after { content: ''; position: absolute; inset: -4px; }
  .wl-chip:hover { transform: scale(1.04); }
  .wl-chip:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(255,236,200,.7); }
  .wl-back { left: 16px; }
  .wl-sound { right: 16px; padding: 0 12px; }
  @media (max-width: 639px) { .wl-chip-t { display: none; } .wl-chip { width: 40px; padding: 0; justify-content: center; } }

  /* Short screens: tighten the message and stand the two of them a
     little smaller, so the last line never lands on his head. */
  @media (max-height: 760px) {
    .wl-copy { top: 60px; }
    .wl-f-eyebrow { margin-bottom: 10px; }
    .wl-f-title { font-size: clamp(1.7rem, 6vw, 2.6rem); margin-bottom: 10px; }
    .wl-f-line { font-size: clamp(.95rem, 2.4vw, 1.08rem); line-height: 1.5; }
    .wl-f-te { margin-top: 10px; font-size: clamp(1.3rem, 4vw, 1.8rem); }
    .wl-bot { transition: transform 1.3s cubic-bezier(.45,.05,.3,1); transform-origin: 50% 100%; }
    .is-done .wl-bot { transform: scale(.88); }
  }

  /* ---------- motion ---------- */
  @keyframes wlTwinkle { 0%, 100% { opacity: calc(var(--op) * .3); } 50% { opacity: var(--op); } }
  @keyframes wlSpin { to { transform: rotate(360deg); } }
  @keyframes wlDrift {
    0% { transform: translate(0, 0); opacity: 0; } 10% { opacity: .55; }
    50% { transform: translate(55vw, -2vh); } 90% { opacity: .4; }
    100% { transform: translate(110vw, 1vh); opacity: 0; }
  }
  @keyframes wlGlintX { 0% { transform: translateX(10px); opacity: 0; } 20% { opacity: 1; } 60%, 100% { transform: translateX(230px); opacity: 0; } }
  @keyframes wlIdle { 0%, 70%, 100% { transform: rotate(0deg); } 78% { transform: rotate(-4deg); } 88% { transform: rotate(3deg); } }
  @keyframes wlOpen { from { transform: scaleY(1); } to { transform: scaleY(0); } }
  @keyframes wlBlink { 0%, 90%, 97%, 100% { transform: scaleY(0); } 93.5% { transform: scaleY(1); } }
  @keyframes wlFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
  @keyframes wlHover { 0%, 100% { transform: scaleX(1); opacity: .35; } 50% { transform: scaleX(.85); opacity: .22; } }
  @keyframes wlGlint { 0%, 100% { transform: scale(.45) rotate(0deg); opacity: .35; } 50% { transform: scale(1.1) rotate(45deg); opacity: 1; } }
  @keyframes wlPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.25); } }
  @keyframes wlPop { from { opacity: 0; transform: scale(.4); } to { opacity: 1; transform: none; } }
  @keyframes wlUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
  @keyframes wlLeave { to { opacity: 0; transform: translateY(-8px); } }
  @keyframes wlShine { to { background-position: 220% center; } }
  @keyframes wlBreathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
  @keyframes wlRing { 0% { transform: scale(.7); opacity: .9; } 100% { transform: scale(1.5); opacity: 0; } }
  @keyframes wlBit {
    0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
    45% { transform: translate(calc(var(--dx) * .6), var(--dy)) rotate(calc(var(--rot) * .5)); opacity: 1; }
    100% { transform: translate(var(--dx), calc(var(--dy) * -0.4)) rotate(var(--rot)); opacity: 0; }
  }
  @keyframes wlMote {
    0% { opacity: 0; transform: translate(0, 0) scale(.6); } 15% { opacity: 1; }
    100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(1); }
  }
  @keyframes wlFlash { 0% { opacity: 0; } 12% { opacity: 1; } 100% { opacity: 0; } }

  /* Reduced motion: every step still happens and every word still
     arrives, it just stops moving to get there. */
  @media (prefers-reduced-motion: reduce) {
    .wl-scene *, .wl-scene *::before, .wl-scene *::after { transition-duration: .01ms !important; transition-delay: 0s !important; }
    .wl-rays, .wl-glint, .wl-panel-glint, .wl-eve-head, .wl-eve-hover, .wl-headidle,
    .wl-act-disc, .wl-handspot::before, .wl-orb { animation: none !important; }
    .wl-dust { display: none; }
    .wl-star { animation: none; opacity: var(--op); }
    .wl-on .wl-lid { animation: none; transform: scaleY(0); }
    .wl-in, .wl-caption, .wl-bubble, .wl-acts.is-leaving, .wl-dock-in.is-leaving { animation: none; opacity: 1; transform: none; }
    .wl-acts.is-leaving, .wl-dock-in.is-leaving { opacity: 0; }
    .wl-f-title { animation: none; opacity: 1; }
  }
`;export{yt as default};
