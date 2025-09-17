import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async () => {
  try {
    // Proxy to the Astro API
    const response = await fetch('http://localhost:4324/api/demo/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return json(data);
  } catch (error) {
    console.error('Error resetting demo data:', error);
    return json({ error: 'Failed to reset demo data' }, { status: 500 });
  }
};
