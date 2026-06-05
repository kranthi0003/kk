import{r as i,j as e}from"./index-FnoVlu4k.js";import{C as q,a as b,b as U}from"./react-three-fiber.esm-D8lMR-El.js";import{aH as j,D as k,aN as G,S as L}from"./three.module-B1ovfr68.js";class ${constructor(){this.ctx=null,this.master=null,this.started=!1,this.element=null,this.lowpass=null}init(){if(this.ctx)return;const s=window.AudioContext||window.webkitAudioContext;s&&(this.ctx=new s,this.master=this.ctx.createGain(),this.master.gain.value=.7,this.lowpass=this.ctx.createBiquadFilter(),this.lowpass.type="lowpass",this.lowpass.frequency.value=22e3,this.lowpass.Q.value=.7,this.lowpass.connect(this.master).connect(this.ctx.destination))}async start(){if(!this.ctx||this.started)return;this.started=!0,this.element=new Audio("/audio/loop.mp3"),this.element.loop=!0,this.element.crossOrigin="anonymous",this.element.volume=1,this.ctx.createMediaElementSource(this.element).connect(this.lowpass);try{await this.element.play()}catch(t){console.warn("Audio play blocked:",t)}}setApproach(s){if(!this.element||!this.ctx)return;this.element.playbackRate=Math.max(.3,1-s*.7);const t=Math.max(400,22e3*(1-s*.95));this.lowpass.frequency.linearRampToValueAtTime(t,this.ctx.currentTime+.1),this.master.gain.linearRampToValueAtTime(.7+s*.2,this.ctx.currentTime+.1)}stop(){this.element&&(this.element.pause(),this.element=null),this.started=!1}}const N=new $;function V({approachRef:n}){const s=i.useRef(),{geometry:t,material:a}=i.useMemo(()=>{const u=new G(2.2,8,256,4),l=new L({uniforms:{uTime:{value:0},uApproach:{value:0}},vertexShader:`
        varying vec2 vUv;
        varying float vRadius;
        void main() {
          vUv = uv;
          vRadius = length(position.xy);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,fragmentShader:`
        uniform float uTime;
        uniform float uApproach;
        varying vec2 vUv;
        varying float vRadius;

        // Simple noise
        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1, 0));
          float c = hash(i + vec2(0, 1));
          float d = hash(i + vec2(1, 1));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        void main() {
          // Spiral pattern - angle + log(radius) creates spiral arms
          float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
          float r = vRadius / 8.0;

          // Doppler effect — front side hotter, back side cooler
          float doppler = 0.5 + 0.5 * cos(angle);

          // Rotating turbulence
          float spiral = sin(angle * 4.0 + log(r + 0.1) * 8.0 - uTime * 2.0);
          float turb = noise(vec2(angle * 4.0 - uTime, log(r + 0.1) * 6.0)) * 0.6;

          // Inner edge: bright white-hot, outer: deep red
          float innerHeat = smoothstep(1.0, 0.0, r);
          vec3 hotCore = mix(vec3(1.0, 0.95, 0.8), vec3(1.0, 0.5, 0.1), 1.0 - innerHeat);
          vec3 outerCool = vec3(0.6, 0.1, 0.05);
          vec3 col = mix(outerCool, hotCore, innerHeat);

          // Doppler boost
          col *= 0.5 + doppler * 1.2;

          // Brightness modulation by spiral + turbulence
          float bright = (0.5 + spiral * 0.3 + turb) * (1.0 + innerHeat * 2.0);

          // Fade at outer + inner edges
          float edgeFade = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);

          // Approach intensifies
          bright *= 1.0 + uApproach * 1.5;

          gl_FragColor = vec4(col * bright * edgeFade, edgeFade * 0.95);
        }
      `,transparent:!0,side:k,depthWrite:!1,blending:j});return{geometry:u,material:l}},[]);return b((u,l)=>{s.current&&(a.uniforms.uTime.value+=l,a.uniforms.uApproach.value=n.current,s.current.rotation.z+=l*.05)}),e.jsx("mesh",{ref:s,geometry:t,material:a,rotation:[Math.PI/2-.25,0,0]})}function W({approachRef:n}){const s=i.useRef(),t=i.useRef();return b(()=>{t.current&&(t.current.opacity=.5+n.current*.4)}),e.jsxs("group",{children:[e.jsxs("mesh",{children:[e.jsx("sphereGeometry",{args:[2,64,64]}),e.jsx("meshBasicMaterial",{color:"#000000"})]}),e.jsxs("mesh",{ref:s,children:[e.jsx("ringGeometry",{args:[2,2.25,128]}),e.jsx("meshBasicMaterial",{ref:t,color:"#ffcc66",transparent:!0,opacity:.6,side:k,blending:j,depthWrite:!1})]}),e.jsxs("mesh",{children:[e.jsx("ringGeometry",{args:[2.25,2.6,128]}),e.jsx("meshBasicMaterial",{color:"#ff8844",transparent:!0,opacity:.25,side:k,blending:j,depthWrite:!1})]})]})}function B({approachRef:n}){const s=i.useRef(),t=3e3,a=i.useMemo(()=>{const u=new Float32Array(t*3),l=new Float32Array(t),h=new Float32Array(t),o=new Float32Array(t),p=new Float32Array(t),d=new Float32Array(t*3),r=new Float32Array(t);for(let c=0;c<t;c++){l[c]=Math.random()*Math.PI*2,h[c]=3+Math.random()*25,o[c]=(Math.random()-.5)*1.5,p[c]=.3+Math.random()*.5,r[c]=.05+Math.random()*.15;const g=1-(h[c]-3)/25;d[c*3]=1,d[c*3+1]=.5+g*.4,d[c*3+2]=.1+g*.6}return{positions:u,angles:l,radii:h,heights:o,speeds:p,colors:d,sizes:r}},[]);return b((u,l)=>{if(!s.current)return;const h=s.current.geometry.attributes.position.array,o=n.current,p=1+o*4,d=1+o*3;for(let r=0;r<t;r++){const c=a.speeds[r]*(8/Math.max(a.radii[r],2))*p;a.angles[r]+=c*l,a.radii[r]-=l*.4*d*(1/Math.max(a.radii[r]/10,.3)),a.heights[r]*=1-l*.5*d,a.radii[r]<2.4&&(a.angles[r]=Math.random()*Math.PI*2,a.radii[r]=22+Math.random()*8,a.heights[r]=(Math.random()-.5)*1.5),h[r*3]=Math.cos(a.angles[r])*a.radii[r],h[r*3+1]=a.heights[r],h[r*3+2]=Math.sin(a.angles[r])*a.radii[r]}s.current.geometry.attributes.position.needsUpdate=!0}),e.jsxs("points",{ref:s,rotation:[-.25,0,0],children:[e.jsxs("bufferGeometry",{children:[e.jsx("bufferAttribute",{attach:"attributes-position",count:t,array:a.positions,itemSize:3}),e.jsx("bufferAttribute",{attach:"attributes-color",count:t,array:a.colors,itemSize:3}),e.jsx("bufferAttribute",{attach:"attributes-size",count:t,array:a.sizes,itemSize:1})]}),e.jsx("pointsMaterial",{vertexColors:!0,size:.18,sizeAttenuation:!0,transparent:!0,opacity:.95,blending:j,depthWrite:!1})]})}function _(){const n=i.useRef(),s=2e3,t=i.useMemo(()=>{const a=new Float32Array(s*3);for(let u=0;u<s;u++){const l=Math.random()*Math.PI*2,h=Math.acos(2*Math.random()-1),o=60+Math.random()*40;a[u*3]=o*Math.sin(h)*Math.cos(l),a[u*3+1]=o*Math.sin(h)*Math.sin(l),a[u*3+2]=o*Math.cos(h)}return a},[]);return b((a,u)=>{n.current&&(n.current.rotation.y+=u*.005)}),e.jsxs("points",{ref:n,children:[e.jsx("bufferGeometry",{children:e.jsx("bufferAttribute",{attach:"attributes-position",count:s,array:t,itemSize:3})}),e.jsx("pointsMaterial",{size:.15,color:"#ffffff",transparent:!0,opacity:.7,sizeAttenuation:!0,depthWrite:!1})]})}function Y({approachRef:n,distanceRef:s}){const{camera:t}=U();return b((a,u)=>{const l=n.current,h=18-l*14;s.current+=(h-s.current)*.04;const o=.2+l*.15;if(t.position.x=0,t.position.y=s.current*Math.sin(o),t.position.z=s.current*Math.cos(o),t.lookAt(0,0,0),l>.5){const d=(l-.5)*.1;t.position.x+=(Math.random()-.5)*d,t.position.y+=(Math.random()-.5)*d}const p=60+l*25;t.fov+=(p-t.fov)*.05,t.updateProjectionMatrix()}),null}function Z({approachRef:n,distanceRef:s}){return e.jsxs(e.Fragment,{children:[e.jsx("color",{attach:"background",args:["#000000"]}),e.jsx(_,{}),e.jsx(W,{approachRef:n}),e.jsx(V,{approachRef:n}),e.jsx(B,{approachRef:n}),e.jsx(Y,{approachRef:n,distanceRef:s})]})}function J({onBack:n}){const[s,t]=i.useState(!1),[a,u]=i.useState(null),[l,h]=i.useState("00:00:000"),[o,p]=i.useState(0),[d,r]=i.useState(1),[c,g]=i.useState(!1),x=i.useRef(0),C=i.useRef(18),y=i.useRef(!1),F=i.useCallback(()=>{N.init(),N.start(),t(!0),u(Date.now())},[]),v=i.useRef(null);i.useEffect(()=>{if(!s)return;let m;const f=()=>{if(c){m=requestAnimationFrame(f);return}if(y.current){const w=1-x.current;x.current=Math.min(x.current+.006*w+8e-4,.995)}else x.current=Math.max(x.current-.008,0);p(x.current),N.setApproach(x.current),x.current>=.99?v.current?performance.now()-v.current>600&&(g(!0),y.current=!1,setTimeout(()=>{x.current=0,v.current=null,g(!1)},8e3)):v.current=performance.now():v.current=null,m=requestAnimationFrame(f)};return m=requestAnimationFrame(f),()=>cancelAnimationFrame(m)},[s,c]),i.useEffect(()=>{if(!a)return;let m,f=0,w=performance.now();const T=R=>{const D=R-w;w=R;const E=Math.max(.1,1-x.current*.9);f+=D*E,r(E);const A=Math.floor(f),O=String(Math.floor(A/6e4)).padStart(2,"0"),P=String(Math.floor(A%6e4/1e3)).padStart(2,"0"),H=String(A%1e3).padStart(3,"0");h(`${O}:${P}:${H}`),m=requestAnimationFrame(T)};return m=requestAnimationFrame(T),()=>cancelAnimationFrame(m)},[a]),i.useEffect(()=>{if(!s)return;let m;const f=()=>{m=requestAnimationFrame(f)};return m=requestAnimationFrame(f),()=>cancelAnimationFrame(m)},[s]);const I=i.useCallback(()=>{c||(y.current=!0)},[c]),S=i.useCallback(()=>{y.current=!1},[]);if(!s)return e.jsxs("div",{className:"fixed inset-0 bg-black flex flex-col items-center justify-center z-50 cursor-pointer",onClick:F,children:[e.jsx("div",{className:"absolute top-6 left-6",children:e.jsx("button",{onClick:m=>{m.stopPropagation(),n==null||n()},className:"text-white/30 hover:text-white/60 text-xs font-mono tracking-wider transition-colors",children:"← BACK"})}),e.jsxs("div",{className:"text-center",children:[e.jsx("h1",{className:"text-white/80 text-2xl sm:text-4xl font-mono tracking-[0.3em] mb-8",children:"EVENT HORIZON"}),e.jsxs("div",{className:"text-white/30 text-xs font-mono tracking-[0.2em] mb-6 max-w-md",children:["You are about to approach a supermassive black hole.",e.jsx("br",{}),"Hold to fall in. Release to pull back.",e.jsx("br",{}),"Time will slow as you near the singularity."]}),e.jsx("div",{className:"text-white/40 text-xs font-mono tracking-[0.2em] animate-pulse border border-white/10 px-6 py-3 inline-block",children:"CLICK TO BEGIN DESCENT"})]}),e.jsx("div",{className:"absolute bottom-8 text-white/15 text-[9px] font-mono tracking-[0.15em]",children:"Schwarzschild radius · accretion disk · time dilation"})]});const M=o,z=`radial-gradient(ellipse at center, rgba(255,${Math.floor(150-M*100)},${Math.floor(80-M*60)},${M*.18}) 0%, transparent 70%)`;return e.jsxs("div",{className:"fixed inset-0 bg-black z-50 select-none cursor-crosshair overflow-hidden",onPointerDown:I,onPointerUp:S,onPointerLeave:S,children:[e.jsx(q,{camera:{position:[0,4,18],fov:60,near:.1,far:200},dpr:[1,2],gl:{antialias:!0,alpha:!1},children:e.jsx(Z,{approachRef:x,distanceRef:C})}),e.jsx("div",{className:"absolute top-0 left-0 right-0 bg-black pointer-events-none z-20",style:{height:"8vh",boxShadow:"0 4px 20px rgba(0,0,0,0.6)"}}),e.jsx("div",{className:"absolute bottom-0 left-0 right-0 bg-black pointer-events-none z-20",style:{height:"8vh",boxShadow:"0 -4px 20px rgba(0,0,0,0.6)"}}),e.jsx("div",{className:"absolute inset-0 pointer-events-none z-10",style:{background:"radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.85) 100%)"}}),e.jsx("div",{className:"absolute inset-0 pointer-events-none z-10",style:{background:z,transition:"background 0.3s"}}),o>.5&&e.jsx("div",{className:"absolute inset-0 pointer-events-none z-10 mix-blend-screen",style:{background:`radial-gradient(circle at 50% 50%, transparent ${30-o*15}%, rgba(255,180,80,${(o-.5)*.4}) ${35-o*15}%, transparent ${40-o*10}%)`,opacity:(o-.5)*2}}),e.jsx("div",{className:"absolute inset-0 pointer-events-none z-10 opacity-[0.07] mix-blend-overlay",style:{backgroundImage:`url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,animation:"grain 0.5s steps(4) infinite"}}),e.jsxs("div",{className:"absolute inset-0 pointer-events-none flex flex-col justify-between z-30",children:[e.jsxs("div",{className:"flex items-center justify-between px-6 pt-2 pointer-events-auto",style:{height:"8vh"},children:[e.jsxs("div",{className:"font-mono text-white/60 text-[10px] tracking-[0.3em] flex items-center gap-3",children:[e.jsx("span",{className:"w-2 h-2 bg-red-500 rounded-full animate-pulse"}),"REC · @kranthi · LAB"]}),e.jsx("div",{className:"font-mono text-white/50 text-[10px] tracking-[0.3em]",children:"EVENT HORIZON · BLACK HOLE PROBE"})]}),e.jsxs("div",{className:"flex items-center justify-between px-6 pb-2 pointer-events-auto",style:{height:"8vh"},children:[e.jsxs("div",{className:"flex flex-col gap-0.5",children:[e.jsx("div",{className:"font-mono text-white/70 text-sm tracking-widest",children:l}),e.jsxs("div",{className:"font-mono text-white/30 text-[9px] tracking-wider",children:["TIME DILATION · ",d.toFixed(2),"x"]})]}),e.jsxs("div",{className:"flex flex-col items-end gap-0.5",children:[e.jsxs("div",{className:"font-mono text-white/40 text-xs tracking-wider flex items-center gap-3",children:[e.jsx("span",{className:"text-white/30 text-[9px]",children:"HOLD TO APPROACH"}),e.jsx("span",{className:"text-white/40",children:"|"}),e.jsxs("span",{className:"text-white/80 text-sm tabular-nums",style:{textShadow:o>.5?`0 0 ${o*20}px rgba(255,180,80,0.8)`:"none"},children:[(o*100).toFixed(0),"%"]})]}),e.jsx("div",{className:"font-mono text-white/30 text-[9px] tracking-wider",children:"GRAVITY WELL DEPTH"})]})]})]}),e.jsx("button",{onClick:m=>{m.stopPropagation(),n==null||n()},className:"absolute top-4 right-6 text-white/40 hover:text-white/80 text-[10px] font-mono tracking-[0.2em] transition-colors pointer-events-auto z-30",children:"← EXIT"}),c&&e.jsxs("div",{className:"absolute inset-0 z-40 pointer-events-none flex items-center justify-center",style:{animation:"singularity 8s ease-in-out forwards"},children:[e.jsx("div",{className:"absolute inset-0 bg-white",style:{animation:"flash 0.6s ease-out"}}),e.jsx("div",{className:"absolute inset-0 bg-black/95"}),e.jsx("div",{className:"absolute inset-0",style:{background:"radial-gradient(circle at center, rgba(255,180,80,0.12) 0%, transparent 70%)",animation:"pulse-deep 8s ease-in-out"}}),e.jsxs("div",{className:"relative text-center px-8 max-w-2xl",style:{animation:"fadeInMsg 8s ease-in-out"},children:[e.jsx("div",{className:"font-mono text-amber-300/80 text-[10px] sm:text-xs tracking-[0.5em] mb-8",children:"▸ EVENT HORIZON CROSSED ▸"}),e.jsxs("h2",{className:"font-mono text-white text-3xl sm:text-5xl tracking-[0.15em] mb-8 font-light",style:{textShadow:"0 0 40px rgba(255,180,80,0.7), 0 0 80px rgba(255,180,80,0.3)"},children:["YOU ARE THE",e.jsx("br",{}),"SINGULARITY"]}),e.jsx("div",{className:"font-mono text-white/80 text-sm sm:text-base tracking-[0.1em] leading-relaxed mb-3",children:"Spacetime has collapsed."}),e.jsx("div",{className:"font-mono text-white/60 text-xs sm:text-sm tracking-[0.1em] leading-relaxed max-w-lg mx-auto",children:"All information you carried is now stored on a 2D surface area equal to your former volume."}),e.jsx("div",{className:"font-mono text-amber-300/50 text-[10px] tracking-[0.2em] mt-4",children:"— holographic principle, 1993"}),e.jsx("div",{className:"mt-12 font-mono text-white/40 text-[10px] tracking-[0.3em] animate-pulse",children:"REINITIALIZING IN COSMIC TIME..."})]})]}),e.jsx("style",{children:`
        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-2%, 1%); }
          50% { transform: translate(1%, -1%); }
          75% { transform: translate(-1%, 2%); }
        }
        @keyframes flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes singularity {
          0% { opacity: 0; }
          5% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes pulse-deep {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes fadeInMsg {
          0% { opacity: 0; transform: scale(0.9); }
          15% { opacity: 1; transform: scale(1); }
          85% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.05); }
        }
      `})]})}export{J as default};
