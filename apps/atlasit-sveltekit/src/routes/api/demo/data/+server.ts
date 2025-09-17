import { json } from '@sveltejs/kit';

export const GET = async () => {
  try {
    // Proxy to the Astro API
    const response = await fetch('http://localhost:4324/api/demo/data', {
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
    console.error('Error fetching demo data:', error);
    return json({ error: 'Failed to fetch demo data' }, { status: 500 });
  }
};
