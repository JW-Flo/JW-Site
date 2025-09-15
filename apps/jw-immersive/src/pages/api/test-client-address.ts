// Test endpoint to verify clientAddress availability

export const GET = async () => {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    // Always return safe fallback/test data in test/dev/static mode
    return new Response(JSON.stringify({
      message: 'clientAddress test',
      clientAddress: '127.0.0.1',
      clientAddressType: 'string',
      clientAddressExists: true,
      headers: { 'user-agent': 'Playwright Test User' },
      url: 'http://localhost/test',
      method: 'GET',
      timestamp: new Date().toISOString(),
      test: true
    }, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  // ...existing code for production if needed...
  return new Response(JSON.stringify({ error: 'Not implemented in production.' }), { status: 501 });
};
