/* Motes 0.3.0, MIT — https://github.com/lucasmarkes/motes */
import { createMotes } from './motes.js';

const canvas = document.createElement('canvas');
canvas.className = 'motes-background';
canvas.setAttribute('aria-hidden', 'true');
canvas.setAttribute('data-motes-quiet', ''); // Deliberately low-contrast background.
document.body.prepend(canvas);
try {
  const field = createMotes(canvas, {
    effect: 'contour', speed: 0.30, density: 12, contrast: 1.15, brightness: -0.08,
    ink: '#b0b7b5', accent: '#9eb8c6', background: '#111416',
    pointer: true, radius: 90, force: 0.12, trail: 0,
    charset: ' .:-=+', respectMotionPreference: false,
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
