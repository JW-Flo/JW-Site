// Developer easter eggs moved out of inline layout to avoid hoisted-script errors
const easterEggs = {
  init() {
    this.setupConsoleEasterEggs();
    this.setupKonamiCode();
    this.setupCryptoHelpers();
    this.logWelcomeMessage();
  },

  logWelcomeMessage() {
    console.log("Developer easter eggs active - messages omitted for brevity");
  },

  setupConsoleEasterEggs() {
    window.siteMeta = window.siteMeta || {};
    window.dev = window.dev || {};
    window.unlockUltimateEasterEgg =
      window.unlockUltimateEasterEgg ||
      (() => {
        console.log("Ultimate easter egg locked. Hint: combine the Konami code with a cryptic cipher.");
      });
  },

  setupCryptoHelpers() {
    window.crypto = window.crypto || {};
    window.crypto.caesar =
      window.crypto.caesar || (() => console.log("caesar"));
    window.crypto.rot13Decrypt = window.crypto.rot13Decrypt || ((t) => t);
  },

  setupKonamiCode() {
    const konamiCode = [
      "ArrowUp",
      "ArrowUp",
      "ArrowDown",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
      "KeyB",
      "KeyA",
    ];
    let konamiIndex = 0;
    document.addEventListener("keydown", (e) => {
      if (e.code === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
          console.log("Konami code triggered");
          konamiIndex = 0;
        }
      } else {
        konamiIndex = 0;
      }
    });
  },
};

document.addEventListener("DOMContentLoaded", () => easterEggs.init());
