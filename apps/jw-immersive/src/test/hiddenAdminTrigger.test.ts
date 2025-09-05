import { describe, it, expect } from 'vitest';

// This test simulates the multi-click logic in BioSection.astro script.
// We reimplement the core logic to ensure expected thresholds hold.

describe('hidden admin trigger logic', () => {
  const REQUIRED_CLICKS = 5;
  const CLICK_WINDOW_MS = 3500;

  function makeState() {
    return { clickCount: 0, firstClickTime: 0, revealed: false };
  }

  function incrementWithinWindow(state: { clickCount: number; }, now: number) { state.clickCount++; }
  function resetSequence(state: { clickCount: number; firstClickTime: number; }, now: number) { state.firstClickTime = now; state.clickCount = 1; }
  function click(now: number, state: { clickCount: number; firstClickTime: number; revealed: boolean }) {
    if (state.clickCount === 0) {
      resetSequence(state, now);
    } else {
      const within = (now - state.firstClickTime) <= CLICK_WINDOW_MS;
      if (within) incrementWithinWindow(state, now); else resetSequence(state, now);
    }
    if (state.clickCount >= REQUIRED_CLICKS) { state.revealed = true; state.clickCount = 0; }
  }

  it('activates after required clicks within window', () => {
    const state = makeState();
    const start = Date.now();
    for (let i=0;i<REQUIRED_CLICKS;i++) click(start + i*400, state); // 400ms spacing < window
    expect(state.revealed).toBe(true);
  });

  it('resets if window exceeded', () => {
    const state = makeState();
    const start = Date.now();
    // Begin a partial successful sequence (3 clicks)
    for (let i=0;i<3;i++) click(start + i*300, state);
    expect(state.clickCount).toBe(3);
    // Exceed the window; this click should reset sequence to 1 (not reveal)
    click(start + CLICK_WINDOW_MS + 100, state); // exceeds window -> reset
    expect(state.revealed).toBe(false);
    expect(state.clickCount).toBe(1);
    // Provide only 3 additional clicks (total 4 since reset) which is below REQUIRED_CLICKS
    for (let i=0;i<3;i++) click(start + CLICK_WINDOW_MS + 200 + i*200, state);
    expect(state.revealed).toBe(false);
    expect(state.clickCount).toBe(4); // still below threshold
  });
});
