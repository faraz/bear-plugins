/* Motes 0.3.0, MIT — https://github.com/lucasmarkes/motes */
import { createMotes } from './motes.js';

const canvas = document.createElement('canvas');
canvas.className = 'motes-background';
canvas.setAttribute('aria-hidden', 'true');
canvas.setAttribute('data-motes-quiet', ''); // Deliberately low-contrast background.
document.body.prepend(canvas);
try {
  const field = createMotes(canvas, {
    effect: 'flow', speed: 0.18, density: 16, brightness: -0.12,
    ink: '#b6d4c0', accent: '#b6d4c0', background: '#111416',
    pointer: true, radius: 110, force: 0.18, trail: 0,
    charset: ' .:-+', respectMotionPreference: false,
  });
  const sync = () => document.hidden ? field.stop() : field.start();
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pageshow', sync);
  const dispose = () => {
    field.destroy();
    canvas.remove();
    document.removeEventListener('visibilitychange', sync);
    window.removeEventListener('pageshow', sync);
  };
  canvas.addEventListener('webglcontextlost', dispose, { once: true });
  window.addEventListener('pagehide', event => event.persisted ? field.stop() : dispose());
  sync();
} catch {
  canvas.remove(); // The graphite background remains when WebGL2 is unavailable.
}
