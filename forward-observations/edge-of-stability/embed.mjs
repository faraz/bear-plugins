const base = new URL('.', import.meta.url);
let bundle;
const frames = new Map();
addEventListener('message', event => {
  if (event.origin !== window.origin || event.data?.type !== 'figure-height' || !Number.isFinite(event.data.height)) return;
  const entry = frames.get(event.source);
  if (!entry || event.data.height < 100) return;
  entry.frame.style.cssText = `display:block;border:0;width:100%;height:${Math.max(350,Math.min(2200,event.data.height))}px`;
  entry.host.querySelector('.eos-static').hidden = true;
});
async function mount(host) {
  try {
    bundle ||= fetch(new URL('figures.json',base)).then(response => {
      if (!response.ok) throw new Error(`Figure assets: ${response.status}`);
      return response.json();
    });
    const documents = await bundle;
    const html = documents[host.dataset.eosFigure];
    if (typeof html !== 'string') throw new Error('Unknown figure');
    const frame = document.createElement('iframe');
    frame.title = host.dataset.title;
    frame.setAttribute('sandbox','allow-scripts allow-same-origin');
    frame.style.cssText = 'position:absolute;display:block;border:0;width:100%;height:1200px;opacity:0;pointer-events:none';
    frame.srcdoc = html.replaceAll('__EOS_ASSET_BASE__',base.href);
    host.prepend(frame);
    frames.set(frame.contentWindow,{frame,host});
  } catch (error) {
    console.error('Interactive figure unavailable; static diagram retained.',error);
  }
}
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) if (entry.isIntersecting) {
    observer.unobserve(entry.target);
    mount(entry.target);
  }
},{rootMargin:'600px'});
document.querySelectorAll('[data-eos-figure]').forEach(host => observer.observe(host));
