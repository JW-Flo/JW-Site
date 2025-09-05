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

    // Global key handling for Escape (return to menu / close) and R (restart)
    document.addEventListener("keydown", (e) => {
      if (!this.gameManager) return;
      const gm = this.gameManager;
      if (e.key === "Escape") {
        // If a game is active, return to menu; otherwise deactivate overlay
        if (gm.currentGame) {
          e.preventDefault();
          gm.returnToMenu();
          return;
        }
        this.deactivate();
      } else if (e.key.toLowerCase() === "r") {
        // Restart current/last game
        if (gm.lastGameName) {
          e.preventDefault();
          gm.restartCurrentGame();
        }
      }
    });

    window.addEventListener("resize", () => this.resize());
  }

  async activate() {
    // Import GameManager dynamically
    const { GameManager } = await import("./GameManager.js");
    this.gameManager = new GameManager(this);

    // Show leaderboard UI
    this.showLeaderboard();

    // Fetch persistent leaderboard from server for all games
    await this.fetchAndDisplayPersistentLeaderboard();

    await this.gameManager.activate();
    this.injectGameControls();
  }
  // Fetch persistent leaderboard from server for all games and update UI
  async fetchAndDisplayPersistentLeaderboard() {
    // List of all games (should match GameManager)
    const games = ["Asteroids", "Pac-Man", "Tetris", "Space Invaders"];
    let allEntries = [];
    let fetchFailed = false;

    // Helper to fetch leaderboard for a single game
    const fetchLeaderboardForGame = async (game) => {
      try {
        const res = await fetch(
          `/api/workflows/game-score-processor?game=${encodeURIComponent(game)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.leaderboard)) {
            return data.leaderboard.map((entry) => ({
              name: entry.player,
              score: entry.score,
              game: game,
            }));
          }
        } else {
          fetchFailed = true;
        }
      } catch (err) {
        fetchFailed = true;
        console.warn(`Failed to fetch leaderboard for ${game}:`, err);
      }
      return [];
    };

    // Fetch all leaderboards in sequence (could be parallelized if needed)
    for (const game of games) {
      const entries = await fetchLeaderboardForGame(game);
      allEntries = allEntries.concat(entries);
    }

    // Sort all entries by score descending, take top 10
    allEntries.sort((a, b) => b.score - a.score);
    const topEntries = allEntries.slice(0, 10);

    if (topEntries.length > 0 && !fetchFailed) {
      this.updateLeaderboard(topEntries);
    } else {
      // Fallback: load from localStorage (legacy)
      try {
        const saved = window.localStorage.getItem("retroArcadeLeaderboard");
        const localEntries = saved ? JSON.parse(saved) : [];
        this.updateLeaderboard(localEntries);
      } catch (err) {
        console.warn("Failed to load local leaderboard:", err);
        // If all else fails, show empty leaderboard
        this.updateLeaderboard([]);
      }
    }
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

  // Inject lightweight control buttons (Restart / Menu) overlayed at bottom-right
  injectGameControls() {
    if (document.getElementById("arcade-controls")) return; // Avoid duplicates
    const wrap = document.createElement("div");
    wrap.id = "arcade-controls";
    wrap.style.cssText =
      "position:fixed;bottom:16px;right:16px;z-index:9999;display:flex;gap:8px;font-family:monospace";
    const btnStyle =
      "background:#1e293b;color:#e2e8f0;border:1px solid #334155;padding:6px 10px;border-radius:6px;font-size:12px;cursor:pointer;transition:background .15s";
    const restartBtn = document.createElement("button");
    restartBtn.textContent = "Restart (R)";
    restartBtn.style.cssText = btnStyle;
    restartBtn.addEventListener(
      "mouseenter",
      () => (restartBtn.style.background = "#334155")
    );
    restartBtn.addEventListener(
      "mouseleave",
      () => (restartBtn.style.background = "#1e293b")
    );
    restartBtn.addEventListener("click", () => {
      if (this.gameManager?.lastGameName) {
        this.gameManager.restartCurrentGame();
      }
    });
    const menuBtn = document.createElement("button");
    menuBtn.textContent = "Menu (Esc)";
    menuBtn.style.cssText = btnStyle;
    menuBtn.addEventListener(
      "mouseenter",
      () => (menuBtn.style.background = "#334155")
    );
    menuBtn.addEventListener(
      "mouseleave",
      () => (menuBtn.style.background = "#1e293b")
    );
    menuBtn.addEventListener("click", () => {
      if (this.gameManager?.currentGame) {
        this.gameManager.returnToMenu();
      } else {
        this.deactivate();
      }
    });
    wrap.appendChild(restartBtn);
    wrap.appendChild(menuBtn);
    document.body.appendChild(wrap);
  }

  resize() {
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  }
}
