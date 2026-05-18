import{r as l,j as t}from"./index-DwjctjM3.js";import{C as M,a as y}from"./react-three-fiber.esm-D1DneYtc.js";import{aH as A}from"./three.module-BLWQIyfC.js";class C{constructor(){this.ctx=null,this.source=null,this.audioBuffer=null,this.master=null,this.started=!1,this.element=null}init(){if(this.ctx)return;const i=window.AudioContext||window.webkitAudioContext;i&&(this.ctx=new i,this.master=this.ctx.createGain(),this.master.gain.value=.7,this.master.connect(this.ctx.destination))}async start(){if(!this.ctx||this.started)return;this.started=!0,this.element=new Audio("/audio/loop.mp3"),this.element.loop=!0,this.element.crossOrigin="anonymous",this.element.volume=1,this.ctx.createMediaElementSource(this.element).connect(this.master);try{await this.element.play()}catch(a){console.warn("Audio play blocked:",a)}}setSpeed(i){if(this.element&&(this.element.playbackRate=Math.min(i,16),this.master)){const a=this.ctx.currentTime;this.master.gain.linearRampToValueAtTime(.7+(i-1)*.08,a+.1)}}stop(){this.element&&(this.element.pause(),this.element=null),this.started=!1}}const b=new C;function P({speedRef:u}){const i=l.useRef(),a=1500,g=80,c=l.useMemo(()=>{const d=new Float32Array(a*3),s=new Float32Array(a*3),r=new Float32Array(a),o=new Float32Array(a),f=new Float32Array(a),x=[[1,.3,.6],[.7,.4,1],[.3,.8,1],[1,.8,.2],[.2,1,.5],[1,.5,.2],[.5,.5,1],[1,1,1]];for(let e=0;e<a;e++){const n=Math.random()*Math.PI*2,p=2+Math.random()*25;d[e*3]=Math.cos(n)*p,d[e*3+1]=Math.sin(n)*p,d[e*3+2]=-Math.random()*g,o[e]=.5+Math.random()*.5,r[e]=.1+Math.random()*.4;const v=x[Math.floor(Math.random()*x.length)];s[e*3]=v[0],s[e*3+1]=v[1],s[e*3+2]=v[2],f[e]=Math.floor(Math.random()*4)}return{positions:d,colors:s,sizes:r,velocities:o,shapes:f}},[]);return l.useMemo(()=>({uTime:{value:0},uSpeed:{value:1}}),[]),y((d,s)=>{if(!i.current)return;const r=i.current.geometry,o=r.attributes.position.array,f=c.velocities,x=u.current;for(let e=0;e<a;e++)if(o[e*3+2]+=f[e]*x*s*30,o[e*3+2]>10){const n=Math.random()*Math.PI*2,p=2+Math.random()*25;o[e*3]=Math.cos(n)*p,o[e*3+1]=Math.sin(n)*p,o[e*3+2]=-g-Math.random()*20}r.attributes.position.needsUpdate=!0}),t.jsxs("points",{ref:i,children:[t.jsxs("bufferGeometry",{children:[t.jsx("bufferAttribute",{attach:"attributes-position",count:a,array:c.positions,itemSize:3}),t.jsx("bufferAttribute",{attach:"attributes-aSize",count:a,array:c.sizes,itemSize:1}),t.jsx("bufferAttribute",{attach:"attributes-aShape",count:a,array:c.shapes,itemSize:1}),t.jsx("bufferAttribute",{attach:"attributes-aColor",count:a,array:c.colors,itemSize:3})]}),t.jsx("shaderMaterial",{vertexShader:`
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
  `,transparent:!0,depthWrite:!1,blending:A})]})}function z({speedRef:u}){const i=l.useRef(),a=200,g=l.useMemo(()=>{const c=new Float32Array(a*6);for(let m=0;m<a;m++){const h=Math.random()*Math.PI*2,d=3+Math.random()*20,s=Math.cos(h)*d,r=Math.sin(h)*d,o=-Math.random()*60;c[m*6]=s,c[m*6+1]=r,c[m*6+2]=o,c[m*6+3]=s,c[m*6+4]=r,c[m*6+5]=o-1.5}return c},[]);return y((c,m)=>{if(!i.current)return;const h=i.current.geometry.attributes.position.array,d=u.current;for(let s=0;s<a;s++){const r=d*m*35;if(h[s*6+2]+=r,h[s*6+5]+=r,h[s*6+2]>10){const o=Math.random()*Math.PI*2,f=3+Math.random()*20,x=Math.cos(o)*f,e=Math.sin(o)*f,n=-60-Math.random()*10;h[s*6]=x,h[s*6+1]=e,h[s*6+2]=n,h[s*6+3]=x,h[s*6+4]=e,h[s*6+5]=n-1.5*d}}i.current.geometry.attributes.position.needsUpdate=!0}),t.jsxs("lineSegments",{ref:i,children:[t.jsx("bufferGeometry",{children:t.jsx("bufferAttribute",{attach:"attributes-position",count:a*2,array:g,itemSize:3})}),t.jsx("lineBasicMaterial",{color:"#ffffff",transparent:!0,opacity:.15})]})}function F({speedRef:u}){return t.jsxs(t.Fragment,{children:[t.jsx("color",{attach:"background",args:["#050508"]}),t.jsx("fog",{attach:"fog",args:["#050508",40,80]}),t.jsx(P,{speedRef:u}),t.jsx(z,{speedRef:u})]})}function T({onBack:u}){const[i,a]=l.useState(!1),[g,c]=l.useState(null),[m,h]=l.useState("00:00:000"),[d,s]=l.useState(1),r=l.useRef(1),o=l.useRef(!1);l.useRef(null);const f=l.useCallback(()=>{b.init(),b.start(),a(!0),c(Date.now())},[]);l.useEffect(()=>{if(!g)return;let n;const p=()=>{const v=Date.now()-g,w=String(Math.floor(v/6e4)).padStart(2,"0"),S=String(Math.floor(v%6e4/1e3)).padStart(2,"0"),j=String(v%1e3).padStart(3,"0");h(`${w}:${S}:${j}`),n=requestAnimationFrame(p)};return n=requestAnimationFrame(p),()=>cancelAnimationFrame(n)},[g]),l.useEffect(()=>{if(!i)return;let n;const p=()=>{if(o.current){const v=(20-r.current)/19;r.current=Math.min(r.current+.08*v,20)}else r.current=Math.max(r.current-.06,1);s(r.current),b.setSpeed(r.current),n=requestAnimationFrame(p)};return n=requestAnimationFrame(p),()=>cancelAnimationFrame(n)},[i]);const x=l.useCallback(()=>{o.current=!0},[]),e=l.useCallback(()=>{o.current=!1},[]);return i?t.jsxs("div",{className:"fixed inset-0 bg-[#050508] z-50 select-none cursor-crosshair",onPointerDown:x,onPointerUp:e,onPointerLeave:e,children:[t.jsx(M,{camera:{position:[0,0,5],fov:75,near:.1,far:100},dpr:[1,2],gl:{antialias:!1,alpha:!1},children:t.jsx(F,{speedRef:r})}),t.jsxs("div",{className:"absolute inset-0 pointer-events-none flex flex-col justify-between",children:[t.jsxs("div",{className:"flex items-center justify-between px-6 py-5 pointer-events-auto",children:[t.jsx("div",{className:"font-mono text-white/50 text-xs tracking-[0.2em]",children:"@kranthi · LAB"}),t.jsx("div",{className:"font-mono text-white/50 text-xs tracking-[0.2em]",children:"ASTRO DITHER"})]}),t.jsxs("div",{className:"flex items-center justify-between px-6 py-5",children:[t.jsx("div",{className:"font-mono text-white/60 text-sm tracking-widest",children:m}),t.jsxs("div",{className:"font-mono text-white/40 text-xs tracking-wider flex items-center gap-3",children:[t.jsx("span",{className:"text-white/20",children:"HOLD FOR SPEED"}),t.jsx("span",{className:"text-white/50",children:"|"}),t.jsxs("span",{className:"text-white/60",children:[d.toFixed(2),"x"]})]})]})]}),t.jsx("button",{onClick:n=>{n.stopPropagation(),u==null||u()},className:"absolute top-5 left-6 text-white/20 hover:text-white/50 text-xs font-mono tracking-wider transition-colors pointer-events-auto z-10",style:{display:"none"},children:"← BACK"})]}):t.jsxs("div",{className:"fixed inset-0 bg-[#050508] flex flex-col items-center justify-center z-50 cursor-pointer",onClick:f,children:[t.jsx("div",{className:"absolute top-6 left-6",children:t.jsx("button",{onClick:n=>{n.stopPropagation(),u==null||u()},className:"text-white/30 hover:text-white/60 text-xs font-mono tracking-wider transition-colors",children:"← BACK"})}),t.jsxs("div",{className:"text-center",children:[t.jsx("h1",{className:"text-white/80 text-2xl sm:text-4xl font-mono tracking-[0.3em] mb-8",children:"ASTRO DITHER"}),t.jsx("div",{className:"text-white/30 text-xs font-mono tracking-[0.2em] animate-pulse border border-white/10 px-6 py-3",children:"CLICK TO ENTER"})]}),t.jsx("div",{className:"absolute bottom-8 text-white/15 text-[9px] font-mono tracking-[0.15em]",children:"A warp travel experiment · audio enabled"})]})}export{T as default};
