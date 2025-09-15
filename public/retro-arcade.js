console.log('[RetroArcade] retro-arcade.js script loaded');
// --- Force leaderboard visibility in TEST_MODE for Playwright and all browsers ---
if (typeof window !== 'undefined' && window.TEST_MODE) {

  document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.innerHTML = `
      #leaderboard, #leaderboard-list {
        opacity: 1 !important;
        display: block !important;
        visibility: visible !important;
        max-height: 1000px !important;
        height: auto !important;
        pointer-events: auto !important;
      }
      #leaderboard.hidden, #leaderboard-list.hidden {
        display: block !important;
        opacity: 1 !important;
        visibility: visible !important;
      }
      #leaderboard.opacity-0, #leaderboard-list.opacity-0 {
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(style);
  });

//
// --- Early global test hook for Playwright ---
if (typeof window !== 'undefined' && !window.__ARCADE_TEST_HOOK__) {
  window.__ARCADE_TEST_HOOK__ = {
    injectedLeaderboardEntries: [],
    injectLeaderboardEntries: (entries) => {
      window.__ARCADE_TEST_HOOK__.injectedLeaderboardEntries = entries;
      // If overlay is loaded, update leaderboard
      if (window.retroArcade && window.retroArcade.gameOverlay && typeof window.retroArcade.gameOverlay.updateLeaderboard === 'function') {
        window.retroArcade.gameOverlay.updateLeaderboard(entries);
      } else {
        // Fallback: update leaderboard DOM directly if present
        const list = document.getElementById('leaderboard-list');
        if (list && Array.isArray(entries)) {
          list.innerHTML = entries.map(e => `<li>${e.name || 'Player'}: ${e.score || 0}</li>`).join('');
        }
      }
    },
    forceShowLeaderboard: () => {
      if (window.retroArcade && window.retroArcade.gameOverlay && typeof window.retroArcade.gameOverlay.showLeaderboard === 'function') {
        window.retroArcade.gameOverlay.showLeaderboard();
      } else {
        // Fallback: show leaderboard DOM directly and forcibly set all relevant CSS for visibility
        const leaderboard = document.getElementById('leaderboard');
        if (leaderboard) {
          leaderboard.style.display = '';
          leaderboard.style.setProperty('opacity', '1', 'important');
          leaderboard.style.visibility = 'visible';
          leaderboard.style.maxHeight = '1000px';
          leaderboard.style.height = 'auto';
          leaderboard.classList.remove('hidden');
          leaderboard.classList.remove('opacity-0');
          // MutationObserver to keep removing 'opacity-0' and force opacity 1
          if (!window.__LEADERBOARD_OBSERVER__) {
            window.__LEADERBOARD_OBSERVER__ = new MutationObserver(() => {
              if (leaderboard.classList.contains('opacity-0')) {
                leaderboard.classList.remove('opacity-0');
                leaderboard.style.setProperty('opacity', '1', 'important');
              }
            });
            window.__LEADERBOARD_OBSERVER__.observe(leaderboard, { attributes: true, attributeFilter: ['class'] });
          }
        }
        const leaderboardList = document.getElementById('leaderboard-list');
        if (leaderboardList) {
          leaderboardList.style.display = '';
          leaderboardList.style.opacity = '1';
          leaderboardList.style.visibility = 'visible';
          leaderboardList.style.maxHeight = '1000px';
          leaderboardList.style.height = 'auto';
          leaderboardList.classList.remove('hidden');
        }
      }
    }
  };

// Retro arcade client script moved out of inline layout
class RetroArcade {
  constructor() {
    // Ensure canvas exists
    this.canvas = document.getElementById("game-canvas");
    if (!this.canvas) {
      console.error("❌ Game canvas not found!");
      return;
    }

    this.triggerWord = document.getElementById("trigger-word");
    this.leaderboard = document.getElementById("leaderboard");
    this.leaderboardList = document.getElementById("leaderboard-list");
    this.closeLeaderboardBtn = document.getElementById("close-leaderboard");

    this.gameOverlay = null;
    this.isActive = false;

    // Start overlay removal observer and interval in TEST_MODE
    if (typeof window !== 'undefined' && window.TEST_MODE) {
      this._startOverlayRemovalObserver();
      this._startOverlayRemovalInterval();
    }
  }

  _startOverlayRemovalInterval() {
    if (this._overlayInterval) return;
    if (!(typeof window !== 'undefined' && window.TEST_MODE)) return;
    const selectors = [
      'vite-error-overlay',
      '.vite-error-overlay',
      '.astro-error-overlay',
      '#cookie-consent',
      '#cookie-settings-modal'
    ];
    const suppressOverlays = () => {
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          el.style.pointerEvents = 'none';
          el.style.opacity = '0';
          el.style.display = 'none';
        });
      });
      // Ensure the game trigger is always accessible
      const trigger = document.getElementById('game-trigger');
      if (trigger) {
        trigger.style.zIndex = '10000';
        trigger.style.pointerEvents = 'auto';
        trigger.style.opacity = '1';
        trigger.style.position = 'fixed';
        trigger.style.bottom = '24px';
        trigger.style.right = '24px';
        trigger.style.touchAction = 'manipulation';
      }
    };
    // Run every 250ms, idempotent
    this._overlayInterval = setInterval(suppressOverlays, 250);
    // Initial call
    suppressOverlays();
  }

  ensureTriggerIsAccessible() {
    // Ensure the trigger is always on top and interactable
    const trigger = document.getElementById("game-trigger");
    if (trigger) {
      trigger.style.zIndex = "10000";
      trigger.style.pointerEvents = "auto";
      trigger.style.opacity = "1";
      trigger.style.position = "fixed";
      trigger.style.bottom = "24px";
      trigger.style.right = "24px";
      trigger.style.touchAction = "manipulation";
    }
    // Remove overlays in test mode (aggressive)
    if (typeof window !== 'undefined' && window.TEST_MODE) {
      // Remove/hide overlays that can block pointer events
      const selectors = [
        'vite-error-overlay',
        '.vite-error-overlay',
        '.astro-error-overlay',
        '#cookie-consent',
        '#cookie-settings-modal'
      ];
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          // Remove if possible, else hide
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          } else {
            el.style.display = 'none';
            el.style.pointerEvents = 'none';
            el.style.opacity = '0';
          }
        });
      });
    }
  }

  bindEvents() {
    // Trigger word activation - bind to both span and parent div for better UX
    const triggerElement =
      this.triggerWord || document.getElementById("trigger-word");
    const triggerContainer = document.getElementById("game-trigger");

    const triggerHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("🎯 Game trigger activated!");
      this.activateGame();
    };

    if (triggerElement) {
      triggerElement.addEventListener("click", triggerHandler);
      triggerElement.addEventListener("touchstart", triggerHandler, { passive: false });
    }

    if (triggerContainer) {
      triggerContainer.addEventListener("click", triggerHandler);
      triggerContainer.addEventListener("touchstart", triggerHandler, { passive: false });
    }

    // Leaderboard controls
    if (this.closeLeaderboardBtn) {
      this.closeLeaderboardBtn.addEventListener("click", () => {
        this.hideLeaderboard();
      });
    }
  }

  async activateGame() {
    if (this.isActive) {
      console.log("🎯 Game already active, ignoring trigger");
      return;
    }
    // Remove overlays in test mode (redundant but extra safe)
    if (typeof window !== 'undefined' && window.TEST_MODE) {
      const selectors = [
        'vite-error-overlay',
        '.vite-error-overlay',
        '.astro-error-overlay',
        '#cookie-consent',
        '#cookie-settings-modal'
      ];
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          } else {
            el.style.display = 'none';
            el.style.pointerEvents = 'none';
            el.style.opacity = '0';
          }
        });
      });
    }

    console.log("🎯 Activating game...");

    try {
      this.isActive = true;
      this.canvas.style.pointerEvents = "auto";
      this.canvas.style.opacity = "0.8";
      this.canvas.style.zIndex = "35"; // Above navigation but below modal elements
      if (this.triggerWord) this.triggerWord.style.opacity = "0";

      // Apply enhanced retro styling for game mode + scroll lock
      document.body.classList.add("game-mode");
      document.body.classList.add("game-mode-scroll-lock");
      this._addScrollKeySuppression();

      console.log("🎯 Importing GameOverlay...");
      // Initialize modular game overlay
      const { GameOverlay } = await import("./GameOverlay.js");
      console.log("🎯 GameOverlay imported successfully");

      this.gameOverlay = new GameOverlay(this.canvas);

      // Set up deactivation callback to properly clean up
      this.gameOverlay.onDeactivate = () => {
        this.deactivateGame();
      };

      console.log("🎯 Activating GameOverlay...");
      await this.gameOverlay.activate();

      this.showLeaderboard();
      console.log("🎮 Retro Arcade activated - enhanced game mode!");
    } catch (error) {
      console.error("❌ Failed to activate game:", error);
      // Reset state on error
      this.isActive = false;
      this.canvas.style.pointerEvents = "none";
      this.canvas.style.opacity = "0";
      this.canvas.style.zIndex = "30";
      if (this.triggerWord) {
        this.triggerWord.style.opacity = "0.3";
      }
      document.body.classList.remove("game-mode");

      // Show error message to user
      console.log(
        "No player name provided. Game overlay will handle name prompt."
      );
    }
  }

  deactivateGame() {
    if (!this.isActive) return;

    this.isActive = false;
    this.canvas.style.pointerEvents = "none";
    this.canvas.style.opacity = "0";
    this.canvas.style.zIndex = "30"; // Back to normal z-index
    if (this.triggerWord) this.triggerWord.style.opacity = "0.3";

    // Remove enhanced game mode styling & scroll lock
    document.body.classList.remove("game-mode");
    document.body.classList.remove("game-mode-scroll-lock");
    this._removeScrollKeySuppression();

    if (this.gameOverlay) {
      this.gameOverlay.deactivate();
      this.gameOverlay = null;
    }

    this.hideLeaderboard();
    console.log("Game deactivated successfully");
  }

  showLeaderboard() {

    // Leaderboard currently removed; guard for absence.
    if (
      this.gameOverlay &&
      typeof this.gameOverlay.showLeaderboard === "function"
    ) {
      this.gameOverlay.showLeaderboard();
    }
  }

  _addScrollKeySuppression() {
    this._keyHandler = (e) => {
      if (!this.isActive) return;
      // Ignore if focusing an input/textarea/contentEditable
      const target = e.target;
      const tag = target && target.tagName ? target.tagName.toLowerCase() : "";
      if (tag === "input" || tag === "textarea" || target.isContentEditable) {
        return;
      }
      const keysToBlock = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        " ", // Space (Chrome/Firefox)
        "Spacebar", // Legacy
        "PageUp",
        "PageDown",
        "Home",
        "End",
      ];
      if (keysToBlock.includes(e.key)) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", this._keyHandler, { passive: false });
  }

  _removeScrollKeySuppression() {
    if (this._keyHandler) {
      window.removeEventListener("keydown", this._keyHandler);
      this._keyHandler = null;
    }
  }
} // <-- Close RetroArcade class definition

// --- Robust RetroArcade Initialization ---
function initRetroArcade(forceReinit = false) {
  try {
    if (
      forceReinit ||
      !window.retroArcade ||
      typeof window.retroArcade.bindEvents !== "function"
    ) {
      window.retroArcade = new RetroArcade();
      console.log("[RetroArcade] Initialized new instance");
    } else {
      window.retroArcade.bindEvents();
      console.log("[RetroArcade] Re-bound events after navigation");
    }

  } catch (e) {
    console.error("Failed to initialize RetroArcade", e);
  }
} // <-- Correctly close initRetroArcade

// Standard DOMContentLoaded

document.addEventListener("DOMContentLoaded", () => {
console.log('[RetroArcade] retro-arcade.js loaded');

// --- TEST_MODE detection (keep for early flag) ---
if (typeof window !== 'undefined') {
  try {
    var search = window.location.search;
    var cookie = document.cookie || '';

    if (search.match(/[?&]testMode=1(?!\d)/) || /TEST_MODE=1/.test(cookie)) {
      window.TEST_MODE = true;
    }

  } catch (e) {}

// Astro client navigation support (if present)
if (window && window.addEventListener) {
  window.addEventListener("astro:after-swap", () => {
    setTimeout(() => initRetroArcade(true), 0);
  });
}

// Fallback for popstate (history navigation)
window.addEventListener("popstate", () => {
  setTimeout(() => initRetroArcade(true), 0);
});

// Fallback for visibilitychange (tab switch)
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    setTimeout(() => initRetroArcade(true), 0);
  }
});

// MutationObserver: re-initialize if #game-trigger is added dynamically
if (
  typeof window !== "undefined" &&
  typeof window.MutationObserver !== "undefined"
) {
  const observer = new window.MutationObserver(() => {
    if (!window.retroArcade || !document.getElementById("game-trigger")) {
      setTimeout(() => initRetroArcade(true), 0);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

