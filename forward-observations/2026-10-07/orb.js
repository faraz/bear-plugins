/* Earthrise by @bas3line, ascii.rest, MIT — see ASCII-LICENSE.txt.
 * Keep this entry URL for the existing Bear/preview script includes. */
(() => {
  const canvas=document.querySelector('#earthrise');if(!canvas)return;
  const base=document.currentScript.src;
  Promise.all([import(new URL('ascii-mount.js',base).href),import(new URL('earthrise.js',base).href)]).then(([{mount},piece])=>{
    // Preserve Earth's blues; soften saturation without changing the source simulation.
    const palette=piece.meta.palette.map(hex=>{
      const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
      const grey=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
      return '#'+rgb.map(v=>Math.round(v*.75+grey*.25).toString(16).padStart(2,'0')).join('');
    });
    const stop=mount(canvas,{...piece,meta:{...piece.meta,ground:'#111416',palette}},{fps:12,motion:true});
    canvas.parentElement.dataset.rendered='true';
    addEventListener('pagehide',event=>{if(!event.persisted)stop();},{once:true});
  }).catch(()=>{canvas.hidden=true;});
})();
