#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");

console.log("🚀 AtlasIT Market Research System");
console.log("=".repeat(40));

// Start MCP server
console.log("📡 Starting MCP Research Server...");
const serverProcess = spawn("node", [path.join(__dirname, "mcp-server.js")], {
  stdio: "inherit",
  cwd: path.join(__dirname, ".."),
});

serverProcess.on("error", (error) => {
  console.error("❌ Failed to start MCP server:", error.message);
  process.exit(1);
});

// Wait a moment for server to start
setTimeout(() => {
  console.log("\n🔬 Starting Research Protocol...");
  const protocolProcess = spawn(
    "node",
    [path.join(__dirname, "run-mcp-protocol.js")],
    {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
    }
  );

  protocolProcess.on("close", (code) => {
    console.log(`\n✨ Research complete with exit code: ${code}`);
    serverProcess.kill();
    process.exit(code);
  });

  protocolProcess.on("error", (error) => {
    console.error("❌ Research protocol failed:", error.message);
    serverProcess.kill();
    process.exit(1);
  });
}, 3000);
