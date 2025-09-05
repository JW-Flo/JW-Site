#!/usr/bin/env node

/**
 * Clean Design Verification Test
 * Tests that the cyberpunk effects have been removed and the site looks professional
 */

import https from "https";

const SITE_URL = "https://thewanderingwhittle.com";

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve({ status: res.statusCode, body: data }));
      })
      .on("error", reject);
  });
}

async function testCleanDesign() {
  console.log("🎨 Testing Clean Professional Design...\n");

  const tests = [
    {
      name: "✨ Professional color scheme applied",
      test: async () => {
        const response = await makeRequest(SITE_URL);
        const success =
          response.body.includes("text-blue-400") &&
          response.body.includes("text-emerald-400") &&
          response.body.includes("text-purple-400") &&
          !response.body.includes("text-neon-cyan") &&
          !response.body.includes("NEON");
        return {
          success,
          details: "Professional colors detected, neon colors removed",
        };
      },
    },
    {
      name: "🎯 Clean hero section structure",
      test: async () => {
        const response = await makeRequest(SITE_URL);
        const success =
          response.body.includes("Joe Whittle") &&
          response.body.includes("Cybersecurity Professional") &&
          response.body.includes("Building secure systems") &&
          !response.body.includes("SYSTEM BOOT COMPLETE") &&
          !response.body.includes("RETRO ARCADE");
        return {
          success,
          details: "Professional hero content without cyberpunk elements",
        };
      },
    },
    {
      name: "🎮 Subtle game trigger (not overwhelming)",
      test: async () => {
        const response = await makeRequest(SITE_URL);
        const success =
          response.body.includes("Gaming Mode") &&
          response.body.includes("Available") &&
          !response.body.includes("READY PLAYER ONE") &&
          !response.body.includes("JACK IN");
        return {
          success,
          details: "Subtle game trigger without cyberpunk styling",
        };
      },
    },
    {
      name: "📚 Professional typography",
      test: async () => {
        const response = await makeRequest(SITE_URL);
        const success =
          response.body.includes("Inter") &&
          !response.body.includes("Orbitron") &&
          !response.body.includes("font-mono") &&
          response.body.includes("font-semibold");
        return { success, details: "Clean typography with Inter font" };
      },
    },
    {
      name: "🎪 Professional action buttons",
      test: async () => {
        const response = await makeRequest(SITE_URL);
        const success =
          response.body.includes("Explore Interactive Demo") &&
          response.body.includes("Live Automation Systems") &&
          response.body.includes("Digital Guestbook") &&
          !response.body.includes("ENTER ARCADE") &&
          !response.body.includes("LIVE SYSTEM");
        return {
          success,
          details: "Professional button text without cyberpunk styling",
        };
      },
    },
    {
      name: "📊 Clean stats presentation",
      test: async () => {
        const response = await makeRequest(SITE_URL);
        const success =
          response.body.includes("Security Incidents Resolved") &&
          response.body.includes("Faster Response Time") &&
          response.body.includes("Vulnerability Closure Rate") &&
          !response.body.includes("INCIDENTS RESOLVED") &&
          !response.body.includes("FASTER RESPONSE");
        return {
          success,
          details: "Professional stats without all-caps styling",
        };
      },
    },
    {
      name: "🎨 No intense visual effects",
      test: async () => {
        const response = await makeRequest(SITE_URL);
        const success =
          !response.body.includes("animate-ping") &&
          !response.body.includes("animate-bounce") &&
          !response.body.includes("neon-glow") &&
          !response.body.includes("scanlines") &&
          !response.body.includes("circuit");
        return { success, details: "Heavy animations and effects removed" };
      },
    },
    {
      name: "💼 Professional background",
      test: async () => {
        const response = await makeRequest(SITE_URL);
        const success =
          response.body.includes("slate-900") &&
          response.body.includes("slate-800") &&
          !response.body.includes("radial-gradient") &&
          !response.body.includes("neon");
        return {
          success,
          details: "Clean slate background without cyberpunk effects",
        };
      },
    },
  ];

  let passed = 0;
  const total = tests.length;

  for (const test of tests) {
    try {
      const result = await test.test();
      if (result.success) {
        console.log(`✅ ${test.name}`);
        console.log(`   ${result.details}\n`);
        passed++;
      } else {
        console.log(`❌ ${test.name}`);
        console.log(`   ${result.details}\n`);
      }
    } catch (error) {
      console.log(`💥 ${test.name}`);
      console.log(`   Error: ${error.message}\n`);
    }
  }

  console.log(`\n🎨 CLEAN DESIGN TEST RESULTS:`);
  console.log(`✅ Passed: ${passed}/${total} tests`);
  console.log(`📊 Success Rate: ${Math.round((passed / total) * 100)}%`);

  if (passed === total) {
    console.log(
      `\n🎉 EXCELLENT! The site now has a clean, professional design!`
    );
    console.log(`🔗 Live Site: ${SITE_URL}`);
    console.log(`\n✨ Key Improvements:`);
    console.log(`   • Removed intense cyberpunk/neon effects`);
    console.log(`   • Clean professional color scheme`);
    console.log(`   • Modern typography with Inter font`);
    console.log(`   • Subtle game elements (not overwhelming)`);
    console.log(`   • Professional button and content styling`);
  } else {
    console.log(
      `\n⚠️  Some design elements still need cleanup. Check details above.`
    );
  }

  return passed === total;
}

// Run the test
testCleanDesign().catch(console.error);
