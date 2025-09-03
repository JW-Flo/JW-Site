// Arcade Hints / Easter Egg Layer (initial minimal implementation)
// Non-module simple script (public) so it can be loaded by arcade without bundler dependency.
// Provides a deterministic hint per session segment; can be extended.
(function (global) {
  const STORAGE_KEY = "retroArcadeHintsSeen";
  const PROGRESS_KEY = "retroArcadeSecretProgress";

  function loadJSON(key, fallback) {
    try {
      const v = global.localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  }
  function saveJSON(key, value) {
    try {
      global.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore write errors */
    }
  }

  function getStats() {
    // Derive coarse stats from existing leaderboard + totals already stored by GameManager
    const totalScore =
      parseInt(
        global.localStorage.getItem("retroArcadeTotalScore") || "0",
        10
      ) || 0;
    const achievementsRaw = global.localStorage.getItem(
      "retroArcadeAchievements"
    );
    const achievements = achievementsRaw
      ? Object.values(JSON.parse(achievementsRaw)).filter(Boolean).length
      : 0;
    return { totalScore, achievements };
  }

  function segment(stats) {
    if (stats.totalScore >= 500) return "advanced";
    if (stats.totalScore >= 150) return "competent";
    if (stats.totalScore > 0) return "novice";
    return "visitor";
  }

  const HINTS = {
    visitor: [
      {
        id: "press-enter",
        text: "Earn points to unlock classics. Press Enter to start.",
      },
      {
        id: "score-unlocks",
        text: "Score points to reveal new games. Asteroids is first.",
      },
    ],
    novice: [
      {
        id: "unlock-pacman",
        text: "Reach 150 total points to unlock the maze.",
      },
      {
        id: "chain-bonus",
        text: "Try different games in a row for a future bonus.",
      },
    ],
    competent: [
      {
        id: "tetris-path",
        text: "300 total points opens the puzzle challenge.",
      },
      { id: "final-tease", text: "A final defense awaits at 500 points." },
    ],
    advanced: [
      {
        id: "secrets",
        text: "Hidden progress grows by exploring unusual site areas.",
      },
      { id: "robots", text: "Even robots.txt can whisper clues." },
    ],
  };

  function pickHint(list, seen) {
    for (const h of list) {
      if (!seen[h.id]) return h;
    }
    // fallback cycle first
    return list[0];
  }

  function getArcadeHint() {
    const stats = getStats();
    const seg = segment(stats);
    const seen = loadJSON(STORAGE_KEY, {});
    const list = HINTS[seg] || HINTS.visitor;
    const hint = pickHint(list, seen);
    // mark as seen (session persistence) but do not over-write if fallback reused
    seen[hint.id] = true;
    saveJSON(STORAGE_KEY, seen);
    return { segment: seg, ...hint };
  }

  function incrementSecretProgress(amount) {
    try {
      const current =
        parseInt(global.localStorage.getItem(PROGRESS_KEY) || "0", 10) || 0;
      const next = Math.min(100, current + amount);
      global.localStorage.setItem(PROGRESS_KEY, String(next));
      return next;
    } catch {
      return 0;
    }
  }

  global.ArcadeHints = { getArcadeHint, incrementSecretProgress };
})(typeof window !== "undefined" ? window : globalThis);
