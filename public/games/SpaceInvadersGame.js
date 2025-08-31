// Space Invaders Game - Classic arcade shooter
export class SpaceInvadersGame {
  constructor(canvas, gameManager) {
    console.log("SpaceInvadersGame: constructor start", { canvas });
    this.canvas = canvas;
    try {
      this.ctx = canvas.getContext("2d");
    } catch (e) {
      console.error(
        "SpaceInvadersGame: failed to get 2D context from provided canvas",
        e
      );
      this.ctx = null;
    }
    this.gameManager = gameManager;

    if (!this.ctx) {
      console.warn(
        "SpaceInvadersGame: primary canvas 2D context is not available. Attempting fallback."
      );
    }

    // Arcade machine dimensions
    this.arcadeWidth = (this.canvas && this.canvas.width) || 800;
    this.arcadeHeight = (this.canvas && this.canvas.height) || 600;
    this.gameAreaWidth = 600; // Smaller game area
    this.gameAreaHeight = 400;
    this.gameAreaX = (this.arcadeWidth - this.gameAreaWidth) / 2;
    this.gameAreaY = 120; // Leave room for marquee

    // Create separate canvas for game rendering
    this.gameCanvas = document.createElement("canvas");
    this.gameCanvas.width = this.gameAreaWidth;
    this.gameCanvas.height = this.gameAreaHeight;
    try {
      this.gameCtx = this.gameCanvas.getContext("2d");
    } catch (e) {
      console.error(
        "SpaceInvadersGame: failed to get 2D context from internal gameCanvas",
        e
      );
      this.gameCtx = null;
    }

    if (!this.ctx && this.gameCtx) {
      // If the main canvas context is missing, use the internal canvas context for offscreen rendering
      console.warn(
        "SpaceInvadersGame: using internal gameCanvas context as primary renderer (main canvas ctx missing)"
      );
      this.ctx = this.gameCtx;
    }

    if (!this.ctx || !this.gameCtx) {
      console.error("SpaceInvadersGame: missing canvas 2D contexts", {
        ctx: !!this.ctx,
        gameCtx: !!this.gameCtx,
        canvas,
      });
      // Continue with reduced functionality but avoid throwing — GameManager will log instantiation errors upstream.
    }

    // Game state
    this.player = {
      x: this.gameAreaWidth / 2,
      y: this.gameAreaHeight - 50,
      width: 40,
      height: 20,
      vx: 0, // velocity x
      speed: 6, // Constant speed for fluid movement
    };
    this.bullets = [];
    this.invaders = [];
    this.invaderBullets = [];
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameOver = false;
    this.paused = false;

    // Enhanced game settings
    this.invaderSpeed = 1.2; // faster invaders
    this.invaderDirection = 1;
    this.invaderDropDistance = 25; // bigger drops
    this.bulletSpeed = 7; // faster bullets
    this.invaderBulletSpeed = 4; // faster invader bullets
    this.invaderRows = 5;
    this.invaderCols = 11;

    // New gameplay features
    this.powerUps = [];
    this.shieldActive = false;
    this.shieldTimer = 0;
    this.multiShot = false;
    this.multiShotTimer = 0;
    this.lastShot = 0;
    this.shootCooldown = 150; // milliseconds between shots

    // Input state
    this.keys = {
      left: false,
      right: false,
      shoot: false,
    };

    // Accuracy tracking
    this.shotsFired = 0;
    this.shotsHit = 0;

    this.initializeInvaders();
  }

  initializeInvaders() {
    this.invaders = [];
    const startX = 60;
    const startY = 80;
    const spacingX = 45;
    const spacingY = 35;

    // Classic Space Invaders formation: 5 rows x 11 columns = 55 invaders
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 11; col++) {
        this.invaders.push({
          x: startX + col * spacingX,
          y: startY + row * spacingY,
          width: 24,
          height: 16,
          alive: true,
          row: row,
          animationFrame: 0,
        });
      }
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
    document.removeEventListener("keydown", this.boundHandleKeyPress);
    document.removeEventListener("keyup", this.boundHandleKeyUp);
  }

  handleKeyPress(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      // Exit back to main website
      if (this.gameManager && this.gameManager.overlay) {
        this.gameManager.overlay.deactivate();
      }
      return;
    }

    if (this.gameOver) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        this.restart();
      }
      return;
    }

    if (e.key === "p" || e.key === "P") {
      e.preventDefault();
      e.stopPropagation();
      this.paused = !this.paused;
      return;
    }

    if (e.key === "s" || e.key === "S") {
      e.preventDefault();
      e.stopPropagation();
      // Manual score save
      if (!this.gameOver && this.score > 0) {
        this.gameManager.saveScore("Space Invaders", this.score);
      }
      return;
    }

    // Update key states for smooth movement
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      e.preventDefault();
      e.stopPropagation();
      this.keys.left = true;
    } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      e.preventDefault();
      e.stopPropagation();
      this.keys.right = true;
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      this.keys.shoot = true;
    }
  }

  handleKeyUp(e) {
    // Update key states
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      e.preventDefault();
      e.stopPropagation();
      this.keys.left = false;
    } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      e.preventDefault();
      e.stopPropagation();
      this.keys.right = false;
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      this.keys.shoot = false;
    }
  }

  shoot() {
    const now = Date.now();
    if (now - this.lastShot < this.shootCooldown) return;

    if (this.multiShot) {
      // Triple shot power-up
      for (let i = -1; i <= 1; i++) {
        if (this.bullets.length < 9) {
          this.bullets.push({
            x: this.player.x + this.player.width / 2 - 2 + i * 8,
            y: this.player.y,
            width: 4,
            height: 10,
            vx: i * 0.5, // slight spread
          });
        }
      }
    } else {
      // Normal single shot
      const canShoot = this.bullets.length < 3;
      if (canShoot) {
        this.bullets.push({
          x: this.player.x + this.player.width / 2 - 2,
          y: this.player.y,
          width: 4,
          height: 10,
        });
      } else {
        // Bullet limit reached, do nothing
      }
    }

    this.lastShot = now;
    this.gameManager.playSound("shoot");
    this.shotsFired++; // Increment shots fired counter
  }

  update() {
    if (this.gameOver || this.paused) return;

    this.updatePlayer();
    this.updateBullets();
    this.updateInvaders();
    this.updatePowerUps();
    this.handleShooting();
    this.checkCollisions();
    this.checkWinLoseConditions();
  }

  updatePlayer() {
    // Update player position with smooth, fluid movement
    this.player.vx = 0; // Reset velocity each frame
    if (this.keys.left) {
      this.player.vx = -this.player.speed;
    }
    if (this.keys.right) {
      this.player.vx = this.player.speed;
    }

    this.player.x += this.player.vx;
    this.player.x = Math.max(
      0,
      Math.min(this.gameAreaWidth - this.player.width, this.player.x)
    );
  }

  updateBullets() {
    // Update player bullets
    this.bullets = this.bullets.filter((bullet) => {
      bullet.y -= this.bulletSpeed;
      if (bullet.vx) {
        bullet.x += bullet.vx;
      }
      return bullet.y > 0;
    });

    // Update invader bullets
    this.invaderBullets = this.invaderBullets.filter((bullet) => {
      bullet.y += this.invaderBulletSpeed;
      return bullet.y < this.canvas.height;
    });
  }

  updateInvaders() {
    // Update invaders with animation
    let shouldDrop = false;
    const animationTimer = Date.now();
    this.invaders.forEach((invader) => {
      if (!invader.alive) return;

      invader.x += this.invaderSpeed * this.invaderDirection;

      // Update animation frame every 500ms
      if (animationTimer % 1000 < 500) {
        invader.animationFrame = 0;
      } else {
        invader.animationFrame = 1;
      }

      if (
        invader.x <= 20 ||
        invader.x + invader.width >= this.gameAreaWidth - 20
      ) {
        shouldDrop = true;
      }
    });

    if (shouldDrop) {
      this.invaderDirection *= -1;
      this.invaders.forEach((invader) => {
        if (invader.alive) invader.y += this.invaderDropDistance;
      });
    }

    // Random invader shooting (more frequent for classic feel)
    if (Math.random() < 0.008) {
      const aliveInvaders = this.invaders.filter((inv) => inv.alive);
      if (aliveInvaders.length > 0) {
        const shooter =
          aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)];
        this.invaderBullets.push({
          x: shooter.x + shooter.width / 2 - 2,
          y: shooter.y + shooter.height,
          width: 4,
          height: 10,
        });
      }
    }
  }

  updatePowerUps() {
    // Update power-up timers
    if (this.shieldActive && Date.now() > this.shieldTimer) {
      this.shieldActive = false;
    }
    if (this.multiShot && Date.now() > this.multiShotTimer) {
      this.multiShot = false;
    }

    // Spawn power-ups occasionally
    if (Math.random() < 0.0005 && this.powerUps.length < 2) {
      this.spawnPowerUp();
    }

    // Update power-ups
    this.powerUps = this.powerUps.filter((powerUp) => {
      powerUp.y += powerUp.vy;
      return powerUp.y < this.canvas.height + 20;
    });
  }

  handleShooting() {
    // Handle shooting input
    if (this.keys.shoot) {
      this.shoot();
    }
  }

  checkWinLoseConditions() {
    // Check win condition
    const aliveInvaders = this.invaders.filter((inv) => inv.alive);
    if (aliveInvaders.length === 0) {
      this.levelUp();
    }

    // Check lose condition
    if (
      this.invaders.some(
        (inv) => inv.alive && inv.y + inv.height >= this.player.y
      )
    ) {
      this.gameOver = true;
      this.gameManager.playSound("gameOver");
      // Save the score when game ends
      if (this.score > 0) {
        this.gameManager.saveScore("Space Invaders", this.score);
      }
    }
  }

  checkCollisions() {
    // Player bullets vs invaders
    this.bullets.forEach((bullet, bulletIndex) => {
      this.invaders.forEach((invader) => {
        if (invader.alive && this.collides(bullet, invader)) {
          invader.alive = false;
          this.bullets.splice(bulletIndex, 1);
          this.score += 10;
          this.shotsHit++; // Track successful hits
          this.gameManager.playSound("explosion");
        }
      });
    });

    // Invader bullets vs player (with shield protection)
    this.invaderBullets.forEach((bullet, bulletIndex) => {
      if (this.collides(bullet, this.player)) {
        if (this.shieldActive) {
          // Shield absorbs the hit
          this.invaderBullets.splice(bulletIndex, 1);
          this.shieldActive = false;
          this.gameManager.playSound("explosion");
        } else {
          // Normal hit
          this.invaderBullets.splice(bulletIndex, 1);
          this.lives--;
          this.gameManager.playSound("explosion");
          if (this.lives <= 0) {
            this.gameOver = true;
            this.gameManager.playSound("gameOver");
            // Save the score when game ends
            if (this.score > 0) {
              this.gameManager.saveScore("Space Invaders", this.score);
            }
          }
        }
      }
    });

    // Invaders collision with player (game over if invader touches player)
    this.invaders.forEach((invader) => {
      if (invader.alive && this.collides(invader, this.player)) {
        this.gameOver = true;
        this.gameManager.playSound("gameOver");
        // Save the score when game ends
        if (this.score > 0) {
          this.gameManager.saveScore("Space Invaders", this.score);
        }
      }
    });

    // Power-ups collection
    this.powerUps.forEach((powerUp, index) => {
      if (this.collides(powerUp, this.player)) {
        this.powerUps.splice(index, 1);
        this.collectPowerUp(powerUp.type);
      }
    });
  }

  collides(obj1, obj2) {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    );
  }

  collectPowerUp(type) {
    if (type === "shield") {
      this.shieldActive = true;
      this.shieldTimer = Date.now() + 10000; // Shield lasts 10 seconds
      this.gameManager.playSound("powerUp");
    } else if (type === "multiShot") {
      this.multiShot = true;
      this.multiShotTimer = Date.now() + 5000; // Multi-shot lasts 5 seconds
      this.gameManager.playSound("powerUp");
    }
  }

  levelUp() {
    this.level++;
    this.invaderSpeed += 0.3; // Slower increase for better gameplay
    this.invaderDirection = 1; // Reset direction
    this.bullets = []; // Clear bullets
    this.invaderBullets = []; // Clear invader bullets

    // Reset invaders to top with increased speed
    this.invaders.forEach((invader) => {
      if (invader.alive) {
        invader.y = 80 + invader.row * 35; // Reset to top
      }
    });

    this.gameManager.playSound("levelUp");
  }

  restart() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameOver = false;
    this.invaderSpeed = 1;
    this.invaderDirection = 1;
    this.bullets = [];
    this.invaderBullets = [];
    this.powerUps = [];
    this.shieldActive = false;
    this.multiShot = false;
    this.initializeInvaders();
  }

  gameLoop() {
    this.update();
    this.draw();
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  draw() {
    // Ensure contexts exist before drawing
    if (!this.ctx) {
      // If there's no rendering context, skip drawing but keep loop running for resilience
      return;
    }

    // Clear main canvas
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw arcade cabinet background
    this.drawArcadeCabinet();

    // Draw game on separate canvas first
    this.drawGameToCanvas();

    // Draw game area with bezel
    this.drawGameBezel();

    // Draw marquee at top
    this.drawMarquee();

    // Draw control panel at bottom
    this.drawControlPanel();

    // Draw side decorations
    this.drawSideDecorations();

    // Draw score display
    this.drawScoreDisplay();

    // Draw technical demonstration overlay
    this.drawTechnicalDemo();

    if (this.paused) {
      this.drawPaused();
    }

    if (this.gameOver) {
      this.drawGameOver();
    }
  }

  drawPlayer() {
    const { x, y, width, height } = this.player;

    // Classic Space Invaders player ship design
    this.ctx.fillStyle = "#00ff00";

    // Main body
    this.ctx.fillRect(x + width / 2 - 8, y + height - 8, 16, 8);

    // Wings
    this.ctx.fillRect(x + width / 2 - 12, y + height - 12, 8, 4);
    this.ctx.fillRect(x + width / 2 + 4, y + height - 12, 8, 4);

    // Cannon
    this.ctx.fillRect(x + width / 2 - 2, y + height - 16, 4, 8);
  }

  drawPlayerToCanvas() {
    const { x, y, width, height } = this.player;

    // Classic Space Invaders player ship design
    this.gameCtx.fillStyle = "#00ff00";

    // Main body
    this.gameCtx.fillRect(x + width / 2 - 8, y + height - 8, 16, 8);

    // Wings
    this.gameCtx.fillRect(x + width / 2 - 12, y + height - 12, 8, 4);
    this.gameCtx.fillRect(x + width / 2 + 4, y + height - 12, 8, 4);

    // Cannon
    this.gameCtx.fillRect(x + width / 2 - 2, y + height - 16, 4, 8);
  }

  drawPlayerBullets() {
    this.ctx.fillStyle = "#ffffff";
    this.bullets.forEach((bullet) => {
      // Classic bullet design - thin white line
      this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
  }

  drawPlayerBulletsToCanvas() {
    this.gameCtx.fillStyle = "#ffffff";
    this.bullets.forEach((bullet) => {
      // Classic bullet design - thin white line
      this.gameCtx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
  }

  drawInvaderBullets() {
    this.ctx.fillStyle = "#ff0000";
    this.invaderBullets.forEach((bullet) => {
      // Classic invader bullet - red zigzag pattern
      this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      this.ctx.fillRect(bullet.x - 2, bullet.y + 3, bullet.width + 4, 2);
    });
  }

  drawInvaderBulletsToCanvas() {
    this.gameCtx.fillStyle = "#ff0000";
    this.invaderBullets.forEach((bullet) => {
      // Classic invader bullet - red zigzag pattern
      this.gameCtx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      this.gameCtx.fillRect(bullet.x - 2, bullet.y + 3, bullet.width + 4, 2);
    });
  }

  drawInvaders() {
    this.invaders.forEach((invader) => {
      if (!invader.alive) return;

      const { x, y, width, height, row, animationFrame } = invader;

      // Classic Space Invaders - all aliens are the same color (white/green)
      this.ctx.fillStyle = "#00ff00"; // Classic green color for all aliens

      // Draw different alien designs based on row
      if (row === 0) {
        // Top row - Squid-like alien
        this.drawSquidAlien(x, y, width, height, animationFrame);
      } else if (row === 1 || row === 2) {
        // Middle rows - Bug-like alien
        this.drawBugAlien(x, y, width, height, animationFrame);
      } else {
        // Bottom rows - Crab-like alien
        this.drawCrabAlien(x, y, width, height, animationFrame);
      }
    });
  }

  drawInvadersToCanvas() {
    this.invaders.forEach((invader) => {
      if (!invader.alive) return;

      const { x, y, width, height, row, animationFrame } = invader;

      // Classic Space Invaders - all aliens are the same color (white/green)
      this.gameCtx.fillStyle = "#00ff00"; // Classic green color for all aliens

      // Draw different alien designs based on row
      if (row === 0) {
        // Top row - Squid-like alien
        this.drawSquidAlienToCanvas(x, y, width, height, animationFrame);
      } else if (row === 1 || row === 2) {
        // Middle rows - Bug-like alien
        this.drawBugAlienToCanvas(x, y, width, height, animationFrame);
      } else {
        // Bottom rows - Crab-like alien
        this.drawCrabAlienToCanvas(x, y, width, height, animationFrame);
      }
    });
  }

  drawSquidAlien(x, y, width, height, frame) {
    // Squid alien design (classic Space Invaders top row)
    const offset = frame * 2;

    // Eyes
    this.ctx.fillRect(x + 4, y + 2, 4, 4);
    this.ctx.fillRect(x + width - 8, y + 2, 4, 4);

    // Head
    this.ctx.fillRect(x + 2, y + 6, width - 4, 4);

    // Tentacles (animated)
    this.ctx.fillRect(x + 2 + offset, y + 10, 2, 4);
    this.ctx.fillRect(x + 6 + offset, y + 10, 2, 4);
    this.ctx.fillRect(x + width - 8 - offset, y + 10, 2, 4);
    this.ctx.fillRect(x + width - 4 - offset, y + 10, 2, 4);
  }

  drawSquidAlienToCanvas(x, y, width, height, frame) {
    // Squid alien design (classic Space Invaders top row)
    const offset = frame * 2;

    // Eyes
    this.gameCtx.fillRect(x + 4, y + 2, 4, 4);
    this.gameCtx.fillRect(x + width - 8, y + 2, 4, 4);

    // Head
    this.gameCtx.fillRect(x + 2, y + 6, width - 4, 4);

    // Tentacles (animated)
    this.gameCtx.fillRect(x + 2 + offset, y + 10, 2, 4);
    this.gameCtx.fillRect(x + 6 + offset, y + 10, 2, 4);
    this.gameCtx.fillRect(x + width - 8 - offset, y + 10, 2, 4);
    this.gameCtx.fillRect(x + width - 4 - offset, y + 10, 2, 4);
  }

  drawBugAlien(x, y, width, height, frame) {
    // Bug alien design (classic Space Invaders middle rows)
    const offset = frame * 1;

    // Eyes
    this.ctx.fillRect(x + 3, y + 2, 3, 3);
    this.ctx.fillRect(x + width - 6, y + 2, 3, 3);

    // Head
    this.ctx.fillRect(x + 2, y + 5, width - 4, 3);

    // Body segments
    this.ctx.fillRect(x + 4 + offset, y + 8, width - 8, 2);
    this.ctx.fillRect(x + 2, y + 10, width - 4, 2);

    // Legs
    this.ctx.fillRect(x + 1, y + 12, 2, 3);
    this.ctx.fillRect(x + width - 3, y + 12, 2, 3);
  }

  drawBugAlienToCanvas(x, y, width, height, frame) {
    // Bug alien design (classic Space Invaders middle rows)
    const offset = frame * 1;

    // Eyes
    this.gameCtx.fillRect(x + 3, y + 2, 3, 3);
    this.gameCtx.fillRect(x + width - 6, y + 2, 3, 3);

    // Head
    this.gameCtx.fillRect(x + 2, y + 5, width - 4, 3);

    // Body segments
    this.gameCtx.fillRect(x + 4 + offset, y + 8, width - 8, 2);
    this.gameCtx.fillRect(x + 2, y + 10, width - 4, 2);

    // Legs
    this.gameCtx.fillRect(x + 1, y + 12, 2, 3);
    this.gameCtx.fillRect(x + width - 3, y + 12, 2, 3);
  }

  drawCrabAlien(x, y, width, height, frame) {
    // Crab alien design (classic Space Invaders bottom rows)
    const offset = frame * 1;

    // Eyes
    this.ctx.fillRect(x + 4, y + 2, 2, 2);
    this.ctx.fillRect(x + width - 6, y + 2, 2, 2);

    // Head
    this.ctx.fillRect(x + 3, y + 4, width - 6, 2);

    // Body
    this.ctx.fillRect(x + 2, y + 6, width - 4, 3);

    // Claws (animated)
    this.ctx.fillRect(x + 1 + offset, y + 9, 3, 2);
    this.ctx.fillRect(x + width - 4 - offset, y + 9, 3, 2);

    // Legs
    this.ctx.fillRect(x + 4, y + 11, 1, 3);
    this.ctx.fillRect(x + width - 5, y + 11, 1, 3);
  }

  drawCrabAlienToCanvas(x, y, width, height, frame) {
    // Crab alien design (classic Space Invaders bottom rows)
    const offset = frame * 1;

    // Eyes
    this.gameCtx.fillRect(x + 4, y + 2, 2, 2);
    this.gameCtx.fillRect(x + width - 6, y + 2, 2, 2);

    // Head
    this.gameCtx.fillRect(x + 3, y + 4, width - 6, 2);

    // Body
    this.gameCtx.fillRect(x + 2, y + 6, width - 4, 3);

    // Claws (animated)
    this.gameCtx.fillRect(x + 1 + offset, y + 9, 3, 2);
    this.gameCtx.fillRect(x + width - 4 - offset, y + 9, 3, 2);

    // Legs
    this.gameCtx.fillRect(x + 4, y + 11, 1, 3);
    this.gameCtx.fillRect(x + width - 5, y + 11, 1, 3);
  }

  drawUI() {
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "16px monospace";
    this.ctx.textAlign = "left";
    this.ctx.fillText(`SCORE: ${this.score}`, 20, 30);
    this.ctx.fillText(`LIVES: ${this.lives}`, 20, 50);
    this.ctx.fillText(`LEVEL: ${this.level}`, 20, 70);

    // Show active power-ups
    if (this.shieldActive) {
      this.ctx.fillStyle = "#0088ff";
      this.ctx.fillText("SHIELD ACTIVE", 20, 90);
    }
    if (this.multiShot) {
      this.ctx.fillStyle = "#ffff00";
      this.ctx.fillText("MULTI-SHOT ACTIVE", 20, this.shieldActive ? 110 : 90);
    }
  }

  drawUIToCanvas() {
    this.gameCtx.fillStyle = "#ffffff";
    this.gameCtx.font = "16px monospace";
    this.gameCtx.textAlign = "left";
    this.gameCtx.fillText(`SCORE: ${this.score}`, 20, 30);
    this.gameCtx.fillText(`LIVES: ${this.lives}`, 20, 50);
    this.gameCtx.fillText(`LEVEL: ${this.level}`, 20, 70);

    // Show active power-ups
    if (this.shieldActive) {
      this.gameCtx.fillStyle = "#0088ff";
      this.gameCtx.fillText("SHIELD ACTIVE", 20, 90);
    }
    if (this.multiShot) {
      this.gameCtx.fillStyle = "#ffff00";
      this.gameCtx.fillText(
        "MULTI-SHOT ACTIVE",
        20,
        this.shieldActive ? 110 : 90
      );
    }
  }

  drawPaused() {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Paused screen with technical overlay
    this.drawTechOverlay();

    this.ctx.fillStyle = "#ffff00";
    this.ctx.font = "bold 36px monospace";
    this.ctx.textAlign = "center";
    this.ctx.fillText("PAUSED", this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.font = "16px monospace";
    this.ctx.fillText(
      "Press P to resume",
      this.canvas.width / 2,
      this.canvas.height / 2 + 50
    );

    // Technical info during pause
    this.ctx.fillStyle = "#00aaff";
    this.ctx.font = "12px monospace";
    this.ctx.fillText(
      "Built with JavaScript Canvas API",
      this.canvas.width / 2,
      this.canvas.height / 2 + 80
    );
    this.ctx.fillText(
      "Real-time game loop @ 60fps",
      this.canvas.width / 2,
      this.canvas.height / 2 + 95
    );
  }

  drawGameOver() {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Game over screen with technical overlay
    this.drawTechOverlay();

    this.ctx.fillStyle = "#ff0000";
    this.ctx.font = "bold 36px monospace";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "GAME OVER",
      this.canvas.width / 2,
      this.canvas.height / 2 - 50
    );
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "24px monospace";
    this.ctx.fillText(
      `FINAL SCORE: ${this.score}`,
      this.canvas.width / 2,
      this.canvas.height / 2
    );

    // Performance stats
    this.ctx.fillStyle = "#ffff00";
    this.ctx.font = "14px monospace";
    this.ctx.fillText(
      `LEVEL REACHED: ${this.level}`,
      this.canvas.width / 2,
      this.canvas.height / 2 + 30
    );

    this.ctx.fillStyle = "#cccccc";
    this.ctx.font = "16px monospace";
    this.ctx.fillText(
      "Press ENTER to restart",
      this.canvas.width / 2,
      this.canvas.height / 2 + 70
    );

    // Technical achievement display
    this.drawAchievementStats();
  }

  drawTechOverlay() {
    const time = Date.now() * 0.001;

    // Animated grid background
    this.ctx.strokeStyle = "rgba(0, 255, 255, 0.1)";
    this.ctx.lineWidth = 1;

    for (let i = 0; i < this.canvas.width; i += 20) {
      const alpha = 0.1 + Math.sin(time + i * 0.01) * 0.05;
      this.ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, this.canvas.height);
      this.ctx.stroke();
    }

    for (let i = 0; i < this.canvas.height; i += 20) {
      const alpha = 0.1 + Math.sin(time + i * 0.01) * 0.05;
      this.ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.canvas.width, i);
      this.ctx.stroke();
    }
  }

  drawAchievementStats() {
    const stats = [
      {
        label: "Objects Rendered",
        value:
          this.invaders.length +
          this.bullets.length +
          this.invaderBullets.length,
      },
      { label: "Game Loop Cycles", value: Math.floor(Date.now() / 16.67) }, // Approximate frame count
      { label: "Memory Usage", value: "~2.1MB" },
      { label: "Render Engine", value: "Canvas 2D" },
    ];

    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(
      this.canvas.width / 2 - 150,
      this.canvas.height / 2 + 90,
      300,
      stats.length * 20 + 20
    );

    this.ctx.strokeStyle = "#00ff00";
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(
      this.canvas.width / 2 - 150,
      this.canvas.height / 2 + 90,
      300,
      stats.length * 20 + 20
    );

    this.ctx.fillStyle = "#00ff00";
    this.ctx.font = "10px monospace";
    this.ctx.textAlign = "left";

    stats.forEach((stat, index) => {
      const y = this.canvas.height / 2 + 110 + index * 18;
      this.ctx.fillText(
        `${stat.label}: ${stat.value}`,
        this.canvas.width / 2 - 140,
        y
      );
    });

    this.ctx.textAlign = "center";
  }

  drawArcadeCabinet() {
    // Main cabinet body - dark metallic color
    this.ctx.fillStyle = "#1a1a1a";
    this.ctx.fillRect(0, 0, this.arcadeWidth, this.arcadeHeight);

    // Cabinet sides with gradient
    const sideGradient = this.ctx.createLinearGradient(0, 0, 50, 0);
    sideGradient.addColorStop(0, "#2a2a2a");
    sideGradient.addColorStop(1, "#1a1a1a");
    this.ctx.fillStyle = sideGradient;
    this.ctx.fillRect(0, 0, 50, this.arcadeHeight);

    const sideGradient2 = this.ctx.createLinearGradient(
      this.arcadeWidth - 50,
      0,
      this.arcadeWidth,
      0
    );
    sideGradient2.addColorStop(0, "#1a1a1a");
    sideGradient2.addColorStop(1, "#2a2a2a");
    this.ctx.fillStyle = sideGradient2;
    this.ctx.fillRect(this.arcadeWidth - 50, 0, 50, this.arcadeHeight);

    // Cabinet base
    this.ctx.fillStyle = "#0f0f0f";
    this.ctx.fillRect(0, this.arcadeHeight - 80, this.arcadeWidth, 80);

    // Base trim
    this.ctx.fillStyle = "#333333";
    this.ctx.fillRect(0, this.arcadeHeight - 85, this.arcadeWidth, 5);

    // Add cabinet lighting effects
    this.drawCabinetLighting();
  }

  drawCabinetLighting() {
    const time = Date.now() * 0.001;

    // Marquee under-lighting
    const marqueeLight = this.ctx.createRadialGradient(
      this.arcadeWidth / 2,
      100,
      0,
      this.arcadeWidth / 2,
      100,
      150
    );
    marqueeLight.addColorStop(
      0,
      `rgba(255, 102, 0, ${0.3 + Math.sin(time * 3) * 0.1})`
    );
    marqueeLight.addColorStop(1, "rgba(255, 102, 0, 0)");
    this.ctx.fillStyle = marqueeLight;
    this.ctx.fillRect(0, 100, this.arcadeWidth, 50);

    // Side panel lighting
    const leftLight = this.ctx.createLinearGradient(0, 0, 80, 0);
    leftLight.addColorStop(
      0,
      `rgba(255, 102, 0, ${0.2 + Math.sin(time * 2 + 1) * 0.1})`
    );
    leftLight.addColorStop(1, "rgba(255, 102, 0, 0)");
    this.ctx.fillStyle = leftLight;
    this.ctx.fillRect(0, 120, 80, this.arcadeHeight - 200);

    const rightLight = this.ctx.createLinearGradient(
      this.arcadeWidth - 80,
      0,
      this.arcadeWidth,
      0
    );
    rightLight.addColorStop(0, "rgba(255, 102, 0, 0)");
    rightLight.addColorStop(
      1,
      `rgba(255, 102, 0, ${0.2 + Math.sin(time * 2 + 2) * 0.1})`
    );
    this.ctx.fillStyle = rightLight;
    this.ctx.fillRect(this.arcadeWidth - 80, 120, 80, this.arcadeHeight - 200);

    // Control panel under-lighting
    const panelLight = this.ctx.createRadialGradient(
      this.arcadeWidth / 2,
      this.arcadeHeight - 150,
      0,
      this.arcadeWidth / 2,
      this.arcadeHeight - 150,
      200
    );
    panelLight.addColorStop(
      0,
      `rgba(0, 255, 0, ${0.1 + Math.sin(time * 4) * 0.05})`
    );
    panelLight.addColorStop(1, "rgba(0, 255, 0, 0)");
    this.ctx.fillStyle = panelLight;
    this.ctx.fillRect(0, this.arcadeHeight - 200, this.arcadeWidth, 50);
  }

  drawGameToCanvas() {
    if (!this.gameCtx) return;
    // Clear game canvas
    this.gameCtx.fillStyle = "#000000";
    this.gameCtx.fillRect(0, 0, this.gameAreaWidth, this.gameAreaHeight);

    // Draw starfield background
    this.drawStarfieldToCanvas();

    if (!this.gameOver) {
      // Draw player ship (classic Space Invaders design)
      this.drawPlayerToCanvas();

      // Draw player bullets
      this.drawPlayerBulletsToCanvas();

      // Draw invader bullets
      this.drawInvaderBulletsToCanvas();

      // Draw invaders with classic designs
      this.drawInvadersToCanvas();

      // Draw power-ups
      this.drawPowerUpsToCanvas();

      // Draw shield effect
      if (this.shieldActive) {
        this.drawShieldToCanvas();
      }
    }

    // Draw UI
    this.drawUIToCanvas();

    // Draw instructions
    this.drawInstructionsToCanvas();
  }

  drawGameBezel() {
    // Draw bezel/frame around game area
    this.ctx.strokeStyle = "#555555";
    this.ctx.lineWidth = 8;
    this.ctx.strokeRect(
      this.gameAreaX - 4,
      this.gameAreaY - 4,
      this.gameAreaWidth + 8,
      this.gameAreaHeight + 8
    );

    // Inner bezel with metallic gradient
    const bezelGradient = this.ctx.createLinearGradient(
      this.gameAreaX - 2,
      this.gameAreaY - 2,
      this.gameAreaX + this.gameAreaWidth + 2,
      this.gameAreaY + this.gameAreaHeight + 2
    );
    bezelGradient.addColorStop(0, "#777777");
    bezelGradient.addColorStop(0.5, "#999999");
    bezelGradient.addColorStop(1, "#777777");
    this.ctx.strokeStyle = bezelGradient;
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(
      this.gameAreaX - 2,
      this.gameAreaY - 2,
      this.gameAreaWidth + 4,
      this.gameAreaHeight + 4
    );

    // Draw the game canvas onto the main canvas
    this.ctx.drawImage(this.gameCanvas, this.gameAreaX, this.gameAreaY);

    // Enhanced screen glass effect
    const glassGradient = this.ctx.createRadialGradient(
      this.gameAreaX + this.gameAreaWidth / 2,
      this.gameAreaY + this.gameAreaHeight / 2,
      0,
      this.gameAreaX + this.gameAreaWidth / 2,
      this.gameAreaY + this.gameAreaHeight / 2,
      this.gameAreaWidth / 2
    );
    glassGradient.addColorStop(0, "rgba(255, 255, 255, 0.05)");
    glassGradient.addColorStop(0.7, "rgba(255, 255, 255, 0.02)");
    glassGradient.addColorStop(1, "rgba(0, 0, 0, 0.1)");
    this.ctx.fillStyle = glassGradient;
    this.ctx.fillRect(
      this.gameAreaX,
      this.gameAreaY,
      this.gameAreaWidth,
      this.gameAreaHeight
    );

    // Screen reflection with animated effect
    const time = Date.now() * 0.001;
    const reflectionGradient = this.ctx.createLinearGradient(
      this.gameAreaX,
      this.gameAreaY,
      this.gameAreaX,
      this.gameAreaY + 60 + Math.sin(time) * 10
    );
    reflectionGradient.addColorStop(
      0,
      `rgba(255, 255, 255, ${0.1 + Math.sin(time * 2) * 0.05})`
    );
    reflectionGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    this.ctx.fillStyle = reflectionGradient;
    this.ctx.fillRect(this.gameAreaX, this.gameAreaY, this.gameAreaWidth, 60);

    // Screen corners with wear effect
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    this.ctx.fillRect(this.gameAreaX, this.gameAreaY, 20, 20);
    this.ctx.fillRect(
      this.gameAreaX + this.gameAreaWidth - 20,
      this.gameAreaY,
      20,
      20
    );
    this.ctx.fillRect(
      this.gameAreaX,
      this.gameAreaY + this.gameAreaHeight - 20,
      20,
      20
    );
    this.ctx.fillRect(
      this.gameAreaX + this.gameAreaWidth - 20,
      this.gameAreaY + this.gameAreaHeight - 20,
      20,
      20
    );
  }

  drawMarquee() {
    // Marquee background with gradient
    const marqueeGradient = this.ctx.createLinearGradient(0, 0, 0, 100);
    marqueeGradient.addColorStop(0, "#2a0033");
    marqueeGradient.addColorStop(0.5, "#1a0022");
    marqueeGradient.addColorStop(1, "#0a0011");
    this.ctx.fillStyle = marqueeGradient;
    this.ctx.fillRect(0, 0, this.arcadeWidth, 100);

    // Marquee border with glow effect
    this.ctx.shadowColor = "#ff6600";
    this.ctx.shadowBlur = 10;
    this.ctx.strokeStyle = "#ff6600";
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(10, 10, this.arcadeWidth - 20, 80);

    // Inner border
    this.ctx.shadowBlur = 5;
    this.ctx.strokeStyle = "#ffaa00";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(15, 15, this.arcadeWidth - 30, 70);

    // Reset shadow
    this.ctx.shadowBlur = 0;

    // Space Invaders title with animated glow
    const time = Date.now() * 0.001;
    const glowIntensity = 0.7 + Math.sin(time * 2) * 0.3;

    // Outer glow
    this.ctx.shadowColor = "#ffffff";
    this.ctx.shadowBlur = 15 * glowIntensity;
    this.ctx.fillStyle = `rgba(255, 255, 255, ${0.2 * glowIntensity})`;
    this.ctx.font = "bold 32px 'Courier New', monospace";
    this.ctx.textAlign = "center";
    this.ctx.fillText("SPACE INVADERS", this.arcadeWidth / 2, 45);

    // Inner glow
    this.ctx.shadowBlur = 8 * glowIntensity;
    this.ctx.fillStyle = `rgba(255, 255, 255, ${0.4 * glowIntensity})`;
    this.ctx.font = "bold 30px 'Courier New', monospace";
    this.ctx.fillText("SPACE INVADERS", this.arcadeWidth / 2, 45);

    // Main title
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "bold 28px 'Courier New', monospace";
    this.ctx.fillText("SPACE INVADERS", this.arcadeWidth / 2, 45);

    // Technical subtitle with code-like styling
    this.ctx.fillStyle = "#00ff88";
    this.ctx.font = "12px 'Courier New', monospace";
    const subtitleOffset = Math.sin(time * 0.5) * 1;
    this.ctx.fillText(
      "function gameLoop() { /* Technical Demo */ }",
      this.arcadeWidth / 2,
      65 + subtitleOffset
    );

    // Version info with professional styling
    this.ctx.fillStyle = "#ffff00";
    this.ctx.font = "10px 'Courier New', monospace";
    this.ctx.fillText(
      "v2.1.0 | Canvas API | ES6+",
      this.arcadeWidth / 2,
      80 + subtitleOffset
    );

    // Decorative elements with animation
    this.ctx.fillStyle = "#ff6600";
    for (let i = 0; i < 10; i++) {
      const x = 30 + i * ((this.arcadeWidth - 60) / 9);
      const y = 20 + Math.sin(time * 3 + i * 0.5) * 2;
      this.ctx.fillRect(x - 2, y, 4, 60);
    }

    // Side lighting effects
    this.ctx.fillStyle = `rgba(255, 102, 0, ${0.3 * glowIntensity})`;
    this.ctx.fillRect(0, 0, 30, 100);
    this.ctx.fillRect(this.arcadeWidth - 30, 0, 30, 100);

    // Technical skill indicators (subtle)
    this.drawSkillIndicators();
  }

  drawSkillIndicators() {
    const time = Date.now() * 0.001;
    const skills = ["JS", "SQL", "API", "UX"];

    this.ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    this.ctx.font = "8px monospace";

    skills.forEach((skill, index) => {
      const x = 50 + index * 80;
      const y = 90 + Math.sin(time * 2 + index) * 2;
      const alpha = 0.3 + Math.sin(time * 3 + index) * 0.1;

      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      this.ctx.fillText(skill, x, y);
    });
  }

  drawControlPanel() {
    const panelY = this.arcadeHeight - 150;

    // Control panel background with gradient
    const panelGradient = this.ctx.createLinearGradient(
      0,
      panelY,
      0,
      panelY + 150
    );
    panelGradient.addColorStop(0, "#3a3a3a");
    panelGradient.addColorStop(1, "#2a2a2a");
    this.ctx.fillStyle = panelGradient;
    this.ctx.fillRect(0, panelY, this.arcadeWidth, 150);

    // Panel border with metallic effect
    this.ctx.strokeStyle = "#555555";
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(5, panelY + 5, this.arcadeWidth - 10, 140);

    // Inner panel border
    this.ctx.strokeStyle = "#777777";
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(8, panelY + 8, this.arcadeWidth - 16, 134);

    // Player indicators with enhanced styling
    this.ctx.fillStyle = "#ff0000";
    this.ctx.font = "bold 12px monospace";
    this.ctx.textAlign = "center";
    this.ctx.fillText("1 PLAYER", 100, panelY + 25);
    this.ctx.fillText("2 PLAYERS", this.arcadeWidth - 100, panelY + 25);

    // Technical specs display
    this.drawTechSpecs(panelY);

    // Coin slot with more detail
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(this.arcadeWidth - 120, panelY + 20, 40, 60);
    this.ctx.strokeStyle = "#ffaa00";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(this.arcadeWidth - 120, panelY + 20, 40, 60);

    // Coin slot details
    this.ctx.fillStyle = "#333333";
    this.ctx.fillRect(this.arcadeWidth - 115, panelY + 25, 30, 8);
    this.ctx.fillRect(this.arcadeWidth - 115, panelY + 40, 30, 8);
    this.ctx.fillRect(this.arcadeWidth - 115, panelY + 55, 30, 8);

    // Coin slot label
    this.ctx.fillStyle = "#ffaa00";
    this.ctx.font = "10px 'Courier New', monospace";
    this.ctx.textAlign = "center";
    this.ctx.fillText("INSERT", this.arcadeWidth - 100, panelY + 45);
    this.ctx.fillText("COIN", this.arcadeWidth - 100, panelY + 58);

    // Joystick with more detail
    const joystickX = 150;
    const joystickY = panelY + 75;

    // Joystick base
    this.ctx.fillStyle = "#222222";
    this.ctx.beginPath();
    this.ctx.arc(joystickX, joystickY, 30, 0, Math.PI * 2);
    this.ctx.fill();

    // Joystick base ring
    this.ctx.strokeStyle = "#666666";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(joystickX, joystickY, 28, 0, Math.PI * 2);
    this.ctx.stroke();

    // Joystick handle with gradient
    const handleGradient = this.ctx.createRadialGradient(
      joystickX,
      joystickY,
      0,
      joystickX,
      joystickY,
      15
    );
    handleGradient.addColorStop(0, "#888888");
    handleGradient.addColorStop(1, "#444444");
    this.ctx.fillStyle = handleGradient;
    this.ctx.beginPath();
    this.ctx.arc(joystickX, joystickY, 15, 0, Math.PI * 2);
    this.ctx.fill();

    // Joystick top
    this.ctx.fillStyle = "#666666";
    this.ctx.beginPath();
    this.ctx.arc(joystickX, joystickY, 8, 0, Math.PI * 2);
    this.ctx.fill();

    // Joystick label
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "8px 'Courier New', monospace";
    this.ctx.fillText("MOVE", joystickX, joystickY + 40);

    // Fire button with more detail
    const buttonX = 300;
    const buttonY = panelY + 60;

    // Button base
    this.ctx.fillStyle = "#333333";
    this.ctx.beginPath();
    this.ctx.arc(buttonX, buttonY, 22, 0, Math.PI * 2);
    this.ctx.fill();

    // Button face
    this.ctx.fillStyle = "#ff0000";
    this.ctx.beginPath();
    this.ctx.arc(buttonX, buttonY, 20, 0, Math.PI * 2);
    this.ctx.fill();

    // Button highlight
    this.ctx.fillStyle = "#ff4444";
    this.ctx.beginPath();
    this.ctx.arc(buttonX - 3, buttonY - 3, 15, 0, Math.PI * 2);
    this.ctx.fill();

    // Button label
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "8px 'Courier New', monospace";
    this.ctx.fillText("FIRE", buttonX, buttonY + 30);

    // Start button
    const startX = 400;
    const startY = panelY + 60;

    // Start button base
    this.ctx.fillStyle = "#333333";
    this.ctx.beginPath();
    this.ctx.arc(startX, startY, 17, 0, Math.PI * 2);
    this.ctx.fill();

    // Start button face
    this.ctx.fillStyle = "#00ff00";
    this.ctx.beginPath();
    this.ctx.arc(startX, startY, 15, 0, Math.PI * 2);
    this.ctx.fill();

    // Start button highlight
    this.ctx.fillStyle = "#44ff44";
    this.ctx.beginPath();
    this.ctx.arc(startX - 2, startY - 2, 10, 0, Math.PI * 2);
    this.ctx.fill();

    // Start label
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "8px 'Courier New', monospace";
    this.ctx.fillText("START", startX, startY + 25);

    // Control instructions with better layout
    this.ctx.fillStyle = "#cccccc";
    this.ctx.font = "9px 'Courier New', monospace";
    this.ctx.textAlign = "left";
    this.ctx.fillText("A/D or ←/→ : MOVE", 50, panelY + 115);
    this.ctx.fillText("SPACE : FIRE", 50, panelY + 130);
    this.ctx.fillText("P : PAUSE", 250, panelY + 115);
    this.ctx.fillText("ESC : MENU", 250, panelY + 130);
  }

  drawTechSpecs(panelY) {
    // Technical specifications display
    const specsX = this.arcadeWidth / 2 - 100;
    const specsY = panelY + 35;

    // Specs background
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    this.ctx.fillRect(specsX, specsY, 200, 25);

    // Specs border
    this.ctx.strokeStyle = "#00aaff";
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(specsX, specsY, 200, 25);

    // Technical specs text
    this.ctx.fillStyle = "#00aaff";
    this.ctx.font = "8px monospace";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "TECHNICAL DEMO | CANVAS 2D | REAL-TIME RENDERING",
      this.arcadeWidth / 2,
      specsY + 16
    );
  }

  drawStarfieldToCanvas() {
    // Create a more detailed starfield with particle effects
    const time = Date.now() * 0.001;

    // Background stars
    this.gameCtx.fillStyle = "#ffffff";
    for (let i = 0; i < 100; i++) {
      const x = (i * 37) % this.gameAreaWidth;
      const y = (i * 23) % this.gameAreaHeight;
      const brightness = Math.sin(i * 0.1 + time) * 0.5 + 0.5;
      this.gameCtx.globalAlpha = brightness * 0.8;
      this.gameCtx.fillRect(x, y, 1, 1);
    }

    // Animated particle effects
    this.drawParticleEffects();

    // Nebula effect in background
    this.drawNebula();

    this.gameCtx.globalAlpha = 1;
  }

  drawParticleEffects() {
    const time = Date.now() * 0.001;

    // Floating particles that demonstrate physics concepts
    for (let i = 0; i < 15; i++) {
      const baseX = (i * 73) % this.gameAreaWidth;
      const baseY = (i * 41) % this.gameAreaHeight;

      // Particle movement with sine waves (trigonometric functions)
      const x = baseX + Math.sin(time * 0.5 + i) * 20;
      const y = baseY + Math.cos(time * 0.3 + i) * 15;

      // Particle color based on position and time
      const hue = (time * 30 + i * 24) % 360;
      this.gameCtx.fillStyle = `hsla(${hue}, 70%, 60%, 0.3)`;

      // Particle size variation
      const size = 1 + Math.sin(time * 2 + i) * 0.5;
      this.gameCtx.fillRect(x, y, size, size);

      // Particle trail effect
      for (let j = 1; j < 3; j++) {
        const trailX = x - Math.sin(time * 0.5 + i) * j * 3;
        const trailY = y - Math.cos(time * 0.3 + i) * j * 2;
        this.gameCtx.fillStyle = `hsla(${hue}, 70%, 60%, ${0.3 - j * 0.1})`;
        this.gameCtx.fillRect(trailX, trailY, size * 0.5, size * 0.5);
      }
    }
  }

  drawNebula() {
    const time = Date.now() * 0.001;

    // Nebula cloud effect using radial gradients
    const nebulaCenters = [
      {
        x: this.gameAreaWidth * 0.2,
        y: this.gameAreaHeight * 0.3,
        color: "#ff0066",
      },
      {
        x: this.gameAreaWidth * 0.8,
        y: this.gameAreaHeight * 0.7,
        color: "#0066ff",
      },
      {
        x: this.gameAreaWidth * 0.6,
        y: this.gameAreaHeight * 0.2,
        color: "#6600ff",
      },
    ];

    nebulaCenters.forEach((nebula, index) => {
      const gradient = this.gameCtx.createRadialGradient(
        nebula.x,
        nebula.y,
        0,
        nebula.x,
        nebula.y,
        80 + Math.sin(time + index) * 20
      );

      gradient.addColorStop(
        0,
        `rgba(${this.hexToRgb(nebula.color).join(", ")}, 0.1)`
      );
      gradient.addColorStop(
        0.5,
        `rgba(${this.hexToRgb(nebula.color).join(", ")}, 0.05)`
      );
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      this.gameCtx.fillStyle = gradient;
      this.gameCtx.fillRect(0, 0, this.gameAreaWidth, this.gameAreaHeight);
    });
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : [0, 0, 0];
  }

  drawInstructionsToCanvas() {
    // Enhanced instructions with technical details
    const time = Date.now() * 0.001;

    // Instructions background with subtle animation
    this.gameCtx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.gameCtx.fillRect(
      10,
      this.gameAreaHeight - 60,
      this.gameAreaWidth - 20,
      50
    );

    // Animated border
    const borderAlpha = 0.5 + Math.sin(time * 2) * 0.2;
    this.gameCtx.strokeStyle = `rgba(255, 255, 255, ${borderAlpha})`;
    this.gameCtx.lineWidth = 1;
    this.gameCtx.strokeRect(
      10,
      this.gameAreaHeight - 60,
      this.gameAreaWidth - 20,
      50
    );

    // Main controls
    this.gameCtx.fillStyle = "#ffffff";
    this.gameCtx.font = "bold 12px monospace";
    this.gameCtx.textAlign = "left";
    this.gameCtx.fillText("CONTROLS:", 20, this.gameAreaHeight - 45);

    this.gameCtx.fillStyle = "#cccccc";
    this.gameCtx.font = "10px monospace";
    this.gameCtx.fillText(
      "A/D or ←/→ : MOVE SHIP",
      20,
      this.gameAreaHeight - 30
    );
    this.gameCtx.fillText("SPACE : FIRE BULLET", 20, this.gameAreaHeight - 18);
    this.gameCtx.fillText("P : PAUSE GAME", 200, this.gameAreaHeight - 30);
    this.gameCtx.fillText("ESC : EXIT TO MENU", 200, this.gameAreaHeight - 18);

    // Technical info bar at bottom
    this.drawTechInfoBar();
  }

  drawTechInfoBar() {
    const time = Date.now() * 0.001;

    // Technical information display
    this.gameCtx.fillStyle = "rgba(0, 255, 255, 0.1)";
    this.gameCtx.fillRect(0, this.gameAreaHeight - 12, this.gameAreaWidth, 12);

    // Animated technical info
    const techInfo = [
      "Canvas 2D Rendering",
      "Real-time Physics",
      "Object-oriented Design",
      "Event-driven Architecture",
      "60 FPS Game Loop",
    ];

    const currentInfo = techInfo[Math.floor(time * 0.5) % techInfo.length];

    this.gameCtx.fillStyle = "#00ffff";
    this.gameCtx.font = "8px monospace";
    this.gameCtx.textAlign = "center";
    this.gameCtx.fillText(
      `TECHNICAL DEMO: ${currentInfo}`,
      this.gameAreaWidth / 2,
      this.gameAreaHeight - 4
    );
  }
}
