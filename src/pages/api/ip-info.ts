// API endpoint for IP information
// This provides a CORS-friendly way to get visitor IP info

import type { APIContext } from 'astro';

export async function GET({ request, clientAddress }: APIContext) {
  try {
    // Get client IP from various headers with proper fallback chain
    let clientIP = 'unknown';
    
    // Priority order for IP detection
    const cfConnectingIP = request.headers.get('CF-Connecting-IP');
    const xForwardedFor = request.headers.get('X-Forwarded-For');
    const xRealIP = request.headers.get('X-Real-IP');
    
    if (cfConnectingIP) {
      clientIP = cfConnectingIP.trim();
    } else if (xForwardedFor) {
      clientIP = xForwardedFor.split(',')[0].trim();
    } else if (xRealIP) {
      clientIP = xRealIP.trim();
    } else if (clientAddress) {
      clientIP = clientAddress;
    }
    
    // Validate IP format (basic check)
    const isValidIP = /^(?:\d{1,3}\.){3}\d{1,3}$|^[\da-fA-F:]+$/.test(clientIP);
    if (!isValidIP && clientIP !== 'unknown') {
      clientIP = 'invalid';
    }
    
    // Get additional Cloudflare headers if available
    const cfHeaders = {
      country: request.headers.get('CF-IPCountry') || null,
      region: request.headers.get('CF-Region') || null,
      city: request.headers.get('CF-IPCity') || null,
      timezone: request.headers.get('CF-Timezone') || null,
      asn: request.headers.get('CF-ASN') || null,
      colo: request.headers.get('CF-RAY')?.split('-')[1] || null
    };
    
    // Determine connection security
    const isSecure = request.url.startsWith('https://');
    const userAgent = request.headers.get('User-Agent') || '';
    
    // Basic bot detection
    const isBot = /bot|crawler|spider|scraping/i.test(userAgent);
    
    // Prepare response data
    const ipInfo = {
      ip: clientIP,
      secure: isSecure,
      protocol: isSecure ? 'HTTPS' : 'HTTP',
      userAgent: userAgent.substring(0, 100), // Truncate for privacy
      isBot: isBot,
      timestamp: new Date().toISOString(),
      
      // Cloudflare-specific data (if available)
      location: {
        country: cfHeaders.country,
        region: cfHeaders.region, 
        city: cfHeaders.city,
        timezone: cfHeaders.timezone
      },
      
      network: {
        asn: cfHeaders.asn,
        datacenter: cfHeaders.colo
      },
      
      // Privacy-focused flags
      privacy: {
        vpnDetected: false, // Would need additional service to detect
        proxyDetected: false,
        torDetected: false
      }
    };
    
    // Clean up null values
    (Object.keys(ipInfo.location) as Array<keyof typeof ipInfo.location>).forEach(key => {
      if (ipInfo.location[key] === null) {
        delete ipInfo.location[key];
      }
    });
    
    (Object.keys(ipInfo.network) as Array<keyof typeof ipInfo.network>).forEach(key => {
      if (ipInfo.network[key] === null) {
        delete ipInfo.network[key];
      }
    });

    return new Response(JSON.stringify(ipInfo), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('IP API error:', error);
    
    return new Response(JSON.stringify({
      error: 'Unable to determine IP information',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
