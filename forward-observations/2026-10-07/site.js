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
    return {growth:Math.max(0,Math.min(1,(time-depth*.5)/.5))};
  }
  function thinkingSignalFrame(time,branches,state,random=Math.random){
    if(time>=state.next){
      const tips=branches.map((b,i)=>({b,i})).filter(({b,i})=>b.depth===6&&i!==state.lastLeaf);
      const leaf=tips[Math.floor(random()*tips.length)].i,path=[];
      for(let i=leaf;i>=0;i=branches[i].parent)path.unshift(i);
      state.pulses.push({path,start:time,duration:.2+random()*.16});state.lastLeaf=leaf;
      state.next=time+.55+random()*1.05;
    }
    state.pulses=state.pulses.filter(p=>time-p.start<p.path.length*p.duration+.4);
    const signals=new Map();
    for(const p of state.pulses){
      const age=time-p.start,step=Math.floor(age/p.duration),travel=age/p.duration-step;
      if(step>=0&&step<p.path.length)signals.set(p.path[step],{active:true,travel,flash:0});
      const flash=Math.max(0,1-(age-p.path.length*p.duration)/.4);
      if(age>=p.path.length*p.duration){const leaf=p.path.at(-1),existing=signals.get(leaf);signals.set(leaf,{active:existing?.active||false,travel:existing?.travel||0,flash:Math.max(existing?.flash||0,flash)});}
    }
    return signals;
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
    const signalState={next:3.5,pulses:[],lastLeaf:-1};
    const tick=now=>{
      frame=0;if(!visible||document.hidden)return;
      const dt=Math.min((now-(last||now))/1000,.04);last=now;phase+=dt;
      for(let k=0;k<2;k++)pull[k]+=((pointer?Math.max(-18,Math.min(18,(pointer[k]-[110,75][k])*.2)):0)-pull[k])*(1-Math.exp(-dt*7));
      const signals=thinkingSignalFrame(phase,branches,signalState);
      const yaw=.35+Math.sin(phase*.23)*.42;
      const project=([x,y,z])=>{
        const xx=x*Math.cos(yaw)+z*Math.sin(yaw),zz=z*Math.cos(yaw)-x*Math.sin(yaw),scale=1.1*220/(220+zz);
        const flexibility=Math.max(0,(68-y)/130),wind=Math.sin(phase*.85+y*.025)*2.5*flexibility;
        return [110+xx*scale*1.2+pull[0]*flexibility+wind,88+y*scale+pull[1]*flexibility,zz,scale];
      };
      const rendered=branches.map((b,i)=>({b,i,a:project(b.start),z:project(b.end)}));
      rendered.sort((a,b)=>b.z[2]-a.z[2]);
      for(const {b,i,a,z} of rendered){
        const g=pieces[i],w=Math.max(.65,7.5*Math.pow(.66,b.depth))*z[3],timing={...thinkingTiming(phase,b.depth),active:false,flash:0,...signals.get(i)};
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
      const more=link(i?'All research':'All Writing',i?'/research/':'/blog/');more.className='stream-more';
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
  // Shelf library model.
  function shelfCapacity(width){return width>=1100?16:width>=700?12:8;}
  function shelfPageFor(index,capacity){return Math.max(0,Math.floor(index/capacity));}
  function shelfDelay(index){return Math.min(455,index*65);}
  function matchShelfBooks(books,query){
    const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const q=normalize(query.trim());return books.filter(b=>normalize(b.title+' '+b.author).includes(q));
  }
  function shelfURL(value){try{if(!value)return null;const u=new URL(value,location.href);return /^https?:$/.test(u.protocol)?u.href:null;}catch{return null;}}
  function readShelfLocation(url,books){
    const book=books.find(b=>b.id===url.searchParams.get('book'));
    const collection=url.searchParams.get('shelf');
    return {collection:book?.collection||(books.some(b=>b.collection===collection)?collection:null),bookId:book?.id||null};
  }
  function stepShelfSpring(position,velocity,target,dt){
    const omega=22,offset=position-target,carry=velocity+omega*offset,e=Math.exp(-omega*Math.max(0,dt));
    return {position:target+(offset+carry*dt)*e,velocity:(velocity-omega*carry*dt)*e};
  }
  function readShelfBooks(root){
    const ids=new Set(),hex=v=>/^#[\da-f]{6}$/i.test(v||'')?v:null;
    return $$('.shelf-book',root).map((sourceElement,index)=>{
      const heading=$('h2',sourceElement),note=$('.book-note',sourceElement);
      const title=text(heading),author=text($('.book-author',sourceElement));
      const base=sourceElement.dataset.bookId||heading?.id?.replace(/-title$/,'')||title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'book';
      let id=base,n=2;while(ids.has(id))id=base+'-'+n++;ids.add(id);
      const section=sourceElement.closest('.shelf-year');
      const href=shelfURL($('.shelf-book-link',sourceElement)?.getAttribute('href'));
      return {id,title,author,collection:section?.classList.contains('shelf-current')?'current':section?.dataset.readYear||'undated',href,
        coverURL:shelfURL($('img',sourceElement)?.getAttribute('src')),notesURL:note&&$('a',note)?shelfURL($('a',note).getAttribute('href')):null,
        noteText:note&&!$('a',note)&&!/^Currently reading\.?$/i.test(text(note))?text(note):null,
        actionLabel:/PDF/i.test(text($('.book-link-label',sourceElement)))?'Read PDF':'View book',
        accent:hex(sourceElement.dataset.bookAccent)||'#c5c8b3',spine:hex(sourceElement.dataset.bookSpine)||'#39433f',sourceElement,index};
    });
  }
  function initBookshelf(root){
    if(!window.HTMLDialogElement)return;
    const books=readShelfBooks(root),byId=new Map(books.map(b=>[b.id,b]));
    const collections=[...new Set(books.map(b=>b.collection))].sort((a,b)=>a==='current'?-1:b==='current'?1:b.localeCompare(a));
    const label=id=>id==='current'?'Currently reading':id==='undated'?'Reading archive':id;
    const savedPages=new Map(),seen=new Set(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
    let collection=collections.find(c=>/^\d{4}$/.test(c))||collections[0]||'current',capacity=shelfCapacity(innerWidth),page=0,results=[],query='',announceTimer,scrollFrame,resizeFrame;
    let selected=null,trigger=null,sourceVisual=null,flight=null,flightFrom=null,flightTo=null,progress=0,velocity=0,target=1,frame=0,last=0,returnFocus=null,scrollYBefore=0,oldOverflow='',historyPending=false;
    const token='shelf-'+Math.random().toString(36).slice(2);
    const ui=make('div','library'),toolbar=make('div','library-toolbar'),choices=make('div','library-collections');choices.setAttribute('role','group');choices.setAttribute('aria-label','Book collections');
    const searchLabel=make('label','library-search'),search=make('input');search.type='search';search.placeholder='Find a book';search.setAttribute('aria-label','Find a book by title or author');searchLabel.append(search);
    const track=make('div','library-track');track.id='library-track';track.setAttribute('aria-label','Books');
    const empty=make('div','library-empty'),clear=make('button','','Clear search');clear.type='button';
    const pagination=make('div','library-pagination'),prev=make('button','','← Previous'),next=make('button','','Next →'),range=make('span','library-range');
    [prev,next].forEach(b=>{b.type='button';b.setAttribute('aria-controls',track.id);});
    const status=make('span','library-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    pagination.append(prev,range,next);toolbar.append(choices,searchLabel);ui.append(toolbar,track,empty,pagination,status);
    const dialog=make('dialog','library-dialog');dialog.setAttribute('aria-labelledby','library-book-title');
    const panel=make('div','library-detail'),close=make('button','library-close','Close ×');close.type='button';close.setAttribute('aria-label','Close book details');
    const coverStage=make('div','library-detail-art'),copy=make('div','library-detail-copy'),meta=make('p','library-detail-meta'),title=make('h2');title.id='library-book-title';
    const author=make('p','library-detail-author'),note=make('p','library-detail-note'),actions=make('div','library-actions');coverStage.setAttribute('aria-hidden','true');copy.append(meta,title,author,note,actions);panel.append(close,coverStage,copy);dialog.append(panel);
    function external(textValue,url){const a=link(textValue+' ↗',url);a.target='_blank';a.rel='noopener noreferrer';return a;}
    function visual(book,face=false){
      const v=make('span','library-volume'+(face?' is-face':''));v.style.setProperty('--book-ink',book.spine);v.style.setProperty('--book-accent',book.accent);if(book.coverRatio)v.style.setProperty('--cover-ratio',book.coverRatio);
      const front=make('span','library-front'),fallback=make('span','library-cover-type');fallback.append(make('span','',book.title),make('small','',book.author));front.append(fallback);
      if(book.coverURL){const img=make('img');img.alt='';img.decoding='async';img.addEventListener('load',()=>{const changed=Math.abs((parseFloat(v.style.getPropertyValue('--cover-ratio'))||.7)-img.naturalWidth/img.naturalHeight)>.001;book.coverRatio=img.naturalWidth/img.naturalHeight;v.style.setProperty('--cover-ratio',book.coverRatio);if(changed&&frame&&coverStage.contains(v))finishShelfMotion();},{once:true});img.src=book.coverURL;img.addEventListener('error',()=>img.remove(),{once:true});front.append(img);}
      const spine=make('span','library-spine');spine.append(make('span','',book.title),make('small','',book.author));v.append(front,spine);return v;
    }
    function currentPage(){return Math.max(0,Math.min(Math.ceil(results.length/capacity)-1,Math.round(track.scrollLeft/Math.max(1,track.clientWidth))));}
    function syncPage(){
      page=currentPage();if(!query)savedPages.set(collection,page);
      [...track.children].forEach((group,i)=>{const inactive=i!==page;if(inactive&&group.contains(document.activeElement))next.focus({preventScroll:true});group.inert=inactive;group.setAttribute('aria-hidden',String(inactive));if(!inactive){$$('.library-book',group).forEach((a,index)=>{if(!seen.has(a.dataset.book)){seen.add(a.dataset.book);const arrival=$('.library-arrival',a);if(!reduced.matches){arrival.style.setProperty('--arrival-delay',shelfDelay(index)+'ms');arrival.classList.add('is-arriving');}}});}});
      range.textContent=results.length?`${page*capacity+1}–${Math.min(results.length,(page+1)*capacity)} of ${results.length}`:'0 books';
      prev.disabled=page===0;next.disabled=(page+1)*capacity>=results.length;pagination.hidden=results.length<=capacity;
    }
    function goPage(n){
      n=Math.max(0,Math.min(Math.ceil(results.length/capacity)-1,n));
      if(track.children[n]){track.children[n].inert=false;track.children[n].removeAttribute('aria-hidden');}
      track.scrollTo({left:n*track.clientWidth,behavior:reduced.matches?'instant':'smooth'});
    }
    function render(){
      results=query?matchShelfBooks(books,query):books.filter(b=>b.collection===collection);
      page=Math.min(query?page:(savedPages.get(collection)||0),Math.max(0,Math.ceil(results.length/capacity)-1));
      track.replaceChildren();choices.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(!query&&b.dataset.collection===collection)));
      const perRow=capacity/2,rows=Math.min(2,Math.ceil(Math.min(capacity,results.length)/perRow));track.style.setProperty('--library-rows',rows||1);track.style.setProperty('--library-columns',perRow);
      for(let offset=0;offset<results.length;offset+=capacity){
        const group=make('div','library-page');group.setAttribute('role','group');group.setAttribute('aria-label',`Books ${offset+1} to ${Math.min(results.length,offset+capacity)}`);
        for(let r=0;r<rows;r++){
          const subset=results.slice(offset+r*perRow,Math.min(offset+(r+1)*perRow,offset+capacity));
          if(!subset.length)continue;
          const row=make('div','library-row'),slots=make('div','library-slots'),caption=make('p','library-caption');
          if(subset[0])caption.textContent=subset[0].title;
          subset.forEach((book,i)=>{
            const a=external('',book.href||'#');a.replaceChildren();a.className='library-book';a.dataset.book=book.id;a.setAttribute('aria-label',`${book.title}${book.author?', '+book.author:''}. Open book details`);a.setAttribute('aria-haspopup','dialog');
            const arrival=make('span','library-arrival'),v=visual(book,i===0);v.setAttribute('aria-hidden','true');arrival.append(v);a.append(arrival);

            a.addEventListener('pointerenter',()=>caption.textContent=book.title);a.addEventListener('focus',()=>{caption.textContent=book.title;arrival.classList.remove('is-arriving');});
            a.addEventListener('click',e=>{if(e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();openShelfBook(book.id,'user',a);});slots.append(a);
          });
          row.append(slots,make('span','library-ledge'),caption);group.append(row);
        }track.append(group);
      }
      empty.replaceChildren();empty.hidden=results.length>0;
      if(!results.length){empty.append(make('p','',query?`No books match “${query}”`:'Your reading archive is waiting.'));if(query)empty.append(clear);}
      track.hidden=!results.length;track.scrollLeft=page*track.clientWidth;syncPage();
    }
    collections.forEach(id=>{const b=make('button','',label(id));b.type='button';b.dataset.collection=id;b.append(make('span','library-count',String(books.filter(book=>book.collection===id).length)));b.addEventListener('click',()=>{collection=id;query='';search.value='';page=savedPages.get(id)||0;render();const u=new URL(location.href);u.searchParams.set('shelf',id);u.searchParams.delete('book');history.replaceState({...history.state},'',u);});choices.append(b);});
    prev.addEventListener('click',()=>goPage(page-1));next.addEventListener('click',()=>goPage(page+1));
    track.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;syncPage();});},{passive:true});
    function searchChanged(){query=search.value.trim();page=0;render();clearTimeout(announceTimer);announceTimer=setTimeout(()=>status.textContent=`${results.length} books found`,200);}
    search.addEventListener('input',searchChanged);clear.addEventListener('click',()=>{search.value='';searchChanged();search.focus();});
    function sourceFor(id){return [...track.querySelectorAll('.library-book')].find(a=>a.dataset.book===id);}
    function cleanupFlight(){cancelAnimationFrame(frame);frame=0;last=0;flight?.remove();flight=null;if(sourceVisual)sourceVisual.style.visibility='';sourceVisual=null;coverStage.style.visibility='';}
    function finishShelfMotion(){
      cleanupFlight();dialog.classList.remove('is-transitioning');
      if(target===0&&dialog.open){dialog.close();document.documentElement.style.overflow=oldOverflow;window.scrollTo({top:scrollYBefore,behavior:'instant'});const f=returnFocus?.isConnected&&!returnFocus.closest('[inert]')?returnFocus:choices.querySelector('button');f?.focus({preventScroll:true});selected=null;}
    }
    function animateShelfBook(direction){
      target=direction==='detail'?1:0;
      dialog.classList.toggle('is-presented',target===1);
      if(reduced.matches||!sourceFor(selected?.id)){finishShelfMotion();return;}
      if(!flight){
        trigger=sourceFor(selected.id);sourceVisual=trigger.querySelector('.library-volume');flightFrom=sourceVisual.getBoundingClientRect();
        const dest=coverStage.firstElementChild;flightTo=dest.getBoundingClientRect();
        if(flightFrom.bottom<0||flightFrom.top>innerHeight){finishShelfMotion();return;}
        flight=visual(selected,true);flight.classList.add('library-flight');flight.setAttribute('aria-hidden','true');dialog.append(flight);
        flight.style.width=flightTo.width+'px';flight.style.height=flightTo.height+'px';sourceVisual.style.visibility='hidden';coverStage.style.visibility='hidden';progress=target?0:1;velocity=0;
      }
      dialog.classList.add('is-transitioning');cancelAnimationFrame(frame);last=0;
      const tick=now=>{
        const dt=last?Math.min(.1,(now-last)/1000):1/60;last=now;const state=stepShelfSpring(progress,velocity,target,dt);progress=state.position;velocity=state.velocity;
        const p=progress,x=flightFrom.left+(flightTo.left-flightFrom.left)*p,y=flightFrom.top+(flightTo.top-flightFrom.top)*p;
        const sx=flightFrom.width/flightTo.width+(1-flightFrom.width/flightTo.width)*p,sy=flightFrom.height/flightTo.height+(1-flightFrom.height/flightTo.height)*p;
        flight.style.transform=`translate(${x}px,${y}px) scale(${sx},${sy}) rotateY(${-12*p}deg)`;
        if(Math.abs(progress-target)<.001&&Math.abs(velocity)<.01){finishShelfMotion();return;}frame=requestAnimationFrame(tick);
      };frame=requestAnimationFrame(tick);
    }
    function openShelfBook(id,origin,originElement){
      const book=byId.get(id);if(!book)return;
      if(dialog.open&&selected?.id===id){animateShelfBook('detail');return;}
      cleanupFlight();selected=book;returnFocus=originElement||sourceFor(id);meta.textContent=book.collection==='current'?'Currently reading':`Read in ${book.collection}`;title.textContent=book.title;author.textContent=book.author;note.textContent=book.noteText||'';note.hidden=!book.noteText;
      actions.replaceChildren();if(book.notesURL)actions.append(external('Read notes',book.notesURL));if(book.href)actions.append(external(book.actionLabel,book.href));
      dialog.style.setProperty('--detail-accent',book.accent);coverStage.replaceChildren(visual(book,true));
      if(!dialog.open){scrollYBefore=window.scrollY;oldOverflow=document.documentElement.style.overflow;dialog.showModal();document.documentElement.style.overflow='hidden';}
      close.focus({preventScroll:true});
      if(origin==='user'){const u=new URL(location.href);u.searchParams.set('book',id);u.searchParams.set('shelf',book.collection);history.pushState({...history.state,shelfLibrary:token},'',u);}
      animateShelfBook('detail');
    }
    function closeShelfBook(origin){
      if(!dialog.open)return;
      if(origin==='user'){
        if(history.state?.shelfLibrary===token){if(!historyPending){historyPending=true;history.back();}return;}
        const u=new URL(location.href);u.searchParams.delete('book');history.replaceState({...history.state,shelfLibrary:null},'',u);
      }animateShelfBook('shelf');
    }
    dialog.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const items=$$('button,a[href]',panel),first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
    close.addEventListener('click',()=>closeShelfBook('user'));dialog.addEventListener('cancel',e=>{e.preventDefault();closeShelfBook('user');});
    let scrimDown=false;dialog.addEventListener('pointerdown',e=>scrimDown=e.target===dialog);dialog.addEventListener('click',e=>{if(scrimDown&&e.target===dialog)closeShelfBook('user');scrimDown=false;});
    function fromLocation(){
      historyPending=false;const state=readShelfLocation(new URL(location.href),books);
      if(state.bookId){const book=byId.get(state.bookId);query='';search.value='';collection=book.collection;const index=books.filter(b=>b.collection===collection).indexOf(book);savedPages.set(collection,shelfPageFor(index,capacity));render();openShelfBook(book.id,'history');}
      else {if(dialog.open)closeShelfBook('history');if(state.collection&&state.collection!==collection){collection=state.collection;render();}if(new URL(location.href).searchParams.has('book')){const u=new URL(location.href);u.searchParams.delete('book');history.replaceState(history.state,'',u);}}
    }
    window.addEventListener('popstate',fromLocation);
    window.addEventListener('resize',()=>{if(!resizeFrame)resizeFrame=requestAnimationFrame(()=>{resizeFrame=0;if(frame)finishShelfMotion();const c=shelfCapacity(innerWidth),first=page*capacity;capacity=c;if(query)page=shelfPageFor(first,c);else savedPages.set(collection,shelfPageFor(first,c));render();});});
    reduced.addEventListener('change',()=>{if(frame)finishShelfMotion();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&frame)finishShelfMotion();});
    root.append(ui);document.body.append(dialog);render();ui.classList.add('is-initial');setTimeout(()=>ui.classList.remove('is-initial'),600);root.classList.add('bookshelf-enhanced');$$(':scope > .shelf-year',root).forEach(s=>s.hidden=true);fromLocation();
  }
  if(isBookshelf){try{initBookshelf($('.bookshelf',main));}catch(error){console.error('Bookshelf enhancement unavailable',error);$('.library',main)?.remove();$('.library-dialog')?.remove();$('.bookshelf',main)?.classList.remove('bookshelf-enhanced');$$('.shelf-year',main).forEach(s=>s.hidden=false);}}
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
