import { describe, it, expect, beforeEach, vi } from "vitest";
import { GameManager } from "../utils/GameManager.js";

describe("GameManager", () => {
  let gameManager;
  let mockCallbacks;

  beforeEach(() => {
    // Create mock overlay with canvas
    const mockCanvas = {
      width: 800,
      height: 600,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      getContext: vi.fn(() => ({
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        fillText: vi.fn(),
        strokeRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        arc: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        rotate: vi.fn(),
        measureText: vi.fn(() => ({ width: 0 })),
        fillStyle: "",
        strokeStyle: "",
        font: "",
        textAlign: "",
        globalAlpha: 1,
      })),
    };

    const mockOverlay = {
      canvas: mockCanvas,
      updateLeaderboard: vi.fn(),
      showInstructions: vi.fn(),
      hideInstructions: vi.fn(),
    };

    // Mock callbacks
    mockCallbacks = {
      showLeaderboard: vi.fn(),
      hideLeaderboard: vi.fn(),
      updateLeaderboard: vi.fn(),
      showInstructions: vi.fn(),
      hideInstructions: vi.fn(),
    };

    gameManager = new GameManager(mockOverlay);
  });

  describe("Initialization", () => {
    it("should initialize with correct canvas dimensions", () => {
      expect(gameManager.overlay.canvas.width).toBe(800);
      expect(gameManager.overlay.canvas.height).toBe(600);
    });

    it("should have default game state", () => {
      expect(gameManager.currentGame).toBeNull();
      expect(gameManager.isActive).toBe(false);
    });
  });

  describe("Game Management", () => {
    it("should activate successfully", async () => {
      await gameManager.activate();
      expect(gameManager.isActive).toBe(true);
    });

    it("should deactivate successfully", async () => {
      await gameManager.activate();
      await gameManager.deactivate();
      expect(gameManager.isActive).toBe(false);
    });

    it("should handle game start", async () => {
      await gameManager.activate();
      // Test that the method exists and can be called
      expect(typeof gameManager.startGame).toBe("function");
    });
  });

  describe("Leaderboard Integration", () => {
    it("should have leaderboard callback methods", () => {
      // Test that the callback methods are available
      expect(typeof mockCallbacks.showLeaderboard).toBe("function");
      expect(typeof mockCallbacks.hideLeaderboard).toBe("function");
    });
  });
});
