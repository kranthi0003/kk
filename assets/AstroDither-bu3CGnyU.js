import{r as h,j as e}from"./index-CbRDtCi7.js";import{C as S,a as y}from"./react-three-fiber.esm-DhTlk5cy.js";import{aH as A}from"./three.module-BLWQIyfC.js";class C{constructor(){this.ctx=null,this.source=null,this.audioBuffer=null,this.master=null,this.started=!1,this.element=null}init(){if(this.ctx)return;const s=window.AudioContext||window.webkitAudioContext;s&&(this.ctx=new s,this.master=this.ctx.createGain(),this.master.gain.value=.7,this.master.connect(this.ctx.destination))}async start(){if(!this.ctx||this.started)return;this.started=!0,this.element=new Audio("/audio/loop.mp3"),this.element.loop=!0,this.element.crossOrigin="anonymous",this.element.volume=1,this.ctx.createMediaElementSource(this.element).connect(this.master);try{await this.element.play()}catch(a){console.warn("Audio play blocked:",a)}}setSpeed(s){if(this.element&&(this.element.playbackRate=Math.min(s,16),this.master)){const a=this.ctx.currentTime;this.master.gain.linearRampToValueAtTime(.7+(s-1)*.08,a+.1)}}stop(){this.element&&(this.element.pause(),this.element=null),this.started=!1}}const v=new C;function P({speedRef:c}){const s=h.useRef(),a=1500,d=80,l=h.useMemo(()=>{const x=new Float32Array(a*3),r=new Float32Array(a*3),o=new Float32Array(a),n=new Float32Array(a),p=new Float32Array(a),j=[[1,.3,.6],[.7,.4,1],[.3,.8,1],[1,.8,.2],[.2,1,.5],[1,.5,.2],[.5,.5,1],[1,1,1]];for(let t=0;t<a;t++){const i=Math.random()*Math.PI*2,f=2+Math.random()*25;x[t*3]=Math.cos(i)*f,x[t*3+1]=Math.sin(i)*f,x[t*3+2]=-Math.random()*d,n[t]=.5+Math.random()*.5,o[t]=.1+Math.random()*.4;const g=j[Math.floor(Math.random()*j.length)];r[t*3]=g[0],r[t*3+1]=g[1],r[t*3+2]=g[2],p[t]=Math.floor(Math.random()*4)}return{positions:x,colors:r,sizes:o,velocities:n,shapes:p}},[]);return h.useMemo(()=>({uTime:{value:0},uSpeed:{value:1}}),[]),y((x,r)=>{if(!s.current)return;const o=s.current.geometry,n=o.attributes.position.array,p=l.velocities,j=c.current;for(let t=0;t<a;t++)if(n[t*3+2]+=p[t]*j*r*30,n[t*3+2]>10){const i=Math.random()*Math.PI*2,f=2+Math.random()*25;n[t*3]=Math.cos(i)*f,n[t*3+1]=Math.sin(i)*f,n[t*3+2]=-d-Math.random()*20}o.attributes.position.needsUpdate=!0}),e.jsxs("points",{ref:s,children:[e.jsxs("bufferGeometry",{children:[e.jsx("bufferAttribute",{attach:"attributes-position",count:a,array:l.positions,itemSize:3}),e.jsx("bufferAttribute",{attach:"attributes-aSize",count:a,array:l.sizes,itemSize:1}),e.jsx("bufferAttribute",{attach:"attributes-aShape",count:a,array:l.shapes,itemSize:1}),e.jsx("bufferAttribute",{attach:"attributes-aColor",count:a,array:l.colors,itemSize:3})]}),e.jsx("shaderMaterial",{vertexShader:`
    attribute float aSize;
    attribute float aShape;
    attribute vec3 aColor;
    varying vec3 vColor;
    varying float vShape;
    varying float vDepth;

    void main() {
      vColor = aColor;
      vShape = aShape;
      vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
      vDepth = -mvPos.z;
      gl_Position = projectionMatrix * mvPos;
      // Size gets bigger as particles approach (perspective)
      gl_PointSize = aSize * (300.0 / -mvPos.z);
      gl_PointSize = clamp(gl_PointSize, 1.0, 64.0);
    }
  `,fragmentShader:`
    varying vec3 vColor;
    varying float vShape;
    varying float vDepth;

    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      float shape = floor(vShape + 0.5);
      float alpha = 0.0;

      if (shape < 0.5) {
        // Square
        float s = max(abs(uv.x), abs(uv.y));
        alpha = step(s, 0.35);
      } else if (shape < 1.5) {
        // Cross
        float cx = step(abs(uv.x), 0.12) * step(abs(uv.y), 0.4);
        float cy = step(abs(uv.y), 0.12) * step(abs(uv.x), 0.4);
        alpha = max(cx, cy);
      } else if (shape < 2.5) {
        // Circle
        alpha = step(length(uv), 0.3);
      } else {
        // Diamond
        alpha = step(abs(uv.x) + abs(uv.y), 0.35);
      }

      if (alpha < 0.1) discard;

      // Fade with depth
      float depthFade = smoothstep(80.0, 5.0, vDepth);
      // Motion blur tail (stretch color for speed feel)
      vec3 col = vColor * (0.7 + depthFade * 0.5);

      gl_FragColor = vec4(col, alpha * depthFade);
    }
  `,transparent:!0,depthWrite:!1,blending:A})]})}function z({speedRef:c}){const s=h.useRef(),a=200,d=h.useMemo(()=>{const l=new Float32Array(a*6);for(let m=0;m<a;m++){const u=Math.random()*Math.PI*2,x=3+Math.random()*20,r=Math.cos(u)*x,o=Math.sin(u)*x,n=-Math.random()*60;l[m*6]=r,l[m*6+1]=o,l[m*6+2]=n,l[m*6+3]=r,l[m*6+4]=o,l[m*6+5]=n-1.5}return l},[]);return y((l,m)=>{if(!s.current)return;const u=s.current.geometry.attributes.position.array,x=c.current;for(let r=0;r<a;r++){const o=x*m*35;if(u[r*6+2]+=o,u[r*6+5]+=o,u[r*6+2]>10){const n=Math.random()*Math.PI*2,p=3+Math.random()*20,j=Math.cos(n)*p,t=Math.sin(n)*p,i=-60-Math.random()*10;u[r*6]=j,u[r*6+1]=t,u[r*6+2]=i,u[r*6+3]=j,u[r*6+4]=t,u[r*6+5]=i-1.5*x}}s.current.geometry.attributes.position.needsUpdate=!0}),e.jsxs("lineSegments",{ref:s,children:[e.jsx("bufferGeometry",{children:e.jsx("bufferAttribute",{attach:"attributes-position",count:a*2,array:d,itemSize:3})}),e.jsx("lineBasicMaterial",{color:"#ffffff",transparent:!0,opacity:.15})]})}function F({speedRef:c}){const s=h.useRef();return y((a,d)=>{if(!s.current)return;const m=(c.current-1)*.001;s.current.position.x=(Math.random()-.5)*m,s.current.position.y=(Math.random()-.5)*m}),e.jsxs("group",{ref:s,position:[0,0,3.5],children:[e.jsxs("mesh",{position:[0,1.8,0],children:[e.jsx("boxGeometry",{args:[4.5,.06,.1]}),e.jsx("meshBasicMaterial",{color:"#1a1a2e"})]}),e.jsxs("mesh",{position:[0,-1.6,0],children:[e.jsx("boxGeometry",{args:[4.5,.08,.1]}),e.jsx("meshBasicMaterial",{color:"#1a1a2e"})]}),e.jsxs("mesh",{position:[-2.2,0,0],rotation:[0,0,.05],children:[e.jsx("boxGeometry",{args:[.06,3.6,.1]}),e.jsx("meshBasicMaterial",{color:"#1a1a2e"})]}),e.jsxs("mesh",{position:[2.2,0,0],rotation:[0,0,-.05],children:[e.jsx("boxGeometry",{args:[.06,3.6,.1]}),e.jsx("meshBasicMaterial",{color:"#1a1a2e"})]}),e.jsxs("mesh",{position:[0,-1.9,.3],rotation:[-.4,0,0],children:[e.jsx("boxGeometry",{args:[3.5,.8,.05]}),e.jsx("meshBasicMaterial",{color:"#0d0d1a"})]}),e.jsxs("mesh",{position:[-.8,-1.75,.2],rotation:[-.4,0,0],children:[e.jsx("circleGeometry",{args:[.03,8]}),e.jsx("meshBasicMaterial",{color:"#00ff88"})]}),e.jsxs("mesh",{position:[-.5,-1.75,.2],rotation:[-.4,0,0],children:[e.jsx("circleGeometry",{args:[.03,8]}),e.jsx("meshBasicMaterial",{color:"#00ff88"})]}),e.jsxs("mesh",{position:[.5,-1.75,.2],rotation:[-.4,0,0],children:[e.jsx("circleGeometry",{args:[.025,8]}),e.jsx("meshBasicMaterial",{color:"#ff4444"})]}),e.jsxs("mesh",{position:[.8,-1.75,.2],rotation:[-.4,0,0],children:[e.jsx("circleGeometry",{args:[.03,8]}),e.jsx("meshBasicMaterial",{color:"#4488ff"})]}),e.jsxs("mesh",{position:[0,0,-.5],children:[e.jsx("ringGeometry",{args:[.08,.1,32]}),e.jsx("meshBasicMaterial",{color:"#ffffff",transparent:!0,opacity:.15})]}),e.jsxs("mesh",{position:[0,.15,-.5],children:[e.jsx("boxGeometry",{args:[.005,.06,.001]}),e.jsx("meshBasicMaterial",{color:"#ffffff",transparent:!0,opacity:.2})]}),e.jsxs("mesh",{position:[0,-.15,-.5],children:[e.jsx("boxGeometry",{args:[.005,.06,.001]}),e.jsx("meshBasicMaterial",{color:"#ffffff",transparent:!0,opacity:.2})]}),e.jsxs("mesh",{position:[.15,0,-.5],children:[e.jsx("boxGeometry",{args:[.06,.005,.001]}),e.jsx("meshBasicMaterial",{color:"#ffffff",transparent:!0,opacity:.2})]}),e.jsxs("mesh",{position:[-.15,0,-.5],children:[e.jsx("boxGeometry",{args:[.06,.005,.001]}),e.jsx("meshBasicMaterial",{color:"#ffffff",transparent:!0,opacity:.2})]})]})}function N({speedRef:c}){return e.jsxs(e.Fragment,{children:[e.jsx("color",{attach:"background",args:["#050508"]}),e.jsx("fog",{attach:"fog",args:["#050508",40,80]}),e.jsx(P,{speedRef:c}),e.jsx(z,{speedRef:c}),e.jsx(F,{speedRef:c})]})}function R({onBack:c}){const[s,a]=h.useState(!1),[d,l]=h.useState(null),[m,u]=h.useState("00:00:000"),[x,r]=h.useState(1),o=h.useRef(1),n=h.useRef(!1),p=h.useCallback(()=>{v.init(),v.start(),a(!0),l(Date.now())},[]);h.useEffect(()=>{if(!d)return;let i;const f=()=>{const g=Date.now()-d,b=String(Math.floor(g/6e4)).padStart(2,"0"),M=String(Math.floor(g%6e4/1e3)).padStart(2,"0"),w=String(g%1e3).padStart(3,"0");u(`${b}:${M}:${w}`),i=requestAnimationFrame(f)};return i=requestAnimationFrame(f),()=>cancelAnimationFrame(i)},[d]),h.useEffect(()=>{if(!s)return;let i;const f=()=>{if(n.current){const g=(20-o.current)/19;o.current=Math.min(o.current+.08*g,20)}else o.current=Math.max(o.current-.06,1);r(o.current),v.setSpeed(o.current),i=requestAnimationFrame(f)};return i=requestAnimationFrame(f),()=>cancelAnimationFrame(i)},[s]);const j=h.useCallback(()=>{n.current=!0},[]),t=h.useCallback(()=>{n.current=!1},[]);return s?e.jsxs("div",{className:"fixed inset-0 bg-[#050508] z-50 select-none cursor-crosshair",onPointerDown:j,onPointerUp:t,onPointerLeave:t,children:[e.jsx(S,{camera:{position:[0,0,5],fov:75,near:.1,far:100},dpr:[1,2],gl:{antialias:!1,alpha:!1},children:e.jsx(N,{speedRef:o})}),e.jsxs("div",{className:"absolute inset-0 pointer-events-none flex flex-col justify-between",children:[e.jsxs("div",{className:"flex items-center justify-between px-6 py-5 pointer-events-auto",children:[e.jsx("div",{className:"font-mono text-white/50 text-xs tracking-[0.2em]",children:"@kranthi · LAB"}),e.jsx("div",{className:"font-mono text-white/50 text-xs tracking-[0.2em]",children:"ASTRO DITHER"})]}),e.jsxs("div",{className:"flex items-center justify-between px-6 py-5",children:[e.jsx("div",{className:"font-mono text-white/60 text-sm tracking-widest",children:m}),e.jsxs("div",{className:"font-mono text-white/40 text-xs tracking-wider flex items-center gap-3",children:[e.jsx("span",{className:"text-white/20",children:"HOLD FOR SPEED"}),e.jsx("span",{className:"text-white/50",children:"|"}),e.jsxs("span",{className:"text-white/60",children:[x.toFixed(2),"x"]})]})]})]}),e.jsx("button",{onClick:i=>{i.stopPropagation(),c==null||c()},className:"absolute top-5 left-6 text-white/20 hover:text-white/50 text-xs font-mono tracking-wider transition-colors pointer-events-auto z-10",style:{display:"none"},children:"← BACK"})]}):e.jsxs("div",{className:"fixed inset-0 bg-[#050508] flex flex-col items-center justify-center z-50 cursor-pointer",onClick:p,children:[e.jsx("div",{className:"absolute top-6 left-6",children:e.jsx("button",{onClick:i=>{i.stopPropagation(),c==null||c()},className:"text-white/30 hover:text-white/60 text-xs font-mono tracking-wider transition-colors",children:"← BACK"})}),e.jsxs("div",{className:"text-center",children:[e.jsx("h1",{className:"text-white/80 text-2xl sm:text-4xl font-mono tracking-[0.3em] mb-8",children:"ASTRO DITHER"}),e.jsx("div",{className:"text-white/30 text-xs font-mono tracking-[0.2em] animate-pulse border border-white/10 px-6 py-3",children:"CLICK TO ENTER"})]}),e.jsx("div",{className:"absolute bottom-8 text-white/15 text-[9px] font-mono tracking-[0.15em]",children:"A warp travel experiment · audio enabled"})]})}export{R as default};
