// Simple arcade button test - check if event binding works
console.log("🧪 Starting arcade button test...");

// Wait for DOM to load
document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ DOM loaded");

  // Find the arcade button
  const gameTrigger = document.getElementById("game-trigger");
  if (!gameTrigger) {
    console.error("❌ Arcade button not found!");
    return;
  }

  console.log("✅ Arcade button found:", gameTrigger);

  // Add our own click listener to test if clicks are working
  gameTrigger.addEventListener("click", function (e) {
    console.log("🎯 Our test listener: Button clicked!");
    console.log("🎯 Event:", e);
  });

  // Check if the button has any existing click listeners
  const hasClickListeners =
    gameTrigger.onclick ||
    gameTrigger.getAttribute("onclick") ||
    gameTrigger.getAttribute("data-onclick");

  console.log("🎯 Button has onclick attribute:", hasClickListeners);

  // Try to simulate a click
  console.log("🖱️ Simulating click...");
  gameTrigger.click();

  // Check canvas state
  const canvas = document.getElementById("game-canvas");
  if (canvas) {
    console.log(
      "🎨 Canvas found, current opacity:",
      window.getComputedStyle(canvas).opacity
    );
  } else {
    console.error("❌ Canvas not found!");
  }

  console.log("🧪 Test completed");
});
