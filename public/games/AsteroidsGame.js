// Asteroids Game - Classic space shooter
export class AsteroidsGame {
  constructor(canvas, gameManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.gameManager = gameManager;
    this.animationId = null;

    // Game state
    this.ship = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      angle: 0,
      vx: 0,
      vy: 0,
      radius: 8,
      maxSpeed: 6, // Maximum speed
      acceleration: 0.15, // Acceleration rate
      rotationSpeed: 0.12, // Faster rotation
      speedBoost: false,
      speedBoostTimer: 0,
    };
    this.bullets = [];
    this.asteroids = [];
    this.powerUps = [];
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameOver = false;
    this.paused = false;

    // Enhanced game settings
    this.shipSpeed = 0.25; // Base acceleration
    this.friction = 0.985; // Less friction for better momentum
    this.bulletSpeed = 10; // Faster bullets
    this.asteroidSpeed = 1.5; // Faster asteroids
    this.maxAsteroids = 4;

    // Power-up states
    this.shieldActive = false;
    this.shieldTimer = 0;
    this.shieldStrength = 0; // Initialize shield strength
    this.shieldRegenRate = 0.1; // Initialize shield regen rate
    this.shieldRegenTimer = 0; // Initialize shield regen timer
    this.multiShot = false;
    this.multiShotTimer = 0;
    this.lastShot = 0;
    this.shootCooldown = 120; // milliseconds between shots

    // Bullet properties
    this.bulletDamage = 1; // Initialize bullet damage

    // Hull properties
    this.maxLives = 3; // Initialize max lives

    // Input state
    this.keys = {};

    // Upgrade system
    this.upgradePoints = 0;
    this.upgrades = {
      weapon: 0, // 0: normal, 1: triple shot, 2: rapid fire, 3: laser
      shield: 0, // 0: none, 1: basic, 2: strong, 3: regenerating
      speed: 0, // 0: normal, 1: fast, 2: very fast, 3: turbo
      hull: 0, // 0: normal, 1: reinforced, 2: armored, 3: indestructible
    };

    // Accuracy tracking
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.accuracy = 0;

    // Upgrade UI
    this.showUpgradeMenu = false;
    this.selectedUpgrade = 0;

    this.bindEvents();
    this.initializeAsteroids();
  }

  bindEvents() {
    // Bind event handlers to preserve 'this' context and enable proper cleanup
    this.boundKeyDown = (e) => {
      this.keys[e.key.toLowerCase()] = true;
      this.handleKeyPress(e);
    };
    this.boundKeyUp = (e) => {
      this.keys[e.key.toLowerCase()] = false;
    };

    document.addEventListener("keydown", this.boundKeyDown);
    document.addEventListener("keyup", this.boundKeyUp);
  }

  initializeAsteroids() {
    this.asteroids = [];
    const numAsteroids = Math.min(this.maxAsteroids + this.level - 1, 8);

    for (let i = 0; i < numAsteroids; i++) {
      let x, y;
      do {
        x = Math.random() * this.canvas.width;
        y = Math.random() * this.canvas.height;
      } while (this.distance(x, y, this.ship.x, this.ship.y) < 100);

      this.asteroids.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * this.asteroidSpeed,
        vy: (Math.random() - 0.5) * this.asteroidSpeed,
        radius: 30 + Math.random() * 20,
        size: 3,
      });
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
    document.removeEventListener("keydown", this.boundKeyDown);
    document.removeEventListener("keyup", this.boundKeyUp);
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
    } else if (e.key === "p" || e.key === "P") {
      e.preventDefault();
      e.stopPropagation();
      this.paused = !this.paused;
    } else if (e.key === "u" || e.key === "U") {
      e.preventDefault();
      e.stopPropagation();
      if (!this.gameOver && !this.paused) {
        this.showUpgradeMenu = !this.showUpgradeMenu;
      }
    } else if (this.showUpgradeMenu) {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        e.stopPropagation();
        this.selectedUpgrade = (this.selectedUpgrade - 1 + 4) % 4;
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        e.stopPropagation();
        this.selectedUpgrade = (this.selectedUpgrade + 1) % 4;
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        this.purchaseUpgrade();
      }
    }
  }

  handleKeyDown(event) {
    const key = event.key.toLowerCase();
    this.keys[key] = true;

    if (this.showUpgradeMenu) {
      // Handle upgrade menu navigation
      if (key === "arrowup" || key === "w") {
        this.selectedUpgrade = Math.max(0, this.selectedUpgrade - 1);
        event.preventDefault();
      } else if (key === "arrowdown" || key === "s") {
        this.selectedUpgrade = Math.min(3, this.selectedUpgrade + 1);
        event.preventDefault();
      } else if (key === "enter") {
        this.purchaseUpgrade();
        event.preventDefault();
      } else if (key === "escape") {
        this.showUpgradeMenu = false;
        event.preventDefault();
      }
      return;
    }

    // Game controls
    if (key === "p") {
      this.paused = !this.paused;
    } else if (key === "enter" && this.gameOver) {
      this.restart();
    }
  }

  update() {
    if (this.paused || this.gameOver) return;

    this.updateShipMovement();
    this.updateBullets();
    this.updateAsteroids();
    this.updatePowerUps();
    this.handleShooting();
    this.checkCollisions();
    this.updateAccuracy();
    this.checkWinLoseConditions();
  }

  updateShipMovement() {
    // Handle input with improved physics
    if (this.keys["arrowleft"] || this.keys["a"]) {
      this.ship.angle -= this.ship.rotationSpeed;
    }
    if (this.keys["arrowright"] || this.keys["d"]) {
      this.ship.angle += this.ship.rotationSpeed;
    }
    if (this.keys["arrowup"] || this.keys["w"]) {
      // Apply acceleration in the direction the ship is facing
      this.ship.vx += Math.cos(this.ship.angle) * this.ship.acceleration;
      this.ship.vy += Math.sin(this.ship.angle) * this.ship.acceleration;

      // Limit speed
      const speed = Math.sqrt(this.ship.vx ** 2 + this.ship.vy ** 2);
      if (speed > this.ship.maxSpeed) {
        this.ship.vx = (this.ship.vx / speed) * this.ship.maxSpeed;
        this.ship.vy = (this.ship.vy / speed) * this.ship.maxSpeed;
      }
    }

    // Apply friction
    this.ship.vx *= this.friction;
    this.ship.vy *= this.friction;

    // Update ship position with screen wrapping
    this.ship.x += this.ship.vx;
    this.ship.y += this.ship.vy;

    // Wrap around screen
    this.ship.x = (this.ship.x + this.canvas.width) % this.canvas.width;
    this.ship.y = (this.ship.y + this.canvas.height) % this.canvas.height;
  }

  updateBullets() {
    this.bullets = this.bullets.filter((bullet) => {
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      bullet.life--;

      // Wrap around screen
      bullet.x = (bullet.x + this.canvas.width) % this.canvas.width;
      bullet.y = (bullet.y + this.canvas.height) % this.canvas.height;

      return bullet.life > 0;
    });
  }

  updateAsteroids() {
    this.asteroids.forEach((asteroid) => {
      asteroid.x += asteroid.vx;
      asteroid.y += asteroid.vy;

      // Wrap around screen
      asteroid.x = (asteroid.x + this.canvas.width) % this.canvas.width;
      asteroid.y = (asteroid.y + this.canvas.height) % this.canvas.height;
    });
  }

  updatePowerUps() {
    // Update power-up timers
    if (this.shieldActive && Date.now() > this.shieldTimer) {
      this.shieldActive = false;
    }
    if (this.multiShot && Date.now() > this.multiShotTimer) {
      this.multiShot = false;
    }
    if (this.ship.speedBoost && Date.now() > this.ship.speedBoostTimer) {
      this.ship.speedBoost = false;
    }

    // Shield regeneration
    if (!this.shieldActive && this.shieldStrength > 0) {
      this.shieldRegenTimer = (this.shieldRegenTimer || 0) + 1;
      if (this.shieldRegenTimer >= 300 / this.shieldRegenRate) {
        this.shieldActive = true;
        this.shieldTimer = Date.now() + 5000; // Shield lasts 5 seconds when regenerated
        this.shieldRegenTimer = 0;
      }
    }

    // Update power-ups
    this.powerUps = this.powerUps.filter((powerUp) => {
      powerUp.y += powerUp.vy;
      return powerUp.y < this.canvas.height + 20;
    });

    // Spawn power-ups occasionally
    if (Math.random() < 0.0003 && this.powerUps.length < 1) {
      this.spawnPowerUp();
    }
  }

  handleShooting() {
    if (this.keys[" "] || this.keys["enter"]) {
      this.shoot();
    }
  }

  checkWinLoseConditions() {
    // Check win condition
    if (this.asteroids.length === 0) {
      this.levelUp();
    }
  }

  shoot() {
    const now = Date.now();
    if (now - this.lastShot < this.shootCooldown) return;

    if (this.multiShot) {
      // Triple shot power-up
      for (let i = -1; i <= 1; i++) {
        if (this.bullets.length < 12) {
          const angle = this.ship.angle + i * 0.3; // Spread shots
          this.bullets.push({
            x: this.ship.x + Math.cos(angle) * this.ship.radius,
            y: this.ship.y + Math.sin(angle) * this.ship.radius,
            vx: Math.cos(angle) * this.bulletSpeed,
            vy: Math.sin(angle) * this.bulletSpeed,
            life: 80,
          });
        }
      }
    } else {
      // Normal single shot
      const canShoot = this.bullets.length < 6;
      if (canShoot) {
        this.bullets.push({
          x: this.ship.x + Math.cos(this.ship.angle) * this.ship.radius,
          y: this.ship.y + Math.sin(this.ship.angle) * this.ship.radius,
          vx: Math.cos(this.ship.angle) * this.bulletSpeed,
          vy: Math.sin(this.ship.angle) * this.bulletSpeed,
          life: 80,
        });
      } else {
        // Bullet limit reached, do nothing
      }
    }

    this.lastShot = now;
    this.shotsFired++; // Track shots fired for accuracy
    this.gameManager.playSound("shoot");
  }

  createBullet(angleOffset) {
    return {
      x:
        this.ship.x +
        Math.cos(this.ship.angle + angleOffset) * this.ship.radius,
      y:
        this.ship.y +
        Math.sin(this.ship.angle + angleOffset) * this.ship.radius,
      vx: Math.cos(this.ship.angle + angleOffset) * this.bulletSpeed,
      vy: Math.sin(this.ship.angle + angleOffset) * this.bulletSpeed,
      life: 60, // Frames before disappearing
    };
  }

  checkCollisions() {
    // Bullets vs asteroids
    this.bullets.forEach((bullet, bulletIndex) => {
      this.asteroids.forEach((asteroid, asteroidIndex) => {
        if (
          this.distance(bullet.x, bullet.y, asteroid.x, asteroid.y) <
          asteroid.radius
        ) {
          // Remove bullet
          this.bullets.splice(bulletIndex, 1);

          // Split asteroid or remove
          if (asteroid.size > 1) {
            const newSize = asteroid.size - 1;
            const newRadius = asteroid.radius * 0.6;
            for (let i = 0; i < 2; i++) {
              this.asteroids.push({
                x: asteroid.x,
                y: asteroid.y,
                vx: (Math.random() - 0.5) * this.asteroidSpeed * 1.5,
                vy: (Math.random() - 0.5) * this.asteroidSpeed * 1.5,
                radius: newRadius,
                size: newSize,
              });
            }
          }

          // Remove asteroid
          this.asteroids.splice(asteroidIndex, 1);

          // Award points based on asteroid size, accuracy, and bullet damage
          const basePoints = 20 * asteroid.size;
          const accuracyBonus = Math.floor(this.accuracy / 10); // Bonus points for accuracy
          const damageBonus = Math.floor(this.bulletDamage * 5); // Bonus points for damage
          const totalPoints = basePoints + accuracyBonus + damageBonus;

          this.score += totalPoints;

          // Award upgrade points
          this.upgradePoints += asteroid.size;

          // Track hit for accuracy
          this.shotsHit++;

          this.gameManager.playSound("explosion");
        }
      });
    });

    // Ship vs asteroids (with shield protection)
    this.asteroids.forEach((asteroid) => {
      if (
        this.distance(this.ship.x, this.ship.y, asteroid.x, asteroid.y) <
        asteroid.radius + this.ship.radius
      ) {
        if (this.shieldActive) {
          // Shield absorbs the hit
          this.shieldActive = false;
          this.gameManager.playSound("explosion");
        } else {
          // Normal hit
          this.lives--;
          this.gameManager.playSound("explosion");

          // Reset ship position
          this.ship.x = this.canvas.width / 2;
          this.ship.y = this.canvas.height / 2;
          this.ship.vx = 0;
          this.ship.vy = 0;

          if (this.lives <= 0) {
            this.gameOver = true;
            this.gameManager.playSound("gameOver");
          }
        }
      }
    });

    // Power-ups collection
    this.powerUps.forEach((powerUp, index) => {
      if (
        this.distance(
          this.ship.x,
          this.ship.y,
          powerUp.x + powerUp.width / 2,
          powerUp.y + powerUp.height / 2
        ) < 25
      ) {
        this.powerUps.splice(index, 1);
        this.collectPowerUp(powerUp.type);
      }
    });
  }

  applyPowerUp(type) {
    switch (type) {
      case "shield":
        this.shieldActive = true;
        this.shieldTimer = Date.now() + 8000; // Shield lasts 8 seconds
        this.gameManager.playSound("powerUp");
        break;
      case "multiShot":
        this.multiShot = true;
        this.multiShotTimer = Date.now() + 6000; // Multi-shot lasts 6 seconds
        this.gameManager.playSound("powerUp");
        break;
      case "speed":
        this.ship.speedBoost = true;
        this.ship.speedBoostTimer = Date.now() + 5000; // Speed boost lasts 5 seconds
        this.gameManager.playSound("powerUp");
        break;
    }
  }

  spawnPowerUp() {
    const types = ["shield", "multiShot", "speedBoost"];
    const type = types[Math.floor(Math.random() * types.length)];

    this.powerUps.push({
      x: Math.random() * (this.canvas.width - 40) + 20,
      y: -20,
      width: 20,
      height: 20,
      vy: 1.5,
      type: type,
    });
  }

  collectPowerUp(type) {
    if (type === "shield") {
      this.shieldActive = true;
      this.shieldTimer = Date.now() + 8000; // Shield lasts 8 seconds
      this.gameManager.playSound("powerUp");
    } else if (type === "multiShot") {
      this.multiShot = true;
      this.multiShotTimer = Date.now() + 6000; // Multi-shot lasts 6 seconds
      this.gameManager.playSound("powerUp");
    } else if (type === "speedBoost") {
      this.ship.speedBoost = true;
      this.ship.speedBoostTimer = Date.now() + 5000; // Speed boost lasts 5 seconds
      this.gameManager.playSound("powerUp");
    }
  }

  distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  levelUp() {
    this.level++;
    this.asteroidSpeed += 0.2;
    this.initializeAsteroids();
    this.gameManager.playSound("levelUp");
  }

  restart() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameOver = false;
    this.ship.x = this.canvas.width / 2;
    this.ship.y = this.canvas.height / 2;
    this.ship.vx = 0;
    this.ship.vy = 0;
    this.ship.angle = 0;
    this.bullets = [];
    this.powerUps = [];
    this.asteroidSpeed = 1.5;
    this.shieldActive = false;
    this.multiShot = false;
    this.ship.speedBoost = false;
    this.upgradePoints = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.accuracy = 0;
    this.shieldStrength = 0;
    this.shieldRegenRate = 0.1;
    this.shieldRegenTimer = 0;
    this.bulletDamage = 1;
    this.maxLives = 3;
    this.initializeAsteroids();
  }

  gameLoop() {
    this.update();
    this.draw();
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  draw() {
    // Clear canvas with space background
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw enhanced starfield
    this.drawStarfield();

    if (!this.gameOver) {
      // Draw ship with thrust effect
      this.drawShip();

      // Draw bullets
      this.drawBullets();

      // Draw asteroids with irregular shapes
      this.drawAsteroids();

      // Draw power-ups
      this.drawPowerUps();

      // Draw shield effect
      if (this.shieldActive) {
        this.drawShield();
      }
    }

    // Draw UI
    this.drawUI();

    if (this.paused) {
      this.drawPaused();
    }

    if (this.gameOver) {
      this.drawGameOver();
    }

    // Draw instructions
    this.drawInstructions();
  }

  drawStarfield() {
    // More detailed starfield with different sizes and brightness
    for (let i = 0; i < 150; i++) {
      const x = (i * 29) % this.canvas.width;
      const y = (i * 17) % this.canvas.height;
      const brightness = Math.sin(i * 0.05) * 0.3 + 0.7;
      const size = (i % 3) + 1;

      this.ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      this.ctx.fillRect(x, y, size, size);
    }
  }

  drawShip() {
    this.ctx.save();
    this.ctx.translate(this.ship.x, this.ship.y);
    this.ctx.rotate(this.ship.angle);

    // Ship body
    this.ctx.fillStyle = "#00ff00";
    this.ctx.beginPath();
    this.ctx.moveTo(this.ship.radius, 0);
    this.ctx.lineTo(-this.ship.radius * 0.6, -this.ship.radius * 0.6);
    this.ctx.lineTo(-this.ship.radius * 0.3, 0);
    this.ctx.lineTo(-this.ship.radius * 0.6, this.ship.radius * 0.6);
    this.ctx.closePath();
    this.ctx.fill();

    // Ship outline
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // Thrust effect when moving forward
    if (this.keys["arrowup"] || this.keys["w"]) {
      this.ctx.fillStyle = "#ff6600";
      this.ctx.beginPath();
      this.ctx.moveTo(-this.ship.radius * 0.3, -this.ship.radius * 0.3);
      this.ctx.lineTo(-this.ship.radius * 0.8, 0);
      this.ctx.lineTo(-this.ship.radius * 0.3, this.ship.radius * 0.3);
      this.ctx.closePath();
      this.ctx.fill();

      // Extra thrust particles
      this.ctx.fillStyle = "#ffaa00";
      this.ctx.fillRect(-this.ship.radius * 0.9, -2, 6, 4);
    }

    this.ctx.restore();
  }

  drawBullets() {
    this.ctx.fillStyle = "#ffffff";
    this.bullets.forEach((bullet) => {
      // Draw bullets as small bright dots
      this.ctx.beginPath();
      this.ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
      this.ctx.fill();

      // Add glow effect
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      this.ctx.beginPath();
      this.ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = "#ffffff";
    });
  }

  drawAsteroids() {
    this.asteroids.forEach((asteroid) => {
      const { x, y, radius, size } = asteroid;

      // Different colors for different sizes
      const colors = ["#666666", "#888888", "#aaaaaa"];
      this.ctx.fillStyle = colors[size - 1] || "#888888";

      // Draw irregular asteroid shape
      this.ctx.beginPath();
      const points = 8 + size * 2;
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const variation = 0.7 + Math.sin(i * 1.5) * 0.3; // Irregular shape
        const pointRadius = radius * variation;
        const px = x + Math.cos(angle) * pointRadius;
        const py = y + Math.sin(angle) * pointRadius;

        if (i === 0) {
          this.ctx.moveTo(px, py);
        } else {
          this.ctx.lineTo(px, py);
        }
      }
      this.ctx.closePath();
      this.ctx.fill();

      // Add crater details for larger asteroids
      if (size >= 2) {
        this.ctx.fillStyle = "#444444";
        this.ctx.beginPath();
        this.ctx.arc(
          x + radius * 0.3,
          y - radius * 0.2,
          radius * 0.2,
          0,
          Math.PI * 2
        );
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(
          x - radius * 0.1,
          y + radius * 0.3,
          radius * 0.15,
          0,
          Math.PI * 2
        );
        this.ctx.fill();
      }

      // Add highlight
      this.ctx.strokeStyle = "#cccccc";
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    });
  }

  drawPowerUps() {
    this.powerUps.forEach((powerUp) => {
      if (powerUp.type === "shield") {
        // Blue shield power-up
        this.ctx.fillStyle = "#0088ff";
        this.ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "12px monospace";
        this.ctx.textAlign = "center";
        this.ctx.fillText(
          "S",
          powerUp.x + powerUp.width / 2,
          powerUp.y + powerUp.height / 2 + 4
        );
      } else if (powerUp.type === "multiShot") {
        // Yellow multi-shot power-up
        this.ctx.fillStyle = "#ffff00";
        this.ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        this.ctx.fillStyle = "#000000";
        this.ctx.font = "10px monospace";
        this.ctx.textAlign = "center";
        this.ctx.fillText(
          "3",
          powerUp.x + powerUp.width / 2,
          powerUp.y + powerUp.height / 2 + 3
        );
      } else if (powerUp.type === "speedBoost") {
        // Red speed boost power-up
        this.ctx.fillStyle = "#ff4444";
        this.ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "10px monospace";
        this.ctx.textAlign = "center";
        this.ctx.fillText(
          "SPD",
          powerUp.x + powerUp.width / 2,
          powerUp.y + powerUp.height / 2 + 3
        );
      }
    });
    this.ctx.textAlign = "left";
  }

  drawShield() {
    // Animated shield effect around ship
    const time = Date.now() * 0.008;
    this.ctx.strokeStyle = `hsl(${(time * 15) % 360}, 100%, 60%)`;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(this.ship.x, this.ship.y, 20, 0, Math.PI * 2);
    this.ctx.stroke();

    // Shield particles
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + time;
      const x = this.ship.x + Math.cos(angle) * 18;
      const y = this.ship.y + Math.sin(angle) * 18;
      this.ctx.fillStyle = `hsl(${(time * 15 + i * 60) % 360}, 100%, 70%)`;
      this.ctx.fillRect(x - 1, y - 1, 3, 3);
    }
  }

  drawUI() {
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "16px monospace";
    this.ctx.textAlign = "left";
    this.ctx.fillText(`SCORE: ${this.score}`, 20, 30);
    this.ctx.fillText(`LIVES: ${this.lives}`, 20, 50);
    this.ctx.fillText(`LEVEL: ${this.level}`, 20, 70);

    // Show active power-ups
    let yOffset = 90;
    if (this.shieldActive) {
      this.ctx.fillStyle = "#0088ff";
      this.ctx.fillText("SHIELD ACTIVE", 20, yOffset);
      yOffset += 20;
    }
    if (this.multiShot) {
      this.ctx.fillStyle = "#ffff00";
      this.ctx.fillText("MULTI-SHOT ACTIVE", 20, yOffset);
      yOffset += 20;
    }
    if (this.ship.speedBoost) {
      this.ctx.fillStyle = "#ff4444";
      this.ctx.fillText("SPEED BOOST ACTIVE", 20, yOffset);
    }

    // Upgrade points display
    this.ctx.fillStyle = "#00ff00";
    this.ctx.fillText(
      `UPGRADE POINTS: ${this.upgradePoints}`,
      this.canvas.width - 150,
      30
    );

    // Accuracy display
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillText(
      `ACCURACY: ${Math.round(this.accuracy)}%`,
      this.canvas.width - 150,
      50
    );

    // Upgrade menu
    if (this.showUpgradeMenu) {
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      this.ctx.fillRect(
        this.canvas.width / 2 - 120,
        this.canvas.height / 2 - 80,
        240,
        160
      );
      this.ctx.fillStyle = "#ffffff";
      this.ctx.font = "18px monospace";
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        "UPGRADES",
        this.canvas.width / 2,
        this.canvas.height / 2 - 50
      );

      // Upgrade options with current levels and costs
      const upgradeOptions = [
        `Weapon Lv.${this.upgrades.weapon} (10pts)`,
        `Shield Lv.${this.upgrades.shield} (25pts)`,
        `Speed Lv.${this.upgrades.speed} (50pts)`,
        `Hull Lv.${this.upgrades.hull} (100pts)`,
      ];

      this.ctx.font = "14px monospace";
      for (let i = 0; i < upgradeOptions.length; i++) {
        if (i === this.selectedUpgrade) {
          this.ctx.fillStyle = "#00ff00";
        } else {
          this.ctx.fillStyle = "#ffffff";
        }
        this.ctx.fillText(
          upgradeOptions[i],
          this.canvas.width / 2,
          this.canvas.height / 2 - 20 + i * 20
        );
      }

      this.ctx.fillStyle = "#ffff00";
      this.ctx.font = "12px monospace";
      this.ctx.fillText(
        "↑↓: Navigate • ENTER: Buy • ESC: Close",
        this.canvas.width / 2,
        this.canvas.height / 2 + 50
      );

      this.ctx.fillStyle = "#00ff00";
      this.ctx.fillText(
        `Points: ${this.upgradePoints}`,
        this.canvas.width / 2,
        this.canvas.height / 2 + 70
      );
    }
  }

  drawPaused() {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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
  }

  drawGameOver() {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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
    this.ctx.font = "16px monospace";
    this.ctx.fillText(
      "Press ENTER to restart",
      this.canvas.width / 2,
      this.canvas.height / 2 + 50
    );
  }

  drawInstructions() {
    this.ctx.fillStyle = "#888888";
    this.ctx.font = "12px monospace";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "A/D: Turn • W/↑: Thrust • Space: Shoot • P: Pause • ESC: Menu",
      this.canvas.width / 2,
      this.canvas.height - 30
    );
    this.ctx.fillText(
      "Power-ups: Blue=Shield • Yellow=Triple Shot • Red=Speed Boost",
      this.canvas.width / 2,
      this.canvas.height - 15
    );
  }

  purchaseUpgrade() {
    const upgradeCosts = [10, 25, 50, 100]; // Costs for levels 1, 2, 3, 4
    const upgradeType = this.selectedUpgrade;
    const currentLevel = this.upgrades[Object.keys(this.upgrades)[upgradeType]];

    if (currentLevel >= 4) return; // Max level reached

    const cost = upgradeCosts[currentLevel];

    if (this.upgradePoints >= cost) {
      this.upgradePoints -= cost;

      switch (upgradeType) {
        case 0: // Weapon upgrade
          this.upgrades.weapon = currentLevel + 1;
          this.applyWeaponUpgrade(currentLevel + 1);
          break;
        case 1: // Shield upgrade
          this.upgrades.shield = currentLevel + 1;
          this.applyShieldUpgrade(currentLevel + 1);
          break;
        case 2: // Speed upgrade
          this.upgrades.speed = currentLevel + 1;
          this.applySpeedUpgrade(currentLevel + 1);
          break;
        case 3: // Hull upgrade
          this.upgrades.hull = currentLevel + 1;
          this.applyHullUpgrade(currentLevel + 1);
          break;
      }

      this.gameManager.playSound("powerUp");
    } else {
      // Not enough points - could add visual feedback here
      this.gameManager.playSound("explosion");
    }
  }

  applyWeaponUpgrade(level) {
    switch (level) {
      case 1:
        this.bulletSpeed = 8; // Faster bullets
        break;
      case 2:
        this.bulletSpeed = 10;
        this.bulletDamage = 1.5; // More damage
        break;
      case 3:
        this.bulletSpeed = 12;
        this.bulletDamage = 2;
        break;
      case 4:
        this.bulletSpeed = 15;
        this.bulletDamage = 3;
        this.multiShot = true; // Permanent multi-shot
        break;
    }
  }

  applyShieldUpgrade(level) {
    this.shieldStrength = level;
    this.shieldRegenRate = level * 0.1;
  }

  applySpeedUpgrade(level) {
    this.ship.maxSpeed = 3 + level * 0.5;
    this.ship.acceleration = 0.2 + level * 0.05;
  }

  applyHullUpgrade(level) {
    this.maxLives = 3 + level;
    this.lives = Math.min(this.lives + 1, this.maxLives); // Give extra life immediately
  }

  updateAccuracy() {
    if (this.shotsFired > 0) {
      this.accuracy = (this.shotsHit / this.shotsFired) * 100;
    } else {
      this.accuracy = 0;
    }
  }
}
