#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🤖 AtlasIT AI Research Demo');
console.log('=' .repeat(40));

// Start MCP server
console.log('🚀 Starting AI-Enhanced MCP Server...');
const serverProcess = spawn('/usr/local/bin/node', ['/Users/jw/Projects/JW-Site/scripts/mcp-server.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, HF_API_KEY: process.env.HF_API_KEY, TOGETHER_API_KEY: process.env.TOGETHER_API_KEY }
});

serverProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('Server:', output.trim());
});

serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Wait for server and run a quick AI test
setTimeout(async () => {
  console.log('\n🧪 Testing AI Capabilities...');

  try {
    // Test health
    const healthResponse = await fetch('http://localhost:5050/health');
    const health = await healthResponse.json();
    console.log('✅ Server Health:', health);

    // Test quick market query
    console.log('\n📊 Testing AI Market Analysis...');
    const marketResponse = await fetch('http://localhost:5050/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step: 'quick_market_query',
        context: 'IT automation market trends 2024'
      })
    });

    const marketData = await marketResponse.json();
    console.log('✅ AI Market Query Results:');
    console.log('   📈 Execution Time:', marketData.executionTime);
    console.log('   📊 Data Points:', marketData.dataPoints);
    if (marketData.insights && marketData.insights.length > 0) {
      console.log('   🧠 AI Insights:', marketData.insights[0].summary);
    }

    console.log('\n🎉 AI Research System Successfully Demonstrated!');
    console.log('💡 Key Features:');
    console.log('   • HuggingFace AI Integration');
    console.log('   • Real-time Sentiment Analysis');
    console.log('   • Intelligent Text Summarization');
    console.log('   • Entity Recognition for Competitors');
    console.log('   • Strategic Question Answering');

  } catch (error) {
    console.log('❌ Demo failed:', error.message);
  }

  // Clean up
  serverProcess.kill();
  process.exit(0);
}, 3000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  serverProcess.kill();
  process.exit(0);
});
