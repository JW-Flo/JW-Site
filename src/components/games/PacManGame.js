// Pac-Man Game - Classic Maze Game
export class PacManGame {
  constructor(canvas, gameManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gameManager = gameManager;

    // Bind event handlers
    this.boundHandleKeyPress = (e) => this.handleKeyPress(e);

    // Add event listeners
    document.addEventListener('keydown', this.boundHandleKeyPress);

    // Game state
    this.pacman = {
      x: 14,
      y: 23,
      dx: 0,
      dy: 0,
      nextDx: 0,
      nextDy: 0,
      mouthAngle: 0,
      mouthDir: 1
    };

    this.ghosts = [];
    this.dots = [];
    this.powerPellets = [];
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameOver = false;
    this.paused = false;
    this.powerMode = false;
    this.powerModeTimer = 0;

    // Game settings
    this.cellSize = 20;
    this.speed = 2;

    // Maze layout (1 = wall, 0 = empty, 2 = dot, 3 = power pellet)
    this.maze = [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
      [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
      [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,1,1,1,1,2,1,2,1,1,1,1,1,1,1,1,1,2,1,2,1,1,1,1,1,2,1],
      [1,2,1,1,1,1,2,1,2,1,1,1,1,1,1,1,1,1,2,1,2,1,1,1,1,1,2,1],
      [1,2,2,2,2,2,2,1,2,2,2,2,2,1,1,2,2,2,2,2,2,1,2,2,2,2,2,1],
      [1,1,1,1,1,1,2,1,1,1,1,2,2,2,2,2,2,1,1,1,1,2,1,1,1,1,1,1],
      [1,1,1,1,1,1,2,1,1,1,1,2,2,2,2,2,2,1,1,1,1,2,1,1,1,1,1,1],
      [1,1,1,1,1,1,2,1,2,2,2,2,2,0,0,2,2,2,2,2,2,1,2,1,1,1,1,1],
      [1,1,1,1,1,1,2,1,2,1,1,2,0,0,0,0,2,1,1,2,1,2,1,1,1,1,1,1],
      [1,1,1,1,1,1,2,1,2,1,1,2,0,0,0,0,2,1,1,2,1,2,1,1,1,1,1,1],
      [0,0,0,0,0,0,2,2,2,1,1,2,0,0,0,0,2,1,1,2,2,2,0,0,0,0,0,0],
      [1,1,1,1,1,1,2,1,2,1,1,2,0,0,0,0,2,1,1,2,1,2,1,1,1,1,1,1],
      [1,1,1,1,1,1,2,1,2,1,1,2,2,2,2,2,2,1,1,2,1,2,1,1,1,1,1,1],
      [1,1,1,1,1,1,2,1,2,2,2,2,2,1,1,2,2,2,2,2,2,1,2,1,1,1,1,1],
      [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
      [1,3,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,3,1],
      [1,1,1,2,1,1,2,1,2,1,1,1,1,1,1,1,1,1,2,1,2,1,1,2,1,1,1,1],
      [1,1,1,2,1,1,2,1,2,1,1,1,1,1,1,1,1,1,2,1,2,1,1,2,1,1,1,1],
      [1,2,2,2,2,2,2,1,2,2,2,2,2,1,1,2,2,2,2,2,2,1,2,2,2,2,2,1],
      [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];

    this.initializeGame();
  }

  initializeGame() {
    this.dots = [];
    this.powerPellets = [];
    this.ghosts = [];

    // Parse maze for dots and power pellets
    for (let y = 0; y < this.maze.length; y++) {
      for (let x = 0; x < this.maze[y].length; x++) {
        if (this.maze[y][x] === 2) {
          this.dots.push({ x, y });
        } else if (this.maze[y][x] === 3) {
          this.powerPellets.push({ x, y });
        }
      }
    }

    // Initialize ghosts
    this.ghosts = [
      { x: 13, y: 11, color: '#ff0000', mode: 'scatter', targetX: 25, targetY: 0 }, // Blinky
      { x: 14, y: 11, color: '#ffb8ff', mode: 'scatter', targetX: 2, targetY: 0 },  // Pinky
      { x: 13, y: 13, color: '#00ffff', mode: 'scatter', targetX: 27, targetY: 27 }, // Inky
      { x: 14, y: 13, color: '#ffb852', mode: 'scatter', targetX: 0, targetY: 27 }   // Clyde
    ];
  }

  start() {
    this.gameLoop();
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    document.removeEventListener('keydown', this.boundHandleKeyPress);
  }

  handleKeyPress(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this.gameManager.returnToMenu();
      return;
    }

    if (this.gameOver) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        this.restart();
      }
      return;
    }

    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      e.stopPropagation();
      this.paused = !this.paused;
      return;
    }

    if (this.paused || this.gameOver) return;

    // Set next direction (will be applied when possible)
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        e.stopPropagation();
        this.pacman.nextDx = -1;
        this.pacman.nextDy = 0;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        e.stopPropagation();
        this.pacman.nextDx = 1;
        this.pacman.nextDy = 0;
        break;
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
        e.stopPropagation();
        this.pacman.nextDx = 0;
        this.pacman.nextDy = -1;
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault();
        e.stopPropagation();
        this.pacman.nextDx = 0;
        this.pacman.nextDy = 1;
        break;
    }
  }

  update() {
    if (this.gameOver || this.paused) return;

    // Update Pac-Man
    this.updatePacman();

    // Update ghosts
    this.updateGhosts();

    // Update power mode
    if (this.powerMode) {
      this.powerModeTimer--;
      if (this.powerModeTimer <= 0) {
        this.powerMode = false;
      }
    }

    // Check win condition
    if (this.dots.length === 0 && this.powerPellets.length === 0) {
      this.level++;
      this.initializeGame();
      this.gameManager.playSound('levelUp');
    }
  }

  updatePacman() {
    // Try to change direction if requested
    if (this.pacman.nextDx !== 0 || this.pacman.nextDy !== 0) {
      const nextX = this.pacman.x + this.pacman.nextDx;
      const nextY = this.pacman.y + this.pacman.nextDy;

      if (!this.isWall(nextX, nextY)) {
        this.pacman.dx = this.pacman.nextDx;
        this.pacman.dy = this.pacman.nextDy;
        this.pacman.nextDx = 0;
        this.pacman.nextDy = 0;
      }
    }

    // Move Pac-Man
    const newX = this.pacman.x + this.pacman.dx * (this.speed / 10);
    const newY = this.pacman.y + this.pacman.dy * (this.speed / 10);

    // Check wall collision
    if (!this.isWall(Math.floor(newX), Math.floor(newY))) {
      this.pacman.x = newX;
      this.pacman.y = newY;
    }

    // Wrap around screen
    if (this.pacman.x < 0) this.pacman.x = this.maze[0].length - 1;
    if (this.pacman.x >= this.maze[0].length) this.pacman.x = 0;

    // Check dot collection
    const pacmanGridX = Math.floor(this.pacman.x);
    const pacmanGridY = Math.floor(this.pacman.y);

    // Check dots
    this.dots = this.dots.filter(dot => {
      if (Math.floor(dot.x) === pacmanGridX && Math.floor(dot.y) === pacmanGridY) {
        this.score += 10;
        this.gameManager.playSound('shoot');
        return false;
      }
      return true;
    });

    // Check power pellets
    this.powerPellets = this.powerPellets.filter(pellet => {
      if (Math.floor(pellet.x) === pacmanGridX && Math.floor(pellet.y) === pacmanGridY) {
        this.score += 50;
        this.powerMode = true;
        this.powerModeTimer = 600; // 10 seconds at 60fps
        this.gameManager.playSound('powerUp');
        return false;
      }
      return true;
    });

    // Update mouth animation
    this.pacman.mouthAngle += this.pacman.mouthDir * 0.2;
    if (this.pacman.mouthAngle > 0.5 || this.pacman.mouthAngle < 0) {
      this.pacman.mouthDir *= -1;
    }
  }

  updateGhosts() {
    this.ghosts.forEach(ghost => {
      this.updateGhostPosition(ghost);
      this.checkGhostCollision(ghost);
    });
  }

  updateGhostPosition(ghost) {
    const dx = ghost.targetX - ghost.x;
    const dy = ghost.targetY - ghost.y;

    const preferredDir = this.getPreferredDirection(dx, dy);
    const moveResult = this.tryMoveGhost(ghost, preferredDir);

    if (!moveResult.moved) {
      // Try other directions
      this.tryAlternativeDirections(ghost);
    }

    // Wrap around screen
    this.wrapGhostPosition(ghost);
  }

  getPreferredDirection(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) {
      return { x: dx > 0 ? 1 : -1, y: 0 };
    } else {
      return { x: 0, y: dy > 0 ? 1 : -1 };
    }
  }

  tryMoveGhost(ghost, direction) {
    if (!this.isWall(ghost.x + direction.x, ghost.y)) {
      ghost.x += direction.x * 0.1;
      return { moved: true };
    } else if (!this.isWall(ghost.x, ghost.y + direction.y)) {
      ghost.y += direction.y * 0.1;
      return { moved: true };
    }
    return { moved: false };
  }

  tryAlternativeDirections(ghost) {
    const directions = [
      { x: 1, y: 0 }, { x: -1, y: 0 },
      { x: 0, y: 1 }, { x: 0, y: -1 }
    ];

    for (const dir of directions) {
      if (!this.isWall(ghost.x + dir.x, ghost.y + dir.y)) {
        ghost.x += dir.x * 0.1;
        ghost.y += dir.y * 0.1;
        break;
      }
    }
  }

  wrapGhostPosition(ghost) {
    if (ghost.x < 0) ghost.x = this.maze[0].length - 1;
    if (ghost.x >= this.maze[0].length) ghost.x = 0;
  }

  checkGhostCollision(ghost) {
    if (Math.abs(ghost.x - this.pacman.x) < 1 && Math.abs(ghost.y - this.pacman.y) < 1) {
      if (this.powerMode) {
        this.handlePacmanEatsGhost(ghost);
      } else {
        this.handleGhostEatsPacman();
      }
    }
  }

  handlePacmanEatsGhost(ghost) {
    ghost.x = 13 + Math.random() * 2;
    ghost.y = 11 + Math.random() * 4;
    this.score += 200;
    this.gameManager.playSound('explosion');
  }

  handleGhostEatsPacman() {
    this.lives--;
    if (this.lives <= 0) {
      this.gameOver = true;
      this.gameManager.playSound('gameOver');
    } else {
      this.resetPacman();
      this.gameManager.playSound('explosion');
    }
  }

  resetPacman() {
    this.pacman.x = 14;
    this.pacman.y = 23;
    this.pacman.dx = 0;
    this.pacman.dy = 0;
  }

  isWall(x, y) {
    if (x < 0 || x >= this.maze[0].length || y < 0 || y >= this.maze.length) {
      return true;
    }
    return this.maze[Math.floor(y)][Math.floor(x)] === 1;
  }

  gameLoop() {
    this.update();
    this.draw();
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  draw() {
    // Clear canvas
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw starfield
    this.drawStarfield();

    if (!this.gameOver) {
      // Draw maze
      this.drawMaze();

      // Draw dots
      this.drawDots();

      // Draw power pellets
      this.drawPowerPellets();

      // Draw Pac-Man
      this.drawPacman();

      // Draw ghosts
      this.drawGhosts();

      // Draw UI
      this.drawUI();
    }

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
    this.ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
      const x = (i * 37) % this.canvas.width;
      const y = (i * 23) % this.canvas.height;
      this.ctx.fillRect(x, y, 1, 1);
    }
  }

  drawMaze() {
    for (let y = 0; y < this.maze.length; y++) {
      for (let x = 0; x < this.maze[y].length; x++) {
        if (this.maze[y][x] === 1) {
          this.ctx.fillStyle = '#0000ff';
          this.ctx.fillRect(
            x * this.cellSize,
            y * this.cellSize,
            this.cellSize,
            this.cellSize
          );
        }
      }
    }
  }

  drawDots() {
    this.ctx.fillStyle = '#ffff00';
    this.dots.forEach(dot => {
      this.ctx.beginPath();
      this.ctx.arc(
        dot.x * this.cellSize + this.cellSize / 2,
        dot.y * this.cellSize + this.cellSize / 2,
        3,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
    });
  }

  drawPowerPellets() {
    const time = Date.now() * 0.01;
    this.powerPellets.forEach(pellet => {
      this.ctx.fillStyle = '#ffff00';
      const size = 6 + Math.sin(time) * 2;
      this.ctx.beginPath();
      this.ctx.arc(
        pellet.x * this.cellSize + this.cellSize / 2,
        pellet.y * this.cellSize + this.cellSize / 2,
        size,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
    });
  }

  drawPacman() {
    const x = this.pacman.x * this.cellSize + this.cellSize / 2;
    const y = this.pacman.y * this.cellSize + this.cellSize / 2;
    const radius = this.cellSize / 2 - 2;

    this.ctx.fillStyle = '#ffff00';
    this.ctx.beginPath();

    // Calculate mouth direction
    let startAngle = 0;
    let endAngle = Math.PI * 2;

    if (this.pacman.dx > 0) { // Right
      startAngle = this.pacman.mouthAngle;
      endAngle = Math.PI * 2 - this.pacman.mouthAngle;
    } else if (this.pacman.dx < 0) { // Left
      startAngle = Math.PI + this.pacman.mouthAngle;
      endAngle = Math.PI - this.pacman.mouthAngle;
    } else if (this.pacman.dy > 0) { // Down
      startAngle = Math.PI / 2 + this.pacman.mouthAngle;
      endAngle = Math.PI / 2 - this.pacman.mouthAngle;
    } else if (this.pacman.dy < 0) { // Up
      startAngle = -Math.PI / 2 + this.pacman.mouthAngle;
      endAngle = -Math.PI / 2 - this.pacman.mouthAngle;
    }

    this.ctx.arc(x, y, radius, startAngle, endAngle);
    this.ctx.lineTo(x, y);
    this.ctx.fill();
  }

  drawGhosts() {
    this.ghosts.forEach(ghost => {
      const x = ghost.x * this.cellSize + this.cellSize / 2;
      const y = ghost.y * this.cellSize + this.cellSize / 2;
      const width = this.cellSize - 4;
      const height = this.cellSize - 4;

      // Ghost body
      this.ctx.fillStyle = this.powerMode ? '#0000ff' : ghost.color;
      this.ctx.beginPath();
      this.ctx.arc(x, y - height/4, width/2, Math.PI, 0);
      this.ctx.lineTo(x + width/2, y + height/4);
      this.ctx.lineTo(x + width/3, y);
      this.ctx.lineTo(x + width/6, y + height/4);
      this.ctx.lineTo(x, y);
      this.ctx.lineTo(x - width/6, y + height/4);
      this.ctx.lineTo(x - width/3, y);
      this.ctx.lineTo(x - width/2, y + height/4);
      this.ctx.closePath();
      this.ctx.fill();

      // Eyes
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(x - width/4, y - height/6, width/6, 0, Math.PI * 2);
      this.ctx.arc(x + width/4, y - height/6, width/6, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#000000';
      this.ctx.beginPath();
      this.ctx.arc(x - width/4, y - height/6, width/10, 0, Math.PI * 2);
      this.ctx.arc(x + width/4, y - height/6, width/10, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  drawUI() {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '16px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`SCORE: ${this.score}`, 20, 30);
    this.ctx.fillText(`LIVES: ${this.lives}`, 20, 50);
    this.ctx.fillText(`LEVEL: ${this.level}`, 20, 70);

    if (this.powerMode) {
      this.ctx.fillStyle = '#ffff00';
      this.ctx.fillText('POWER MODE!', 20, 90);
    }
  }

  drawPaused() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#ffff00';
    this.ctx.font = 'bold 36px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.font = '16px monospace';
    this.ctx.fillText('Press P to resume', this.canvas.width / 2, this.canvas.height / 2 + 50);
  }

  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#ff0000';
    this.ctx.font = 'bold 36px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 50);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '24px monospace';
    this.ctx.fillText(`FINAL SCORE: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.font = '16px monospace';
    this.ctx.fillText('Press ENTER to restart', this.canvas.width / 2, this.canvas.height / 2 + 50);
  }

  drawInstructions() {
    this.ctx.fillStyle = '#888888';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('A/D: Move • W/S: Turn • Eat dots & power pellets • Avoid ghosts • P: Pause • ESC: Menu', this.canvas.width / 2, this.canvas.height - 20);
  }

  restart() {
    this.pacman.x = 14;
    this.pacman.y = 23;
    this.pacman.dx = 0;
    this.pacman.dy = 0;
    this.pacman.nextDx = 0;
    this.pacman.nextDy = 0;
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameOver = false;
    this.powerMode = false;
    this.powerModeTimer = 0;
    this.initializeGame();
  }
}
