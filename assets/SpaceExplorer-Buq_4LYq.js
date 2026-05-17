import{r as d,j as r}from"./index-BgDY5ldx.js";import{v as oe,u as V,a as O,C as he,O as pe,e as ae}from"./OrbitControls-C_luT6iQ.js";import{aG as xe,aH as Z,aI as G,a3 as N,aJ as ve,aa as q,ab as le,V as w,S as K,aK as H,aL as Q,a as ce,M as ge,aM as R,aN as be,i as ye,Y,C,_ as ee,aO as we,aP as Se,aQ as je,aR as $,D as F,aS as Ee,R as _e}from"./extends-DSWoQKP3.js";const de=oe>=125?"uv1":"uv2",te=new q,B=new w;class X extends xe{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry";const e=[-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],n=[-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],s=[0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5];this.setIndex(s),this.setAttribute("position",new Z(e,3)),this.setAttribute("uv",new Z(n,2))}applyMatrix4(e){const n=this.attributes.instanceStart,s=this.attributes.instanceEnd;return n!==void 0&&(n.applyMatrix4(e),s.applyMatrix4(e),n.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}setPositions(e){let n;e instanceof Float32Array?n=e:Array.isArray(e)&&(n=new Float32Array(e));const s=new G(n,6,1);return this.setAttribute("instanceStart",new N(s,3,0)),this.setAttribute("instanceEnd",new N(s,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e,n=3){let s;e instanceof Float32Array?s=e:Array.isArray(e)&&(s=new Float32Array(e));const i=new G(s,n*2,1);return this.setAttribute("instanceColorStart",new N(i,n,0)),this.setAttribute("instanceColorEnd",new N(i,n,n)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new ve(e.geometry)),this}fromLineSegments(e){const n=e.geometry;return this.setPositions(n.attributes.position.array),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new q);const e=this.attributes.instanceStart,n=this.attributes.instanceEnd;e!==void 0&&n!==void 0&&(this.boundingBox.setFromBufferAttribute(e),te.setFromBufferAttribute(n),this.boundingBox.union(te))}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new le),this.boundingBox===null&&this.computeBoundingBox();const e=this.attributes.instanceStart,n=this.attributes.instanceEnd;if(e!==void 0&&n!==void 0){const s=this.boundingSphere.center;this.boundingBox.getCenter(s);let i=0;for(let o=0,c=e.count;o<c;o++)B.fromBufferAttribute(e,o),i=Math.max(i,s.distanceToSquared(B)),B.fromBufferAttribute(n,o),i=Math.max(i,s.distanceToSquared(B));this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(e){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(e)}}class ue extends X{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(e){const n=e.length-3,s=new Float32Array(2*n);for(let i=0;i<n;i+=3)s[2*i]=e[i],s[2*i+1]=e[i+1],s[2*i+2]=e[i+2],s[2*i+3]=e[i+3],s[2*i+4]=e[i+4],s[2*i+5]=e[i+5];return super.setPositions(s),this}setColors(e,n=3){const s=e.length-n,i=new Float32Array(2*s);if(n===3)for(let o=0;o<s;o+=n)i[2*o]=e[o],i[2*o+1]=e[o+1],i[2*o+2]=e[o+2],i[2*o+3]=e[o+3],i[2*o+4]=e[o+4],i[2*o+5]=e[o+5];else for(let o=0;o<s;o+=n)i[2*o]=e[o],i[2*o+1]=e[o+1],i[2*o+2]=e[o+2],i[2*o+3]=e[o+3],i[2*o+4]=e[o+4],i[2*o+5]=e[o+5],i[2*o+6]=e[o+6],i[2*o+7]=e[o+7];return super.setColors(i,n),this}fromLine(e){const n=e.geometry;return this.setPositions(n.attributes.position.array),this}}class J extends K{constructor(e){super({type:"LineMaterial",uniforms:H.clone(H.merge([Q.common,Q.fog,{worldUnits:{value:1},linewidth:{value:1},resolution:{value:new ce(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}}])),vertexShader:`
				#include <common>
				#include <fog_pars_vertex>
				#include <logdepthbuf_pars_vertex>
				#include <clipping_planes_pars_vertex>

				uniform float linewidth;
				uniform vec2 resolution;

				attribute vec3 instanceStart;
				attribute vec3 instanceEnd;

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
						attribute vec4 instanceColorStart;
						attribute vec4 instanceColorEnd;
					#else
						varying vec3 vLineColor;
						attribute vec3 instanceColorStart;
						attribute vec3 instanceColorEnd;
					#endif
				#endif

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#ifdef USE_DASH

					uniform float dashScale;
					attribute float instanceDistanceStart;
					attribute float instanceDistanceEnd;
					varying float vLineDistance;

				#endif

				void trimSegment( const in vec4 start, inout vec4 end ) {

					// trim end segment so it terminates between the camera plane and the near plane

					// conservative estimate of the near plane
					float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
					float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
					float nearEstimate = - 0.5 * b / a;

					float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

					end.xyz = mix( start.xyz, end.xyz, alpha );

				}

				void main() {

					#ifdef USE_COLOR

						vLineColor = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

					#endif

					#ifdef USE_DASH

						vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
						vUv = uv;

					#endif

					float aspect = resolution.x / resolution.y;

					// camera space
					vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
					vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

					#ifdef WORLD_UNITS

						worldStart = start.xyz;
						worldEnd = end.xyz;

					#else

						vUv = uv;

					#endif

					// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
					// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
					// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
					// perhaps there is a more elegant solution -- WestLangley

					bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

					if ( perspective ) {

						if ( start.z < 0.0 && end.z >= 0.0 ) {

							trimSegment( start, end );

						} else if ( end.z < 0.0 && start.z >= 0.0 ) {

							trimSegment( end, start );

						}

					}

					// clip space
					vec4 clipStart = projectionMatrix * start;
					vec4 clipEnd = projectionMatrix * end;

					// ndc space
					vec3 ndcStart = clipStart.xyz / clipStart.w;
					vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

					// direction
					vec2 dir = ndcEnd.xy - ndcStart.xy;

					// account for clip-space aspect ratio
					dir.x *= aspect;
					dir = normalize( dir );

					#ifdef WORLD_UNITS

						// get the offset direction as perpendicular to the view vector
						vec3 worldDir = normalize( end.xyz - start.xyz );
						vec3 offset;
						if ( position.y < 0.5 ) {

							offset = normalize( cross( start.xyz, worldDir ) );

						} else {

							offset = normalize( cross( end.xyz, worldDir ) );

						}

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						float forwardOffset = dot( worldDir, vec3( 0.0, 0.0, 1.0 ) );

						// don't extend the line if we're rendering dashes because we
						// won't be rendering the endcaps
						#ifndef USE_DASH

							// extend the line bounds to encompass  endcaps
							start.xyz += - worldDir * linewidth * 0.5;
							end.xyz += worldDir * linewidth * 0.5;

							// shift the position of the quad so it hugs the forward edge of the line
							offset.xy -= dir * forwardOffset;
							offset.z += 0.5;

						#endif

						// endcaps
						if ( position.y > 1.0 || position.y < 0.0 ) {

							offset.xy += dir * 2.0 * forwardOffset;

						}

						// adjust for linewidth
						offset *= linewidth * 0.5;

						// set the world position
						worldPos = ( position.y < 0.5 ) ? start : end;
						worldPos.xyz += offset;

						// project the worldpos
						vec4 clip = projectionMatrix * worldPos;

						// shift the depth of the projected points so the line
						// segments overlap neatly
						vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
						clip.z = clipPose.z * clip.w;

					#else

						vec2 offset = vec2( dir.y, - dir.x );
						// undo aspect ratio adjustment
						dir.x /= aspect;
						offset.x /= aspect;

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						// endcaps
						if ( position.y < 0.0 ) {

							offset += - dir;

						} else if ( position.y > 1.0 ) {

							offset += dir;

						}

						// adjust for linewidth
						offset *= linewidth;

						// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
						offset /= resolution.y;

						// select end
						vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

						// back to clip space
						offset *= clip.w;

						clip.xy += offset;

					#endif

					gl_Position = clip;

					vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

					#include <logdepthbuf_vertex>
					#include <clipping_planes_vertex>
					#include <fog_vertex>

				}
			`,fragmentShader:`
				uniform vec3 diffuse;
				uniform float opacity;
				uniform float linewidth;

				#ifdef USE_DASH

					uniform float dashOffset;
					uniform float dashSize;
					uniform float gapSize;

				#endif

				varying float vLineDistance;

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#include <common>
				#include <fog_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <clipping_planes_pars_fragment>

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
					#else
						varying vec3 vLineColor;
					#endif
				#endif

				vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

					float mua;
					float mub;

					vec3 p13 = p1 - p3;
					vec3 p43 = p4 - p3;

					vec3 p21 = p2 - p1;

					float d1343 = dot( p13, p43 );
					float d4321 = dot( p43, p21 );
					float d1321 = dot( p13, p21 );
					float d4343 = dot( p43, p43 );
					float d2121 = dot( p21, p21 );

					float denom = d2121 * d4343 - d4321 * d4321;

					float numer = d1343 * d4321 - d1321 * d4343;

					mua = numer / denom;
					mua = clamp( mua, 0.0, 1.0 );
					mub = ( d1343 + d4321 * ( mua ) ) / d4343;
					mub = clamp( mub, 0.0, 1.0 );

					return vec2( mua, mub );

				}

				void main() {

					#include <clipping_planes_fragment>

					#ifdef USE_DASH

						if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

						if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

					#endif

					float alpha = opacity;

					#ifdef WORLD_UNITS

						// Find the closest points on the view ray and the line segment
						vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
						vec3 lineDir = worldEnd - worldStart;
						vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

						vec3 p1 = worldStart + lineDir * params.x;
						vec3 p2 = rayEnd * params.y;
						vec3 delta = p1 - p2;
						float len = length( delta );
						float norm = len / linewidth;

						#ifndef USE_DASH

							#ifdef USE_ALPHA_TO_COVERAGE

								float dnorm = fwidth( norm );
								alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

							#else

								if ( norm > 0.5 ) {

									discard;

								}

							#endif

						#endif

					#else

						#ifdef USE_ALPHA_TO_COVERAGE

							// artifacts appear on some hardware if a derivative is taken within a conditional
							float a = vUv.x;
							float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
							float len2 = a * a + b * b;
							float dlen = fwidth( len2 );

							if ( abs( vUv.y ) > 1.0 ) {

								alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

							}

						#else

							if ( abs( vUv.y ) > 1.0 ) {

								float a = vUv.x;
								float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
								float len2 = a * a + b * b;

								if ( len2 > 1.0 ) discard;

							}

						#endif

					#endif

					vec4 diffuseColor = vec4( diffuse, alpha );
					#ifdef USE_COLOR
						#ifdef USE_LINE_COLOR_ALPHA
							diffuseColor *= vLineColor;
						#else
							diffuseColor.rgb *= vLineColor;
						#endif
					#endif

					#include <logdepthbuf_fragment>

					gl_FragColor = diffuseColor;

					#include <tonemapping_fragment>
					#include <${oe>=154?"colorspace_fragment":"encodings_fragment"}>
					#include <fog_fragment>
					#include <premultiplied_alpha_fragment>

				}
			`,clipping:!0}),this.isLineMaterial=!0,this.onBeforeCompile=function(){this.transparent?this.defines.USE_LINE_COLOR_ALPHA="1":delete this.defines.USE_LINE_COLOR_ALPHA},Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(n){this.uniforms.diffuse.value=n}},worldUnits:{enumerable:!0,get:function(){return"WORLD_UNITS"in this.defines},set:function(n){n===!0?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(n){this.uniforms.linewidth.value=n}},dashed:{enumerable:!0,get:function(){return"USE_DASH"in this.defines},set(n){!!n!="USE_DASH"in this.defines&&(this.needsUpdate=!0),n===!0?this.defines.USE_DASH="":delete this.defines.USE_DASH}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(n){this.uniforms.dashScale.value=n}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(n){this.uniforms.dashSize.value=n}},dashOffset:{enumerable:!0,get:function(){return this.uniforms.dashOffset.value},set:function(n){this.uniforms.dashOffset.value=n}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(n){this.uniforms.gapSize.value=n}},opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(n){this.uniforms.opacity.value=n}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(n){this.uniforms.resolution.value.copy(n)}},alphaToCoverage:{enumerable:!0,get:function(){return"USE_ALPHA_TO_COVERAGE"in this.defines},set:function(n){!!n!="USE_ALPHA_TO_COVERAGE"in this.defines&&(this.needsUpdate=!0),n===!0?(this.defines.USE_ALPHA_TO_COVERAGE="",this.extensions.derivatives=!0):(delete this.defines.USE_ALPHA_TO_COVERAGE,this.extensions.derivatives=!1)}}}),this.setValues(e)}}const D=new R,ne=new w,ie=new w,g=new R,b=new R,M=new R,I=new w,W=new ye,y=new be,re=new w,k=new q,T=new le,L=new R;let A,z;function se(t,e,n){return L.set(0,0,-e,1).applyMatrix4(t.projectionMatrix),L.multiplyScalar(1/L.w),L.x=z/n.width,L.y=z/n.height,L.applyMatrix4(t.projectionMatrixInverse),L.multiplyScalar(1/L.w),Math.abs(Math.max(L.x,L.y))}function Me(t,e){const n=t.matrixWorld,s=t.geometry,i=s.attributes.instanceStart,o=s.attributes.instanceEnd,c=Math.min(s.instanceCount,i.count);for(let a=0,l=c;a<l;a++){y.start.fromBufferAttribute(i,a),y.end.fromBufferAttribute(o,a),y.applyMatrix4(n);const u=new w,f=new w;A.distanceSqToSegment(y.start,y.end,f,u),f.distanceTo(u)<z*.5&&e.push({point:f,pointOnLine:u,distance:A.origin.distanceTo(f),object:t,face:null,faceIndex:a,uv:null,[de]:null})}}function Le(t,e,n){const s=e.projectionMatrix,o=t.material.resolution,c=t.matrixWorld,a=t.geometry,l=a.attributes.instanceStart,u=a.attributes.instanceEnd,f=Math.min(a.instanceCount,l.count),m=-e.near;A.at(1,M),M.w=1,M.applyMatrix4(e.matrixWorldInverse),M.applyMatrix4(s),M.multiplyScalar(1/M.w),M.x*=o.x/2,M.y*=o.y/2,M.z=0,I.copy(M),W.multiplyMatrices(e.matrixWorldInverse,c);for(let v=0,x=f;v<x;v++){if(g.fromBufferAttribute(l,v),b.fromBufferAttribute(u,v),g.w=1,b.w=1,g.applyMatrix4(W),b.applyMatrix4(W),g.z>m&&b.z>m)continue;if(g.z>m){const p=g.z-b.z,S=(g.z-m)/p;g.lerp(b,S)}else if(b.z>m){const p=b.z-g.z,S=(b.z-m)/p;b.lerp(g,S)}g.applyMatrix4(s),b.applyMatrix4(s),g.multiplyScalar(1/g.w),b.multiplyScalar(1/b.w),g.x*=o.x/2,g.y*=o.y/2,b.x*=o.x/2,b.y*=o.y/2,y.start.copy(g),y.start.z=0,y.end.copy(b),y.end.z=0;const E=y.closestPointToPointParameter(I,!0);y.at(E,re);const j=Y.lerp(g.z,b.z,E),_=j>=-1&&j<=1,U=I.distanceTo(re)<z*.5;if(_&&U){y.start.fromBufferAttribute(l,v),y.end.fromBufferAttribute(u,v),y.start.applyMatrix4(c),y.end.applyMatrix4(c);const p=new w,S=new w;A.distanceSqToSegment(y.start,y.end,S,p),n.push({point:S,pointOnLine:p,distance:A.origin.distanceTo(S),object:t,face:null,faceIndex:v,uv:null,[de]:null})}}}class fe extends ge{constructor(e=new X,n=new J({color:Math.random()*16777215})){super(e,n),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){const e=this.geometry,n=e.attributes.instanceStart,s=e.attributes.instanceEnd,i=new Float32Array(2*n.count);for(let c=0,a=0,l=n.count;c<l;c++,a+=2)ne.fromBufferAttribute(n,c),ie.fromBufferAttribute(s,c),i[a]=a===0?0:i[a-1],i[a+1]=i[a]+ne.distanceTo(ie);const o=new G(i,2,1);return e.setAttribute("instanceDistanceStart",new N(o,1,0)),e.setAttribute("instanceDistanceEnd",new N(o,1,1)),this}raycast(e,n){const s=this.material.worldUnits,i=e.camera;i===null&&!s&&console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');const o=e.params.Line2!==void 0&&e.params.Line2.threshold||0;A=e.ray;const c=this.matrixWorld,a=this.geometry,l=this.material;z=l.linewidth+o,a.boundingSphere===null&&a.computeBoundingSphere(),T.copy(a.boundingSphere).applyMatrix4(c);let u;if(s)u=z*.5;else{const m=Math.max(i.near,T.distanceToPoint(A.origin));u=se(i,m,l.resolution)}if(T.radius+=u,A.intersectsSphere(T)===!1)return;a.boundingBox===null&&a.computeBoundingBox(),k.copy(a.boundingBox).applyMatrix4(c);let f;if(s)f=z*.5;else{const m=Math.max(i.near,k.distanceToPoint(A.origin));f=se(i,m,l.resolution)}k.expandByScalar(f),A.intersectsBox(k)!==!1&&(s?Me(this,n):Le(this,i,n))}onBeforeRender(e){const n=this.material.uniforms;n&&n.resolution&&(e.getViewport(D),this.material.uniforms.resolution.value.set(D.z,D.w))}}class Ae extends fe{constructor(e=new ue,n=new J({color:Math.random()*16777215})){super(e,n),this.isLine2=!0,this.type="Line2"}}const ze=d.forwardRef(function({points:e,color:n=16777215,vertexColors:s,linewidth:i,lineWidth:o,segments:c,dashed:a,...l},u){var f,m;const v=V(_=>_.size),x=d.useMemo(()=>c?new fe:new Ae,[c]),[h]=d.useState(()=>new J),E=(s==null||(f=s[0])==null?void 0:f.length)===4?4:3,j=d.useMemo(()=>{const _=c?new X:new ue,U=e.map(p=>{const S=Array.isArray(p);return p instanceof w||p instanceof R?[p.x,p.y,p.z]:p instanceof ce?[p.x,p.y,0]:S&&p.length===3?[p[0],p[1],p[2]]:S&&p.length===2?[p[0],p[1],0]:p});if(_.setPositions(U.flat()),s){n=16777215;const p=s.map(S=>S instanceof C?S.toArray():S);_.setColors(p.flat(),E)}return _},[e,c,s,E]);return d.useLayoutEffect(()=>{x.computeLineDistances()},[e,x]),d.useLayoutEffect(()=>{a?h.defines.USE_DASH="":delete h.defines.USE_DASH,h.needsUpdate=!0},[a,h]),d.useEffect(()=>()=>{j.dispose(),h.dispose()},[j]),d.createElement("primitive",ee({object:x,ref:u},l),d.createElement("primitive",{object:j,attach:"geometry"}),d.createElement("primitive",ee({object:h,attach:"material",color:n,vertexColors:!!s,resolution:[v.width,v.height],linewidth:(m=i??o)!==null&&m!==void 0?m:1,dashed:a,transparent:E===4},l)))});function me(t,e,n,s){const i=class extends K{constructor(c={}){const a=Object.entries(t);super({uniforms:a.reduce((l,[u,f])=>{const m=H.clone({[u]:{value:f}});return{...l,...m}},{}),vertexShader:e,fragmentShader:n}),this.key="",a.forEach(([l])=>Object.defineProperty(this,l,{get:()=>this.uniforms[l].value,set:u=>this.uniforms[l].value=u})),Object.assign(this,c)}};return i.key=Y.generateUUID(),i}const Ne=()=>parseInt(we.replace(/\D+/g,"")),Pe=Ne();class Ce extends K{constructor(){super({uniforms:{time:{value:0},fade:{value:1}},vertexShader:`
      uniform float time;
      attribute float size;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 0.5);
        gl_PointSize = size * (30.0 / -mvPosition.z) * (3.0 + sin(time + 100.0));
        gl_Position = projectionMatrix * mvPosition;
      }`,fragmentShader:`
      uniform sampler2D pointTexture;
      uniform float fade;
      varying vec3 vColor;
      void main() {
        float opacity = 1.0;
        if (fade == 1.0) {
          float d = distance(gl_PointCoord, vec2(0.5, 0.5));
          opacity = 1.0 / (1.0 + exp(16.0 * (d - 0.25)));
        }
        gl_FragColor = vec4(vColor, opacity);

        #include <tonemapping_fragment>
	      #include <${Pe>=154?"colorspace_fragment":"encodings_fragment"}>
      }`})}}const Oe=t=>new w().setFromSpherical(new je(t,Math.acos(1-Math.random()*2),Math.random()*2*Math.PI)),Re=d.forwardRef(({radius:t=100,depth:e=50,count:n=5e3,saturation:s=0,factor:i=4,fade:o=!1,speed:c=1},a)=>{const l=d.useRef(),[u,f,m]=d.useMemo(()=>{const x=[],h=[],E=Array.from({length:n},()=>(.5+.5*Math.random())*i),j=new C;let _=t+e;const U=e/n;for(let p=0;p<n;p++)_-=U*Math.random(),x.push(...Oe(_).toArray()),j.setHSL(p/n,s,.9),h.push(j.r,j.g,j.b);return[new Float32Array(x),new Float32Array(h),new Float32Array(E)]},[n,e,i,t,s]);O(x=>l.current&&(l.current.uniforms.time.value=x.clock.elapsedTime*c));const[v]=d.useState(()=>new Ce);return d.createElement("points",{ref:a},d.createElement("bufferGeometry",null,d.createElement("bufferAttribute",{attach:"attributes-position",args:[u,3]}),d.createElement("bufferAttribute",{attach:"attributes-color",args:[f,3]}),d.createElement("bufferAttribute",{attach:"attributes-size",args:[m,1]})),d.createElement("primitive",{ref:l,object:v,attach:"material",blending:Se,"uniforms-fade-value":o,depthWrite:!1,transparent:!0,vertexColors:!0}))}),P=[{id:"about",label:"Kranthi",orbit:14,size:1.6,speed:.12,color:"#c4b5fd",surface:"#8b5cf6",atmosphere:"#a78bfa",tilt:.15,ring:!1,moons:0,desc:"Personal info, bio, and everything about Kranthi.",detail:"Orbit Period: 88 days · Rotation: 59 days"},{id:"workspace",label:"Station Alpha",orbit:22,size:1.3,speed:.09,color:"#93c5fd",surface:"#3b82f6",atmosphere:"#60a5fa",tilt:.03,ring:!1,moons:1,desc:"Interactive 3D desk workspace with tools and links.",detail:"Orbit Period: 225 days · Rotation: 243 days"},{id:"experience",label:"Experia",orbit:30,size:2,speed:.07,color:"#fda4af",surface:"#e11d48",atmosphere:"#f472b6",tilt:.41,ring:!0,moons:2,desc:"Professional experience timeline and career journey.",detail:"Orbit Period: 365 days · Rotation: 24 hours"},{id:"tech",label:"Techyon",orbit:40,size:1.4,speed:.055,color:"#6ee7b7",surface:"#059669",atmosphere:"#34d399",tilt:.12,ring:!1,moons:1,desc:"Tech stack, tools, languages, and frameworks.",detail:"Orbit Period: 687 days · Rotation: 24.6 hours"},{id:"projects",label:"Projectis",orbit:55,size:3,speed:.035,color:"#fcd34d",surface:"#d97706",atmosphere:"#fbbf24",tilt:.22,ring:!0,moons:3,desc:"Portfolio of projects built and contributed to.",detail:"Orbit Period: 12 years · Rotation: 10 hours"},{id:"travel",label:"Wanderer",orbit:68,size:1.8,speed:.022,color:"#7dd3fc",surface:"#0284c7",atmosphere:"#38bdf8",tilt:.46,ring:!0,moons:2,desc:"Travel map and adventures around the world.",detail:"Orbit Period: 29 years · Rotation: 10.7 hours"},{id:"connect",label:"Signalis",orbit:82,size:1.2,speed:.014,color:"#c4b5fd",surface:"#7c3aed",atmosphere:"#a78bfa",tilt:1.71,ring:!1,moons:1,desc:"Get in touch — contact form and social links.",detail:"Orbit Period: 84 years · Rotation: 17.2 hours"},{id:"guestbook",label:"Beacon Prime",orbit:95,size:1.3,speed:.009,color:"#fdba74",surface:"#ea580c",atmosphere:"#fb923c",tilt:.49,ring:!1,moons:0,desc:"Leave a message in the guestbook.",detail:"Orbit Period: 165 years · Rotation: 16 hours"}],Ue=me({time:0,color:new C("#ff8800")},`
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,`
    uniform float time;
    uniform vec3 color;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
      float pulse = 1.0 + sin(time * 0.8) * 0.15;
      gl_FragColor = vec4(color, intensity * 0.6 * pulse);
    }
  `);ae({SunGlowMaterial:Ue});const Be=me({color:new C("#4488ff"),intensity:1},`
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,`
    uniform vec3 color;
    uniform float intensity;
    varying vec3 vNormal;
    void main() {
      float rim = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
      gl_FragColor = vec4(color, rim * intensity * 0.7);
    }
  `);ae({AtmosphereMaterial:Be});function ke(t,e,n){return d.useMemo(()=>{const s=n>2?256:128,i=document.createElement("canvas");i.width=s,i.height=s;const o=i.getContext("2d"),c=new C(t),a=new C(e);for(let u=0;u<s;u++)for(let f=0;f<s;f++){const m=f/s-.5,v=u/s-.5,h=(Math.sin(m*30+v*20)*.5+.5)*(Math.cos(v*25-m*15)*.5+.5)*.6+.2,E=Math.floor((c.r*h+a.r*(1-h))*255),j=Math.floor((c.g*h+a.g*(1-h))*255),_=Math.floor((c.b*h+a.b*(1-h))*255);o.fillStyle=`rgb(${E},${j},${_})`,o.fillRect(f,u,1,1)}const l=new Ee(i);return l.wrapS=l.wrapT=_e,l},[t,e,n])}function Te(){const t=d.useRef(),e=d.useRef(),n=d.useRef(),s=d.useRef();return O(i=>{const o=i.clock.elapsedTime;t.current&&(t.current.rotation.y=o*.05),e.current&&(e.current.material.uniforms.time.value=o),n.current&&(n.current.material.uniforms.time.value=o),s.current&&(s.current.rotation.z=o*.02,s.current.scale.setScalar(1+Math.sin(o*.3)*.08))}),r.jsxs("group",{children:[r.jsxs("mesh",{ref:t,children:[r.jsx("sphereGeometry",{args:[4,64,64]}),r.jsx("meshBasicMaterial",{color:"#fff5d0",toneMapped:!1})]}),r.jsxs("mesh",{ref:e,scale:1.3,children:[r.jsx("sphereGeometry",{args:[4,32,32]}),r.jsx("sunGlowMaterial",{transparent:!0,side:$,depthWrite:!1,color:"#ffaa00"})]}),r.jsxs("mesh",{ref:n,scale:2.2,children:[r.jsx("sphereGeometry",{args:[4,32,32]}),r.jsx("sunGlowMaterial",{transparent:!0,side:$,depthWrite:!1,color:"#ff6600"})]}),r.jsx("group",{ref:s,children:[0,60,120].map((i,o)=>r.jsxs("mesh",{"rotation-z":Y.degToRad(i),children:[r.jsx("planeGeometry",{args:[.5,22]}),r.jsx("meshBasicMaterial",{color:"#ffcc44",transparent:!0,opacity:.03,side:F,depthWrite:!1})]},o))}),r.jsx("pointLight",{intensity:3,color:"#fff8e7",distance:250,decay:.3}),r.jsx("pointLight",{intensity:.8,color:"#ffaa44",distance:350,decay:.8})]})}function De({radius:t,highlighted:e}){const n=d.useMemo(()=>{const s=[];for(let o=0;o<=128;o++){const c=o/128*Math.PI*2;s.push(new w(Math.cos(c)*t,0,Math.sin(c)*t))}return s},[t]);return r.jsx(ze,{points:n,color:e?"#ffffff":"#334155",lineWidth:e?1.2:.5,transparent:!0,opacity:e?.5:.15})}function Ie({planet:t,onSelect:e,selected:n,hovered:s,onHover:i,planetPositions:o}){const c=d.useRef(),a=d.useRef(),l=d.useRef(Math.random()*Math.PI*2),u=ke(t.surface,t.color,t.size),f=n===t.id||s===t.id;return O((m,v)=>{if(!c.current)return;l.current+=t.speed*v;const x=Math.cos(l.current)*t.orbit,h=Math.sin(l.current)*t.orbit;c.current.position.set(x,0,h),a.current&&(a.current.rotation.y+=.008),o&&(o.current[t.id]={x,y:0,z:h})}),r.jsxs("group",{ref:c,children:[r.jsxs("mesh",{ref:a,"rotation-z":t.tilt,onClick:m=>{m.stopPropagation(),e(t)},onPointerOver:m=>{m.stopPropagation(),i(t.id),document.body.style.cursor="pointer"},onPointerOut:()=>{i(null),document.body.style.cursor="default"},children:[r.jsx("sphereGeometry",{args:[t.size,48,48]}),r.jsx("meshStandardMaterial",{map:u,roughness:.7,metalness:.1,emissive:t.surface,emissiveIntensity:f?.3:.05})]}),r.jsxs("mesh",{scale:1.15,children:[r.jsx("sphereGeometry",{args:[t.size,32,32]}),r.jsx("atmosphereMaterial",{transparent:!0,side:$,depthWrite:!1,color:t.atmosphere,intensity:f?1.5:.6})]}),f&&r.jsxs("mesh",{"rotation-x":Math.PI/2,children:[r.jsx("ringGeometry",{args:[t.size*1.8,t.size*1.85,64]}),r.jsx("meshBasicMaterial",{color:t.color,transparent:!0,opacity:.4,side:F,depthWrite:!1})]}),t.ring&&r.jsxs("mesh",{"rotation-x":Math.PI/2.3+t.tilt*.5,children:[r.jsx("ringGeometry",{args:[t.size*1.4,t.size*2.3,80]}),r.jsx("meshBasicMaterial",{color:t.color,transparent:!0,opacity:.2,side:F,depthWrite:!1})]}),Array.from({length:t.moons},(m,v)=>r.jsx(We,{parentSize:t.size,index:v,color:t.color},v))]})}function We({parentSize:t,index:e,color:n}){const s=d.useRef(),i=t*2.8+e*1.5,o=.4+e*.2,c=d.useRef(e*2.1);return O((a,l)=>{s.current&&(c.current+=o*l,s.current.position.set(Math.cos(c.current)*i,Math.sin(c.current*.3)*.3,Math.sin(c.current)*i))}),r.jsxs("mesh",{ref:s,children:[r.jsx("sphereGeometry",{args:[.25,16,16]}),r.jsx("meshStandardMaterial",{color:"#999",roughness:.9,emissive:n,emissiveIntensity:.05})]})}function Ge({target:t,controlsRef:e}){const{camera:n}=V(),s=d.useRef(new w(0,40,60)),i=d.useRef(new w(0,0,0)),o=d.useRef(!1);return d.useEffect(()=>{if(t){const c=new w(t.x+8,6,t.z+12);s.current.copy(c),i.current.set(t.x,0,t.z),o.current=!0}else s.current.set(0,40,60),i.current.set(0,0,0),o.current=!0},[t]),O(()=>{if(!o.current||!e.current)return;n.position.lerp(s.current,.035),e.current.target.lerp(i.current,.035),e.current.update(),n.position.distanceTo(s.current)<.5&&(o.current=!1)}),null}function He({progress:t}){return r.jsx("div",{className:"fixed inset-0 z-50 bg-black flex flex-col items-center justify-center font-mono",children:r.jsxs("div",{className:"flex flex-col items-center gap-6",children:[r.jsx("div",{className:"w-16 h-16 rounded-full border border-white/10 flex items-center justify-center",children:r.jsx("div",{className:"w-3 h-3 rounded-full bg-amber-400 animate-pulse"})}),r.jsx("div",{className:"text-[11px] tracking-[0.6em] text-white/40 uppercase",children:"Eyes on Kranthi's Universe"}),r.jsx("div",{className:"w-64 h-[2px] bg-white/5 rounded-full overflow-hidden",children:r.jsx("div",{className:"h-full bg-gradient-to-r from-amber-500/60 to-amber-300/60 rounded-full transition-all duration-700",style:{width:`${t}%`}})}),r.jsx("div",{className:"text-[9px] tracking-[0.3em] text-white/20",children:"INITIALIZING SOLAR SYSTEM"})]})})}function $e({planet:t,onClose:e,onExplore:n}){const[s,i]=d.useState(!1);return d.useEffect(()=>{t?requestAnimationFrame(()=>i(!0)):i(!1)},[t]),t?r.jsx("div",{className:"fixed bottom-0 left-0 right-0 z-40 pointer-events-auto transition-all duration-500 ease-out",style:{transform:s?"translateY(0)":"translateY(100%)"},children:r.jsx("div",{className:"mx-auto max-w-3xl",children:r.jsxs("div",{className:"bg-black/85 backdrop-blur-2xl border border-white/8 rounded-t-2xl overflow-hidden",children:[r.jsx("div",{className:"h-[2px]",style:{background:`linear-gradient(90deg, transparent, ${t.color}, transparent)`}}),r.jsxs("div",{className:"p-6 flex items-start gap-6",children:[r.jsx("div",{className:"w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center",style:{background:`radial-gradient(circle at 35% 35%, ${t.color}40, ${t.surface}20)`,boxShadow:`0 0 30px ${t.color}20`},children:r.jsx("div",{className:"w-8 h-8 rounded-full",style:{background:`radial-gradient(circle at 40% 35%, ${t.color}, ${t.surface})`}})}),r.jsxs("div",{className:"flex-1 min-w-0",children:[r.jsxs("div",{className:"flex items-center gap-3 mb-1",children:[r.jsx("h2",{className:"text-lg font-semibold text-white/90",children:t.label}),r.jsx("span",{className:"text-[9px] font-mono tracking-[0.3em] px-2 py-0.5 rounded-full bg-white/5 text-white/30 border border-white/5",children:t.id.toUpperCase()})]}),r.jsx("p",{className:"text-sm text-white/40 mb-2 leading-relaxed",children:t.desc}),r.jsx("div",{className:"text-[10px] font-mono text-white/20 tracking-wider",children:t.detail})]}),r.jsxs("div",{className:"flex flex-col gap-2 flex-shrink-0",children:[r.jsx("button",{onClick:()=>n(t.id),className:"px-5 py-2 rounded-lg text-xs font-medium tracking-wider transition-all hover:scale-105",style:{background:`linear-gradient(135deg, ${t.color}30, ${t.surface}20)`,border:`1px solid ${t.color}30`,color:t.color},children:"EXPLORE →"}),r.jsx("button",{onClick:e,className:"px-5 py-2 rounded-lg text-xs text-white/30 hover:text-white/60 hover:bg-white/5 transition-all",children:"CLOSE"})]})]})]})})}):null}function Fe({planets:t,selected:e,hovered:n,onSelect:s,planetPositions:i}){const{camera:o,size:c}=V(),a=d.useRef({});return O(()=>{i.current&&P.forEach(l=>{const u=i.current[l.id];if(!u||!a.current[l.id])return;const f=new w(u.x,u.y+l.size+1.5,u.z);f.project(o);const m=(f.x*.5+.5)*c.width,v=-(f.y*.5-.5)*c.height,x=a.current[l.id],h=o.position.distanceTo(new w(u.x,u.y,u.z)),E=f.z<1&&h<120;x.style.transform=`translate(-50%, -100%) translate(${m}px, ${v}px)`,x.style.opacity=E?e===l.id||n===l.id?"1":"0.5":"0"})}),r.jsx("div",{className:"fixed inset-0 pointer-events-none z-20",style:{overflow:"hidden"},children:P.map(l=>r.jsx("div",{ref:u=>{u&&(a.current[l.id]=u)},className:"absolute top-0 left-0 pointer-events-auto cursor-pointer transition-opacity duration-300",onClick:()=>s(l),style:{opacity:0},children:r.jsxs("div",{className:"flex flex-col items-center gap-0.5",children:[r.jsx("span",{className:"text-[10px] font-medium tracking-[0.15em] drop-shadow-lg",style:{color:l.color},children:l.label}),r.jsx("div",{className:"w-[1px] h-3",style:{background:`${l.color}40`}})]})},l.id))})}function Ve({selected:t,hovered:e,onSelect:n,onHover:s,planetPositions:i,controlsRef:o}){const c=d.useMemo(()=>{var l;return t&&((l=i.current)==null?void 0:l[t.id])||null},[t,i]);return r.jsxs(r.Fragment,{children:[r.jsx("color",{attach:"background",args:["#020008"]}),r.jsx("ambientLight",{intensity:.04}),r.jsx(Re,{radius:300,depth:150,count:8e3,factor:3,saturation:0,fade:!0,speed:.3}),r.jsx(Te,{}),P.map(a=>r.jsx(De,{radius:a.orbit,highlighted:(t==null?void 0:t.id)===a.id||e===a.id},`orbit-${a.id}`)),P.map(a=>r.jsx(Ie,{planet:a,onSelect:n,selected:t==null?void 0:t.id,hovered:e,onHover:s,planetPositions:i},a.id)),r.jsx(Fe,{planets:P,selected:t==null?void 0:t.id,hovered:e,onSelect:n,planetPositions:i}),r.jsx(Ge,{target:c,controlsRef:o}),r.jsx(pe,{ref:o,enablePan:!0,enableZoom:!0,enableRotate:!0,minDistance:8,maxDistance:180,minPolarAngle:.1,maxPolarAngle:Math.PI/2,autoRotate:!0,autoRotateSpeed:.08,dampingFactor:.06,enableDamping:!0,zoomSpeed:.8,rotateSpeed:.5})]})}function qe({onHome:t}){return r.jsx("div",{className:"fixed top-0 left-0 right-0 z-30 pointer-events-none",children:r.jsxs("div",{className:"flex items-center justify-between px-5 py-3",children:[r.jsx("div",{className:"flex items-center gap-4 pointer-events-auto",children:r.jsxs("button",{onClick:t,className:"flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 transition-all group",children:[r.jsx("svg",{className:"w-3.5 h-3.5 text-white/40 group-hover:text-white/70 transition-colors",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:2,children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 19l-7-7 7-7"})}),r.jsx("span",{className:"text-[10px] font-medium tracking-[0.15em] text-white/40 group-hover:text-white/70 transition-colors",children:"HOME"})]})}),r.jsxs("div",{className:"flex items-center gap-3",children:[r.jsx("div",{className:"text-[10px] font-mono tracking-[0.4em] text-white/15 hidden sm:block",children:"KRANTHI'S UNIVERSE"}),r.jsx("div",{className:"w-2 h-2 rounded-full bg-emerald-400/60 animate-pulse",title:"Live"})]})]})})}function Ke({planets:t,selected:e,onSelect:n}){return r.jsx("div",{className:"fixed bottom-0 left-0 right-0 z-20 pointer-events-none",children:r.jsx("div",{className:"flex justify-center pb-4 px-4 pointer-events-auto",children:r.jsxs("div",{className:"flex items-center gap-[2px] p-1 rounded-xl bg-black/50 backdrop-blur-xl border border-white/5",children:[r.jsxs("button",{onClick:()=>n(null),className:`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-all ${e?"hover:bg-white/5":"bg-amber-500/10"}`,children:[r.jsx("div",{className:`w-2.5 h-2.5 rounded-full ${e?"bg-amber-400/40":"bg-amber-400"} transition-colors`}),r.jsx("span",{className:`text-[7px] font-mono tracking-wider ${e?"text-white/20":"text-amber-300/70"}`,children:"SUN"})]}),r.jsx("div",{className:"w-px h-6 bg-white/5"}),t.map(s=>{const i=(e==null?void 0:e.id)===s.id;return r.jsxs("button",{onClick:()=>n(s),className:`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-lg transition-all ${i?"bg-white/8":"hover:bg-white/5"}`,title:s.label,children:[r.jsx("div",{className:"w-2 h-2 rounded-full transition-all",style:{background:i?s.color:`${s.color}50`,boxShadow:i?`0 0 8px ${s.color}40`:"none"}}),r.jsx("span",{className:`text-[7px] font-mono tracking-wider transition-colors ${i?"text-white/60":"text-white/15"}`,children:s.label.slice(0,4).toUpperCase()})]},s.id)})]})})})}function Qe(){const[t,e]=d.useState(null),[n,s]=d.useState(null),[i,o]=d.useState(!1),[c,a]=d.useState(0),l=d.useRef(),u=d.useRef({});d.useEffect(()=>{const x=setInterval(()=>{a(h=>h>=100?(clearInterval(x),100):h+Math.random()*15)},200);return()=>clearInterval(x)},[]);const f=d.useCallback(x=>{e(h=>x?(h==null?void 0:h.id)===x.id?null:x:null)},[]),m=d.useCallback(x=>{const h={about:"#about",workspace:"#/workspace",experience:"#experience",tech:"#tech",projects:"#projects",travel:"#travel",connect:"#connect",guestbook:"#guestbook"};window.location.hash=h[x]||`#${x}`,window.location.reload()},[]),v=d.useCallback(()=>{window.location.hash="",window.location.reload()},[]);return r.jsxs("div",{className:"fixed inset-0 bg-black text-white select-none",children:[!i&&r.jsx(He,{progress:Math.min(c,100)}),r.jsx(he,{camera:{position:[0,40,60],fov:45,near:.1,far:600},dpr:window.innerWidth<768?1:[1,1.5],onCreated:()=>setTimeout(()=>o(!0),600),gl:{antialias:!0,alpha:!1,powerPreference:"high-performance"},children:r.jsx(Ve,{selected:t,hovered:n,onSelect:f,onHover:s,planetPositions:u,controlsRef:l})}),r.jsx(qe,{onHome:v}),i&&r.jsx(Ke,{planets:P,selected:t,onSelect:f}),r.jsx($e,{planet:t,onClose:()=>e(null),onExplore:m}),i&&!t&&r.jsx("div",{className:"fixed bottom-16 left-1/2 -translate-x-1/2 z-10 pointer-events-none",children:r.jsx("div",{className:"text-[9px] font-mono tracking-[0.4em] text-white/15 animate-pulse",children:"SELECT A PLANET TO EXPLORE"})})]})}export{Qe as default};
