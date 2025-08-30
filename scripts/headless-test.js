import puppeteer from "puppeteer";

(async () => {
  const url = process.env.URL || "http://localhost:4322/";
  console.log("Starting headless test against", url);

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  const logs = [];
  page.on("console", (msg) => {
    const text = msg.text();
    logs.push(text);
    console.log("PAGE LOG>", text);
  });

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    // Ensure trigger exists
    await page.waitForSelector("#game-trigger", { timeout: 10000 });
    await page.waitForSelector("#trigger-word", { timeout: 10000 });
    await page.waitForSelector("#game-canvas", { timeout: 10000 });

    // Configure simulation parameters
    const rounds = parseInt(process.env.ROUNDS || "3", 10);
    const failuresBeforeSuccess = parseInt(process.env.FAILURES || "2", 10);

    // Override fetch in the page to simulate transient failures for workflow submission
    await page.evaluate((failures) => {
      window.__fetchFailureCount = failures;
      window.__originalFetch = window.fetch.bind(window);
      window.fetch = async (...args) => {
        if (
          args[0] &&
          typeof args[0] === "string" &&
          args[0].includes("/api/workflows/game-score-processor")
        ) {
          if (window.__fetchFailureCount > 0) {
            window.__fetchFailureCount -= 1;
            console.warn(
              "Simulated workflow failure, remaining failures:",
              window.__fetchFailureCount
            );
            return new Response(null, {
              status: 500,
              statusText: "Simulated Failure",
            });
          }
          // Simulate success
          return new Response(
            JSON.stringify({ success: true, processed: true }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        return window.__originalFetch(...args);
      };
    }, failuresBeforeSuccess);

    // Initial canvas opacity should be 0 (or 0px)
    const initialOpacity = await page.$eval(
      "#game-canvas",
      (el) => getComputedStyle(el).opacity
    );
    console.log("Initial canvas opacity:", initialOpacity);

    // Click the trigger (first try trigger-word then container)
    const triggerWord = await page.$("#trigger-word");
    if (triggerWord) {
      await triggerWord.click({ delay: 50 });
    } else {
      await page.click("#game-trigger");
    }

    // Wait for canvas opacity to increase
    await page.waitForFunction(
      () => {
        const c = document.getElementById("game-canvas");
        if (!c) return false;
        const o = parseFloat(getComputedStyle(c).opacity || "0");
        return o > 0.1;
      },
      { timeout: 10000 }
    );

    const afterOpacity = await page.$eval(
      "#game-canvas",
      (el) => getComputedStyle(el).opacity
    );
    console.log("After click canvas opacity:", afterOpacity);

    // Check leaderboard visible
    const leaderboardOpacity = await page.$eval(
      "#leaderboard",
      (el) => getComputedStyle(el).opacity
    );
    console.log("Leaderboard opacity:", leaderboardOpacity);

    // Use exposed retroArcade instance to access GameManager
    const hasRetro = await page.evaluate(() => !!window.retroArcade);
    if (!hasRetro) {
      console.warn("retroArcade not exposed on window; attempting fallback.");
    }

    // Override window.prompt to avoid blocking and provide a deterministic name
    await page.evaluate(() => {
      window._originalPrompt = window.prompt;
      window.prompt = () => "HeadlessTester";
    });

    // Simulate multiple rounds of gameplay
    for (let r = 0; r < rounds; r++) {
      console.log("Starting simulation round", r + 1, "of", rounds);
      await page.evaluate(async () => {
        const ra = window.retroArcade;
        if (!ra || !ra.gameOverlay || !ra.gameOverlay.gameManager) return null;
        const gm = ra.gameOverlay.gameManager;
        // For each game, if unlocked, start it, then call saveScore with a synthetic score, then return to menu
        for (let i = 0; i < gm.games.length; i++) {
          if (!gm.unlockedGames[i]) continue;
          const gameName = gm.games[i];
          try {
            await gm.startGame(gameName);
            // Wait briefly to let game initialize
            await new Promise((r) => setTimeout(r, 300));
            // Submit synthetic score
            await gm.saveScore(
              gameName,
              Math.floor(100 + Math.random() * 2000)
            );
            // Return to menu
            gm.returnToMenu();
            await new Promise((r) => setTimeout(r, 200));
          } catch (e) {
            console.error("Simulation error for", gameName, e);
          }
        }
        return true;
      });
      // small pause between rounds
      await new Promise((res) => setTimeout(res, 400));
    }

    // Restore prompt
    await page.evaluate(() => {
      if (window._originalPrompt) {
        window.prompt = window._originalPrompt;
      }
      delete window._originalPrompt;
    });

    // Verify leaderboard persisted in localStorage
    const stored = await page.evaluate(() =>
      localStorage.getItem("retroArcadeLeaderboard")
    );
    console.log(
      "Stored leaderboard length:",
      stored ? JSON.parse(stored).length : 0
    );
    if (!stored) throw new Error("Leaderboard not persisted to localStorage");

    // Verify unlocks persisted
    const unlocked = await page.evaluate(() =>
      localStorage.getItem("retroArcadeUnlockedGames")
    );
    console.log("Unlocked games saved:", unlocked);

    // Check how many simulated failures remain
    const remainingFailures = await page.evaluate(
      () => window.__fetchFailureCount
    );
    console.log("Remaining simulated workflow failures:", remainingFailures);

    // Log sample of leaderboard
    const sample = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("retroArcadeLeaderboard")).slice(0, 5)
    );
    console.log("Leaderboard sample:", sample);

    console.log("Headless multi-round test: SUCCESS");
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error("Headless multi-round test: FAILURE", err);
    console.log("Last page logs:", logs.slice(-50));
    await browser.close();
    process.exit(2);
  }
})();
