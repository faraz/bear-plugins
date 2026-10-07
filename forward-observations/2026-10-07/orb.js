/* SHDR-29 Mosaic shader and GLSL helpers © Orbkit contributors, MIT.
 * Source: https://github.com/zzzzshawn/orbkit — see ORBKIT-LICENSE.txt.
 * Standalone single-orb renderer for Forward Observations. */
(() => {
  'use strict';
  const canvas=document.querySelector('#mosaic-orb'); if(!canvas)return;
  const wrap=canvas.parentElement;
  const gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:true});if(!gl)return;
  const params={"drift": 0.18, "churn": 0.2, "swirl": 1.2, "shuffle": 0.22, "pulse": 0.0, "spin": 0.055, "radius": 0.9, "cells": 48.0, "scale": 1.3, "coverage": 0.52, "confetti": 0.06, "light": 0.6, "gain": 1.0, "contrast": 1.0};
  const rates=new Set(['drift','churn','shuffle','spin']);
  const vertex='attribute vec2 aPos; void main(){gl_Position=vec4(aPos,0.,1.);}';
  const fragment=`
precision highp float;
uniform vec2 uRes;
uniform float uTime;   // slow ambient clock (half real-time)
uniform float uAnim;   // flow clock — its speed follows the output volume
uniform float uInput;  // input volume 0..1: user speech energy
uniform float uOutput; // output volume 0..1: agent speech energy

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(11.7, 7.3);
    a *= 0.5;
  }
  return v;
}
vec2 orbUV() { return (2.0 * gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y); }

// GLSL ES 1.0 has no tanh() — it arrived in ES 3.0. Shader-golf listings lean
// on it as a tone-mapper, so it ships here. Clamped against exp() overflow;
// accurate for the non-negative accumulators those shaders produce.
vec3 tanh3(vec3 x) {
  x = clamp(x, -10.0, 10.0);
  vec3 e = exp(2.0 * x);
  return (e - 1.0) / (e + 1.0);
}

uniform float uP_drift;
uniform float uP_churn;
uniform float uP_swirl;
uniform float uP_shuffle;
uniform float uP_pulse;
uniform float uP_spin;
uniform float uP_radius;
uniform float uP_cells;
uniform float uP_scale;
uniform float uP_coverage;
uniform float uP_confetti;
uniform float uP_light;
uniform float uP_gain;
uniform float uP_contrast;
uniform vec3 uC_lit;
uniform vec3 uC_wall;

void main() {
  // Volume coupling: user input widens the lit coverage, agent output turns
  // the panel brightness up.
  float coverNow = uP_coverage + 0.07 * uInput;
  float gainNow = uP_gain * (0.85 + 0.5 * uOutput);

  // resolution-relative tile grid — same wall at every size
  float cellPx = max(min(uRes.x, uRes.y) / max(uP_cells, 8.0), 4.0);
  vec2 cellIdx = floor(gl_FragCoord.xy / cellPx);
  vec2 cellCentre = (cellIdx + 0.5) * cellPx;
  vec2 g = fract(gl_FragCoord.xy / cellPx); // 0..1 inside the tile

  vec2 suv = (2.0 * cellCentre - uRes) / min(uRes.x, uRes.y);
  vec2 uv = suv / uP_radius;
  float r2 = dot(uv, uv);

  // blocky silhouette, cut on the tile grid like the wall itself
  float mask = 1.0 - step(1.0, r2);

  float z = sqrt(max(1.0 - r2, 0.0));
  vec3 n = vec3(uv, z);

  // rotating dome, stereographic projection — the blobs roll around the
  // ball as the dome turns
  float rot = uP_spin; // integrated clock
  float cr = cos(rot);
  float sr = sin(rot);
  vec3 sp = vec3(n.x * cr - n.z * sr, n.y, n.x * sr + n.z * cr);
  vec2 p2 = sp.xy / (abs(sp.z) + 1.2) * uP_scale * 3.0;

  /*
    Per-state motion, each on its own integrated clock:
      DRIFT    the blob field streams across the wall     (idle flows)
      CHURN    the fluid warp evolves in place            (thinking boils)
      SHUFFLE  the confetti promotion cycles              (thinking races it)
      PULSE    rings radiate from the centre              (speaking)
    Rates glide; a rate at zero freezes that motion with its phase intact.
    The pulse depth is an amplitude, so idle carries no static rings.
  */
  float driftT = uP_drift;     // integrated clock: blob stream
  float churnT = uP_churn;     // integrated clock: warp evolution
  float shuffleT = uP_shuffle; // integrated clock: confetti reshuffle
  vec2 f1 = vec2(driftT * 0.5, -driftT * 0.35);
  vec2 f2 = vec2(-churnT * 0.4, churnT * 0.6);

  /*
    FLUID domain warp: two decorrelated fbm channels displace the sample
    point before the blob field reads it, and the displacement itself
    evolves on the churn clock. The blobs curl, stretch and merge like
    liquid instead of sliding across the wall as one rigid sheet.
  */
  vec2 warp = vec2(
    fbm(p2 * 0.9 + f2),
    fbm(p2 * 0.9 + f2.yx + 13.7)
  ) - 0.5;
  float field = fbm(p2 + f1 + warp * uP_swirl * 2.4);

  float lambert = clamp(dot(n, normalize(vec3(-0.45, 0.55, 0.7))), 0.0, 1.0);
  float lum = smoothstep(1.0 - coverNow, 1.14 - coverNow, field
    + 0.25 * uP_light * lambert
    + uP_pulse * 0.3 * sin(length(uv) * 5.0 - driftT * 3.2));
  lum *= gainNow;

  /*
    The tile: a bevelled square face inside a frame. The face is the lit
    part; the frame stays dark; an unlit tile keeps a faint presence so the
    wall reads as hardware even where nothing is lit.
  */
  vec2 d2 = abs(g - 0.5);
  float d = max(d2.x, d2.y);
  float face = 1.0 - smoothstep(0.26, 0.36, d);
  float tile = 1.0 - smoothstep(0.42, 0.48, d);
  // a soft centre hot-spot on the face, like an LED under a diffuser
  float hot = 1.0 - smoothstep(0.0, 0.34, length(d2));

  /*
    Confetti: a per-tile hash cycles against the shuffle clock, and the top
    uP_confetti slice of the cycle is promoted from warm white to a fully
    saturated hue drawn from a second hash. Which tiles are coloured
    therefore reshuffles continuously — slowly at rest, fast in thought.
  */
  float h1 = hash(cellIdx * 1.618 + 7.3);
  float h2 = hash(cellIdx * 2.113 + 41.7);
  float cyc = fract(h1 + shuffleT * 0.06);
  float promoted = step(1.0 - uP_confetti, cyc);
  vec3 confetti = 0.5 + 0.5 * cos(6.2831 * (h2 + vec3(0.0, 0.33, 0.67)));
  confetti = normalize(confetti + 0.05) * 1.2;
  vec3 litCol = mix(uC_lit, confetti, promoted);

  // lit face over the dark wall; frames and off-tiles stay faintly present
  vec3 offCol = uC_wall * tile;
  vec3 onCol = litCol * (face * 1.05 + hot * 0.5) * lum;
  vec3 col = offCol + onCol;

  col = pow(max(col, 0.0), vec3(uP_contrast));

  // Surface-lit orb bounded by a mask: alpha IS coverage, so premultiply —
  // the opposite convention from the emissive orbs (see shdr-31).
  float a = mask;
  gl_FragColor = vec4(col * a, a);
}
`;
  let program, buffer, vs, fs, raf=0, visible=true, clock=17, last=0, locations={};
  function compile(type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);throw new Error('Orb shader could not compile');}return shader;}
  function setup(){
    try{
      vs=compile(gl.VERTEX_SHADER,vertex);fs=compile(gl.FRAGMENT_SHADER,fragment);program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Orb shader could not link');gl.useProgram(program);
      buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
      const pos=gl.getAttribLocation(program,'aPos');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
      for(const name of ['uRes','uTime','uAnim','uInput','uOutput','uC_lit','uC_wall',...Object.keys(params).map(k=>'uP_'+k)])locations[name]=gl.getUniformLocation(program,name);
      gl.uniform3f(locations.uC_lit,182/255,212/255,192/255);gl.uniform3f(locations.uC_wall,26/255,31/255,34/255);resize();resume();
    }catch(error){wrap.dataset.rendered='false';console.warn(error.message);}
  }
  function resize(){const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(canvas.clientWidth*dpr));canvas.height=Math.max(1,Math.round(canvas.clientHeight*dpr));if(program&&!gl.isContextLost()){gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(locations.uRes,canvas.width,canvas.height);}}
  function frame(now){raf=0;if(document.hidden||!visible||gl.isContextLost())return;
    if(now-last>=1000/30){clock+=Math.min((now-last)/1000,.06);last=now;gl.uniform1f(locations.uTime,clock*.5);gl.uniform1f(locations.uAnim,clock);gl.uniform1f(locations.uInput,0);gl.uniform1f(locations.uOutput,0);
      for(const [k,v] of Object.entries(params))gl.uniform1f(locations['uP_'+k],rates.has(k)?clock*v:v);
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,3);wrap.dataset.rendered='true';}
    raf=requestAnimationFrame(frame);
  }
  function resume(){if(!raf&&visible&&!document.hidden&&program&&!gl.isContextLost()){last=performance.now();raf=requestAnimationFrame(frame);}}
  function pause(){cancelAnimationFrame(raf);raf=0;}
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible)resume();else pause();}).observe(canvas);
  document.addEventListener('visibilitychange',()=>document.hidden?pause():resume());
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();wrap.dataset.rendered='false';});
  canvas.addEventListener('webglcontextrestored',setup);
  window.addEventListener('pagehide',pause);window.addEventListener('pageshow',resume);
  setup();
})();
