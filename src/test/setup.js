// Basic test setup for JW-Site
// Minimal setup to avoid TypeScript issues

// Mock DOM element methods
const mockElement = {
  addEventListener: () => {},
  removeEventListener: () => {},
  getBoundingClientRect: () => ({ top: 0, left: 0, width: 800, height: 600 }),
  style: {},
  appendChild: () => {},
  removeChild: () => {},
  parentNode: null,
};

// Mock canvas with DOM methods
const mockCanvas = {
  ...mockElement,
  width: 800,
  height: 600,
  getContext: () => ({
    fillRect: () => {},
    clearRect: () => {},
    fillText: () => {},
    strokeRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    fill: () => {},
    arc: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    scale: () => {},
    rotate: () => {},
    measureText: () => ({ width: 0 }),
    fillStyle: "",
    strokeStyle: "",
    font: "",
    textAlign: "",
    globalAlpha: 1,
  }),
};

// @ts-ignore - Mocking browser APIs for testing
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 16);
// @ts-ignore
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
// @ts-ignore
globalThis.performance = { now: () => Date.now() };
// @ts-ignore
globalThis.Audio = function () {
  return {};
};
// @ts-ignore
const CanvasCtor =
  globalThis.HTMLCanvasElement ||
  (globalThis.window && globalThis.window.HTMLCanvasElement);
if (CanvasCtor && CanvasCtor.prototype) {
  // @ts-ignore
  CanvasCtor.prototype.getContext = () => mockCanvas.getContext();
}

// @ts-ignore - Mocking document for testing
globalThis.document = {
  ...mockElement,
  createElement: () => mockElement,
  getElementById: () => mockCanvas,
  body: mockElement,
  head: mockElement,
  addEventListener: () => {},
  removeEventListener: () => {},
  querySelector: () => mockElement,
  querySelectorAll: () => [],
};

// @ts-ignore - Mocking window for testing
globalThis.window = {
  ...mockElement,
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  },
  prompt: () => "Test Player",
  AudioContext: function () {
    return {};
  },
  webkitAudioContext: function () {
    return {};
  },
};

// Signal to runtime that we are in a test environment (used to disable animations, etc.)
// @ts-ignore
globalThis.__TEST__ = true;
