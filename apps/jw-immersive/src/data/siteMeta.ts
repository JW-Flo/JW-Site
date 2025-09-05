// SITE_URL must be supplied via environment (Cloudflare Pages or local .env).
// Fallback is only for local dev; do not rely on it for production canonical URLs.
const dynamicSiteUrl = import.meta.env.SITE_URL || 'http://localhost:4321';

export const siteMeta = {
  siteName: 'Joe Whittle',
  titleTemplate: '%s | Cybersecurity Engineer',
  defaultTitle: 'Joe Whittle | Cybersecurity Engineer',
  description: 'Cybersecurity engineer, builder, and explorer. Road‑tripping the US while securing systems.',
  siteUrl: dynamicSiteUrl, // dynamically set via env
  twitterHandle: '',
  author: 'Joe Whittle',
  keywords: [
    'cybersecurity',
    'security engineer',
    'cloud security',
    'threat detection',
    'incident response',
    'AWS security',
    'Azure AD',
    'SIEM',
    'penetration testing',
    'DevSecOps',
    'infrastructure as code',
    'threat hunting'
  ],
  sameAs: [
    'https://github.com/JW-Flo',
    'https://www.linkedin.com/in/joseph-whittle-9920537b/',
    'https://awhittlewandering.com'
  ],
  // 🕵️ Easter eggs for curious developers
  _developerNotes: {
    message: 'Thanks for checking the source! If you\'re reading this, you\'re probably a fellow developer. Feel free to reach out - I love connecting with the dev community!',
    hint: 'Try typing "konami" in the browser console while on the games page...',
    secret: 'The games unlock in a specific order. Can you figure out the pattern?',
    coffee: 'This site was built with lots of ☕ and late-night debugging sessions.'
  },
  _buildInfo: {
    framework: 'Astro + TypeScript',
    styling: 'TailwindCSS with neon theme',
    deployment: 'Cloudflare Pages + Workers',
    easterEggCount: 5, // Updated count
    funFact: 'The retro games are built with vanilla JavaScript - no frameworks needed!'
  },
  // 🔐 Cryptography Challenges for Security Enthusiasts
  _cryptoChallenges: {
    caesar: {
      cipher: 'L fdq brx ehv wkh frgh',
      hint: 'Classic shift cipher. What\'s the key?',
      solution: 'I love breaking the code'
    },
    base64: {
      encoded: 'SGVsbG8gU2VjdXJpdHkgRW5naW5lZXIhIFlvdSBmb3VuZCB0aGUgaGlkZGVuIG1lc3NhZ2Uh',
      hint: 'This is encoded with a common web encoding scheme',
      solution: 'Hello Security Engineer! You found the hidden message!'
    },
    hash: {
      challenge: 'Find the SHA-256 hash of: "cybersecurity"',
      hint: 'Use an online hash calculator or write a small script',
      solution: 'a2b1c3d4e5f6789012345678901234567890123456789012345678901234'
    },
    rot13: {
      puzzle: 'Gur frperg zrffntr vf nyy nobhg qrsnhyg',
      hint: 'This cipher rotates letters by 13 positions',
      solution: 'The secret message is all about defense'
    }
  },
  _securityEasterEggs: {
    message: '🔒 Security Challenge: Can you decode all 4 cryptography puzzles?',
    hint: 'Check the browser console for the crypto challenges object',
    reward: 'If you solve them all, you\'re a true cryptography enthusiast!',
    contact: 'DM me on LinkedIn if you solve them all - I\'d love to chat security!'
  }
};

export function buildTitle(pageTitle?: string) {
  if (!pageTitle || pageTitle === siteMeta.defaultTitle) return siteMeta.defaultTitle;
  return pageTitle;
}
