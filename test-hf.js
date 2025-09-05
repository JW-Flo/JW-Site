const fetch = require('node-fetch');
const HF_API_KEY = process.env.HF_API_KEY;

console.log('Testing HuggingFace API...');
console.log('API Key loaded:', !!HF_API_KEY);

if (!HF_API_KEY) {
  console.log('❌ No API key found');
  process.exit(1);
}

fetch('https://api-inference.huggingface.co/models/facebook/bart-large-cnn', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + HF_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    inputs: 'This is a test of AI summarization for market research.',
    parameters: { max_length: 30, min_length: 10 }
  })
})
.then(r => {
  console.log('Response status:', r.status);
  return r.text();
})
.then(t => {
  console.log('Raw response:', t.substring(0, 200));
  try {
    const d = JSON.parse(t);
    console.log('✅ API working! Response:', JSON.stringify(d, null, 2));
  } catch {
    console.log('❌ Could not parse JSON response');
  }
})
.catch(e => console.log('❌ Error:', e.message));
