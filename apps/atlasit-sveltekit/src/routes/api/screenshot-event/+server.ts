import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
  try {
    // Proxy to the Astro API
    const response = await fetch('http://localhost:4324/api/screenshot-event', {
      method: 'GET',
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
    console.error('Error fetching screenshot events:', error);
    return json({ error: 'Failed to fetch screenshot events' }, { status: 500 });
  }
};
