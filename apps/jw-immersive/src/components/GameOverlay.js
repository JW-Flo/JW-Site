// GameOverlay.js - Game overlay component for modular architecture
export class GameOverlay {
  constructor(canvas) {
    this.overlay = null; // Not used in BaseLayout
    this.container = null; // Not used in BaseLayout
    this.canvas = canvas || document.getElementById("game-canvas");
    // Note: triggerWord is handled by RetroArcade class, not GameOverlay
    this.triggerWord = null; // Don't get by ID - RetroArcade handles this
    this.leaderboard = document.getElementById("leaderboard");
    this.leaderboardList = document.getElementById("leaderboard-list");
    this.closeLeaderboardBtn = document.getElementById("close-leaderboard");
    this.instructions = null; // Not used in BaseLayout
    this.controlHints = null; // Not used in BaseLayout

    this.gameManager = null;
    this.onDeactivate = null; // Callback for external deactivation handling
    this.bindEvents();
    this.resize();

    console.log("🎮 Game Overlay initialized");
  }

  bindEvents() {
    // Note: Trigger activation is handled by RetroArcade class
    // We don't bind to triggerWord here to avoid conflicts

    // Leaderboard controls
    if (this.closeLeaderboardBtn) {
      this.closeLeaderboardBtn.addEventListener("click", () => {
        this.hideLeaderboard();
      });
    }

    // Global escape key - only deactivate if no game is active
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        // If GameManager is active and has a current game, let the game handle escape
        if (
          this.gameManager &&
          this.gameManager.isActive &&
          this.gameManager.currentGame
        ) {
          // Game will handle its own escape logic
          return;
        }
        // Otherwise, deactivate the entire overlay
        this.deactivate();
      }
    });

    window.addEventListener("resize", () => this.resize());
  }

  async activate() {
    // Import GameManager dynamically
    const { GameManager } = await import("../utils/GameManager.js");
    this.gameManager = new GameManager(this);

    // Note: overlay styling is handled by BaseLayout's RetroArcade class
    // We don't need to modify overlay styles here

    this.showLeaderboard();
    await this.gameManager.activate();
  }

  async deactivate() {
    // Note: overlay styling is handled by BaseLayout's RetroArcade class
    // We don't need to modify overlay styles here

    this.hideLeaderboard();

    if (this.gameManager) {
      await this.gameManager.deactivate();
      this.gameManager = null;
    }

    // Remove retro styling from body when deactivating
    document.body.classList.remove("retro-active");

    // Call external deactivation callback if provided
    if (this.onDeactivate) {
      this.onDeactivate();
    }
  }

  showLeaderboard() {
    if (this.leaderboard) {
      this.leaderboard.style.opacity = "1";
    }
  }

  hideLeaderboard() {
    if (this.leaderboard) {
      this.leaderboard.style.opacity = "0";
    }
  }

  updateLeaderboard(data) {
    if (this.leaderboardList) {
      this.leaderboardList.innerHTML = data
        .slice(0, 5)
        .map(
          (entry, index) => `
          <div class="flex justify-between ${
            index === 0 ? "text-neon-pink font-bold" : "text-slate-300"
          }">
            <span>${index + 1}. ${entry.name}</span>
            <span>${entry.score} (${entry.game})</span>
          </div>
        `
        )
        .join("");
    }
  }

  showInstructions(controls) {
    // Instructions are not implemented in BaseLayout
    // This method is kept for compatibility but doesn't do anything
    console.log("Game instructions:", controls);
  }

  hideInstructions() {
    // Instructions are not implemented in BaseLayout
    // This method is kept for compatibility but doesn't do anything
  }

  resize() {
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  }
}
