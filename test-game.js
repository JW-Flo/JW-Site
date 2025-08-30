// Test script to verify game functionality
console.log("🎯 Testing game functionality...");

// Check if RetroArcade is initialized
if (window.retroArcade) {
  console.log("✅ RetroArcade found!");
  
  // Check if canvas exists
  const canvas = document.getElementById("game-canvas");
  if (canvas) {
    console.log("✅ Game canvas found!");
  } else {
    console.log("❌ Game canvas not found!");
  }
  
  // Check if trigger elements exist
  const trigger = document.getElementById("trigger-word");
  const triggerContainer = document.getElementById("game-trigger");
  
  if (trigger || triggerContainer) {
    console.log("✅ Game trigger found!");
    
    // Try to activate the game
    console.log("🎯 Attempting to activate game...");
    window.retroArcade.activateGame();
  } else {
    console.log("❌ Game trigger not found!");
  }
} else {
  console.log("❌ RetroArcade not found!");
}
