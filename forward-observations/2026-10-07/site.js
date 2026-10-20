/* Forward Observations — shared navigation, research, reading and search. */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const text = n => n?.textContent.replace(/\s+/g, ' ').trim() || '';
  const make = (tag, className, content) => { const n = document.createElement(tag); if (className) n.className = className; if (content) n.textContent = content; return n; };
  const link = (label, href) => { const a = make('a', '', label); a.href = href; return a; };
  const main = $('main'); if (!main) return;
  import(new URL('background.js', document.currentScript.src).href).catch(() => {});
  if ($('.research-card__media')) import(new URL('research-backgrounds.js', document.currentScript.src).href).catch(() => {});
  main.id ||= 'main-content'; main.tabIndex = -1;
  const skip = link('Skip to content', '#'+main.id); skip.className='skip-link'; document.body.prepend(skip);
  $$('a[href^="//blog//"]').forEach(a=>a.setAttribute('href',a.getAttribute('href').replace('//blog//','/blog/')));
  const path = location.pathname.replace(/\/$/, '') || '/';
  const header = $('body>header');
  const nav = $('nav', header); nav.replaceChildren(); nav.id='site-navigation'; nav.setAttribute('aria-label','Main navigation');
  for (const [label, href] of [['Writing','/blog/'],['Research','/research/'],['Talks','/talks/'],['TIL','/til'],['Projects','/projects'],['Bookshelf','/books/']]) {
    const a = link(label,href);
    const section=(label==='Research' && document.body.classList.contains('paper')) || (label==='Writing' && !$('.bookshelf,.talks',main) && document.body.classList.contains('post') && !document.body.classList.contains('paper'));
    if(path===href.replace(/\/$/, '')) a.setAttribute('aria-current','page');
    else if(section) a.setAttribute('aria-current','location');
    nav.append(a);
  }
  const menu=make('button','menu-trigger','Menu');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-controls',nav.id);header.insertBefore(menu,nav);
  const searchButton=make('button','search-trigger','Search');searchButton.append(make('kbd','','⌘ K'));searchButton.setAttribute('aria-expanded','false');searchButton.setAttribute('aria-controls','site-search');header.append(searchButton);
  const search=make('section','search-panel');search.id='site-search';search.inert=true;const label=make('label','','Search writing and research');label.htmlFor='site-query';const query=make('input');query.id='site-query';query.type='search';query.placeholder='Search titles and summaries';const results=make('ul','search-results');results.setAttribute('aria-live','polite');search.append(label,query,results);header.append(search);
  const narrow=matchMedia('(max-width:1159px)');
  let searchOpen=false;
  const setMenu=open=>{nav.classList.toggle('is-open',open);nav.inert=narrow.matches&&!open;menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'Close':'Menu';};
  const toggleSearch=(open,restore=true)=>{searchOpen=open;search.classList.toggle('is-open',open);search.inert=!open;searchButton.setAttribute('aria-expanded',String(open));if(open){setMenu(false);query.focus();loadIndex();}else if(restore)searchButton.focus();};
  menu.addEventListener('click',()=>{const open=!nav.classList.contains('is-open');toggleSearch(false,false);setMenu(open);});
  searchButton.addEventListener('click',()=>toggleSearch(!searchOpen));
  document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();toggleSearch(!searchOpen);}if(e.key==='Escape'){if(searchOpen)toggleSearch(false);else if(nav.classList.contains('is-open')){setMenu(false);menu.focus();}}});
  document.addEventListener('pointerdown',e=>{if(!header.contains(e.target)){setMenu(false);toggleSearch(false,false);}});
  header.addEventListener('focusout',e=>{if(e.relatedTarget&&!header.contains(e.relatedTarget)){setMenu(false);toggleSearch(false,false);}});
  const marker=make('span','nav-marker');marker.setAttribute('aria-hidden','true');nav.append(marker);
  const pointTo=a=>{if(!a||narrow.matches){marker.style.opacity='0';return;}marker.style.transform='translateX('+a.offsetLeft+'px) scaleX('+a.offsetWidth+')';marker.style.background=getComputedStyle(a).getPropertyValue('--nav-accent');marker.style.opacity='1';};
  const navLinks=$$('a',nav);
  navLinks.forEach(a=>{a.addEventListener('pointerenter',()=>pointTo(a));a.addEventListener('focus',()=>pointTo(a));});
  nav.addEventListener('pointerleave',()=>pointTo(nav.contains(document.activeElement)?document.activeElement:null));
  nav.addEventListener('focusout',e=>{if(!nav.contains(e.relatedTarget))pointTo(null);});
  const resetNav=()=>{setMenu(false);pointTo(null);};narrow.addEventListener('change',resetNav);resetNav();
  window.addEventListener('resize',()=>pointTo(null),{passive:true});
  const getDoc=async url=>{const r=await fetch(url);if(!r.ok)throw new Error('Unable to load '+url);return new DOMParser().parseFromString(await r.text(),'text/html');};
  const researchItems=doc=>$$('.research-card',doc).map(card=>({title:text($('.research-card__title',card)),href:card.getAttribute('href'),date:text($('.research-card__meta span',card)),status:text($('.research-card__status',card)),dek:text($('.research-card__dek',card))})).filter(x=>x.title&&x.href);
  let index=[];let indexPromise;
  async function loadIndex(){
    if(!indexPromise)indexPromise=Promise.all([getDoc('/blog/'),getDoc('/research/')]).then(([blog,research])=>{
      index=$$('.blog-posts li',blog).map(li=>({title:text($('a',li)),href:$('a',li)?.getAttribute('href'),dek:text($('.post-description',li))})).filter(x=>x.href).concat(researchItems(research)); renderResults();
    }).catch(()=>{indexPromise=null;results.replaceChildren(make('li','','Search could not load. Reopen search to retry.'));});
    await indexPromise;
  }
  function renderResults(){const q=query.value.trim().toLowerCase();const found=index.filter(x=>(x.title+' '+(x.dek||'')).toLowerCase().includes(q));results.replaceChildren(...found.map(x=>{const li=make('li');li.append(link(x.title,x.href));return li;}));if(!found.length)results.append(make('li','','No matching writing or research.'));}
  query.addEventListener('input',renderResults);
  // Format dates in UTC so date-only publication labels cannot move backwards a day.
  $$('time[datetime]').forEach(t=>{const d=new Date(t.dateTime);if(!Number.isNaN(d.valueOf()))t.textContent=new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(d);});
  function tensegrityGeometry(){
    const p=1.618,points=[];
    for(const a of [-1,1])for(const b of [-p,p])points.push([0,a,b],[a,b,0],[b,0,a]);
    const bars=[],cables=[];
    for(let i=0;i<12;i++)for(let j=i+1;j<12;j++){
      const d=Math.hypot(...points[i].map((v,k)=>v-points[j][k]));
      if(Math.abs(d-2*p)<.01&&points[i].filter((v,k)=>v===points[j][k]).length===2)bars.push([i,j]);
      else if(Math.abs(d-2)<.01)cables.push([i,j]);
    }
    return {points,bars,cables};
  }
  function mountTensegrity(art){
    art.removeAttribute('aria-hidden');
    const svg=$('svg',art),body=$('.tensegrity-body',svg),{points,bars,cables}=tensegrityGeometry();
    const ns='http://www.w3.org/2000/svg';
    const line=(a,b,bar)=>{
      const g=document.createElementNS(ns,'g'),edge=document.createElementNS(ns,'line');
      edge.setAttribute('stroke',bar?'#7daaba':'#9eb8c6');edge.setAttribute('stroke-width',bar?'8':'1');edge.setAttribute('stroke-linecap','round');g.append(edge);
      if(bar){const shine=edge.cloneNode();shine.setAttribute('stroke','#d7edf3');shine.setAttribute('stroke-width','2');g.append(shine);}
      body.append(g);return {a,b,bar,g};
    };
    const members=[...cables.map(([a,b])=>line(a,b,false)),...bars.map(([a,b])=>line(a,b,true))];
    const joints=points.map(()=>{const c=document.createElementNS(ns,'circle');c.setAttribute('r','3.5');c.setAttribute('fill','#d9edf1');body.append(c);return c;});
    let frame=0,visible=false,last=0,phase=0,pointer=null,selected=-1,projected=[];
    const offset=points.map(()=>[0,0]);
    const tick=now=>{
      frame=0;if(!visible||document.hidden)return;
      const dt=Math.min((now-(last||now))/1000,.04);last=now;phase+=dt;
      const yaw=.45+Math.sin(phase*.25)*.3,tilt=.4;
      projected=points.map(([x,y,z],i)=>{
        const xx=x*Math.cos(yaw)+z*Math.sin(yaw),zz=z*Math.cos(yaw)-x*Math.sin(yaw);
        const yy=y*Math.cos(tilt)-zz*Math.sin(tilt),depth=y*Math.sin(tilt)+zz*Math.cos(tilt);
        const scale=38*6/(6+depth);
        return [110+xx*scale,90+yy*scale,depth];
      });
      if(pointer)selected=projected.reduce((best,p,i)=>Math.hypot(p[0]-pointer[0],p[1]-pointer[1])<Math.hypot(projected[best][0]-pointer[0],projected[best][1]-pointer[1])?i:best,0);
      projected.forEach((p,i)=>{
        const weight=selected<0?0:i===selected?1:members.some(e=>(e.a===i&&e.b===selected)||(e.b===i&&e.a===selected))?.32:.1;
        for(let k=0;k<2;k++){
          const target=pointer?Math.max(-14,Math.min(14,pointer[k]-projected[selected][k]))*weight:0;
          offset[i][k]+=(target-offset[i][k])*(1-Math.exp(-dt*9));
        }
      });
      const drawn=projected.map((p,i)=>[p[0]+offset[i][0],p[1]+offset[i][1],p[2]]);
      members.sort((a,b)=>(drawn[b.a][2]+drawn[b.b][2])-(drawn[a.a][2]+drawn[a.b][2])).forEach(e=>{
        const a=drawn[e.a],b=drawn[e.b];
        for(const l of e.g.children){l.setAttribute('x1',a[0]);l.setAttribute('y1',a[1]);l.setAttribute('x2',b[0]);l.setAttribute('y2',b[1]);}
        e.g.setAttribute('opacity',e.bar?1:(selected===e.a||selected===e.b)?.9:.4);body.append(e.g);
      });
      joints.forEach((c,i)=>{c.setAttribute('cx',drawn[i][0]);c.setAttribute('cy',drawn[i][1]);body.append(c);});
      frame=requestAnimationFrame(tick);
    };
    const start=()=>{last=0;if(visible&&!document.hidden&&!frame)frame=requestAnimationFrame(tick);};
    svg.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const r=svg.getBoundingClientRect();pointer=[(e.clientX-r.left)*220/r.width,(e.clientY-r.top)*180/r.height];});
    svg.addEventListener('pointerleave',()=>{pointer=null;selected=-1;});
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else{cancelAnimationFrame(frame);frame=0;}},{threshold:0}).observe(svg);
    document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else start();});
    window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;});
  }
  if(document.body.classList.contains('home')){
    const hero=make('section','home-hero');const identity=make('div','home-identity');const masthead=make('h1','masthead');masthead.append('forward',document.createElement('br'),'observations');identity.append(masthead);
    const tagline=$('.hero-title');if(tagline)identity.append(tagline);
    const artwork=make('div','earthrise-wrap');artwork.setAttribute('aria-hidden','true');artwork.innerHTML='<canvas id="earthrise"></canvas>';hero.append(identity,artwork);main.prepend(hero);
    const streamHeads=[];
    $$('.stream').forEach((stream,i)=>{
      const head=make('div','stream-head');
      const h=$('h2',stream);h.textContent=i?'Systems':'Thinking';
      const intro=$('.stream-intro',stream);
      const art=make('div','stream-art');art.setAttribute('aria-hidden','true');
      // Bespoke growth and kinetic section signatures.
      art.innerHTML=["<svg class=\"section-signature thought-growth\" viewBox=\"0 0 220 180\" aria-hidden=\"true\"><defs><pattern id=\"thinking-pixels\" width=\"2.5\" height=\"2.5\" patternUnits=\"userSpaceOnUse\"><rect width=\"1.8\" height=\"1.8\" fill=\"white\"/><rect x=\"1.9\" y=\"1.9\" width=\".6\" height=\".6\" fill=\"white\"/></pattern><mask id=\"thinking-screen\" maskUnits=\"userSpaceOnUse\" x=\"-10\" y=\"-10\" width=\"240\" height=\"210\"><rect x=\"-10\" y=\"-10\" width=\"240\" height=\"210\" fill=\"url(#thinking-pixels)\"/></mask></defs><g class=\"dither-art\" mask=\"url(#thinking-screen)\" aria-hidden=\"true\"><g class=\"thought-canopy\"><g transform=\"translate(-27.5 0) scale(1.25 1)\"><path class=\"thought-skeleton\" style=\"--weight:3.6\" d=\"M110.00 162.00 C111.48 150.60 110.00 133.50 110.00 124.00\"/><path class=\"thought-branch\" style=\"--delay:0.0s;--weight:3.6\" pathLength=\"1\" d=\"M110.00 162.00 C111.48 150.60 110.00 133.50 110.00 124.00\"/><path class=\"thought-skeleton\" style=\"--weight:3.05\" d=\"M110.00 124.00 C102.15 116.32 97.96 104.81 93.95 98.42\"/><path class=\"thought-branch\" style=\"--delay:0.32s;--weight:3.05\" pathLength=\"1\" d=\"M110.00 124.00 C102.15 116.32 97.96 104.81 93.95 98.42\"/><path class=\"thought-skeleton\" style=\"--weight:2.5\" d=\"M93.95 98.42 C86.62 94.20 79.80 87.87 75.09 84.35\"/><path class=\"thought-branch\" style=\"--delay:0.64s;--weight:2.5\" pathLength=\"1\" d=\"M93.95 98.42 C86.62 94.20 79.80 87.87 75.09 84.35\"/><path class=\"thought-skeleton\" style=\"--weight:1.95\" d=\"M75.09 84.35 C66.52 83.37 61.58 81.91 57.08 81.09\"/><path class=\"thought-branch\" style=\"--delay:0.96s;--weight:1.95\" pathLength=\"1\" d=\"M75.09 84.35 C66.52 83.37 61.58 81.91 57.08 81.09\"/><path class=\"thought-skeleton\" style=\"--weight:1.4\" d=\"M57.08 81.09 C49.13 82.83 47.92 85.45 44.87 86.90\"/><path class=\"thought-branch\" style=\"--delay:1.28s;--weight:1.4\" pathLength=\"1\" d=\"M57.08 81.09 C49.13 82.83 47.92 85.45 44.87 86.90\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M44.87 86.90 C39.20 89.56 41.22 93.56 40.00 95.78\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M44.87 86.90 C39.20 89.56 41.22 93.56 40.00 95.78\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M44.87 86.90 C46.74 86.51 37.24 85.91 34.69 85.59\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M44.87 86.90 C46.74 86.51 37.24 85.91 34.69 85.59\"/><path class=\"thought-skeleton\" style=\"--weight:1.4\" d=\"M57.08 81.09 C55.28 78.52 49.76 74.65 47.32 72.50\"/><path class=\"thought-branch\" style=\"--delay:1.28s;--weight:1.4\" pathLength=\"1\" d=\"M57.08 81.09 C55.28 78.52 49.76 74.65 47.32 72.50\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M47.32 72.50 C46.52 71.71 40.20 70.53 37.83 69.87\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M47.32 72.50 C46.52 71.71 40.20 70.53 37.83 69.87\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M47.32 72.50 C48.78 69.91 44.73 66.02 43.86 63.86\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M47.32 72.50 C48.78 69.91 44.73 66.02 43.86 63.86\"/><path class=\"thought-skeleton\" style=\"--weight:1.95\" d=\"M75.09 84.35 C75.14 79.84 70.04 73.07 68.35 69.31\"/><path class=\"thought-branch\" style=\"--delay:0.96s;--weight:1.95\" pathLength=\"1\" d=\"M75.09 84.35 C75.14 79.84 70.04 73.07 68.35 69.31\"/><path class=\"thought-skeleton\" style=\"--weight:1.4\" d=\"M68.35 69.31 C62.11 66.70 60.93 62.79 58.45 60.62\"/><path class=\"thought-branch\" style=\"--delay:1.28s;--weight:1.4\" pathLength=\"1\" d=\"M68.35 69.31 C62.11 66.70 60.93 62.79 58.45 60.62\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M58.45 60.62 C58.56 60.40 51.73 60.08 49.49 59.90\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M58.45 60.62 C58.56 60.40 51.73 60.08 49.49 59.90\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M58.45 60.62 C56.79 57.98 55.85 54.03 54.98 51.83\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M58.45 60.62 C56.79 57.98 55.85 54.03 54.98 51.83\"/><path class=\"thought-skeleton\" style=\"--weight:1.4\" d=\"M68.35 69.31 C65.27 65.49 68.71 59.76 68.83 56.57\"/><path class=\"thought-branch\" style=\"--delay:1.28s;--weight:1.4\" pathLength=\"1\" d=\"M68.35 69.31 C65.27 65.49 68.71 59.76 68.83 56.57\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M68.83 56.57 C67.85 53.98 65.94 50.09 64.97 47.93\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M68.83 56.57 C67.85 53.98 65.94 50.09 64.97 47.93\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M68.83 56.57 C68.56 54.29 72.19 50.88 73.32 48.99\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M68.83 56.57 C68.56 54.29 72.19 50.88 73.32 48.99\"/><path class=\"thought-skeleton\" style=\"--weight:2.5\" d=\"M93.95 98.42 C93.38 92.08 91.13 82.57 90.19 77.29\"/><path class=\"thought-branch\" style=\"--delay:0.64s;--weight:2.5\" pathLength=\"1\" d=\"M93.95 98.42 C93.38 92.08 91.13 82.57 90.19 77.29\"/><path class=\"thought-skeleton\" style=\"--weight:1.95\" d=\"M90.19 77.29 C86.74 73.86 82.47 68.72 79.90 65.87\"/><path class=\"thought-branch\" style=\"--delay:0.96s;--weight:1.95\" pathLength=\"1\" d=\"M90.19 77.29 C86.74 73.86 82.47 68.72 79.90 65.87\"/><path class=\"thought-skeleton\" style=\"--weight:1.4\" d=\"M79.90 65.87 C80.71 64.73 71.74 63.03 69.01 62.09\"/><path class=\"thought-branch\" style=\"--delay:1.28s;--weight:1.4\" pathLength=\"1\" d=\"M79.90 65.87 C80.71 64.73 71.74 63.03 69.01 62.09\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M69.01 62.09 C66.89 62.31 62.35 62.63 60.13 62.81\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M69.01 62.09 C66.89 62.31 62.35 62.63 60.13 62.81\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M69.01 62.09 C70.14 60.59 64.41 58.33 62.88 57.08\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M69.01 62.09 C70.14 60.59 64.41 58.33 62.88 57.08\"/><path class=\"thought-skeleton\" style=\"--weight:1.4\" d=\"M79.90 65.87 C77.82 62.64 76.92 57.79 75.92 55.09\"/><path class=\"thought-branch\" style=\"--delay:1.28s;--weight:1.4\" pathLength=\"1\" d=\"M79.90 65.87 C77.82 62.64 76.92 57.79 75.92 55.09\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M75.92 55.09 C78.13 53.53 71.55 51.19 70.10 49.89\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M75.92 55.09 C78.13 53.53 71.55 51.19 70.10 49.89\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M75.92 55.09 C73.29 52.70 77.03 49.10 77.40 47.11\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M75.92 55.09 C73.29 52.70 77.03 49.10 77.40 47.11\"/><path class=\"thought-skeleton\" style=\"--weight:1.95\" d=\"M90.19 77.29 C90.08 72.44 93.79 65.17 94.99 61.13\"/><path class=\"thought-branch\" style=\"--delay:0.96s;--weight:1.95\" pathLength=\"1\" d=\"M90.19 77.29 C90.08 72.44 93.79 65.17 94.99 61.13\"/><path class=\"thought-skeleton\" style=\"--weight:1.4\" d=\"M94.99 61.13 C97.26 57.80 91.87 52.82 90.83 50.05\"/><path class=\"thought-branch\" style=\"--delay:1.28s;--weight:1.4\" pathLength=\"1\" d=\"M94.99 61.13 C97.26 57.80 91.87 52.82 90.83 50.05\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M90.83 50.05 C88.69 48.32 86.41 45.73 84.93 44.29\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M90.83 50.05 C88.69 48.32 86.41 45.73 84.93 44.29\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M90.83 50.05 C86.61 47.31 92.00 43.20 92.40 40.91\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M90.83 50.05 C86.61 47.31 92.00 43.20 92.40 40.91\"/><path class=\"thought-skeleton\" style=\"--weight:1.4\" d=\"M94.99 61.13 C97.13 58.32 101.92 54.11 104.23 51.77\"/><path class=\"thought-branch\" style=\"--delay:1.28s;--weight:1.4\" pathLength=\"1\" d=\"M94.99 61.13 C97.13 58.32 101.92 54.11 104.23 51.77\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M104.23 51.77 C108.32 49.15 106.53 45.22 107.30 43.04\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M104.23 51.77 C108.32 49.15 106.53 45.22 107.30 43.04\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M104.23 51.77 C111.22 51.35 111.67 50.70 114.16 50.35\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M104.23 51.77 C111.22 51.35 111.67 50.70 114.16 50.35\"/><path class=\"thought-skeleton\" style=\"--weight:3.05\" d=\"M110.00 124.00 C113.33 117.23 119.98 107.07 123.30 101.43\"/><path class=\"thought-branch\" style=\"--delay:0.32s;--weight:3.05\" pathLength=\"1\" d=\"M110.00 124.00 C113.33 117.23 119.98 107.07 123.30 101.43\"/><path class=\"thought-skeleton\" style=\"--weight:2.5\" d=\"M123.30 101.43 C122.80 95.98 124.54 87.82 124.95 83.29\"/><path class=\"thought-branch\" style=\"--delay:0.64s;--weight:2.5\" pathLength=\"1\" d=\"M123.30 101.43 C122.80 95.98 124.54 87.82 124.95 83.29\"/><path class=\"thought-skeleton\" style=\"--weight:1.95\" d=\"M124.95 83.29 C120.39 79.14 121.91 72.93 120.89 69.47\"/><path class=\"thought-branch\" style=\"--delay:0.96s;--weight:1.95\" pathLength=\"1\" d=\"M124.95 83.29 C120.39 79.14 121.91 72.93 120.89 69.47\"/><path class=\"thought-skeleton\" style=\"--weight:1.4\" d=\"M120.89 69.47 C113.73 67.17 114.97 63.71 113.00 61.79\"/><path class=\"thought-branch\" style=\"--delay:1.28s;--weight:1.4\" pathLength=\"1\" d=\"M120.89 69.47 C113.73 67.17 114.97 63.71 113.00 61.79\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M113.00 61.79 C111.21 61.43 106.53 60.89 104.37 60.58\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M113.00 61.79 C111.21 61.43 106.53 60.89 104.37 60.58\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M113.00 61.79 C116.68 59.54 111.45 56.16 110.93 54.29\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M113.00 61.79 C116.68 59.54 111.45 56.16 110.93 54.29\"/><path class=\"thought-skeleton\" style=\"--weight:1.4\" d=\"M120.89 69.47 C120.30 66.22 122.78 61.35 123.41 58.65\"/><path class=\"thought-branch\" style=\"--delay:1.28s;--weight:1.4\" pathLength=\"1\" d=\"M120.89 69.47 C120.30 66.22 122.78 61.35 123.41 58.65\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M123.41 58.65 C124.65 56.41 121.60 53.06 121.00 51.19\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M123.41 58.65 C124.65 56.41 121.60 53.06 121.00 51.19\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M123.41 58.65 C129.21 56.75 127.70 53.90 129.12 52.32\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M123.41 58.65 C129.21 56.75 127.70 53.90 129.12 52.32\"/><path class=\"thought-skeleton\" style=\"--weight:1.95\" d=\"M124.95 83.29 C127.59 79.61 129.51 74.09 131.03 71.03\"/><path class=\"thought-branch\" style=\"--delay:0.96s;--weight:1.95\" pathLength=\"1\" d=\"M124.95 83.29 C127.59 79.61 129.51 74.09 131.03 71.03\"/><path class=\"thought-skeleton\" style=\"--weight:1.4\" d=\"M131.03 71.03 C133.68 68.23 130.26 64.03 130.00 61.70\"/><path class=\"thought-branch\" style=\"--delay:1.28s;--weight:1.4\" pathLength=\"1\" d=\"M131.03 71.03 C133.68 68.23 130.26 64.03 130.00 61.70\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M130.00 61.70 C133.76 59.77 127.38 56.88 126.50 55.27\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M130.00 61.70 C133.76 59.77 127.38 56.88 126.50 55.27\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M130.00 61.70 C132.41 59.92 132.08 57.26 132.77 55.78\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M130.00 61.70 C132.41 59.92 132.08 57.26 132.77 55.78\"/><path class=\"thought-skeleton\" style=\"--weight:1.4\" d=\"M131.03 71.03 C138.35 69.38 137.73 66.92 139.97 65.55\"/><path class=\"thought-branch\" style=\"--delay:1.28s;--weight:1.4\" pathLength=\"1\" d=\"M131.03 71.03 C138.35 69.38 137.73 66.92 139.97 65.55\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M139.97 65.55 C146.08 63.62 142.96 60.73 143.96 59.13\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M139.97 65.55 C146.08 63.62 142.96 60.73 143.96 59.13\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M139.97 65.55 C145.44 65.60 146.20 65.69 148.28 65.74\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M139.97 65.55 C145.44 65.60 146.20 65.69 148.28 65.74\"/><path class=\"thought-skeleton\" style=\"--weight:2.5\" d=\"M123.30 101.43 C129.19 98.02 135.17 92.91 139.13 90.08\"/><path class=\"thought-branch\" style=\"--delay:0.64s;--weight:2.5\" pathLength=\"1\" d=\"M123.30 101.43 C129.19 98.02 135.17 92.91 139.13 90.08\"/><path class=\"thought-skeleton\" style=\"--weight:1.95\" d=\"M139.13 90.08 C138.86 86.14 142.22 80.22 143.25 76.94\"/><path class=\"thought-branch\" style=\"--delay:0.96s;--weight:1.95\" pathLength=\"1\" d=\"M139.13 90.08 C138.86 86.14 142.22 80.22 143.25 76.94\"/><path class=\"thought-skeleton\" style=\"--weight:1.4\" d=\"M143.25 76.94 C139.49 74.01 142.22 69.62 141.88 67.19\"/><path class=\"thought-branch\" style=\"--delay:1.28s;--weight:1.4\" pathLength=\"1\" d=\"M143.25 76.94 C139.49 74.01 142.22 69.62 141.88 67.19\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M141.88 67.19 C138.30 65.46 138.87 62.87 137.87 61.44\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M141.88 67.19 C138.30 65.46 138.87 62.87 137.87 61.44\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M141.88 67.19 C138.14 65.28 143.62 62.43 144.19 60.85\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M141.88 67.19 C138.14 65.28 143.62 62.43 144.19 60.85\"/><path class=\"thought-skeleton\" style=\"--weight:1.4\" d=\"M143.25 76.94 C148.32 75.23 149.00 72.68 150.91 71.25\"/><path class=\"thought-branch\" style=\"--delay:1.28s;--weight:1.4\" pathLength=\"1\" d=\"M143.25 76.94 C148.32 75.23 149.00 72.68 150.91 71.25\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M150.91 71.25 C152.63 69.30 153.54 66.37 154.41 64.74\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M150.91 71.25 C152.63 69.30 153.54 66.37 154.41 64.74\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M150.91 71.25 C156.41 70.81 156.12 70.14 157.86 69.77\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M150.91 71.25 C156.41 70.81 156.12 70.14 157.86 69.77\"/><path class=\"thought-skeleton\" style=\"--weight:1.95\" d=\"M139.13 90.08 C145.93 90.15 149.28 90.26 152.66 90.32\"/><path class=\"thought-branch\" style=\"--delay:0.96s;--weight:1.95\" pathLength=\"1\" d=\"M139.13 90.08 C145.93 90.15 149.28 90.26 152.66 90.32\"/><path class=\"thought-skeleton\" style=\"--weight:1.4\" d=\"M152.66 90.32 C153.49 88.56 158.81 85.92 160.87 84.46\"/><path class=\"thought-branch\" style=\"--delay:1.28s;--weight:1.4\" pathLength=\"1\" d=\"M152.66 90.32 C153.49 88.56 158.81 85.92 160.87 84.46\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M160.87 84.46 C164.27 82.54 162.95 79.65 163.65 78.05\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M160.87 84.46 C164.27 82.54 162.95 79.65 163.65 78.05\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M160.87 84.46 C165.40 84.21 166.42 83.84 168.27 83.64\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M160.87 84.46 C165.40 84.21 166.42 83.84 168.27 83.64\"/><path class=\"thought-skeleton\" style=\"--weight:1.4\" d=\"M152.66 90.32 C151.32 91.38 159.41 92.97 161.65 93.85\"/><path class=\"thought-branch\" style=\"--delay:1.28s;--weight:1.4\" pathLength=\"1\" d=\"M152.66 90.32 C151.32 91.38 159.41 92.97 161.65 93.85\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M161.65 93.85 C167.69 93.79 167.11 93.69 168.93 93.64\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M161.65 93.85 C167.69 93.79 167.11 93.69 168.93 93.64\"/><path class=\"thought-skeleton\" style=\"--weight:0.8500000000000001\" d=\"M161.65 93.85 C167.65 95.53 165.19 98.05 166.37 99.44\"/><path class=\"thought-branch\" style=\"--delay:1.6s;--weight:0.8500000000000001\" pathLength=\"1\" d=\"M161.65 93.85 C167.65 95.53 165.19 98.05 166.37 99.44\"/><circle class=\"thought-bud\" style=\"--delay:2.02s\" cx=\"40.00\" cy=\"95.78\" r=\"2.30\"/><circle class=\"thought-bud\" style=\"--delay:1.61s\" cx=\"34.69\" cy=\"85.59\" r=\"2.48\"/><circle class=\"thought-bud\" style=\"--delay:1.86s\" cx=\"37.83\" cy=\"69.87\" r=\"1.69\"/><circle class=\"thought-bud\" style=\"--delay:2.07s\" cx=\"43.86\" cy=\"63.86\" r=\"2.30\"/><circle class=\"thought-bud\" style=\"--delay:1.77s\" cx=\"49.49\" cy=\"59.90\" r=\"2.12\"/><circle class=\"thought-bud\" style=\"--delay:2.01s\" cx=\"54.98\" cy=\"51.83\" r=\"1.92\"/><circle class=\"thought-bud\" style=\"--delay:1.68s\" cx=\"64.97\" cy=\"47.93\" r=\"2.29\"/><circle class=\"thought-bud\" style=\"--delay:1.63s\" cx=\"73.32\" cy=\"48.99\" r=\"1.91\"/><circle class=\"thought-bud\" style=\"--delay:2.05s\" cx=\"60.13\" cy=\"62.81\" r=\"2.22\"/><circle class=\"thought-bud\" style=\"--delay:1.75s\" cx=\"62.88\" cy=\"57.08\" r=\"2.15\"/><circle class=\"thought-bud\" style=\"--delay:2.02s\" cx=\"70.10\" cy=\"49.89\" r=\"2.27\"/><circle class=\"thought-bud\" style=\"--delay:2.02s\" cx=\"77.40\" cy=\"47.11\" r=\"1.90\"/><circle class=\"thought-bud\" style=\"--delay:2.01s\" cx=\"84.93\" cy=\"44.29\" r=\"1.69\"/><circle class=\"thought-bud\" style=\"--delay:1.85s\" cx=\"92.40\" cy=\"40.91\" r=\"1.88\"/><circle class=\"thought-bud\" style=\"--delay:1.68s\" cx=\"107.30\" cy=\"43.04\" r=\"2.24\"/><circle class=\"thought-bud\" style=\"--delay:1.66s\" cx=\"114.16\" cy=\"50.35\" r=\"2.15\"/><circle class=\"thought-bud\" style=\"--delay:1.86s\" cx=\"104.37\" cy=\"60.58\" r=\"2.37\"/><circle class=\"thought-bud\" style=\"--delay:1.70s\" cx=\"110.93\" cy=\"54.29\" r=\"2.10\"/><circle class=\"thought-bud\" style=\"--delay:1.68s\" cx=\"121.00\" cy=\"51.19\" r=\"1.91\"/><circle class=\"thought-bud\" style=\"--delay:2.08s\" cx=\"129.12\" cy=\"52.32\" r=\"2.02\"/><circle class=\"thought-bud\" style=\"--delay:1.87s\" cx=\"126.50\" cy=\"55.27\" r=\"2.00\"/><circle class=\"thought-bud\" style=\"--delay:2.02s\" cx=\"132.77\" cy=\"55.78\" r=\"2.44\"/><circle class=\"thought-bud\" style=\"--delay:1.63s\" cx=\"143.96\" cy=\"59.13\" r=\"1.91\"/><circle class=\"thought-bud\" style=\"--delay:1.69s\" cx=\"148.28\" cy=\"65.74\" r=\"2.32\"/><circle class=\"thought-bud\" style=\"--delay:2.02s\" cx=\"137.87\" cy=\"61.44\" r=\"1.70\"/><circle class=\"thought-bud\" style=\"--delay:2.02s\" cx=\"144.19\" cy=\"60.85\" r=\"2.31\"/><circle class=\"thought-bud\" style=\"--delay:1.82s\" cx=\"154.41\" cy=\"64.74\" r=\"2.16\"/><circle class=\"thought-bud\" style=\"--delay:1.92s\" cx=\"157.86\" cy=\"69.77\" r=\"2.28\"/><circle class=\"thought-bud\" style=\"--delay:1.97s\" cx=\"163.65\" cy=\"78.05\" r=\"1.62\"/><circle class=\"thought-bud\" style=\"--delay:1.81s\" cx=\"168.27\" cy=\"83.64\" r=\"1.68\"/><circle class=\"thought-bud\" style=\"--delay:1.69s\" cx=\"168.93\" cy=\"93.64\" r=\"2.10\"/><circle class=\"thought-bud\" style=\"--delay:1.79s\" cx=\"166.37\" cy=\"99.44\" r=\"2.13\"/></g></g></g></svg>", "<svg class=\"section-signature tensegrity\" viewBox=\"0 0 220 180\" role=\"img\" aria-label=\"Tensegrity sculpture: six blue struts suspended in tension cables. Move the pointer to gently deform the connected structure.\"><defs><pattern id=\"systems-pixels\" width=\"2.5\" height=\"2.5\" patternUnits=\"userSpaceOnUse\"><rect width=\"1.8\" height=\"1.8\" fill=\"white\"/><rect x=\"1.9\" y=\"1.9\" width=\".6\" height=\".6\" fill=\"white\"/></pattern><mask id=\"systems-screen\" maskUnits=\"userSpaceOnUse\" x=\"-10\" y=\"-10\" width=\"240\" height=\"210\"><rect x=\"-10\" y=\"-10\" width=\"240\" height=\"210\" fill=\"url(#systems-pixels)\"/></mask></defs><g class=\"dither-art\" mask=\"url(#systems-screen)\" aria-hidden=\"true\"><g class=\"tensegrity-body\"></g></g></svg>"][i];
      if(i)mountTensegrity(art);
      const more=link(i?'All research':'All writing',i?'/research/':'/blog/');more.className='stream-more';
      const arrow=make('span','stream-arrow');arrow.setAttribute('aria-hidden','true');arrow.innerHTML='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.25"><path d="M3 13 13 3M3 3h10v10"/></svg>';more.append(arrow);
      h.before(head);head.append(h,art);if(intro)head.append(intro);head.append(more);streamHeads.push(head);
    });
    const streamObserver=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{
      target.dataset.visible=String(isIntersecting);target.classList.toggle('is-moving',isIntersecting&&!document.hidden);
    }));
    streamHeads.forEach(head=>streamObserver.observe(head));
    document.addEventListener('visibilitychange',()=>streamHeads.forEach(head=>head.classList.toggle('is-moving',head.dataset.visible==='true'&&!document.hidden)));

    const shell=$('[data-systems-mixed-stream]');
    if(shell){
      const initial=$$('.blog-posts li',shell).filter(li=>$('a',li));
      shell.replaceChildren(make('p','stream-loading','Loading research…'));shell.setAttribute('aria-busy','true');
      getDoc(shell.dataset.researchPath||'/research/').then(doc=>{
        const items=researchItems(doc);const ul=make('ul','systems-stream');
        items.forEach(item=>{const li=make('li');const meta=make('div','systems-stream__meta');meta.append(make('span','',item.date),make('span','systems-stream__state',item.status));const a=link(item.title,item.href);a.className='systems-stream__title';li.append(meta,a,make('p','systems-stream__dek',item.dek));ul.append(li);});
        initial.forEach(li=>ul.append(li));shell.replaceChildren(items.length||initial.length?ul:make('p','stream-loading','No research published yet.'));
      }).catch(()=>{const error=make('p','stream-error','Research could not load. ');error.append(link('Browse research →','/research/'));shell.replaceChildren(error);}).finally(()=>shell.removeAttribute('aria-busy'));
    }
    const subscribe=$('main>p:has(a[href="/subscribe/"])');if(subscribe)subscribe.remove();
  }

  function readingPercent(top,bottom,viewport){
    const range=bottom-top-viewport+96;
    return bottom<=viewport?100:range<=0?0:Math.max(0,Math.min(100,Math.round((96-top)/range*100)));
  }
  function installReadingNavigator(content,head,utilities,title){
    const body=make('div','reading-body');
    [...content.childNodes].filter(n=>n!==head&&n!==utilities&&!(n.nodeType===1&&(n.matches('form,.tags,.post-tags,script')||n.matches('p')&&n.querySelector('a[href*="?q="]')))).forEach(n=>body.append(n));
    utilities.after(body);
    const headings=$$('h2,h3',body).filter(h=>!h.closest('figure,aside,[aria-hidden="true"]'));
    const ids=new Set($$('[id]').map(n=>n.id));
    headings.forEach(h=>{
      if(!h.id){const base=text(h).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'section';let id=base,i=2;while(ids.has(id))id=base+'-'+i++;h.id=id;ids.add(id);}
      h.tabIndex=-1;
    });
    const rail=make('aside','article-rail reading-rail');rail.setAttribute('aria-label','Article navigation');
    const panel=make('div','reading-panel');panel.id='reading-panel';
    const top=link(text(title),'#'+(title.id||='article-title'));top.className='reading-title';
    const toc=make('nav','reading-tree');toc.setAttribute('aria-label','Article sections');
    const list=make('ul');let parent,nested;
    headings.forEach(h=>{const li=make('li'),a=link(text(h),'#'+encodeURIComponent(h.id));li.append(a);if(h.tagName==='H3'&&parent){if(!nested){nested=make('ul');parent.append(nested);}nested.append(li);}else{list.append(li);parent=li;nested=null;}});
    if(headings.length){toc.append(list);}else toc.hidden=true;
    const meter=make('div','reading-meter'),progress=make('progress');progress.max=100;progress.value=0;progress.setAttribute('aria-label','Article reading progress');const percent=make('span','','0%');percent.setAttribute('aria-hidden','true');meter.append(progress,percent);
    panel.append(top,toc,meter);rail.append(panel);main.prepend(rail);main.classList.add('article-layout','has-reading-nav');document.body.classList.add('has-reading-nav');
    const slim=make('div','reading-slim'),open=make('button','','Contents');open.type='button';open.setAttribute('aria-haspopup','dialog');open.setAttribute('aria-controls','reading-dialog');open.setAttribute('aria-expanded','false');const slimProgress=progress.cloneNode();slim.append(open,slimProgress);document.body.append(slim);
    const dialog=make('dialog','reading-dialog');dialog.id='reading-dialog';dialog.setAttribute('aria-label','Article contents');const close=make('button','reading-close','Close contents');close.type='button';dialog.append(close);document.body.append(dialog);
    const closePanel=()=>{if(dialog.open)dialog.close();};
    open.addEventListener('click',()=>{dialog.append(panel);dialog.showModal();open.setAttribute('aria-expanded','true');close.focus();});
    close.addEventListener('click',closePanel);
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closePanel();}});
    dialog.addEventListener('close',()=>{rail.append(panel);open.setAttribute('aria-expanded','false');open.focus({preventScroll:true});});
    panel.addEventListener('click',e=>{const a=e.target.closest('a');if(!a)return;closePanel();const target=document.getElementById(decodeURIComponent(a.hash.slice(1)));requestAnimationFrame(()=>target?.focus({preventScroll:true}));});
    const wide=matchMedia('(min-width:1100px)');wide.addEventListener('change',()=>{if(wide.matches)closePanel();});
    const links=$$('a',toc);let pending=false;
    const update=()=>{
      pending=false;const r=body.getBoundingClientRect();
      const value=readingPercent(r.top,r.bottom,innerHeight);
      progress.value=slimProgress.value=value;percent.textContent=value+'%';
      let active=-1;headings.forEach((h,i)=>{if(h.getBoundingClientRect().top<=112)active=i;});
      links.forEach((a,i)=>{if(i===active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
    };
    const schedule=()=>{if(!pending){pending=true;requestAnimationFrame(update);}};
    addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);addEventListener('pageshow',schedule);
    new ResizeObserver(schedule).observe(body);body.addEventListener('load',schedule,true);document.fonts?.ready.then(schedule);schedule();
    if(location.hash){let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}const target=document.getElementById(id);if(target&&body.contains(target))requestAnimationFrame(()=>target.scrollIntoView());}
  }

  const isBookshelf=!!$('.bookshelf',main);
  const isTalks=!!$('.talks',main);
  if(isBookshelf||isTalks){
    document.body.classList.remove('post');document.body.classList.add('page',isTalks?'talks-page':'bookshelf-page');
    // Bear supplies an article title/date even when the page owns its introduction.
    $(':scope > h1',main)?.remove();
    $$(':scope > p',main).filter(p=>$('time',p)).forEach(p=>p.remove());
    $('#upvote-form',main)?.remove();
  }
  if(isTalks){
    $$('.talk-viewport',main).forEach(viewport=>{
      const fit=()=>viewport.style.setProperty('--talk-scale',viewport.clientWidth/1920);
      new ResizeObserver(fit).observe(viewport);fit();
    });
  }
  const isPaper=!isBookshelf&&!isTalks&&document.body.classList.contains('paper'),isPost=!isBookshelf&&!isTalks&&document.body.classList.contains('post');
  if(isPaper||isPost){
    const title=$('main>h1');
    if(title){
      const content=make('article','paper-content');content.append(...main.childNodes);main.append(content);
      const head=make('header','article-head');
      const status=$('p',content);const validStatus=status&&(/preprint|under review|researching/i.test(text(status))||$('time',status));
      if(validStatus){status.classList.add('article-status');head.append(status);}
      head.append(title);const subtitle=isPaper?$('h2:not([id])',content):null;if(subtitle){subtitle.classList.add('article-subtitle');head.append(subtitle);}
      const topRule=$('hr',content);if(topRule&&topRule===content.firstElementChild)topRule.remove();
      content.prepend(head);
      const utilities=make('div','reading-tools');utilities.append(make('span','metadata',Math.max(1,Math.round($$('p, li, blockquote',content).map(text).join(' ').split(/\s+/).filter(Boolean).length/220))+' min read'));
      const actions=make('div');const copy=make('button','copy-link','Copy link ↗');const share=make('button','','Share ↗');const announcement=make('span','share-status');announcement.setAttribute('role','status');actions.append(announcement,copy,share);utilities.append(actions);head.after(utilities);
      const canonical=$('link[rel=canonical]')?.href||'https://observations.frwd.dev'+location.pathname;
      const copyLink=async()=>{try{await navigator.clipboard.writeText(canonical+location.hash);announcement.textContent='Link copied';copy.textContent='Copied';setTimeout(()=>copy.textContent='Copy link ↗',1800);}catch{announcement.textContent='Copy this URL: '+canonical;}};
      copy.addEventListener('click',copyLink);share.addEventListener('click',async()=>{if(navigator.share){try{await navigator.share({title:text(title),url:canonical+location.hash});}catch(e){if(e.name!=='AbortError')await copyLink();}}else await copyLink();});
      if(isPaper){
        const keywords=$$('p',content).find(p=>/^Keywords:/.test(text(p)));if(keywords)keywords.classList.add('paper-keywords');

      }
      installReadingNavigator(content,head,utilities,title);
    }
  }
  $$('table',main).forEach(table=>{const scroll=make('div','table-scroll');scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label','Scrollable data table');table.before(scroll);scroll.append(table);});
  if(document.body.classList.contains('blog')){
    const list=$('.blog-posts',main);
    if(list){
      document.body.classList.add('writing-index');
      const editorial={
  "/input-output-metrics-management/": {
    "summary": "Input metrics guide action, but their link to outcomes is a hypothesis. How to test that model, expose misleading targets, and know when to revise it.",
    "minutes": 7
  },
  "/love-the-plateau/": {
    "summary": "Why progress in complex skills happens in plateaus, not steady gains, and the three mechanisms that can allow people to persist when visible feedback disappears.",
    "minutes": 4
  },
  "/choosing-problems-that-compound/": {
    "summary": "How the problems you choose shape the trust you earn and the responsibility that follows.",
    "minutes": 3
  },
  "/the-logic-most-advice-skips/": {
    "summary": "Necessary, sufficient, or helpful: the distinctions that make a promise worth testing.",
    "minutes": 1
  }
}
;
      const heading=$('h1',main)||make('h1','','Writing');heading.textContent='Writing';
      const intro=make('header','writing-intro');intro.append(heading,make('p','','Essays on mental models and systems thinking.'));main.prepend(intro);
      const rows=$$('li',list).filter(row=>$('a',row));
      const topics=[...new Set(rows.flatMap(row=>(row.dataset.tags||'').split(',').filter(Boolean)))].sort();
      const controls=make('div','writing-controls'),topicNav=make('nav','writing-topics');topicNav.setAttribute('aria-label','Writing topics');
      const all=link('All essays','/blog/');topicNav.append(all);
      const topicLinks=topics.map(topic=>{const a=link(topic.replace(/-/g,' '),'/blog/?q='+encodeURIComponent(topic));a.dataset.topic=topic;topicNav.append(a);return a;});
      const searchLabel=make('label','writing-search');searchLabel.append(make('span','','Search essays'));const input=make('input');input.type='search';input.placeholder='Find an essay';input.setAttribute('aria-label','Search essays');searchLabel.append(input);controls.append(topicNav,searchLabel);list.before(controls);
      const status=make('p','writing-count');status.setAttribute('role','status');list.before(status);
      const empty=make('div','writing-empty');empty.hidden=true;empty.append(make('h2','','No essays found'),make('p','','Try another phrase or return to all essays.'));const reset=make('button','','Clear filters');empty.append(reset);list.after(empty);
      // Replace the old unstructured tag footer with the topic navigation above.
      $$('a[href*="?q="]',main).filter(a=>!a.closest('.writing-controls')).forEach(a=>{const parent=a.parentElement;a.remove();if(parent!==main&&!text(parent))parent.remove();});
      rows.forEach((row,index)=>{
        const a=$('a',row),date=$('time',row),href=new URL(a.href,location.href).pathname;
        const info=editorial[href]||{},year=date?.getAttribute('datetime')?.slice(0,4)||'';
        row.dataset.year=year;row.classList.add('writing-row');
        const marker=make('span','writing-year',year);marker.setAttribute('aria-hidden','true');
        const content=make('div','writing-entry'),title=make('h2');title.append(a);
        const meta=make('div','writing-meta');if(date)meta.append(date);if(info.minutes)meta.append(make('span','',info.minutes+' min read'));
        content.append(title);if(info.summary)content.append(make('p','writing-summary',info.summary));content.append(meta);
        const arrow=make('span','writing-arrow');arrow.setAttribute('aria-hidden','true');arrow.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 19 19 5M5 5h14v14"/></svg>';
        row.replaceChildren(marker,content,arrow);
        row.animate?.([{opacity:.4,transform:"translateY(10px)"},{opacity:1,transform:"translateY(0)"}],{duration:550,delay:Math.min(index,5)*60,easing:"cubic-bezier(.16,1,.3,1)"});
      });
      let topic='';
      function update(fromHistory=false){
        const filtering=!!(topic||input.value.trim());list.classList.toggle('is-filtering',filtering);
        const oldRects=new Map(rows.filter(r=>!r.hidden).map(r=>[r,r.getBoundingClientRect()]));
        let count=0,lastYear='';
        rows.forEach(row=>{
          const tags=(row.dataset.tags||'').split(',');
          const matches=(!topic||tags.includes(topic))&&input.value.toLowerCase().split(',').every(term=>(text(row)+' '+tags.join(' ')).toLowerCase().includes(term.trim()));
          row.hidden=!matches;row.classList.toggle('writing-lead',!filtering&&row===rows[0]);
          if(matches){const marker=$('.writing-year',row);marker.textContent=lastYear===row.dataset.year?'':row.dataset.year;lastYear=row.dataset.year;count++;}
        });
        [all,...topicLinks].forEach(a=>{if((a.dataset.topic||'')===topic)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});
        status.textContent=filtering?count+' '+(count===1?'essay':'essays')+' found':rows.length+' essays';empty.hidden=count>0;
        if(!fromHistory)rows.filter(r=>!r.hidden).forEach(row=>{const old=oldRects.get(row),next=row.getBoundingClientRect();if(old&&Math.abs(old.top-next.top)>1)row.animate?.([{transform:`translateY(${old.top-next.top}px)`},{transform:'translateY(0)'}],{duration:260,easing:'cubic-bezier(.16,1,.3,1)'});});
      }
      function syncURL(push=false){const u=new URL(location.href);u.searchParams.delete('q');u.searchParams.delete('topic');if(input.value)u.searchParams.set('q',input.value);if(topic)u.searchParams.set('topic',topic);history[push?'pushState':'replaceState'](null,'',u);}
      function readURL(){const p=new URLSearchParams(location.search),q=p.get('q')||'';topic=p.get('topic')||(topics.includes(q)?q:'');input.value=topics.includes(q)&&!p.has('topic')?'':q;update(true);}
      [all,...topicLinks].forEach(a=>a.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();topic=a.dataset.topic||'';syncURL(true);update();}));
      input.addEventListener('input',()=>{syncURL();update();});reset.addEventListener('click',()=>{topic='';input.value='';syncURL();update();input.focus();});window.addEventListener('popstate',readURL);readURL();
    }
  }
  if(document.body.classList.contains('page')&&!isPaper&&!document.body.classList.contains('papers-homepage')){
    if(!$('h1,h2',main)){const titles={'/til':'Today I learned','/projects':'Projects','/books':'Books'};main.prepend(make('h1','',titles[path]||document.title.split(' | ')[0]));}
    if(!$$('p,li,figure,table',main).some(n=>!n.closest('form')&&text(n)))main.append(make('p','empty-page','Nothing published here yet.'));
  }
  // Each visible row draws its ledge while books land from left to right.
  if(isBookshelf && 'IntersectionObserver' in window){
    const shelfObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){
        const book=entry.target;
        const columns=getComputedStyle(book.parentElement).gridTemplateColumns.split(' ').length;
        const index=$$('.shelf-book',book.parentElement).indexOf(book);
        book.style.setProperty('--book-delay',(140+(index%columns)*140)+'ms');
        book.classList.add('shelf-arrived');
        shelfObserver.unobserve(book);
      }
    }),{threshold:0,rootMargin:'0px 0px -24px 0px'});
    $$('.shelf-book',main).forEach(book=>{book.classList.add('shelf-ready');shelfObserver.observe(book);});
  }
  // One mechanical arrival; the accessible title stays stable through every flip.
  function splitFlapWordmark(heading){
    if(!heading)return;
    heading.classList.add('split-flap');
    heading.setAttribute('aria-label','forward observations');
    heading.replaceChildren();
    const tiles=[],alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for(const word of ['forward','observations']){
      const row=make('span','flap-row');row.setAttribute('aria-hidden','true');
      for(const target of word){
        const tile=make('span','flap-tile');
        const parts=['top','bottom','front','back'].map(part=>{
          const half=make('span','flap-half flap-'+part);
          const glyph=make('span','flap-glyph',target);half.append(glyph);tile.append(half);
          return {half,glyph};
        });
        row.append(tile);tiles.push({target,parts,step:-1,sequence:Array.from({length:12},()=>alphabet[Math.floor(Math.random()*26)]).concat(target)});
      }
      heading.append(row);
    }
    const order=tiles.map((_,i)=>i);
    for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
    let frame,start;
    const finish=()=>{
      cancelAnimationFrame(frame);
      tiles.forEach(({target,parts})=>parts.forEach(({half,glyph},i)=>{glyph.textContent=target;half.style.transform='';if(i>1)half.hidden=true;}));
      document.removeEventListener('visibilitychange',onHidden);
      window.removeEventListener('pagehide',finish);
    };
    const onHidden=()=>{if(document.hidden)finish();};
    const tick=now=>{
      start??=now;let running=false;
      tiles.forEach((tile,i)=>{
        const elapsed=now-start-order[i]*35,step=Math.floor(Math.max(0,elapsed)/90);
        const {parts,sequence,target}=tile;
        if(step>=sequence.length){parts.forEach(({half,glyph},j)=>{glyph.textContent=target;if(j>1)half.hidden=true;});return;}
        running=true;
        const current=step?sequence[step-1]:' ',next=sequence[step];
        if(tile.step!==step){tile.step=step;parts.forEach(({glyph},j)=>glyph.textContent=(j===0||j===3)?next:current);}
        const progress=elapsed<0?0:(elapsed%90)/90;
        parts[2].half.style.transform=`rotateX(${-Math.min(1,progress*2)*90}deg)`;
        parts[3].half.style.transform=`rotateX(${Math.min(1,Math.max(0,1-(progress-.5)*2))*90}deg)`;
      });
      if(running)frame=requestAnimationFrame(tick);else finish();
    };
    if(document.hidden){finish();return;}
    document.addEventListener('visibilitychange',onHidden);
    window.addEventListener('pagehide',finish);
    frame=requestAnimationFrame(tick);
  }
  splitFlapWordmark($('.home-hero .masthead'));
  const footer=$('body>footer');if(footer){const directive=$('#footer-directive',footer);if(directive&&!text(directive))directive.remove();const credit=$('a[href="https://bearblog.dev"]',footer)?.parentElement;if(credit)credit.classList.add('bear-credit');const intro=make('span','','Independent writing & research');const links=make('div','footer-links');links.append(link('Subscribe ↗','/subscribe/'),link('RSS ↗','/feed/'));footer.prepend(intro,links);}
})();
