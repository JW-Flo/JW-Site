// Test script to verify arcade button functionality
// This simulates clicking the arcade button and checks if the game activates

// Wait for DOM to load
document.addEventListener("DOMContentLoaded", function () {
  console.log("🧪 Testing arcade button functionality...");

  // Find the arcade button
  const gameTrigger = document.getElementById("game-trigger");
  if (!gameTrigger) {
    console.error("❌ Arcade button not found!");
    return;
  }

  console.log("✅ Arcade button found:", gameTrigger);

  // Check if the button has click event listeners
  const hasClickListeners =
    gameTrigger.onclick ||
    gameTrigger.hasAttribute("onclick") ||
    gameTrigger.getAttribute("data-onclick") ||
    gameTrigger.addEventListener.toString().includes("click");

  console.log("🎯 Button has click listeners:", hasClickListeners);

  // Simulate a click event
  console.log("🖱️ Simulating click on arcade button...");
  gameTrigger.click();

  // Check if game canvas becomes visible after a short delay
  setTimeout(() => {
    const canvas = document.getElementById("game-canvas");
    if (canvas) {
      const opacity = window.getComputedStyle(canvas).opacity;
      console.log("🎨 Canvas opacity after click:", opacity);

      if (opacity > 0) {
        console.log("✅ Game canvas is visible - arcade button is working!");
      } else {
        console.log(
          "❌ Game canvas is still hidden - arcade button may not be working"
        );
      }
    } else {
      console.error("❌ Game canvas not found!");
    }
  }, 1000);

  // Check for any JavaScript errors
  window.addEventListener("error", function (e) {
    console.error("🚨 JavaScript error detected:", e.error);
  });

  console.log("🧪 Arcade button test completed");
});
