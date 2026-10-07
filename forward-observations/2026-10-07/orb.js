/* Earthrise by @bas3line, ascii.rest, MIT — see ASCII-LICENSE.txt.
 * Keep this entry URL for the existing Bear/preview script includes. */
(() => {
  const canvas=document.querySelector('#earthrise');if(!canvas)return;
  const base=document.currentScript.src;
  Promise.all([import(new URL('ascii-mount.js',base).href),import(new URL('earthrise.js',base).href)]).then(([{mount},piece])=>{
    // Three-times scene time makes rotation/cloud drift perceptible at hero scale.
    const animated={...piece,default:()=>{const frame=piece.default();return (t,env)=>frame(t*3,env);},meta:{...piece.meta,ground:'#111416'}};
    const stop=mount(canvas,animated,{fps:24,motion:true});
    canvas.parentElement.dataset.rendered='true';
    addEventListener('pagehide',event=>{if(!event.persisted)stop();},{once:true});
  }).catch(()=>{canvas.hidden=true;});
})();
