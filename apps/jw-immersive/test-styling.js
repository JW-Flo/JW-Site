#!/usr/bin/env node

/**
 * Styling Verification Test Suite
 * Tests the visual improvements made to fix the "looks like shit" issue
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

async function testStyling() {
  console.log("🎨 Testing Styling Improvements...\n");

  const tests = [
    {
      name: "🏠 Homepage loads with proper structure",
      test: async () => {
        const response = await makeRequest(SITE_URL);
        const success =
          response.status === 200 &&
          response.body.includes("JOE WHITTLE") &&
          response.body.includes("CYBERSECURITY ENGINEER");
        return { success, details: `Status: ${response.status}` };
      },
    },
    {
      name: "🎮 Retro arcade trigger is present",
      test: async () => {
        const response = await makeRequest(SITE_URL);
        const success =
          response.body.includes("READY PLAYER ONE") &&
          response.body.includes("RETRO ARCADE");
        return { success, details: "Game trigger found in HTML" };
      },
    },
    {
      name: "🎯 Hero section has proper structure",
      test: async () => {
        const response = await makeRequest(SITE_URL);
        const success =
          response.body.includes(
            '<section class="text-center py-12 md:py-20 relative overflow-hidden'
          ) &&
          response.body.includes("ENTER ARCADE") &&
          response.body.includes("LIVE SYSTEM");
        return { success, details: "Hero section structure validated" };
      },
    },
    {
      name: "💫 Tailwind classes are properly applied",
      test: async () => {
        const response = await makeRequest(SITE_URL);
        const success =
          response.body.includes("text-cyan-400") &&
          response.body.includes("text-green-400") &&
          response.body.includes("text-fuchsia-500");
        return { success, details: "Color classes found in HTML" };
      },
    },
    {
      name: "📱 Responsive navigation is present",
      test: async () => {
        const response = await makeRequest(SITE_URL);
        const success =
          response.body.includes("mobile-menu") &&
          response.body.includes("md:hidden") &&
          response.body.includes("Projects") &&
          response.body.includes("Workflows");
        return { success, details: "Navigation structure validated" };
      },
    },
    {
      name: "🎨 Font and styling resources loaded",
      test: async () => {
        const response = await makeRequest(SITE_URL);
        const success =
          response.body.includes("fonts.googleapis.com") &&
          response.body.includes("Orbitron") &&
          response.body.includes("JetBrains+Mono");
        return { success, details: "Font resources linked correctly" };
      },
    },
    {
      name: "🎭 Retro elements are present",
      test: async () => {
        const response = await makeRequest(SITE_URL);
        const success =
          response.body.includes("INCIDENTS RESOLVED") &&
          response.body.includes("FASTER RESPONSE") &&
          response.body.includes("VULNERABILITY CLOSURE") &&
          response.body.includes("SECURITY MONITORING");
        return { success, details: "Stats panels found" };
      },
    },
    {
      name: "🎪 Interactive elements configured",
      test: async () => {
        const response = await makeRequest(SITE_URL);
        const success =
          response.body.includes("game-trigger") &&
          response.body.includes("RetroArcade") &&
          response.body.includes("game-canvas");
        return { success, details: "Interactive game elements present" };
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

  console.log(`\n🎨 STYLING TEST RESULTS:`);
  console.log(`✅ Passed: ${passed}/${total} tests`);
  console.log(`📊 Success Rate: ${Math.round((passed / total) * 100)}%`);

  if (passed === total) {
    console.log(
      `\n🎉 ALL STYLING TESTS PASSED! The site should look much better now!`
    );
    console.log(`🔗 Live Site: ${SITE_URL}`);
  } else {
    console.log(`\n⚠️  Some styling tests failed. Check the details above.`);
  }

  return passed === total;
}

// Run the test
testStyling().catch(console.error);
