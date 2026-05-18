import{r as l,j as e}from"./index-DQOp3ukx.js";import{C as b,a as w}from"./react-three-fiber.esm-DprcjGfp.js";import{e as g,aH as j}from"./three.module-BLWQIyfC.js";class A{constructor(){this.ctx=null,this.analyser=null,this.dataArray=null,this.master=null,this.nodes=[],this.started=!1}init(){if(this.ctx)return;const t=window.AudioContext||window.webkitAudioContext;t&&(this.ctx=new t,this.master=this.ctx.createGain(),this.master.gain.value=.6,this.analyser=this.ctx.createAnalyser(),this.analyser.fftSize=256,this.dataArray=new Uint8Array(this.analyser.frequencyBinCount),this.master.connect(this.analyser),this.analyser.connect(this.ctx.destination))}start(){if(!this.ctx||this.started)return;this.started=!0;const t=this.ctx.currentTime;[40,60,80].forEach((x,p)=>{const m=this.ctx.createOscillator(),f=this.ctx.createGain();m.type="sine",m.frequency.value=x,m.detune.value=(Math.random()-.5)*6,f.gain.value=0,f.gain.linearRampToValueAtTime(.08,t+3),m.connect(f).connect(this.master),m.start(t),this.nodes.push(m,f)});const i=this.ctx.createOscillator(),a=this.ctx.createBiquadFilter(),u=this.ctx.createGain();i.type="sawtooth",i.frequency.value=110,a.type="lowpass",a.frequency.value=400,a.Q.value=4,u.gain.value=0,u.gain.linearRampToValueAtTime(.03,t+5),i.connect(a).connect(u).connect(this.master),i.start(t);const d=this.ctx.createOscillator(),c=this.ctx.createGain();d.frequency.value=.1,c.gain.value=200,d.connect(c).connect(a.frequency),d.start(t),this.nodes.push(i,d,u);const r=this.ctx.createOscillator(),n=this.ctx.createGain();r.type="sine",r.frequency.value=880,n.gain.value=0,n.gain.linearRampToValueAtTime(.01,t+6),r.connect(n).connect(this.master),r.start(t),this.nodes.push(r,n)}getFrequencyData(){if(!this.analyser)return 0;this.analyser.getByteFrequencyData(this.dataArray);let t=0;for(let o=0;o<this.dataArray.length;o++)t+=this.dataArray[o];return t/(this.dataArray.length*255)}getBass(){if(!this.analyser)return 0;this.analyser.getByteFrequencyData(this.dataArray);let t=0;for(let o=0;o<8;o++)t+=this.dataArray[o];return t/(8*255)}}const v=new A,y={vertexShader:`
    uniform float uTime;
    uniform float uAudio;
    uniform float uSpeed;
    uniform vec2 uMouse;
    
    attribute float aRandom;
    varying float vRandom;
    varying vec3 vPosition;
    varying float vDist;
    
    void main() {
      vRandom = aRandom;
      vec3 pos = position;
      
      // Mouse influence
      float mouseDist = length(pos.xy - uMouse * 3.0);
      float mouseInfluence = smoothstep(2.0, 0.0, mouseDist);
      
      // Fluid-like displacement
      float wave = sin(pos.x * 2.0 + uTime * 0.5 * uSpeed) * cos(pos.y * 1.5 + uTime * 0.3 * uSpeed);
      pos.z += wave * 0.3 * (1.0 + uAudio * 2.0);
      pos.x += sin(uTime * 0.2 + pos.y * 3.0) * 0.1 * uSpeed;
      pos.y += cos(uTime * 0.15 + pos.x * 2.5) * 0.08 * uSpeed;
      
      // Mouse repulsion
      pos.xy += normalize(pos.xy - uMouse * 3.0) * mouseInfluence * 0.5;
      
      // Audio pulse
      pos *= 1.0 + uAudio * 0.15;
      
      vPosition = pos;
      vDist = mouseDist;
      
      vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPos;
      gl_PointSize = (3.0 + aRandom * 2.0 + mouseInfluence * 4.0) * (1.0 / -mvPos.z) * 80.0;
    }
  `,fragmentShader:`
    uniform float uTime;
    uniform float uAudio;
    
    varying float vRandom;
    varying vec3 vPosition;
    varying float vDist;
    
    // Dithering pattern (Bayer 4x4)
    float dither4x4(vec2 pos) {
      int x = int(mod(pos.x, 4.0));
      int y = int(mod(pos.y, 4.0));
      int index = x + y * 4;
      float limit = 0.0;
      if (index == 0) limit = 0.0625;
      else if (index == 1) limit = 0.5625;
      else if (index == 2) limit = 0.1875;
      else if (index == 3) limit = 0.6875;
      else if (index == 4) limit = 0.8125;
      else if (index == 5) limit = 0.3125;
      else if (index == 6) limit = 0.9375;
      else if (index == 7) limit = 0.4375;
      else if (index == 8) limit = 0.25;
      else if (index == 9) limit = 0.75;
      else if (index == 10) limit = 0.125;
      else if (index == 11) limit = 0.625;
      else if (index == 12) limit = 1.0;
      else if (index == 13) limit = 0.5;
      else if (index == 14) limit = 0.875;
      else limit = 0.375;
      return limit;
    }
    
    void main() {
      // Circular point
      vec2 center = gl_PointCoord - 0.5;
      float dist = length(center);
      if (dist > 0.5) discard;
      
      // Base color — cool blue/purple palette
      vec3 color = mix(
        vec3(0.2, 0.4, 1.0),
        vec3(0.8, 0.3, 1.0),
        vRandom
      );
      
      // Add warmth based on audio
      color = mix(color, vec3(1.0, 0.6, 0.2), uAudio * 0.4);
      
      // Dithering
      float dith = dither4x4(gl_FragCoord.xy);
      float brightness = 1.0 - dist * 1.5;
      brightness = step(dith * 0.6, brightness);
      
      // Edge glow
      float glow = smoothstep(0.5, 0.2, dist);
      
      gl_FragColor = vec4(color * brightness * glow, glow * 0.9);
    }
  `};function S({speed:s}){const t=l.useRef(),o=l.useRef(new g(0,0)),i=8e3,{positions:a,randoms:u}=l.useMemo(()=>{const c=new Float32Array(i*3),r=new Float32Array(i);for(let n=0;n<i;n++){const x=Math.random()*Math.PI*2,p=Math.acos(2*Math.random()-1),m=1.5+Math.random()*1.5;c[n*3]=m*Math.sin(p)*Math.cos(x),c[n*3+1]=m*Math.sin(p)*Math.sin(x),c[n*3+2]=m*Math.cos(p),r[n]=Math.random()}return{positions:c,randoms:r}},[]),d=l.useMemo(()=>({uTime:{value:0},uAudio:{value:0},uSpeed:{value:1},uMouse:{value:new g(0,0)}}),[]);return l.useEffect(()=>{const c=r=>{o.current.x=r.clientX/window.innerWidth*2-1,o.current.y=-(r.clientY/window.innerHeight)*2+1};return window.addEventListener("mousemove",c),()=>window.removeEventListener("mousemove",c)},[]),w((c,r)=>{if(!t.current)return;const n=t.current.material;n.uniforms.uTime.value+=r*s,n.uniforms.uAudio.value=v.getBass(),n.uniforms.uSpeed.value+=(s-n.uniforms.uSpeed.value)*.05,n.uniforms.uMouse.value.lerp(o.current,.08),t.current.rotation.y+=r*.05*s,t.current.rotation.x+=r*.02*s}),e.jsxs("points",{ref:t,children:[e.jsxs("bufferGeometry",{children:[e.jsx("bufferAttribute",{attach:"attributes-position",count:i,array:a,itemSize:3}),e.jsx("bufferAttribute",{attach:"attributes-aRandom",count:i,array:u,itemSize:1})]}),e.jsx("shaderMaterial",{vertexShader:y.vertexShader,fragmentShader:y.fragmentShader,uniforms:d,transparent:!0,depthWrite:!1,blending:j})]})}function M(){const s=l.useRef(),t=3e3,o=l.useMemo(()=>{const i=new Float32Array(t*3);for(let a=0;a<t;a++)i[a*3]=(Math.random()-.5)*20,i[a*3+1]=(Math.random()-.5)*20,i[a*3+2]=(Math.random()-.5)*20;return i},[]);return w((i,a)=>{s.current&&(s.current.rotation.y+=a*.01)}),e.jsxs("points",{ref:s,children:[e.jsx("bufferGeometry",{children:e.jsx("bufferAttribute",{attach:"attributes-position",count:t,array:o,itemSize:3})}),e.jsx("pointsMaterial",{size:.02,color:"#4060ff",transparent:!0,opacity:.3,sizeAttenuation:!0,depthWrite:!1})]})}function N({speed:s}){return e.jsxs(e.Fragment,{children:[e.jsx("color",{attach:"background",args:["#050508"]}),e.jsx(S,{speed:s}),e.jsx(M,{})]})}function C({startTime:s}){const[t,o]=l.useState(0);l.useEffect(()=>{const d=setInterval(()=>{o(Math.floor((Date.now()-s)/1e3))},1e3);return()=>clearInterval(d)},[s]);const i=String(Math.floor(t/3600)).padStart(2,"0"),a=String(Math.floor(t%3600/60)).padStart(2,"0"),u=String(t%60).padStart(2,"0");return e.jsxs("div",{className:"font-mono text-white/60 text-4xl sm:text-6xl tracking-widest select-none",children:[e.jsx("span",{children:i}),e.jsx("span",{className:"mx-1 animate-pulse",children:":"}),e.jsx("span",{children:a}),e.jsx("span",{className:"mx-1 animate-pulse",children:":"}),e.jsx("span",{children:u})]})}function E({onBack:s}){const[t,o]=l.useState(!1),[i,a]=l.useState(null),[u,d]=l.useState(1),[c,r]=l.useState(!1),[n,x]=l.useState(!1),p=l.useCallback(()=>{v.init(),v.start(),o(!0),a(Date.now())},[]),m=l.useCallback(()=>{r(!0),d(3)},[]),f=l.useCallback(()=>{r(!1),d(1)},[]);return l.useCallback(()=>{c||d(h=>h===1?2:1)},[c]),t?e.jsxs("div",{className:"fixed inset-0 bg-[#050508] z-50 select-none",onPointerDown:m,onPointerUp:f,onPointerLeave:f,children:[e.jsx(b,{camera:{position:[0,0,5],fov:60},dpr:[1,1.5],gl:{antialias:!1,alpha:!1},children:e.jsx(N,{speed:u})}),e.jsxs("div",{className:"absolute inset-0 pointer-events-none flex flex-col",children:[e.jsxs("div",{className:"flex items-center justify-between px-6 py-5 pointer-events-auto",children:[e.jsx("button",{onClick:h=>{h.stopPropagation(),s==null||s()},className:"text-white/30 hover:text-white/60 text-xs font-mono tracking-wider transition-colors",children:"← BACK"}),e.jsx("div",{className:"text-white/40 text-[10px] font-mono tracking-[0.3em]",children:"ASTRO DITHER"}),e.jsx("button",{onClick:h=>{h.stopPropagation(),x(!n)},className:"text-white/30 hover:text-white/60 text-xs font-mono transition-colors",children:n?"CLOSE":"INFO"})]}),e.jsx("div",{className:"flex-1 flex items-center justify-center",children:e.jsx(C,{startTime:i})}),e.jsxs("div",{className:"flex items-center justify-between px-6 py-5",children:[e.jsx("div",{className:"text-white/20 text-[9px] font-mono tracking-[0.15em]",children:"HOLD FOR SPEED · CLICK FOR SPEED"}),e.jsxs("div",{className:"text-white/30 text-xs font-mono",children:[u.toFixed(2),"x"]})]})]}),u>1&&e.jsx("div",{className:"absolute inset-0 pointer-events-none border-2 border-white/5 rounded-none animate-pulse"}),n&&e.jsx("div",{className:"absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto z-10",onClick:()=>x(!1),children:e.jsxs("div",{className:"max-w-md text-center px-8",onClick:h=>h.stopPropagation(),children:[e.jsx("h2",{className:"text-white/80 font-mono text-lg tracking-[0.2em] mb-6",children:"ASTRO DITHER"}),e.jsx("p",{className:"text-white/40 text-sm font-mono leading-relaxed mb-4",children:"An audio-reactive WebGL particle experiment. 8,000 particles form a fluid sphere that responds to your mouse movement and the procedural audio drone."}),e.jsx("p",{className:"text-white/30 text-xs font-mono leading-relaxed mb-6",children:"Custom dithering shader • Fluid displacement • Audio reactivity • Mouse interaction • Additive blending"}),e.jsx("div",{className:"text-white/15 text-[9px] font-mono tracking-wider",children:"[signal. lost. beauty. found. digital. chaos.]"}),e.jsx("button",{onClick:()=>x(!1),className:"mt-8 text-white/30 hover:text-white/60 text-xs font-mono tracking-wider border border-white/10 px-4 py-2 transition-colors",children:"CLOSE"})]})})]}):e.jsxs("div",{className:"fixed inset-0 bg-[#050508] flex flex-col items-center justify-center z-50 cursor-pointer",onClick:p,children:[e.jsx("div",{className:"absolute top-6 left-6",children:e.jsx("button",{onClick:h=>{h.stopPropagation(),s==null||s()},className:"text-white/30 hover:text-white/60 text-xs font-mono tracking-wider transition-colors",children:"← BACK"})}),e.jsxs("div",{className:"text-center",children:[e.jsx("h1",{className:"text-white/80 text-2xl sm:text-4xl font-mono tracking-[0.3em] mb-8",children:"ASTRO DITHER"}),e.jsx("div",{className:"text-white/30 text-xs font-mono tracking-[0.2em] animate-pulse border border-white/10 px-6 py-3",children:"[:: CLICK TO ENTER + ENABLE AUDIO ::]"})]}),e.jsx("div",{className:"absolute bottom-8 text-white/15 text-[9px] font-mono tracking-[0.15em]",children:"A WebGL particle experiment"})]})}export{E as default};
