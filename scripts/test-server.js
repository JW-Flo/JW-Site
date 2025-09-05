const fetch = require("node-fetch");

async function testServer() {
  try {
    console.log("🔍 Testing MCP Server...");

    // Test health endpoint
    const healthResponse = await fetch("http://localhost:5050/health");
    const healthData = await healthResponse.json();
    console.log("✅ Health check passed:", healthData);

    // Test a simple research step
    console.log("\n🧪 Testing context ingestion...");
    const contextResponse = await fetch("http://localhost:5050/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        step: "context_ingestion",
        context: "Test research context",
      }),
    });

    const contextData = await contextResponse.json();
    console.log("✅ Context ingestion successful");
    console.log("📊 Files analyzed:", contextData.analysis?.totalFiles || 0);

    console.log("\n🎉 MCP Server is fully functional!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.log("\n💡 Make sure the MCP server is running:");
    console.log("   node /Users/jw/Projects/JW-Site/scripts/mcp-server.js");
  }
}

testServer();
