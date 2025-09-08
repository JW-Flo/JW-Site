// Test GameOverlay import specifically
console.log("🧪 Testing GameOverlay import...");

async function testGameOverlayImport() {
  try {
    console.log("🎯 Attempting to import GameOverlay...");
    const { GameOverlay } = await import(
      "http://localhost:4321/GameOverlay.js"
    );
    console.log("✅ GameOverlay imported successfully:", GameOverlay);

    // Try to create an instance
    const canvas = document.getElementById("game-canvas");
    if (canvas) {
      console.log("🎯 Creating GameOverlay instance...");
      const gameOverlay = new GameOverlay(canvas);
      console.log("✅ GameOverlay instance created:", gameOverlay);
    } else {
      console.error("❌ Canvas not found for GameOverlay test");
    }
  } catch (error) {
    console.error("❌ Failed to import GameOverlay:", error);
  }
}

// Test the import when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ DOM loaded, testing GameOverlay import...");
  testGameOverlayImport();
});
