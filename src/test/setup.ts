// Basic test setup for JW-Site
// Minimal setup to avoid TypeScript issues

// Mock DOM element methods with relaxed typing
// Using HTMLElement partial cast to satisfy TS during tests
const mockElement = {
  addEventListener: () => {},
  removeEventListener: () => {},
  getBoundingClientRect: () => ({ top: 0, left: 0, width: 800, height: 600 }),
  style: {} as any,
  appendChild: () => {},
  removeChild: () => {},
  parentNode: null
} as unknown as HTMLElement;

// Mock canvas with DOM methods
const mockCanvas = ({
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
    fillStyle: '',
    strokeStyle: '',
    font: '',
    textAlign: '',
    globalAlpha: 1
  })
}) as unknown as HTMLCanvasElement;

// @ts-ignore - Mocking browser APIs for testing
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
// @ts-ignore
global.cancelAnimationFrame = () => {};
// @ts-ignore
global.performance = { now: () => Date.now() };
// @ts-ignore
global.Audio = function() { return {}; };
// @ts-ignore
HTMLCanvasElement.prototype.getContext = () => mockCanvas.getContext();

// @ts-ignore - Mocking document for testing
global.document = {
  // minimal properties used in tests
  createElement: () => mockElement,
  getElementById: () => mockCanvas,
  body: mockElement,
  head: mockElement,
  addEventListener: () => {},
  removeEventListener: () => {},
  querySelector: () => mockElement,
  querySelectorAll: () => ({ length: 0, item: () => null, forEach: () => {} }) as any
} as unknown as Document;

// @ts-ignore - Mocking window for testing
global.window = {
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  },
  prompt: () => 'Test Player',
  AudioContext: function() { return {}; },
  webkitAudioContext: function() { return {}; },
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true
} as unknown as Window & typeof globalThis;
