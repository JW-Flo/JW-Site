// Tetris Game - Classic Block Puzzle
export class TetrisGame {
  constructor(canvas, gameManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.gameManager = gameManager;

    // Bind event handlers
    this.boundHandleKeyPress = (e) => this.handleKeyPress(e);
    this.boundHandleKeyUp = (e) => this.handleKeyUp(e);

    // Add event listeners
    document.addEventListener("keydown", this.boundHandleKeyPress);
    document.addEventListener("keyup", this.boundHandleKeyUp);

    // Game state
    this.board = [];
    this.currentPiece = null;
    this.nextPiece = null;
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.gameOver = false;
    this.paused = false;

    // Game settings
    this.boardWidth = 10;
    this.boardHeight = 20;
    this.cellSize = 25;
    this.dropTime = 1000; // milliseconds
    this.lastDrop = 0;

    // Colors for pieces
    this.colors = [
      "#00f5ff", // I - Cyan
      "#ffff00", // O - Yellow
      "#800080", // T - Purple
      "#00ff00", // S - Green
      "#ff0000", // Z - Red
      "#0000ff", // J - Blue
      "#ffa500", // L - Orange
    ];

    // Tetromino shapes
    this.shapes = [
      // I
      [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      // O
      [
        [1, 1],
        [1, 1],
      ],
      // T
      [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      // S
      [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
      ],
      // Z
      [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
      ],
      // J
      [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      // L
      [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0],
      ],
    ];

    this.initializeBoard();
    this.spawnPiece();
    this.spawnNextPiece();
  }

  initializeBoard() {
    this.board = [];
    for (let y = 0; y < this.boardHeight; y++) {
      this.board[y] = [];
      for (let x = 0; x < this.boardWidth; x++) {
        this.board[y][x] = 0;
      }
    }
  }

  spawnPiece() {
    if (this.nextPiece) {
      this.currentPiece = this.nextPiece;
    } else {
      const randomIndex = Math.floor(Math.random() * this.shapes.length);
      this.currentPiece = {
        shape: this.shapes[randomIndex],
        color: this.colors[randomIndex],
        x: Math.floor(this.boardWidth / 2) - 1,
        y: 0,
      };
    }
    this.spawnNextPiece();
  }

  spawnNextPiece() {
    const randomIndex = Math.floor(Math.random() * this.shapes.length);
    this.nextPiece = {
      shape: this.shapes[randomIndex],
      color: this.colors[randomIndex],
      x: Math.floor(this.boardWidth / 2) - 1,
      y: 0,
    };
  }

  start() {
    this.gameLoop();
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    document.removeEventListener("keydown", this.boundHandleKeyPress);
    document.removeEventListener("keyup", this.boundHandleKeyUp);
  }

  handleKeyPress(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      this.gameManager.returnToMenu();
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

    if (this.paused || this.gameOver) return;

    switch (e.key) {
      case "ArrowLeft":
      case "a":
      case "A":
        e.preventDefault();
        e.stopPropagation();
        this.movePiece(-1, 0);
        break;
      case "ArrowRight":
      case "d":
      case "D":
        e.preventDefault();
        e.stopPropagation();
        this.movePiece(1, 0);
        break;
      case "ArrowDown":
      case "s":
      case "S":
        e.preventDefault();
        e.stopPropagation();
        this.movePiece(0, 1);
        break;
      case "ArrowUp":
      case "w":
      case "W":
        e.preventDefault();
        e.stopPropagation();
        this.rotatePiece();
        break;
      case " ":
        e.preventDefault();
        e.stopPropagation();
        this.hardDrop();
        break;
    }
  }

  handleKeyUp() {
    // Handle key release if needed
  }

  movePiece(dx, dy) {
    if (!this.currentPiece) return;

    const newX = this.currentPiece.x + dx;
    const newY = this.currentPiece.y + dy;

    if (this.isValidPosition(this.currentPiece.shape, newX, newY)) {
      this.currentPiece.x = newX;
      this.currentPiece.y = newY;
      return true;
    }
    return false;
  }

  rotatePiece() {
    if (!this.currentPiece) return;

    const rotated = this.rotateMatrix(this.currentPiece.shape);
    if (
      this.isValidPosition(rotated, this.currentPiece.x, this.currentPiece.y)
    ) {
      this.currentPiece.shape = rotated;
    }
  }

  hardDrop() {
    if (!this.currentPiece) return;

    while (this.movePiece(0, 1)) {
      // Keep moving down
    }
    this.lockPiece();
  }

  rotateMatrix(matrix) {
    const size = matrix.length;
    const rotated = [];

    for (let i = 0; i < size; i++) {
      rotated[i] = [];
      for (let j = 0; j < size; j++) {
        rotated[i][j] = matrix[size - 1 - j][i];
      }
    }

    return rotated;
  }

  isValidPosition(shape, x, y) {
    for (let py = 0; py < shape.length; py++) {
      for (let px = 0; px < shape[py].length; px++) {
        if (shape[py][px]) {
          const boardX = x + px;
          const boardY = y + py;

          if (
            boardX < 0 ||
            boardX >= this.boardWidth ||
            boardY >= this.boardHeight ||
            (boardY >= 0 && this.board[boardY][boardX])
          ) {
            return false;
          }
        }
      }
    }
    return true;
  }

  lockPiece() {
    if (!this.currentPiece) return;

    // Place piece on board
    for (let py = 0; py < this.currentPiece.shape.length; py++) {
      for (let px = 0; px < this.currentPiece.shape[py].length; px++) {
        if (this.currentPiece.shape[py][px]) {
          const boardY = this.currentPiece.y + py;
          const boardX = this.currentPiece.x + px;

          if (boardY >= 0) {
            this.board[boardY][boardX] = this.currentPiece.color;
          }
        }
      }
    }

    // Check for completed lines
    this.clearLines();

    // Spawn new piece
    this.spawnPiece();

    // Check game over
    if (
      !this.isValidPosition(
        this.currentPiece.shape,
        this.currentPiece.x,
        this.currentPiece.y
      )
    ) {
      this.gameOver = true;
      this.gameManager.playSound("gameOver");
    }
  }

  clearLines() {
    let linesCleared = 0;

    for (let y = this.boardHeight - 1; y >= 0; ) {
      if (this.board[y].every((cell) => cell !== 0)) {
        // Remove the line
        this.board.splice(y, 1);
        // Add new empty line at top
        this.board.unshift(new Array(this.boardWidth).fill(0));
        linesCleared++;
        // Don't increment y, check the same position again since we removed a line
      } else {
        y--; // Only decrement when we don't remove a line
      }
    }

    if (linesCleared > 0) {
      this.lines += linesCleared;
      this.score += linesCleared * 100 * this.level;

      // Level up every 10 lines
      if (Math.floor(this.lines / 10) + 1 > this.level) {
        this.level = Math.floor(this.lines / 10) + 1;
        this.dropTime = Math.max(100, 1000 - (this.level - 1) * 50);
        this.gameManager.playSound("levelUp");
      }

      this.gameManager.playSound("explosion");
    }
  }

  update() {
    if (this.gameOver || this.paused) return;

    const now = Date.now();
    if (now - this.lastDrop > this.dropTime) {
      if (!this.movePiece(0, 1)) {
        this.lockPiece();
      }
      this.lastDrop = now;
    }
  }

  gameLoop() {
    this.update();
    this.draw();
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  draw() {
    // Clear canvas
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw starfield
    this.drawStarfield();

    if (!this.gameOver) {
      // Draw game board
      this.drawBoard();

      // Draw current piece
      if (this.currentPiece) {
        this.drawPiece(this.currentPiece);
      }

      // Draw next piece
      this.drawNextPiece();

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
    this.ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 50; i++) {
      const x = (i * 37) % this.canvas.width;
      const y = (i * 23) % this.canvas.height;
      this.ctx.fillRect(x, y, 1, 1);
    }
  }

  drawBoard() {
    const boardX = (this.canvas.width - this.boardWidth * this.cellSize) / 2;
    const boardY = 50;

    // Draw board background
    this.ctx.fillStyle = "#111111";
    this.ctx.fillRect(
      boardX - 2,
      boardY - 2,
      this.boardWidth * this.cellSize + 4,
      this.boardHeight * this.cellSize + 4
    );

    // Draw cells
    for (let y = 0; y < this.boardHeight; y++) {
      for (let x = 0; x < this.boardWidth; x++) {
        if (this.board[y][x]) {
          this.ctx.fillStyle = this.board[y][x];
          this.ctx.fillRect(
            boardX + x * this.cellSize,
            boardY + y * this.cellSize,
            this.cellSize - 1,
            this.cellSize - 1
          );
        }
      }
    }

    // Draw grid
    this.ctx.strokeStyle = "#333333";
    this.ctx.lineWidth = 1;
    for (let x = 0; x <= this.boardWidth; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(boardX + x * this.cellSize, boardY);
      this.ctx.lineTo(
        boardX + x * this.cellSize,
        boardY + this.boardHeight * this.cellSize
      );
      this.ctx.stroke();
    }
    for (let y = 0; y <= this.boardHeight; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(boardX, boardY + y * this.cellSize);
      this.ctx.lineTo(
        boardX + this.boardWidth * this.cellSize,
        boardY + y * this.cellSize
      );
      this.ctx.stroke();
    }
  }

  drawPiece(piece) {
    const boardX = (this.canvas.width - this.boardWidth * this.cellSize) / 2;
    const boardY = 50;

    this.ctx.fillStyle = piece.color;
    for (let py = 0; py < piece.shape.length; py++) {
      for (let px = 0; px < piece.shape[py].length; px++) {
        if (piece.shape[py][px]) {
          this.ctx.fillRect(
            boardX + (piece.x + px) * this.cellSize,
            boardY + (piece.y + py) * this.cellSize,
            this.cellSize - 1,
            this.cellSize - 1
          );
        }
      }
    }
  }

  drawNextPiece() {
    const nextX = this.canvas.width - 150;
    const nextY = 100;

    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "16px monospace";
    this.ctx.textAlign = "center";
    this.ctx.fillText("NEXT", nextX + 50, nextY);

    if (this.nextPiece) {
      this.ctx.fillStyle = this.nextPiece.color;
      const scale = 0.8;
      for (let py = 0; py < this.nextPiece.shape.length; py++) {
        for (let px = 0; px < this.nextPiece.shape[py].length; px++) {
          if (this.nextPiece.shape[py][px]) {
            this.ctx.fillRect(
              nextX + px * this.cellSize * scale,
              nextY + 20 + py * this.cellSize * scale,
              this.cellSize * scale - 1,
              this.cellSize * scale - 1
            );
          }
        }
      }
    }
  }

  drawUI() {
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "16px monospace";
    this.ctx.textAlign = "left";
    this.ctx.fillText(`SCORE: ${this.score}`, 20, 30);
    this.ctx.fillText(`LEVEL: ${this.level}`, 20, 50);
    this.ctx.fillText(`LINES: ${this.lines}`, 20, 70);
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
      "A/D: Move • S: Soft Drop • W: Rotate • Space: Hard Drop • P: Pause • ESC: Menu",
      this.canvas.width / 2,
      this.canvas.height - 20
    );
  }

  restart() {
    this.initializeBoard();
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.gameOver = false;
    this.dropTime = 1000;
    this.spawnPiece();
    this.spawnNextPiece();
  }
}
