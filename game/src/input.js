// Keyboard and pointer input for the taqueria.
// Clicks are reported as normalised device coordinates (-1..1) so the 3D
// renderer can raycast bins and stations. Keys: 1-9, 0, Q, E, R, A, S, D, F
// ingredients (17 bins), C chop, W panci, G comal, P plate, T trash,
// Space confirm, Esc pause, M mute.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;

const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['Escape']);
const MUTE = new Set(['KeyM']);

export function createInput(canvas) {
  let actions = 0;
  let clicks = [];
  let keys = new Set();

  window.addEventListener('keydown', (event) => {
    if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (MUTE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else if (/^Digit[0-9]$/.test(event.code) || /^Key[CFWGPTQERASDX]$/.test(event.code)) {
      keys.add(event.code);
    } else {
      return;
    }
    event.preventDefault();
  });

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    clicks.push({
      x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
      y: -(((event.clientY - rect.top) / rect.height) * 2 - 1),
    });
  });

  return {
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    takeClicks() {
      const taken = clicks;
      clicks = [];
      return taken;
    },
    takeKeys() {
      const taken = keys;
      keys = new Set();
      return taken;
    },
  };
}
