// The Velvet Vault — keyboard and mouse, read once a frame.
// Keys are tracked by their physical code so WASD and arrows both work.
// A click is stored as a canvas point and consumed by the world on the
// next step, which is how the thief throws a coin.

export function createInput(canvas) {
  const keys = new Set();
  let click = null;
  let clickArmed = true;

  const KEYMAP = {
    KeyW: 'up',
    ArrowUp: 'up',
    KeyS: 'down',
    ArrowDown: 'down',
    KeyA: 'left',
    ArrowLeft: 'left',
    KeyD: 'right',
    ArrowRight: 'right',
    ShiftLeft: 'sneak',
    ShiftRight: 'sneak',
    Space: 'dash',
    KeyE: 'grab',
    Enter: 'enter',
    KeyR: 'retry',
    KeyM: 'mute',
  };

  function onKeyDown(event) {
    const name = KEYMAP[event.code];
    if (name) {
      keys.add(name);
      if (name === 'dash' || name === 'enter' || name === 'retry') event.preventDefault();
    }
  }

  function onKeyUp(event) {
    const name = KEYMAP[event.code];
    if (name) keys.delete(name);
  }

  function toCanvas(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function onMouseDown(event) {
    if (!clickArmed) return;
    clickArmed = false;
    click = toCanvas(event);
  }

  function onMouseUp() {
    clickArmed = true;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);

  return {
    /** The movement vector and action flags for this frame. */
    read() {
      const mx = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
      const my = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0);
      const out = {
        mx,
        my,
        sneak: keys.has('sneak'),
        dash: keys.has('dash'),
        grab: keys.has('grab'),
        enter: keys.has('enter'),
        retry: keys.has('retry'),
        mute: keys.has('mute'),
        click,
      };
      click = null;
      return out;
    },
    /** True once while the key is held; callers clear it by reading. */
    pressed(name) {
      return keys.has(name);
    },
    release(name) {
      keys.delete(name);
    },
  };
}
