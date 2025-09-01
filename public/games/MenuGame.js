// Menu Game - Handles game selection interface
export class MenuGame {
  constructor(canvas, gameManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.gameManager = gameManager;
    this.selectedGame = 0;
    this.games = gameManager.games;
    this.unlockedGames = gameManager.unlockedGames;
    // Provide alias mapping (e.g., user said "defenders" referring to Space Invaders)
    this.aliases = {
      'Defenders': 'Space Invaders',
      'Defender': 'Space Invaders'
    };
    this.animationId = null;

  // Ephemeral lock feedback
  this.lockMessageTimer = 0; // frames remaining to show message
  this.lockMessage = "";

    // Animation properties
    this.titleGlow = 0;
    this.titleGlowDir = 1;
    this.particles = [];
    this.lastSelectionTime = 0;

    this.bindEvents();
  }

  bindEvents() {
    // Bind event handlers to preserve 'this' context and enable proper cleanup
    this.boundHandleClick = (e) => this.handleClick(e);
    this.boundHandleKeyPress = (e) => this.handleKeyPress(e);

    this.canvas.addEventListener("click", this.boundHandleClick);
    if (typeof document !== 'undefined') {
      document.addEventListener("keydown", this.boundHandleKeyPress);
    }
  }

  start() {
    this.gameLoop();
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    // Remove event listeners using the bound function references
    this.canvas.removeEventListener("click", this.boundHandleClick);
    if (typeof document !== 'undefined') {
      document.removeEventListener("keydown", this.boundHandleKeyPress);
    }
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;

    const menuStartY = this.canvas.height / 2 - 120;
    const itemSpacing = 70;
    const itemHeight = 40;

    for (let i = 0; i < this.games.length; i++) {
      const itemY = menuStartY + i * itemSpacing;
      if (y >= itemY - itemHeight / 2 && y <= itemY + itemHeight / 2) {
        if (this.unlockedGames[i]) {
          this.gameManager.startGame(this.games[i]);
        } else {
          this.showLockedMessage(this.games[i]);
        }
        return;
      }
    }
  }

  handleKeyPress(e) {
    const currentTime = Date.now();

    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      // Exit back to main website
      if (this.gameManager && this.gameManager.overlay) {
        this.gameManager.overlay.deactivate();
      }
      return;
    }

    if (e.key === "ArrowDown" || e.key === "s") {
      e.preventDefault();
      e.stopPropagation();
      this.selectedGame = (this.selectedGame + 1) % this.games.length;
      this.lastSelectionTime = currentTime;
      this.createSelectionParticles();
      this.gameManager.playSound("shoot");
    } else if (e.key === "ArrowUp" || e.key === "w") {
      e.preventDefault();
      e.stopPropagation();
      this.selectedGame =
        (this.selectedGame - 1 + this.games.length) % this.games.length;
      this.lastSelectionTime = currentTime;
      this.createSelectionParticles();
      this.gameManager.playSound("shoot");
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      if (this.unlockedGames[this.selectedGame]) {
        this.createLaunchParticles();
        this.gameManager.playSound("powerUp");
        setTimeout(() => {
          this.gameManager.startGame(this.games[this.selectedGame]);
        }, 300);
      } else {
        this.showLockedMessage(this.games[this.selectedGame]);
      }
    }
  }

  gameLoop() {
    this.updateParticles();
    this.updateTitleGlow();
    this.draw();
    // Avoid perpetuating animation loops in test environment to prevent unhandled async after teardown
    if (typeof globalThis !== 'undefined' && globalThis.__TEST__) {
      return; // do not schedule next frame
    }
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  updateTitleGlow() {
    this.titleGlow += this.titleGlowDir * 0.02;
    if (this.titleGlow > 1 || this.titleGlow < 0) {
      this.titleGlowDir *= -1;
    }
  }

  draw() {
    // Clear canvas with space background
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw enhanced starfield background
    this.drawStarfield();

    // Draw retro arcade border/frame
    this.drawArcadeFrame();

    // Title with glow effect
    this.drawTitle();

    // Menu options with better styling
    this.drawMenuOptions();

    // Instructions
    this.drawInstructions();

    // Draw particles
    this.drawParticles();

    // Locked message overlay
    if (this.lockMessageTimer > 0 && this.lockMessage) {
      this.ctx.fillStyle = "rgba(0,0,0,0.7)";
      const boxWidth = 560;
      const boxHeight = 80;
      const x = (this.canvas.width - boxWidth) / 2;
      const y = this.canvas.height - boxHeight - 140;
      this.ctx.fillRect(x, y, boxWidth, boxHeight);
      this.ctx.strokeStyle = "#ff6666";
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, y, boxWidth, boxHeight);
      this.ctx.fillStyle = "#ff6666";
      this.ctx.font = "bold 20px monospace";
      this.ctx.textAlign = "center";
      this.ctx.fillText("LOCKED", this.canvas.width / 2, y + 30);
      this.ctx.fillStyle = "#ffffff";
      this.ctx.font = "14px monospace";
      this.ctx.fillText(this.lockMessage, this.canvas.width / 2, y + 55);
      this.lockMessageTimer--;
    }

    this.ctx.textAlign = "left";
  }

  drawParticles() {
    this.particles.forEach((particle) => {
      const alpha = particle.life / particle.maxLife;
      this.ctx.fillStyle = particle.color
        .replace(")", `, ${alpha})`)
        .replace("#", "rgba(");
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  drawStarfield() {
    // Animated starfield
    const time = Date.now() * 0.001;
    for (let i = 0; i < 100; i++) {
      const x = (i * 37 + time * 10) % this.canvas.width;
      const y = (i * 23 + time * 5) % this.canvas.height;
      const brightness = Math.sin(i * 0.1 + time) * 0.5 + 0.5;

      this.ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.6})`;
      this.ctx.fillRect(x, y, 1, 1);
    }
  }

  drawArcadeFrame() {
    // Guard against minimal/mocked contexts in tests
    const ctx = this.ctx;
    if (!ctx) return;
    const canStroke = typeof ctx.strokeRect === 'function';
    const canFill = typeof ctx.fillRect === 'function';
    // Retro arcade machine frame
    if (canStroke) {
      ctx.strokeStyle = "#444444";
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, this.canvas.width - 40, this.canvas.height - 40);
      // Inner frame
      ctx.strokeStyle = "#666666";
      ctx.lineWidth = 2;
      ctx.strokeRect(30, 30, this.canvas.width - 60, this.canvas.height - 60);
    }
    // Corner decorations (optional if fill unavailable)
    if (canFill) {
      ctx.fillStyle = "#888888";
      ctx.fillRect(20, 20, 20, 20);
      ctx.fillRect(this.canvas.width - 40, 20, 20, 20);
      ctx.fillRect(20, this.canvas.height - 40, 20, 20);
      ctx.fillRect(this.canvas.width - 40, this.canvas.height - 40, 20, 20);
    }
  }

  drawTitle() {
    // Title with enhanced glow effect
    const titleY = 80;
    const glowIntensity = 0.5 + this.titleGlow * 0.5;

    // Outer glow
    this.ctx.shadowColor = "#00ff00";
    this.ctx.shadowBlur = 20 * glowIntensity;
    this.ctx.fillStyle = `rgba(0, 255, 0, ${0.3 * glowIntensity})`;
    this.ctx.font = "bold 44px monospace";
    this.ctx.textAlign = "center";
    this.ctx.fillText("RETRO ARCADE", this.canvas.width / 2, titleY);

    // Inner glow
    this.ctx.shadowBlur = 10 * glowIntensity;
    this.ctx.fillStyle = `rgba(0, 255, 0, ${0.6 * glowIntensity})`;
    this.ctx.font = "bold 42px monospace";
    this.ctx.fillText("RETRO ARCADE", this.canvas.width / 2, titleY);

    // Main title
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "bold 40px monospace";
    this.ctx.fillText("RETRO ARCADE", this.canvas.width / 2, titleY);

    // Animated underline
    const time = Date.now() * 0.005;
    const underlineWidth = 200 + Math.sin(time) * 20;
    this.ctx.strokeStyle = "#00ff00";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2 - underlineWidth / 2, titleY + 10);
    this.ctx.lineTo(this.canvas.width / 2 + underlineWidth / 2, titleY + 10);
    this.ctx.stroke();

    // Subtitle with subtle animation
    this.ctx.fillStyle = "#888888";
    this.ctx.font = "16px monospace";
    const subtitleOffset = Math.sin(time * 0.5) * 2;
    this.ctx.fillText(
      "CLASSIC GAMES REBORN",
      this.canvas.width / 2,
      titleY + 30 + subtitleOffset
    );
  }

  drawMenuOptions() {
    this.ctx.font = "bold 24px monospace";
    const menuStartY = this.canvas.height / 2 - 100;
    const itemSpacing = 60;

  this.games.forEach((game, index) => {
      const y = menuStartY + index * itemSpacing;
      const isSelected = index === this.selectedGame;
      const isUnlocked = this.unlockedGames[index];
      const requiredScore = this.gameManager.unlockRequirements[game];

      // Selection background
      if (isSelected) {
        // Animated selection box
        const pulse = Math.sin(Date.now() * 0.005) * 0.1 + 0.9;
        this.ctx.fillStyle = `rgba(255, 255, 0, ${0.3 * pulse})`;
        this.ctx.fillRect(this.canvas.width / 2 - 180, y - 20, 360, 35);

        // Selection border
        this.ctx.strokeStyle = "#ffff00";
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.canvas.width / 2 - 180, y - 20, 360, 35);
      }

      // Game icon and name
      let icon = "▶";
      let textColor = "#666666";

      if (isSelected) {
        textColor = "#ffff00";
        icon = "►";
      } else if (isUnlocked) {
        textColor = "#ffffff";
      }

      this.ctx.fillStyle = textColor;
      this.ctx.textAlign = "center";

      // Draw icon
      this.ctx.font = "bold 20px monospace";
      this.ctx.fillText(icon, this.canvas.width / 2 - 120, y);

      // Draw game name
      this.ctx.font = "bold 24px monospace";
      // Show alias hint if player has referred to game differently (Space Invaders => Defenders)
      let displayName = game;
      if (game === 'Space Invaders') {
        displayName = 'Space Invaders'; // base
      }
      this.ctx.fillText(displayName, this.canvas.width / 2, y);

      // Draw lock icon for locked games
      if (!isUnlocked) {
        this.ctx.fillStyle = "#ff6666";
        this.ctx.font = "bold 20px monospace";
        this.ctx.fillText("🔒", this.canvas.width / 2 + 120, y);

        // Unlock requirements and progress
  if (requiredScore > 0) {
          // Use total player score for locked progress (more intuitive)
          const totalScore = this.gameManager.totalPlayerScore || 0;
          const progressPercent = Math.min(
            (totalScore / requiredScore) * 100,
            100
          );

          this.ctx.fillStyle = "#888888";
          this.ctx.font = "12px monospace";
          let progressText = `${totalScore}/${requiredScore} pts (${Math.round(progressPercent)}%)`;
          if (game === 'Space Invaders') {
            progressText += ' - Final challenge';
          }
          this.ctx.fillText(
            progressText,
            this.canvas.width / 2,
            y + 20
          );

          // Progress bar
          const barWidth = 150;
          const barHeight = 4;
          const barX = this.canvas.width / 2 - barWidth / 2;
          const barY = y + 28;

          // Background
          this.ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
          this.ctx.fillRect(barX, barY, barWidth, barHeight);

          // Progress
          this.ctx.fillStyle = progressPercent >= 100 ? "#00ff00" : "#ffff00";
          this.ctx.fillRect(
            barX,
            barY,
            (barWidth * progressPercent) / 100,
            barHeight
          );
        }
      } else {
        // Show unlocked indicator
        this.ctx.fillStyle = "#00ff00";
        this.ctx.font = "bold 16px monospace";
        this.ctx.fillText("✓", this.canvas.width / 2 + 120, y);
      }
    });
  }

  showLockedMessage(gameName) {
    const required = this.gameManager.unlockRequirements[gameName];
    const total = this.gameManager.totalPlayerScore || 0;
    if (required) {
      const remaining = Math.max(required - total, 0);
      this.lockMessage = remaining > 0
        ? `${gameName} unlocks at ${required} pts. Need ${remaining} more.`
        : `${gameName} will unlock after next score save.`;
    } else {
      this.lockMessage = `${gameName} is currently locked.`;
    }
    this.lockMessageTimer = 180; // ~3 seconds at 60fps
    this.gameManager.playSound("shoot");
  }

  drawInstructions() {
    const instructionsY = this.canvas.height - 100;

    // Background for instructions
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(0, instructionsY - 15, this.canvas.width, 100);

    // Instructions text
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "14px monospace";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "↑↓/WS: Navigate • ENTER/Space: Select • Click: Play • ESC: Exit",
      this.canvas.width / 2,
      instructionsY
    );

    this.ctx.fillStyle = "#888888";
    this.ctx.font = "12px monospace";
    this.ctx.fillText(
      "Mouse/Touchpad: Move • WASD/Arrows: Move • Space/Click: Shoot",
      this.canvas.width / 2,
      instructionsY + 18
    );

    // Achievement progress
    const achievements = this.gameManager.achievements;
    const unlockedCount = Object.values(achievements).filter(Boolean).length;
    const totalAchievements = Object.keys(achievements).length;

    this.ctx.fillStyle = "#ff6b35";
    this.ctx.font = "12px monospace";
    this.ctx.fillText(
      `🏆 Achievements: ${unlockedCount}/${totalAchievements}`,
      this.canvas.width / 2,
      instructionsY + 35
    );

    // Unlock progress hint
    const lockedGames = this.games.filter(
      (game, index) => !this.unlockedGames[index]
    );
    if (lockedGames.length > 0) {
      this.ctx.fillStyle = "#ffff00";
      this.ctx.font = "11px monospace";
      this.ctx.fillText(
        "💡 Play games to earn points and unlock new challenges!",
        this.canvas.width / 2,
        instructionsY + 50
      );
    }

    // Show current best scores
    this.ctx.fillStyle = "#00aaff";
    this.ctx.font = "10px monospace";
    const bestScores = this.games.map((game) =>
      this.gameManager.getBestScore(game)
    );
    const totalScore = bestScores.reduce((sum, score) => sum + score, 0);
    this.ctx.fillText(
      `Total Points: ${totalScore} | Best Scores: ${bestScores.join(" | ")}`,
      this.canvas.width / 2,
      instructionsY + 65
    );

    // Optional dynamic hint (single line) from ArcadeHints module if present and not already drawn this frame
    try {
      if (typeof window !== 'undefined' && window.ArcadeHints && !this._lastHintTs) {
        const hint = window.ArcadeHints.getArcadeHint();
        if (hint && hint.text) {
          this.ctx.fillStyle = '#ffaa00';
          this.ctx.font = '10px monospace';
          this.ctx.fillText(hint.text, this.canvas.width / 2, instructionsY + 80);
          this._lastHintTs = Date.now();
        }
      }
    } catch (e) {
      // Non-fatal hint retrieval issue
      if (typeof console !== 'undefined' && console.debug) {
        console.debug('Hint retrieval failed', e);
      }
    }
  }

  createSelectionParticles() {
    const menuStartY = this.canvas.height / 2 - 100;
    const itemSpacing = 60;
    const y = menuStartY + this.selectedGame * itemSpacing;

    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: this.canvas.width / 2 - 200 + Math.random() * 400,
        y: y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 30,
        maxLife: 30,
        color: "#ffff00",
      });
    }
  }

  createLaunchParticles() {
    const menuStartY = this.canvas.height / 2 - 100;
    const itemSpacing = 60;
    const y = menuStartY + this.selectedGame * itemSpacing;

    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: this.canvas.width / 2,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 60,
        maxLife: 60,
        color: "#00ff00",
      });
    }
  }

  updateParticles() {
    this.particles = this.particles.filter((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      particle.life--;
      return particle.life > 0;
    });
  }
}
