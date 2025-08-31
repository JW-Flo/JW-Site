// Comprehensive arcade test script
import { test } from 'vitest';

// Test game module imports
test('Game modules can be imported', async () => {
  try {
    // Test importing from the public folder paths
    const { MenuGame } = await import('./public/games/MenuGame.js');
    const { GameManager } = await import('./public/GameManager.js');
    const { GameOverlay } = await import('./public/GameOverlay.js');
    
    console.log('✅ All game modules imported successfully');
    console.log('MenuGame:', typeof MenuGame);
    console.log('GameManager:', typeof GameManager);
    console.log('GameOverlay:', typeof GameOverlay);
  } catch (error) {
    console.error('❌ Failed to import game modules:', error);
    throw error;
  }
});

// Test if all game files exist
test('All game files exist in public folder', async () => {
  const fs = await import('fs');
  
  const gameFiles = [
    'public/GameManager.js',
    'public/GameOverlay.js',
    'public/games/MenuGame.js',
    'public/games/SpaceInvadersGame.js',
    'public/games/PacManGame.js',
    'public/games/TetrisGame.js',
    'public/games/AsteroidsGame.js'
  ];
  
  for (const file of gameFiles) {
    const exists = fs.existsSync(file);
    console.log(`${exists ? '✅' : '❌'} ${file}`);
    if (!exists) {
      throw new Error(`Missing game file: ${file}`);
    }
  }
});
