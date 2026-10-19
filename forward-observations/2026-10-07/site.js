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
      // Abstract lenses and planes: section signatures, not scientific figures.
      art.innerHTML=`<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1" focusable="false">${i
        ? '<path class="diagram-guide" d="M60 8v104M12 60h96"/><g class="system-plane plane-back"><path d="m60 18 42 22-42 22-42-22Z"/></g><g class="system-plane plane-mid"><path d="m60 38 42 22-42 22-42-22Z"/></g><g class="system-plane plane-front"><path d="m60 58 42 22-42 22-42-22Z"/></g><path class="system-signal" pathLength="100" d="M60 18v84"/><circle class="diagram-point" cx="60" cy="60" r="3"/>'
        : '<path class="diagram-guide" d="M8 60h104M60 8v104"/><g class="thinking-lenses"><ellipse cx="60" cy="60" rx="23" ry="43"/><ellipse cx="60" cy="60" rx="23" ry="43" transform="rotate(60 60 60)"/><ellipse cx="60" cy="60" rx="23" ry="43" transform="rotate(120 60 60)"/></g><circle class="diagram-point" cx="60" cy="60" r="3"/>'}</svg>`;
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
  // One bounded decode; preserve the original line break and accessible name.
  function decodeWordmark(heading){
    if(!heading||document.hidden)return;
    const visual=make('span');visual.setAttribute('aria-hidden','true');
    heading.setAttribute('aria-label','forward observations');
    visual.append(...heading.childNodes);heading.append(visual);
    const nodes=[...visual.childNodes].filter(n=>n.nodeType===3);
    const originals=nodes.map(n=>n.data);
    const length=originals.join('').length,alphabet='abcdefghijklmnopqrstuvwxyz0123456789/+=_';
    let frame,start,last=-1;
    const finish=()=>{
      cancelAnimationFrame(frame);
      nodes.forEach((n,i)=>n.data=originals[i]);
      document.removeEventListener('visibilitychange',onHidden);
      window.removeEventListener('pagehide',finish);
    };
    const onHidden=()=>{if(document.hidden)finish();};
    const tick=now=>{
      start??=now;
      const elapsed=now-start;
      if(elapsed>=750){finish();return;}
      const step=Math.floor(elapsed/50);
      if(step!==last){
        last=step;let index=0;
        const resolved=Math.floor(length*Math.min(1,elapsed/700));
        nodes.forEach((n,i)=>n.data=[...originals[i]].map(char=>{
          const position=index++;
          return /\s/.test(char)||position<resolved?char:alphabet[(position*17+step*7)%alphabet.length];
        }).join(''));
      }
      frame=requestAnimationFrame(tick);
    };
    document.addEventListener('visibilitychange',onHidden);
    window.addEventListener('pagehide',finish);
    frame=requestAnimationFrame(tick);
  }
  decodeWordmark($('.masthead')||$('body>header .title h1'));
  const footer=$('body>footer');if(footer){const directive=$('#footer-directive',footer);if(directive&&!text(directive))directive.remove();const credit=$('a[href="https://bearblog.dev"]',footer)?.parentElement;if(credit)credit.classList.add('bear-credit');const intro=make('span','','Independent writing & research');const links=make('div','footer-links');links.append(link('Subscribe ↗','/subscribe/'),link('RSS ↗','/feed/'));footer.prepend(intro,links);}
})();
