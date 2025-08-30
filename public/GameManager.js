/**
 * Game Manager - Central hub for all game logic
 */
export class GameManager {
  constructor(overlay) {
    this.overlay = overlay;
    this.currentGame = null;
    this.isActive = false;
    this.games = ["Space Invaders", "Pac-Man", "Tetris", "Asteroids"];
    this.unlockedGames = [true, false, false, true]; // Space Invaders and Asteroids unlocked

    // Load unlocked games from localStorage
    this.loadUnlockedGames();

    // Unlock requirements for each game
    this.unlockRequirements = {
      "Space Invaders": 0, // Always unlocked
      "Pac-Man": 500,
      Tetris: 1000,
      Asteroids: 0, // Always unlocked
    };

    // Leaderboard data
    this.leaderboardData = this.loadLeaderboard();

    // Achievement tracking
    this.achievements = this.loadAchievements();
    this.checkAchievements();

    console.log("🎯 Game Manager initialized");
  }

  async activate() {
    this.isActive = true;
    this.overlay.updateLeaderboard(this.leaderboardData);
    await this.showMenu();
  }

  async deactivate() {
    this.isActive = false;
    if (this.currentGame) {
      this.currentGame.destroy();
      this.currentGame = null;
    }
  }

  async showMenu() {
    // Import and create menu game
    const { MenuGame } = await import("./games/MenuGame.js");
    this.currentGame = new MenuGame(this.overlay.canvas, this);
    this.currentGame.start();
  }

  async startGame(gameName) {
    if (this.currentGame) {
      this.currentGame.destroy();
    }

    // Map game names to their modules
    const gameModules = {
      "Space Invaders": () =>
        import("./games/SpaceInvadersGame.js"),
      Asteroids: () => import("./games/AsteroidsGame.js"),
      "Pac-Man": () => import("./games/PacManGame.js"),
      Tetris: () => import("./games/TetrisGame.js"),
    };

    if (gameModules[gameName]) {
      try {
        const module = await gameModules[gameName]();

        // Resolve the exported Game class robustly:
        // 1) named export like SpaceInvadersGame
        // 2) default export
        // 3) first export whose name ends with 'Game'
        const candidateKeys = Object.keys(module);
        const expectedKey = gameName.replace(/\s+/g, "") + "Game";

        let GameClass = null;
        if (module[expectedKey]) {
          GameClass = module[expectedKey];
        } else if (module.default) {
          GameClass = module.default;
        } else {
          // Fallback: pick the first export that looks like a Game class/function
          for (const k of candidateKeys) {
            try {
              const exp = module[k];
              if (typeof exp === "function" && /Game$/.test(exp.name || k)) {
                GameClass = exp;
                break;
              }
            } catch (e) {
              // ignore problematic getters
            }
          }
        }

        if (!GameClass) {
          const available = candidateKeys.join(", ") || "(no exports)";
          throw new Error(
            `No Game export found for "${gameName}". Expected export keys: ${expectedKey} or default. Module exports: ${available}`
          );
        }

        try {
          this.currentGame = new GameClass(this.overlay.canvas, this);
          if (typeof this.currentGame.start === "function") {
            this.currentGame.start();
          } else {
            console.warn(
              `Loaded game class for "${gameName}" does not implement start() method.`
            );
          }
        } catch (instErr) {
          console.error(
            `Failed to instantiate/start game class for "${gameName}":`,
            instErr
          );
          throw instErr;
        }
      } catch (error) {
        console.error(`Failed to load game ${gameName}:`, error);
        this.showMenu();
      }
    }
  }

  async saveScore(gameName, score) {
    if (score > 0) {
      const playerName = window.prompt(
        "Enter your name for the leaderboard:",
        "Anonymous Recruiter"
      );
      if (playerName) {
        // Save to local leaderboard
        this.leaderboardData.push({
          name: playerName,
          score: score,
          game: gameName,
        });
        this.leaderboardData.sort((a, b) => b.score - a.score);
        this.leaderboardData = this.leaderboardData.slice(0, 10);
        this.saveLeaderboard();
        this.overlay.updateLeaderboard(this.leaderboardData);

        // Check for game unlocks
        this.checkForUnlocks(gameName, score);

        // Check for achievements
        this.checkAchievements();

        // Submit to Cloudflare workflow for processing
        try {
          await this.submitScoreToWorkflow(gameName, score, playerName);
        } catch (error) {
          console.error("Failed to submit score to workflow:", error);
          // Continue with local save even if workflow fails
        }
      }
    }
  }

  checkForUnlocks(gameName, score) {
    // Check if this score unlocks any games
    Object.entries(this.unlockRequirements).forEach(([game, requiredScore]) => {
      if (score >= requiredScore && !this.isGameUnlocked(game)) {
        this.unlockGame(game);
        console.log(`🎉 Game unlocked: ${game}!`);

        // Show unlock notification
        this.showUnlockNotification(game);
      }
    });
  }

  showUnlockNotification(gameName) {
    // Create a simple notification
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(45deg, #00ff00, #00aa00);
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 16px;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(0, 255, 0, 0.3);
      z-index: 10000;
      animation: slideIn 0.5s ease-out;
    `;
    notification.innerHTML = `🎉 ${gameName} Unlocked!`;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = "slideOut 0.5s ease-in";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 500);
    }, 3000);

    // Add CSS animations
    const style = document.createElement("style");
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  async submitScoreToWorkflow(gameType, score, playerName) {
    const workflowUrl = "/api/workflows/game-score-processor";

    const response = await fetch(workflowUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        gameType: gameType.toLowerCase().replace(/\s+/g, "-"),
        score: score,
        playerName: playerName,
        sessionId: Date.now().toString(), // Simple session ID
      }),
    });

    if (!response.ok) {
      throw new Error(`Workflow submission failed: ${response.status}`);
    }

    const result = await response.json();
    console.log("Score submitted to workflow:", result);
    return result;
  }

  loadLeaderboard() {
    const saved = window.localStorage.getItem("retroArcadeLeaderboard");
    return saved
      ? JSON.parse(saved)
      : [
          { name: "Top Recruiter", score: 5000, game: "Space Invaders" },
          { name: "Game Master", score: 4200, game: "Pac-Man" },
          { name: "Puzzle Solver", score: 3800, game: "Tetris" },
          { name: "Space Ace", score: 3500, game: "Asteroids" },
          { name: "New Player", score: 0, game: "Getting Started" },
        ];
  }

  saveLeaderboard() {
    window.localStorage.setItem(
      "retroArcadeLeaderboard",
      JSON.stringify(this.leaderboardData)
    );
  }

  isGameUnlocked(gameName) {
    const index = this.games.indexOf(gameName);
    return index >= 0 ? this.unlockedGames[index] : false;
  }

  unlockGame(gameName) {
    const index = this.games.indexOf(gameName);
    if (index >= 0) {
      this.unlockedGames[index] = true;
      this.saveUnlockedGames();
    }
  }

  saveUnlockedGames() {
    window.localStorage.setItem(
      "retroArcadeUnlockedGames",
      JSON.stringify(this.unlockedGames)
    );
  }

  loadUnlockedGames() {
    const saved = window.localStorage.getItem("retroArcadeUnlockedGames");
    if (saved) {
      this.unlockedGames = JSON.parse(saved);
    }
  }

  returnToMenu() {
    if (this.currentGame) {
      this.currentGame.destroy();
    }
    this.showMenu();
  }

  playSound(soundType) {
    // Simple Web Audio API sound generation
    try {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      switch (soundType) {
        case "shoot":
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(
            400,
            audioContext.currentTime + 0.1
          );
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.1
          );
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.1);
          break;

        case "explosion":
          oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(
            50,
            audioContext.currentTime + 0.3
          );
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.3
          );
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.3);
          break;

        case "levelUp":
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(
            554,
            audioContext.currentTime + 0.1
          );
          oscillator.frequency.setValueAtTime(
            659,
            audioContext.currentTime + 0.2
          );
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.3
          );
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.3);
          break;

        case "gameOver":
          oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(
            100,
            audioContext.currentTime + 0.5
          );
          gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.5
          );
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.5);
          break;
      }
    } catch (error) {
      // Silently fail if Web Audio API is not available
      console.log("Sound not available:", error.message);
    }
  }

  getBestScore(gameName) {
    const gameScores = this.leaderboardData.filter(
      (entry) => entry.game === gameName
    );
    if (gameScores.length > 0) {
      return Math.max(...gameScores.map((entry) => entry.score));
    }
    return 0;
  }

  loadAchievements() {
    const saved = window.localStorage.getItem("retroArcadeAchievements");
    return saved
      ? JSON.parse(saved)
      : {
          firstGame: false,
          highScorer: false,
          gameMaster: false,
          speedRunner: false,
          survivor: false,
        };
  }

  saveAchievements() {
    window.localStorage.setItem(
      "retroArcadeAchievements",
      JSON.stringify(this.achievements)
    );
  }

  checkAchievements() {
    const totalScore = this.leaderboardData.reduce(
      (sum, entry) => sum + entry.score,
      0
    );
    const gamesPlayed = new Set(this.leaderboardData.map((entry) => entry.game))
      .size;

    // First Game achievement
    if (!this.achievements.firstGame && this.leaderboardData.length > 0) {
      this.achievements.firstGame = true;
      this.showAchievementNotification(
        "First Game!",
        "Welcome to the Retro Arcade!"
      );
    }

    // High Scorer achievement
    if (!this.achievements.highScorer && totalScore >= 1000) {
      this.achievements.highScorer = true;
      this.showAchievementNotification(
        "High Scorer!",
        "Earned 1000+ total points!"
      );
    }

    // Game Master achievement
    if (!this.achievements.gameMaster && gamesPlayed >= 4) {
      this.achievements.gameMaster = true;
      this.showAchievementNotification(
        "Game Master!",
        "Played all available games!"
      );
    }

    this.saveAchievements();
  }

  showAchievementNotification(title, description) {
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: linear-gradient(45deg, #ff6b35, #f7931e);
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 14px;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
      z-index: 10000;
      animation: achievementSlideIn 0.5s ease-out;
      max-width: 300px;
    `;
    notification.innerHTML = `
      <div style="font-size: 16px; margin-bottom: 5px;">🏆 ${title}</div>
      <div style="font-size: 12px; opacity: 0.9;">${description}</div>
    `;

    document.body.appendChild(notification);

    // Remove after 4 seconds
    setTimeout(() => {
      notification.style.animation = "achievementSlideOut 0.5s ease-in";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 500);
    }, 4000);

    // Add CSS animations if not already added
    if (!document.getElementById("achievement-styles")) {
      const style = document.createElement("style");
      style.id = "achievement-styles";
      style.textContent = `
        @keyframes achievementSlideIn {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes achievementSlideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(-100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }
}
