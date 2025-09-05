import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Dynamically import GameManager from public path (not TypeScript). We'll mock minimal overlay.

// Provide a mock implementation of dynamic import used inside GameManager.startGame
vi.mock('../../public/games/AsteroidsGame.js', () => {
  class AsteroidsGameMock {
    canvas: any;
    gm: any;
    started: boolean = false;
    destroyed: boolean = false;
    constructor(canvas: any, gm: any) { this.canvas = canvas; this.gm = gm; }
    start() { this.started = true; }
    destroy() { this.destroyed = true; }
  }
  return { AsteroidsGame: AsteroidsGameMock };
});

// Mock other games to avoid errors if referenced
vi.mock('../../public/games/PacManGame.js', () => ({ PacManGame: class { start() { /* mock */ } destroy() { /* mock */ } } }));
vi.mock('../../public/games/TetrisGame.js', () => ({ TetrisGame: class { start() { /* mock */ } destroy() { /* mock */ } } }));
vi.mock('../../public/games/SpaceInvadersGame.js', () => ({ SpaceInvadersGame: class { start() { /* mock */ } destroy() { /* mock */ } } }));

// Because GameManager imports dynamically with import(), we need to mock import mechanism.
// We'll intercept import() by creating a helper; but simpler is to modify global import if needed.

// Provide localStorage mock
const store: Record<string,string> = {};
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: (k:string) => store[k] || null,
    setItem: (k:string, v:string) => { store[k] = v; },
    removeItem: (k:string) => { delete store[k]; }
  },
});

// Provide basic prompt mock
Object.defineProperty(global, 'prompt', { value: vi.fn(() => null) });

// Provide minimal fetch mock for workflow submission
global.fetch = vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 }));

describe('GameManager restart functionality', async () => {
  const { GameManager } = await import('../../public/GameManager.js');

  let gm: any;
  beforeEach(() => {
    // Provide a mock canvas with getContext to satisfy MenuGame when it shows menu
    const mockCtx = {
      fillRect: () => {},
      strokeRect: () => {},
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fillText: () => {},
      font: '',
      textAlign: 'left',
      arc: () => {},
      fill: () => {},
    };
    const mockCanvas = { width: 800, height: 600, getContext: () => mockCtx, addEventListener: () => {}, removeEventListener: () => {} } as any;
    gm = new GameManager({
        canvas: mockCanvas,
      updateLeaderboard: () => {},
      showMessage: () => {},
    } as any);
  });

  afterEach(() => {
    if (gm && gm.currentGame && typeof gm.currentGame.destroy === 'function') {
      gm.currentGame.destroy();
    }
  });

  it('records lastGameName on startGame and restarts', async () => {
    await gm.startGame('Asteroids');
    expect(gm.lastGameName).toBe('Asteroids');
    const firstInstance = gm.currentGame;
    await gm.restartCurrentGame();
    expect(gm.currentGame).not.toBe(firstInstance);
    expect(gm.lastGameName).toBe('Asteroids');
  });

  it('returnToMenu when no lastGameName on restart', async () => {
    const spy = vi.spyOn(gm, 'returnToMenu');
    gm.lastGameName = null;
    await gm.restartCurrentGame();
    expect(spy).toHaveBeenCalled();
  });
});
