// input.js — keyboard and mouse input for Ember Kitchen.
// Movement: WASD or arrow keys. Interact: E or Space. Number keys 1-6 grab a pantry
// ingredient. Mouse: click anywhere to walk there; click a station to walk to it and
// use it; click a pantry ingredient to walk over and pick it up.

export class Input {
  constructor(canvas, onFirstGesture) {
    this.keys = new Set();
    this.justPressed = new Set();
    this.mouse = { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 };
    this._gestureFired = false;
    this._onFirstGesture = onFirstGesture || (() => {});

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      if (!e.repeat) this.justPressed.add(e.code);
      this.keys.add(e.code);
      this._gesture();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());

    canvas.addEventListener('pointerdown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const sx = canvas.width / rect.width;
      const sy = canvas.height / rect.height;
      this.mouse.x = (e.clientX - rect.left) * sx;
      this.mouse.y = (e.clientY - rect.top) * sy;
      this.mouse.clicked = true;
      this.mouse.clickX = this.mouse.x;
      this.mouse.clickY = this.mouse.y;
      this._gesture();
    });
    canvas.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
      this.mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
    });
  }

  _gesture() {
    if (!this._gestureFired) {
      this._gestureFired = true;
      this._onFirstGesture();
    }
  }

  // Direction from the held movement keys, normalized.
  moveVector() {
    let x = 0;
    let y = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      const n = Math.hypot(x, y);
      x /= n;
      y /= n;
    }
    return { x, y };
  }

  pressed(code) {
    return this.justPressed.has(code);
  }

  interactPressed() {
    return this.justPressed.has('KeyE') || this.justPressed.has('Space');
  }

  // Pantry number key pressed this frame (1-6), or 0.
  pantryNumber() {
    for (let i = 1; i <= 6; i++) {
      if (this.justPressed.has(`Digit${i}`) || this.justPressed.has(`Numpad${i}`)) return i;
    }
    return 0;
  }

  // Consume the click (a click is handled once).
  takeClick() {
    if (!this.mouse.clicked) return null;
    this.mouse.clicked = false;
    return { x: this.mouse.clickX, y: this.mouse.clickY };
  }

  // Call at the end of each frame so justPressed only lives one frame.
  endFrame() {
    this.justPressed.clear();
  }
}
