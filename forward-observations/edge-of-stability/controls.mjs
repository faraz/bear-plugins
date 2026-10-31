export async function setupControls({runs, frameAt, period, landings, describe, stepOf}) {
await customElements.whenDefined('hyperframes-player');
const player = document.getElementById('player');
const lastStep = landings.length - 1;
const play = document.getElementById('play');
const scrub = document.getElementById('scrub');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let chapter = 0, lastState = '';
const note = text => document.getElementById('motion-note').textContent = text;
function sync() {
  const f = frameAt(player.currentTime, runs);
  const stateText = describe(f);
  const local = Math.max(0, player.currentTime - chapter * period);
  scrub.max = reduced.matches ? lastStep : period - 0.01;
  scrub.step = reduced.matches ? 1 : 0.01;
  scrub.value = reduced.matches ? stepOf(f) : local;
  scrub.setAttribute('aria-valuetext', stateText);
  document.getElementById('time').textContent = reduced.matches ? `State ${stepOf(f)} / ${lastStep}` : `${local.toFixed(1)} / ${period} s`;
  const key = `${f.chapter}:${stepOf(f)}`;
  if (key !== lastState) {
    document.getElementById('state').textContent = stateText;
    lastState = key;
  }
  play.textContent = player.paused ? 'Play' : 'Pause';
  play.setAttribute('aria-label', player.paused ? 'Play animation' : 'Pause animation');
  document.getElementById('previous').disabled = stepOf(f) === 0;
  document.getElementById('next').disabled = stepOf(f) === lastStep;
}
function seek(time) { player.pause(); player.seek(time); sync(); }
function select(index) {
  chapter = index;
  player.pause();
  player.rangeStart = index * period;
  player.rangeEnd = (index + 1) * period;
  player.seek(index * period);
  document.querySelectorAll('[data-case]').forEach(button => button.setAttribute('aria-pressed', Number(button.dataset.case) === index));
  sync();
}
function setMotionPreference() {
  player.pause();
  play.disabled = reduced.matches;
  if (reduced.matches) {
    const f = frameAt(player.currentTime, runs);
    seek(chapter * period + landings[stepOf(f)]);
  }
  note(reduced.matches ? 'Reduced motion: use Back, Step, Replay, or the slider to select a stage.' : 'Play the explanation, or use Step to inspect each stage.');
  sync();
}
function ready() {
  document.getElementById('stage').classList.add('ready');
  document.getElementById('controls').hidden = false;
  document.getElementById('playback').hidden = false;
  select(0); setMotionPreference();
}
player.addEventListener('ready', ready, { once: true });
if (player.ready) ready();
player.addEventListener('timeupdate', sync);
for (const event of ['play','pause','ended']) player.addEventListener(event, sync);
player.addEventListener('error', () => {
  document.getElementById('stage').classList.remove('ready');
  document.getElementById('controls').hidden = true;
  document.getElementById('playback').hidden = true;
});
document.querySelectorAll('[data-case]').forEach(button => button.addEventListener('click', () => select(Number(button.dataset.case))));
play.addEventListener('click', () => {
  if (!player.paused) player.pause();
  else { if (player.currentTime >= chapter * period + period - 0.1) player.seek(chapter * period); player.play(); }
  sync();
});
for (const [id, delta] of [['previous', -1], ['next', 1]]) document.getElementById(id).addEventListener('click', () => {
  const f = frameAt(player.currentTime, runs);
  seek(chapter * period + landings[Math.max(0, Math.min(lastStep, stepOf(f) + delta))]);
});
document.getElementById('replay').addEventListener('click', () => seek(chapter * period));
scrub.addEventListener('input', () => {
  const time = Number(scrub.value);
  const local = reduced.matches ? landings[time] : time;
  seek(chapter * period + local);
});
reduced.addEventListener('change', setMotionPreference);
new IntersectionObserver(entries => { if (!entries[0].isIntersecting) { player.pause(); sync(); } }, { threshold: 0 }).observe(document.getElementById('stage'));
document.addEventListener('visibilitychange', () => { if (document.hidden) { player.pause(); sync(); } });

const reportHeight = () => parent.postMessage({type:'figure-height',height:Math.ceil(document.body.getBoundingClientRect().height)},window.origin);
new ResizeObserver(reportHeight).observe(document.body);
reportHeight();
}
