import{r as u,j as t}from"./index-DEgkwZmZ.js";import{C as M,a as y}from"./react-three-fiber.esm-DNaBWDaP.js";import{aH as A}from"./three.module-BLWQIyfC.js";class F{constructor(){this.ctx=null,this.master=null,this.oscillators=[],this.started=!1,this.playbackRate=1,this.noiseSource=null,this.noiseGain=null,this.bassGain=null}init(){if(this.ctx)return;const s=window.AudioContext||window.webkitAudioContext;s&&(this.ctx=new s,this.master=this.ctx.createGain(),this.master.gain.value=.5,this.master.connect(this.ctx.destination))}start(){if(!this.ctx||this.started)return;this.started=!0;const s=this.ctx.currentTime;[55,82.5,110].forEach(p=>{const e=this.ctx.createOscillator(),r=this.ctx.createGain();e.type="sine",e.frequency.value=p,r.gain.value=0,r.gain.linearRampToValueAtTime(.07,s+2),e.connect(r).connect(this.master),e.start(s),this.oscillators.push({osc:e,gain:r,baseFreq:p})});const f=this.ctx.createOscillator(),i=this.ctx.createBiquadFilter(),h=this.ctx.createGain();f.type="sawtooth",f.frequency.value=165,i.type="lowpass",i.frequency.value=300,i.Q.value=6,h.gain.value=0,h.gain.linearRampToValueAtTime(.025,s+3),f.connect(i).connect(h).connect(this.master),f.start(s),this.oscillators.push({osc:f,gain:h,baseFreq:165});const l=this.ctx.createOscillator(),m=this.ctx.createGain();l.frequency.value=.15,m.gain.value=150,l.connect(m).connect(i.frequency),l.start(s);const a=this.ctx.sampleRate*2,o=this.ctx.createBuffer(1,a,this.ctx.sampleRate),c=o.getChannelData(0);for(let p=0;p<a;p++)c[p]=Math.random()*2-1;this.noiseSource=this.ctx.createBufferSource(),this.noiseSource.buffer=o,this.noiseSource.loop=!0;const x=this.ctx.createBiquadFilter();x.type="bandpass",x.frequency.value=800,x.Q.value=1.5,this.noiseGain=this.ctx.createGain(),this.noiseGain.gain.value=.02,this.noiseSource.connect(x).connect(this.noiseGain).connect(this.master),this.noiseSource.start(s)}setSpeed(s){if(!this.ctx||!this.started)return;this.playbackRate=s;const n=this.ctx.currentTime;this.oscillators.forEach(({osc:f,baseFreq:i})=>{f.frequency.linearRampToValueAtTime(i*(.8+s*.2),n+.1)}),this.noiseGain&&this.noiseGain.gain.linearRampToValueAtTime(.02+(s-1)*.04,n+.1),this.master&&this.master.gain.linearRampToValueAtTime(.5+(s-1)*.1,n+.1)}stop(){if(this.oscillators.forEach(({osc:s})=>{try{s.stop()}catch{}}),this.noiseSource)try{this.noiseSource.stop()}catch{}this.started=!1,this.oscillators=[]}}const b=new F;function C({speedRef:d}){const s=u.useRef(),n=1500,f=80,i=u.useMemo(()=>{const m=new Float32Array(n*3),a=new Float32Array(n*3),o=new Float32Array(n),c=new Float32Array(n),x=new Float32Array(n),p=[[1,.3,.6],[.7,.4,1],[.3,.8,1],[1,.8,.2],[.2,1,.5],[1,.5,.2],[.5,.5,1],[1,1,1]];for(let e=0;e<n;e++){const r=Math.random()*Math.PI*2,v=2+Math.random()*25;m[e*3]=Math.cos(r)*v,m[e*3+1]=Math.sin(r)*v,m[e*3+2]=-Math.random()*f,c[e]=.5+Math.random()*.5,o[e]=.1+Math.random()*.4;const g=p[Math.floor(Math.random()*p.length)];a[e*3]=g[0],a[e*3+1]=g[1],a[e*3+2]=g[2],x[e]=Math.floor(Math.random()*4)}return{positions:m,colors:a,sizes:o,velocities:c,shapes:x}},[]);return u.useMemo(()=>({uTime:{value:0},uSpeed:{value:1}}),[]),y((m,a)=>{if(!s.current)return;const o=s.current.geometry,c=o.attributes.position.array,x=i.velocities,p=d.current;for(let e=0;e<n;e++)if(c[e*3+2]+=x[e]*p*a*30,c[e*3+2]>10){const r=Math.random()*Math.PI*2,v=2+Math.random()*25;c[e*3]=Math.cos(r)*v,c[e*3+1]=Math.sin(r)*v,c[e*3+2]=-f-Math.random()*20}o.attributes.position.needsUpdate=!0}),t.jsxs("points",{ref:s,children:[t.jsxs("bufferGeometry",{children:[t.jsx("bufferAttribute",{attach:"attributes-position",count:n,array:i.positions,itemSize:3}),t.jsx("bufferAttribute",{attach:"attributes-aSize",count:n,array:i.sizes,itemSize:1}),t.jsx("bufferAttribute",{attach:"attributes-aShape",count:n,array:i.shapes,itemSize:1}),t.jsx("bufferAttribute",{attach:"attributes-aColor",count:n,array:i.colors,itemSize:3})]}),t.jsx("shaderMaterial",{vertexShader:`
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
  `,transparent:!0,depthWrite:!1,blending:A})]})}function R({speedRef:d}){const s=u.useRef(),n=200,f=u.useMemo(()=>{const i=new Float32Array(n*6);for(let h=0;h<n;h++){const l=Math.random()*Math.PI*2,m=3+Math.random()*20,a=Math.cos(l)*m,o=Math.sin(l)*m,c=-Math.random()*60;i[h*6]=a,i[h*6+1]=o,i[h*6+2]=c,i[h*6+3]=a,i[h*6+4]=o,i[h*6+5]=c-1.5}return i},[]);return y((i,h)=>{if(!s.current)return;const l=s.current.geometry.attributes.position.array,m=d.current;for(let a=0;a<n;a++){const o=m*h*35;if(l[a*6+2]+=o,l[a*6+5]+=o,l[a*6+2]>10){const c=Math.random()*Math.PI*2,x=3+Math.random()*20,p=Math.cos(c)*x,e=Math.sin(c)*x,r=-60-Math.random()*10;l[a*6]=p,l[a*6+1]=e,l[a*6+2]=r,l[a*6+3]=p,l[a*6+4]=e,l[a*6+5]=r-1.5*m}}s.current.geometry.attributes.position.needsUpdate=!0}),t.jsxs("lineSegments",{ref:s,children:[t.jsx("bufferGeometry",{children:t.jsx("bufferAttribute",{attach:"attributes-position",count:n*2,array:f,itemSize:3})}),t.jsx("lineBasicMaterial",{color:"#ffffff",transparent:!0,opacity:.15})]})}function T({speedRef:d}){return t.jsxs(t.Fragment,{children:[t.jsx("color",{attach:"background",args:["#050508"]}),t.jsx("fog",{attach:"fog",args:["#050508",40,80]}),t.jsx(C,{speedRef:d}),t.jsx(R,{speedRef:d})]})}function q({onBack:d}){const[s,n]=u.useState(!1),[f,i]=u.useState(null),[h,l]=u.useState("00:00:000"),[m,a]=u.useState(1),o=u.useRef(1),c=u.useRef(!1);u.useRef(null);const x=u.useCallback(()=>{b.init(),b.start(),n(!0),i(Date.now())},[]);u.useEffect(()=>{if(!f)return;let r;const v=()=>{const g=Date.now()-f,S=String(Math.floor(g/6e4)).padStart(2,"0"),w=String(Math.floor(g%6e4/1e3)).padStart(2,"0"),j=String(g%1e3).padStart(3,"0");l(`${S}:${w}:${j}`),r=requestAnimationFrame(v)};return r=requestAnimationFrame(v),()=>cancelAnimationFrame(r)},[f]),u.useEffect(()=>{if(!s)return;let r;const v=()=>{c.current?o.current=Math.min(o.current+.03,5):o.current=Math.max(o.current-.04,1),a(o.current),b.setSpeed(o.current),r=requestAnimationFrame(v)};return r=requestAnimationFrame(v),()=>cancelAnimationFrame(r)},[s]);const p=u.useCallback(()=>{c.current=!0},[]),e=u.useCallback(()=>{c.current=!1},[]);return s?t.jsxs("div",{className:"fixed inset-0 bg-[#050508] z-50 select-none cursor-crosshair",onPointerDown:p,onPointerUp:e,onPointerLeave:e,children:[t.jsx(M,{camera:{position:[0,0,5],fov:75,near:.1,far:100},dpr:[1,2],gl:{antialias:!1,alpha:!1},children:t.jsx(T,{speedRef:o})}),t.jsxs("div",{className:"absolute inset-0 pointer-events-none flex flex-col justify-between",children:[t.jsxs("div",{className:"flex items-center justify-between px-6 py-5 pointer-events-auto",children:[t.jsx("div",{className:"font-mono text-white/50 text-xs tracking-[0.2em]",children:"@kranthi · LAB"}),t.jsx("div",{className:"font-mono text-white/50 text-xs tracking-[0.2em]",children:"ASTRO DITHER"})]}),t.jsxs("div",{className:"flex items-center justify-between px-6 py-5",children:[t.jsx("div",{className:"font-mono text-white/60 text-sm tracking-widest",children:h}),t.jsxs("div",{className:"font-mono text-white/40 text-xs tracking-wider flex items-center gap-3",children:[t.jsx("span",{className:"text-white/20",children:"HOLD FOR SPEED"}),t.jsx("span",{className:"text-white/50",children:"|"}),t.jsxs("span",{className:"text-white/60",children:[m.toFixed(2),"x"]})]})]})]}),t.jsx("button",{onClick:r=>{r.stopPropagation(),d==null||d()},className:"absolute top-5 left-6 text-white/20 hover:text-white/50 text-xs font-mono tracking-wider transition-colors pointer-events-auto z-10",style:{display:"none"},children:"← BACK"})]}):t.jsxs("div",{className:"fixed inset-0 bg-[#050508] flex flex-col items-center justify-center z-50 cursor-pointer",onClick:x,children:[t.jsx("div",{className:"absolute top-6 left-6",children:t.jsx("button",{onClick:r=>{r.stopPropagation(),d==null||d()},className:"text-white/30 hover:text-white/60 text-xs font-mono tracking-wider transition-colors",children:"← BACK"})}),t.jsxs("div",{className:"text-center",children:[t.jsx("h1",{className:"text-white/80 text-2xl sm:text-4xl font-mono tracking-[0.3em] mb-8",children:"ASTRO DITHER"}),t.jsx("div",{className:"text-white/30 text-xs font-mono tracking-[0.2em] animate-pulse border border-white/10 px-6 py-3",children:"CLICK TO ENTER"})]}),t.jsx("div",{className:"absolute bottom-8 text-white/15 text-[9px] font-mono tracking-[0.15em]",children:"A warp travel experiment · audio enabled"})]})}export{q as default};
