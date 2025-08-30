/**
 * Game Manager - Central hub for all game logic
 */
export class GameManager {
  constructor(overlay) {
    this.overlay = overlay;
    this.currentGame = null;
    this.isActive = false;
    this.games = ['Space Invaders', 'Pac-Man', 'Tetris', 'Asteroids'];
    this.unlockedGames = [true, false, false, true]; // Space Invaders and Asteroids unlocked
    
    // Leaderboard data
    this.leaderboardData = this.loadLeaderboard();
    
    console.log('🎯 Game Manager initialized');
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
    const { MenuGame } = await import('../components/games/MenuGame.js');
    this.currentGame = new MenuGame(this.overlay.canvas, this);
    this.currentGame.start();
  }
  
  async startGame(gameName) {
    if (this.currentGame) {
      this.currentGame.destroy();
    }
    
    // Map game names to their modules
    const gameModules = {
      'Space Invaders': () => import('../components/games/SpaceInvadersGame.js'),
      'Asteroids': () => import('../components/games/AsteroidsGame.js'),
      'Pac-Man': () => import('../components/games/PacManGame.js'),
      'Tetris': () => import('../components/games/TetrisGame.js')
    };
    
    if (gameModules[gameName]) {
      try {
        const module = await gameModules[gameName]();
        const GameClass = module[gameName.replace(/\s+/g, '') + 'Game'];
        this.currentGame = new GameClass(this.overlay.canvas, this);
        this.currentGame.start();
      } catch (error) {
        console.error(`Failed to load game ${gameName}:`, error);
        this.showMenu();
      }
    }
  }
  
  saveScore(gameName, score) {
    if (score > 0) {
      const playerName = window.prompt('Enter your name for the leaderboard:', 'Anonymous Recruiter');
      if (playerName) {
        this.leaderboardData.push({
          name: playerName,
          score: score,
          game: gameName
        });
        this.leaderboardData.sort((a, b) => b.score - a.score);
        this.leaderboardData = this.leaderboardData.slice(0, 10);
        this.saveLeaderboard();
        this.overlay.updateLeaderboard(this.leaderboardData);
      }
    }
  }
  
  loadLeaderboard() {
    const saved = window.localStorage.getItem('retroArcadeLeaderboard');
    return saved ? JSON.parse(saved) : [
      { name: 'Top Recruiter', score: 5000, game: 'Space Invaders' },
      { name: 'Game Master', score: 4200, game: 'Pac-Man' },
      { name: 'Puzzle Solver', score: 3800, game: 'Tetris' },
      { name: 'Space Ace', score: 3500, game: 'Asteroids' },
      { name: 'New Player', score: 0, game: 'Getting Started' }
    ];
  }
  
  saveLeaderboard() {
    window.localStorage.setItem('retroArcadeLeaderboard', JSON.stringify(this.leaderboardData));
  }
  
  isGameUnlocked(gameName) {
    const index = this.games.indexOf(gameName);
    return index >= 0 ? this.unlockedGames[index] : false;
  }
  
  unlockGame(gameName) {
    const index = this.games.indexOf(gameName);
    if (index >= 0) {
      this.unlockedGames[index] = true;
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
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      switch (soundType) {
        case 'shoot':
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.1);
          break;
          
        case 'explosion':
          oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.3);
          break;
          
        case 'levelUp':
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(554, audioContext.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.3);
          break;
          
        case 'gameOver':
          oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
          gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.5);
          break;
      }
    } catch (error) {
      // Silently fail if Web Audio API is not available
      console.log('Sound not available:', error.message);
    }
  }
}
