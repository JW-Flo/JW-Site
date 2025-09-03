// Retro arcade client script moved out of inline layout
class RetroArcade {
  constructor() {
    // Ensure canvas exists
    this.canvas = document.getElementById("game-canvas");
    if (!this.canvas) {
      console.error("❌ Game canvas not found!");
      return;
    }

    this.triggerWord = document.getElementById("trigger-word");
    this.leaderboard = document.getElementById("leaderboard");
    this.leaderboardList = document.getElementById("leaderboard-list");
    this.closeLeaderboardBtn = document.getElementById("close-leaderboard");

    this.gameOverlay = null;
    this.isActive = false;

    this.bindEvents();
    console.log("🎯 Retro Arcade initialized - modular architecture ready!");
  }

  bindEvents() {
    // Trigger word activation - bind to both span and parent div for better UX
    const triggerElement =
      this.triggerWord || document.getElementById("trigger-word");
    const triggerContainer = document.getElementById("game-trigger");

    if (triggerElement) {
      triggerElement.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("🎯 Game trigger clicked!");
        this.activateGame();
      });
    }

    if (triggerContainer) {
      triggerContainer.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("🎯 Game trigger container clicked!");
        this.activateGame();
      });
    }

    // Leaderboard controls
    if (this.closeLeaderboardBtn) {
      this.closeLeaderboardBtn.addEventListener("click", () => {
        this.hideLeaderboard();
      });
    }
  }

  async activateGame() {
    if (this.isActive) {
      console.log("🎯 Game already active, ignoring trigger");
      return;
    }

    console.log("🎯 Activating game...");

    try {
      this.isActive = true;
      this.canvas.style.pointerEvents = "auto";
      this.canvas.style.opacity = "0.8";
      this.canvas.style.zIndex = "35"; // Above navigation but below modal elements
      if (this.triggerWord) this.triggerWord.style.opacity = "0";

      // Apply enhanced retro styling for game mode + scroll lock
      document.body.classList.add("game-mode");
      document.body.classList.add("game-mode-scroll-lock");
      this._addScrollKeySuppression();

      console.log("🎯 Importing GameOverlay...");
      // Initialize modular game overlay
      const { GameOverlay } = await import("./GameOverlay.js");
      console.log("🎯 GameOverlay imported successfully");

      this.gameOverlay = new GameOverlay(this.canvas);

      // Set up deactivation callback to properly clean up
      this.gameOverlay.onDeactivate = () => {
        this.deactivateGame();
      };

      console.log("🎯 Activating GameOverlay...");
      await this.gameOverlay.activate();

      this.showLeaderboard();
      console.log("🎮 Retro Arcade activated - enhanced game mode!");
    } catch (error) {
      console.error("❌ Failed to activate game:", error);
      // Reset state on error
      this.isActive = false;
      this.canvas.style.pointerEvents = "none";
      this.canvas.style.opacity = "0";
      this.canvas.style.zIndex = "30";
      if (this.triggerWord) {
        this.triggerWord.style.opacity = "0.3";
      }
      document.body.classList.remove("game-mode");

      // Show error message to user
      console.log(
        "No player name provided. Game overlay will handle name prompt."
      );
    }
  }

  deactivateGame() {
    if (!this.isActive) return;

    this.isActive = false;
    this.canvas.style.pointerEvents = "none";
    this.canvas.style.opacity = "0";
    this.canvas.style.zIndex = "30"; // Back to normal z-index
    if (this.triggerWord) this.triggerWord.style.opacity = "0.3";

    // Remove enhanced game mode styling & scroll lock
    document.body.classList.remove("game-mode");
    document.body.classList.remove("game-mode-scroll-lock");
    this._removeScrollKeySuppression();

    if (this.gameOverlay) {
      this.gameOverlay.deactivate();
      this.gameOverlay = null;
    }

    this.hideLeaderboard();
    console.log("Game deactivated successfully");
  }

  showLeaderboard() {
    // Leaderboard currently removed; guard for absence.
    if (
      this.gameOverlay &&
      typeof this.gameOverlay.showLeaderboard === "function"
    ) {
      this.gameOverlay.showLeaderboard();
    }
  }

  hideLeaderboard() {
    if (
      this.gameOverlay &&
      typeof this.gameOverlay.hideLeaderboard === "function"
    ) {
      this.gameOverlay.hideLeaderboard();
    }
  }

  _addScrollKeySuppression() {
    this._keyHandler = (e) => {
      if (!this.isActive) return;
      // Ignore if focusing an input/textarea/contentEditable
      const target = e.target;
      const tag = target && target.tagName ? target.tagName.toLowerCase() : "";
      if (tag === "input" || tag === "textarea" || target.isContentEditable) {
        return;
      }
      const keysToBlock = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        " ", // Space (Chrome/Firefox)
        "Spacebar", // Legacy
        "PageUp",
        "PageDown",
        "Home",
        "End",
      ];
      if (keysToBlock.includes(e.key)) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", this._keyHandler, { passive: false });
  }

  _removeScrollKeySuppression() {
    if (this._keyHandler) {
      window.removeEventListener("keydown", this._keyHandler);
      this._keyHandler = null;
    }
  }
}

// Initialize when DOM is ready and expose for testing
document.addEventListener("DOMContentLoaded", () => {
  try {
    window.retroArcade = new RetroArcade();
  } catch (e) {
    console.error("Failed to initialize RetroArcade for testing", e);
  }
});
