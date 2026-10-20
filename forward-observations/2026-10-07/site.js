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
  function thinkingGeometry(){
    let seed=27;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;},branches=[];
    const grow=(start,angle,length,depth,parent)=>{
      const end=[start[0]+Math.cos(angle)*length,start[1]+Math.sin(angle)*length,start[2]+(random()-.5)*length*1.5];
      const index=branches.length;branches.push({start,end,depth,parent,bend:(random()-.5)*8});
      if(depth<6)for(const sign of [-1,1])grow(end,angle+sign*(.32+random()*.4),length*(.67+random()*.12),depth+1,index);
    };
    grow([0,68,0],-Math.PI/2,38,0,-1);return branches;
  }
  function thinkingTiming(time,depth){
    const growth=Math.max(0,Math.min(1,(time-depth*.5)/.5));
    const wave=(time-3.5)%5,travel=(wave-depth*.28)/.28;
    return {growth,travel,active:time>=3.5&&travel>=0&&travel<=1,flash:time>=3.5?Math.max(0,1-Math.abs(wave-(depth+1)*.28)/.35):0};
  }
  function mountThinkingTree(art){
    art.removeAttribute('aria-hidden');
    const svg=$('svg',art),body=$('.thinking-body',svg),branches=thinkingGeometry(),ns='http://www.w3.org/2000/svg';
    const pieces=branches.map(branch=>{
      const g=document.createElementNS(ns,'g');
      for(const color of ['#514534','#b9a17b','#f0dfba']){const p=document.createElementNS(ns,'path');p.setAttribute('fill','none');p.setAttribute('stroke',color);p.setAttribute('stroke-linecap','round');p.setAttribute('pathLength','1');p.setAttribute('stroke-dasharray','1');g.append(p);}
      const pulse=document.createElementNS(ns,'g');pulse.setAttribute('class','thought-signal');
      for(const [radius,color,opacity] of [[4,'#f6dca5',.3],[1.8,'#fff6dc',1]]){const dot=document.createElementNS(ns,'circle');dot.setAttribute('r',radius);dot.setAttribute('fill',color);dot.setAttribute('opacity',opacity);pulse.append(dot);}
      g.append(pulse);
      if(branch.depth===6){const leaf=document.createElementNS(ns,'ellipse');leaf.setAttribute('fill','#e6d2a6');g.append(leaf);}
      body.append(g);return g;
    });
    let frame=0,visible=false,last=0,phase=0,pointer=null,pull=[0,0];
    const tick=now=>{
      frame=0;if(!visible||document.hidden)return;
      const dt=Math.min((now-(last||now))/1000,.04);last=now;phase+=dt;
      for(let k=0;k<2;k++)pull[k]+=((pointer?Math.max(-18,Math.min(18,(pointer[k]-[110,75][k])*.2)):0)-pull[k])*(1-Math.exp(-dt*7));
      const yaw=.35+Math.sin(phase*.23)*.42;
      const project=([x,y,z])=>{
        const xx=x*Math.cos(yaw)+z*Math.sin(yaw),zz=z*Math.cos(yaw)-x*Math.sin(yaw),scale=1.1*220/(220+zz);
        const flexibility=Math.max(0,(68-y)/130),wind=Math.sin(phase*.85+y*.025)*2.5*flexibility;
        return [110+xx*scale*1.2+pull[0]*flexibility+wind,88+y*scale+pull[1]*flexibility,zz,scale];
      };
      const rendered=branches.map((b,i)=>({b,i,a:project(b.start),z:project(b.end)}));
      rendered.sort((a,b)=>b.z[2]-a.z[2]);
      for(const {b,i,a,z} of rendered){
        const g=pieces[i],w=Math.max(.65,7.5*Math.pow(.66,b.depth))*z[3],timing=thinkingTiming(phase,b.depth);
        const d=`M${a[0]} ${a[1]} C${a[0]+b.bend} ${a[1]+(z[1]-a[1])*.4} ${z[0]-b.bend*.3} ${z[1]-(z[1]-a[1])*.22} ${z[0]} ${z[1]}`;
        [...g.children].slice(0,3).forEach((p,k)=>{p.setAttribute('d',d);p.setAttribute('stroke-dashoffset',1-timing.growth);p.setAttribute('stroke-width',w*[1,.7,.18][k]);p.setAttribute('transform',k===2?`translate(${-w*.15} ${-w*.1})`:'');});
        g.setAttribute('opacity',Math.max(.42,Math.min(1,.85-z[2]*.008)));
        const pulse=$('.thought-signal',g);pulse.setAttribute('opacity',timing.active?1:0);
        if(timing.active){
          const t=timing.travel,u=1-t,c1=[a[0]+b.bend,a[1]+(z[1]-a[1])*.4],c2=[z[0]-b.bend*.3,z[1]-(z[1]-a[1])*.22];
          const point=[0,1].map(k=>u*u*u*a[k]+3*u*u*t*c1[k]+3*u*t*t*c2[k]+t*t*t*z[k]);
          pulse.setAttribute('transform',`translate(${point[0]} ${point[1]})`);
        }
        if(b.depth===6){const leaf=g.lastChild;leaf.setAttribute('opacity',timing.growth);leaf.setAttribute('fill',timing.flash>.2?'#fff1c7':'#e6d2a6');leaf.setAttribute('cx',z[0]);leaf.setAttribute('cy',z[1]);leaf.setAttribute('rx',(3.5+timing.flash*1.8)*z[3]);leaf.setAttribute('ry',(1.7+timing.flash)*z[3]);leaf.setAttribute('transform',`rotate(${Math.atan2(z[1]-a[1],z[0]-a[0])*180/Math.PI} ${z[0]} ${z[1]})`);}
        body.append(g);
      }
      frame=requestAnimationFrame(tick);
    };
    const start=()=>{last=0;if(visible&&!document.hidden&&!frame)frame=requestAnimationFrame(tick);};
    svg.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const r=svg.getBoundingClientRect();pointer=[(e.clientX-r.left)*220/r.width,(e.clientY-r.top)*180/r.height];});
    svg.addEventListener('pointerleave',()=>{pointer=null;});
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else{cancelAnimationFrame(frame);frame=0;}},{threshold:0}).observe(svg);
    document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else start();});
    window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;});
  }
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
  function systemsAssembly(time,index){
    const progress=Math.max(0,Math.min(1,(time-index*.22)/.8));
    return {progress,remaining:Math.pow(1-progress,3),cables:Math.max(0,Math.min(1,(time-1.9)/.8))};
  }
  function mountTensegrity(art){
    art.removeAttribute('aria-hidden');
    const svg=$('svg',art),body=$('.tensegrity-body',svg),{points,bars,cables}=tensegrityGeometry();
    const ns='http://www.w3.org/2000/svg';
    const line=(a,b,bar)=>{
      const g=document.createElementNS(ns,'g'),edge=document.createElementNS(ns,'line');
      edge.setAttribute('stroke',bar?'#7daaba':'#9eb8c6');edge.setAttribute('stroke-width',bar?'8':'1');edge.setAttribute('stroke-linecap','round');g.append(edge);
      if(bar){
        g.replaceChildren();
        for(const color of ['#203b49','#426a7c','#8db8c9','#d4eaf1','#426a7c','#8db8c9']){
          const face=document.createElementNS(ns,'polygon');face.setAttribute('fill',color);face.setAttribute('stroke','#20323b');face.setAttribute('stroke-width','.5');g.append(face);
        }
      }
      body.append(g);return {a,b,bar,g};
    };
    const jointBars=points.map((_,i)=>bars.findIndex(pair=>pair.includes(i)));
    const members=[...cables.map(([a,b])=>line(a,b,false)),...bars.map(([a,b])=>line(a,b,true))];
    const joints=points.map(()=>{const c=document.createElementNS(ns,'circle');c.setAttribute('r','3.5');c.setAttribute('fill','#d9edf1');body.append(c);return c;});
    let frame=0,visible=false,last=0,phase=0,pointer=null,selected=-1,projected=[];
    const offset=points.map(()=>[0,0]);
    const tick=now=>{
      frame=0;if(!visible||document.hidden)return;
      const dt=Math.min((now-(last||now))/1000,.04);last=now;phase+=dt;
      const yaw=.65+Math.sin(phase*.25)*.45,tilt=.52+Math.sin(phase*.18)*.08;
      const project=([x,y,z])=>{
        const xx=x*Math.cos(yaw)+z*Math.sin(yaw),zz=z*Math.cos(yaw)-x*Math.sin(yaw);
        const yy=y*Math.cos(tilt)-zz*Math.sin(tilt),depth=y*Math.sin(tilt)+zz*Math.cos(tilt);
        const scale=40*4.8/(4.8+depth);
        return [110+xx*scale,90+yy*scale,depth];
      };
      const assembly=bars.map((_,i)=>systemsAssembly(phase,i));
      const assembled=points.map((point,i)=>{
        const bar=bars[jointBars[i]],center=point.map((_,k)=>(points[bar[0]][k]+points[bar[1]][k])/2),remaining=assembly[jointBars[i]].remaining;
        return point.map((v,k)=>v+remaining*(center[k]*.85+(k===2?1.3:0)));
      });
      projected=assembled.map(project);
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
        if(e.bar){
          const axis=points[e.a].findIndex((v,k)=>v!==points[e.b][k]),cross=[0,1,2].filter(k=>k!==axis);
          const corners=[e.a,e.b].map(i=>[[ -1,-1],[1,-1],[1,1],[-1,1]].map(sign=>{
            const v=assembled[i].slice();cross.forEach((k,j)=>v[k]+=sign[j]*.14);
            const p=project(v);return [p[0]+offset[i][0],p[1]+offset[i][1],p[2]];
          }));
          const normals=cross.flatMap(k=>[-1,1].map(sign=>{const n=[0,0,0];n[k]=sign;return n;}));
          const faces=[0,1,2,3].map(k=>({vertices:[corners[0][k],corners[1][k],corners[1][(k+1)%4],corners[0][(k+1)%4]],normal:normals[[2,1,3,0][k]]}));
          for(let end=0;end<2;end++){const normal=[0,0,0];normal[axis]=(points[e.b][axis]>points[e.a][axis]?1:-1)*(end?1:-1);faces.push({vertices:corners[end],normal});}
          faces.sort((a,b)=>b.vertices.reduce((n,p)=>n+p[2],0)-a.vertices.reduce((n,p)=>n+p[2],0));
          [...e.g.children].forEach((face,k)=>{
            const f=faces[k],[nx,ny,nz]=f.normal,rx=nx*Math.cos(yaw)+nz*Math.sin(yaw),rz=nz*Math.cos(yaw)-nx*Math.sin(yaw),ry=ny*Math.cos(tilt)-rz*Math.sin(tilt),depth=ny*Math.sin(tilt)+rz*Math.cos(tilt);
            const light=Math.max(0,-rx*.45-ry*.6-depth*.65),shade=Math.min(4,Math.floor(light*5));
            face.setAttribute('fill',['#213e4c','#355c70','#5b879b','#93bdcc','#d5eaf0'][shade]);
            face.setAttribute('points',f.vertices.map(p=>p.slice(0,2).join(',')).join(' '));
          });
        }else{
          const l=e.g.firstChild;l.setAttribute('x1',a[0]);l.setAttribute('y1',a[1]);l.setAttribute('x2',b[0]);l.setAttribute('y2',b[1]);
        }
        const depth=(a[2]+b[2])/2;
        const build=assembly[jointBars[e.a]];
        if(!e.bar){e.g.firstChild.setAttribute('pathLength','1');e.g.firstChild.setAttribute('stroke-dasharray','1');e.g.firstChild.setAttribute('stroke-dashoffset',1-build.cables);}
        e.g.setAttribute('opacity',e.bar?build.progress*Math.max(.55,Math.min(1,1-depth*.16)):build.cables*((selected===e.a||selected===e.b)?.9:Math.max(.16,.48-depth*.15)));body.append(e.g);
      });
      joints.forEach((c,i)=>{c.setAttribute('cx',drawn[i][0]);c.setAttribute('cy',drawn[i][1]);c.setAttribute('r',3.5*4.8/(4.8+drawn[i][2]));c.setAttribute('opacity',assembly[jointBars[i]].progress*Math.max(.3, .9-drawn[i][2]*.22));body.append(c);});
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
      art.innerHTML=["<svg class=\"section-signature thinking-tree\" viewBox=\"0 0 220 180\" role=\"img\" aria-label=\"Growing three-dimensional tree with branching neural signals. Move the pointer to bend its connected branches.\"><defs><pattern id=\"thinking-pixels\" width=\"2.5\" height=\"2.5\" patternUnits=\"userSpaceOnUse\"><rect width=\"1.8\" height=\"1.8\" fill=\"white\"/><rect x=\"1.9\" y=\"1.9\" width=\".6\" height=\".6\" fill=\"white\"/></pattern><mask id=\"thinking-screen\" maskUnits=\"userSpaceOnUse\" x=\"-10\" y=\"-10\" width=\"240\" height=\"210\"><rect x=\"-10\" y=\"-10\" width=\"240\" height=\"210\" fill=\"url(#thinking-pixels)\"/></mask></defs><g class=\"dither-art\" mask=\"url(#thinking-screen)\" aria-hidden=\"true\"><g class=\"thinking-body\"></g></g></svg>", "<svg class=\"section-signature tensegrity\" viewBox=\"0 0 220 180\" role=\"img\" aria-label=\"Tensegrity sculpture: six blue struts suspended in tension cables. Move the pointer to gently deform the connected structure.\"><defs><pattern id=\"systems-pixels\" width=\"2.5\" height=\"2.5\" patternUnits=\"userSpaceOnUse\"><rect width=\"1.8\" height=\"1.8\" fill=\"white\"/><rect x=\"1.9\" y=\"1.9\" width=\".6\" height=\".6\" fill=\"white\"/></pattern><mask id=\"systems-screen\" maskUnits=\"userSpaceOnUse\" x=\"-10\" y=\"-10\" width=\"240\" height=\"210\"><rect x=\"-10\" y=\"-10\" width=\"240\" height=\"210\" fill=\"url(#systems-pixels)\"/></mask></defs><g class=\"dither-art\" mask=\"url(#systems-screen)\" aria-hidden=\"true\"><g class=\"tensegrity-body\"></g></g></svg>"][i];
      if(i)mountTensegrity(art);else mountThinkingTree(art);
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
