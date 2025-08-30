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

      // Apply enhanced retro styling for game mode
      document.body.classList.add("game-mode");

      console.log("🎯 Importing GameOverlay...");
      // Initialize modular game overlay
      const { GameOverlay } = await import("/src/components/GameOverlay.js");
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
      alert(
        "Sorry, there was an issue loading the game. Please try again or check the console for details."
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

    // Remove enhanced game mode styling
    document.body.classList.remove("game-mode");

    if (this.gameOverlay) {
      this.gameOverlay.deactivate();
      this.gameOverlay = null;
    }

    this.hideLeaderboard();
    console.log("Game deactivated successfully");
  }

  showLeaderboard() {
    if (this.gameOverlay) {
      this.gameOverlay.showLeaderboard();
    }
  }

  hideLeaderboard() {
    if (this.gameOverlay) {
      this.gameOverlay.hideLeaderboard();
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
