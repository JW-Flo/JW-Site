const fetch = require('node-fetch');

async function testMCP() {
  try {
    const response = await fetch('http://localhost:5050/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: 'context_ingestion', context: 'Test context' })
    });
    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testMCP();
