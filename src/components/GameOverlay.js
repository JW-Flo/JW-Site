// GameOverlay.js - Game overlay component for modular architecture
export class GameOverlay {
  constructor(canvas) {
    this.overlay = document.getElementById('game-overlay');
    this.container = document.getElementById('game-container');
    this.canvas = canvas || document.getElementById('game-canvas');
    this.triggerWord = document.getElementById('trigger-word');
    this.leaderboard = document.getElementById('leaderboard');
    this.leaderboardList = document.getElementById('leaderboard-list');
    this.closeLeaderboardBtn = document.getElementById('close-leaderboard');
    this.instructions = document.getElementById('game-instructions');
    this.controlHints = document.getElementById('control-hints');

    this.gameManager = null;
    this.onDeactivate = null; // Callback for external deactivation handling
    this.bindEvents();
    this.resize();

    console.log('🎮 Game Overlay initialized');
  }

  bindEvents() {
    // Trigger activation
    if (this.triggerWord) {
      this.triggerWord.addEventListener('click', (e) => {
        e.preventDefault();
        this.activate();
      });
    }

    // Leaderboard controls
    if (this.closeLeaderboardBtn) {
      this.closeLeaderboardBtn.addEventListener('click', () => {
        this.hideLeaderboard();
      });
    }

    // Global escape key - only deactivate if no game is active
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // If GameManager is active and has a current game, let the game handle escape
        if (this.gameManager && this.gameManager.isActive && this.gameManager.currentGame) {
          // Game will handle its own escape logic
          return;
        }
        // Otherwise, deactivate the entire overlay
        this.deactivate();
      }
    });

    window.addEventListener('resize', () => this.resize());
  }

  async activate() {
    // Import GameManager dynamically
    const { GameManager } = await import('../utils/GameManager.js');
    this.gameManager = new GameManager(this);

    if (this.overlay) {
      this.overlay.style.pointerEvents = 'auto';
      this.overlay.style.opacity = '1';
    }

    if (this.triggerWord) {
      this.triggerWord.style.opacity = '0';
    }

    this.showLeaderboard();
    await this.gameManager.activate();
  }

  async deactivate() {
    if (this.overlay) {
      this.overlay.style.pointerEvents = 'none';
      this.overlay.style.opacity = '0';
    }

    if (this.triggerWord) {
      this.triggerWord.style.opacity = '0.3';
    }

    this.hideLeaderboard();

    if (this.gameManager) {
      await this.gameManager.deactivate();
      this.gameManager = null;
    }

    // Remove retro styling from body when deactivating
    document.body.classList.remove('retro-active');

    // Call external deactivation callback if provided
    if (this.onDeactivate) {
      this.onDeactivate();
    }
  }

  showLeaderboard() {
    if (this.leaderboard) {
      this.leaderboard.style.opacity = '1';
    }
  }

  hideLeaderboard() {
    if (this.leaderboard) {
      this.leaderboard.style.opacity = '0';
    }
  }

  updateLeaderboard(data) {
    if (this.leaderboardList) {
      this.leaderboardList.innerHTML = data
        .slice(0, 5)
        .map((entry, index) => `
          <div class="flex justify-between ${index === 0 ? 'text-neon-pink font-bold' : 'text-slate-300'}">
            <span>${index + 1}. ${entry.name}</span>
            <span>${entry.score} (${entry.game})</span>
          </div>
        `).join('');
    }
  }

  showInstructions(controls) {
    if (this.controlHints) {
      this.controlHints.innerHTML = controls.map(control =>
        `<div class="text-xs">${control}</div>`
      ).join('');
    }

    if (this.instructions) {
      this.instructions.style.opacity = '1';
    }
  }

  hideInstructions() {
    if (this.instructions) {
      this.instructions.style.opacity = '0';
    }
  }

  resize() {
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  }
}
