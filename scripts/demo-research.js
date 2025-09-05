#!/usr/bin/env node

const { spawn } = require("child_process");

console.log("🚀 AtlasIT Market Research Demo");
console.log("=".repeat(50));

// Start MCP server in background
console.log("📡 Starting MCP Research Server...");
const serverProcess = spawn(
  "node",
  ["/Users/jw/Projects/JW-Site/scripts/mcp-server.js"],
  {
    stdio: ["pipe", "pipe", "pipe"],
  }
);

let serverReady = false;

serverProcess.stdout.on("data", (data) => {
  const output = data.toString();
  console.log("Server:", output.trim());
  if (output.includes("AtlasIT MCP Research Server running")) {
    serverReady = true;
  }
});

serverProcess.stderr.on("data", (data) => {
  console.error("Server Error:", data.toString());
});

serverProcess.on("close", (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Wait for server to be ready
const waitForServer = () => {
  return new Promise((resolve) => {
    const checkServer = () => {
      if (serverReady) {
        resolve();
      } else {
        setTimeout(checkServer, 500);
      }
    };
    checkServer();
  });
};

// Demo sequence
async function runDemo() {
  await waitForServer();
  console.log("\n🔬 Running Research Protocol Demo...");

  // Test health endpoint
  try {
    const response = await fetch("http://localhost:5050/health");
    const health = await response.json();
    console.log("✅ Health check:", health);
  } catch (error) {
    console.log("❌ Health check failed:", error.message);
  }

  // Test context ingestion
  try {
    console.log("\n📊 Testing context ingestion...");
    const response = await fetch("http://localhost:5050/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        step: "context_ingestion",
        context: "Demo research for AtlasIT platform",
      }),
    });
    const result = await response.json();
    console.log("✅ Context ingestion completed");
    console.log(`   📁 Files analyzed: ${result.analysis?.totalFiles || 0}`);
    console.log(
      `   📄 Docs: ${result.analysis?.docFiles || 0}, Code: ${
        result.analysis?.codeFiles || 0
      }`
    );
  } catch (error) {
    console.log("❌ Context ingestion failed:", error.message);
  }

  console.log("\n🎯 Demo completed successfully!");
  console.log(
    "💡 Full research protocol available via: node scripts/run-mcp-protocol.js"
  );

  // Clean up
  serverProcess.kill();
  process.exit(0);
}

// Start demo after a brief delay
setTimeout(runDemo, 2000);

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down...");
  serverProcess.kill();
  process.exit(0);
});
