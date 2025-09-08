// Test arcade button on the actual live site
async function testLiveArcadeButton() {
  console.log("🧪 Testing arcade button on live site...");

  try {
    // Load the live site
    const response = await fetch("http://localhost:4321/team/jw/immersive");
    const html = await response.text();

    console.log("✅ Site loaded successfully");

    // Check if arcade button is in the HTML
    if (html.includes('id="game-trigger"')) {
      console.log("✅ Arcade button found in HTML");
    } else {
      console.log("❌ Arcade button not found in HTML");
    }

    // Check if JavaScript files are referenced
    if (html.includes("/retro-arcade.js")) {
      console.log("✅ Retro arcade script referenced");
    } else {
      console.log("❌ Retro arcade script not referenced");
    }

    if (html.includes("/GameOverlay.js")) {
      console.log("✅ GameOverlay script referenced");
    } else {
      console.log("❌ GameOverlay script not referenced");
    }

    // Test if we can access the JavaScript files
    const retroArcadeResponse = await fetch(
      "http://localhost:4321/team/jw/immersive/retro-arcade.js"
    );
    if (retroArcadeResponse.ok) {
      console.log("✅ Retro arcade script accessible");
    } else {
      console.log("❌ Retro arcade script not accessible");
    }

    const gameOverlayResponse = await fetch(
      "http://localhost:4321/team/jw/immersive/GameOverlay.js"
    );
    if (gameOverlayResponse.ok) {
      console.log("✅ GameOverlay script accessible");
    } else {
      console.log("❌ GameOverlay script not accessible");
    }

    const gameManagerResponse = await fetch(
      "http://localhost:4321/team/jw/immersive/GameManager.js"
    );
    if (gameManagerResponse.ok) {
      console.log("✅ GameManager script accessible");
    } else {
      console.log("❌ GameManager script not accessible");
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testLiveArcadeButton();
