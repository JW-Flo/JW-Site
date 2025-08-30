// Menu Game - Handles game selection interface
export class MenuGame {
  constructor(canvas, gameManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.gameManager = gameManager;
    this.selectedGame = 0;
    this.games = gameManager.games;
    this.unlockedGames = gameManager.unlockedGames;
    this.animationId = null;

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
    document.addEventListener("keydown", this.boundHandleKeyPress);
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
    document.removeEventListener("keydown", this.boundHandleKeyPress);
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
      }
    }
  }

  gameLoop() {
    this.updateParticles();
    this.updateTitleGlow();
    this.draw();
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
    // Retro arcade machine frame
    this.ctx.strokeStyle = "#444444";
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(
      20,
      20,
      this.canvas.width - 40,
      this.canvas.height - 40
    );

    // Inner frame
    this.ctx.strokeStyle = "#666666";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(
      30,
      30,
      this.canvas.width - 60,
      this.canvas.height - 60
    );

    // Corner decorations
    this.ctx.fillStyle = "#888888";
    this.ctx.fillRect(20, 20, 20, 20);
    this.ctx.fillRect(this.canvas.width - 40, 20, 20, 20);
    this.ctx.fillRect(20, this.canvas.height - 40, 20, 20);
    this.ctx.fillRect(this.canvas.width - 40, this.canvas.height - 40, 20, 20);
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
      this.ctx.fillText(game, this.canvas.width / 2, y);

      // Draw lock icon for locked games
      if (!isUnlocked) {
        this.ctx.fillStyle = "#ff6666";
        this.ctx.font = "bold 20px monospace";
        this.ctx.fillText("🔒", this.canvas.width / 2 + 120, y);

        // Unlock requirements
        const requiredScores = [0, 500, 1000, 0];
        if (requiredScores[index] > 0) {
          this.ctx.fillStyle = "#888888";
          this.ctx.font = "14px monospace";
          this.ctx.fillText(
            `${requiredScores[index]} pts to unlock`,
            this.canvas.width / 2,
            y + 25
          );
        }
      }
    });
  }

  drawInstructions() {
    const instructionsY = this.canvas.height - 50;

    // Background for instructions
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(0, instructionsY - 15, this.canvas.width, 50);

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
      instructionsY + 20
    );
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
