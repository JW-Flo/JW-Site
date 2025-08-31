import type { APIRoute } from 'astro';

interface ScannerUsageData {
  scanType: string;
  targetDomain: string;
  scanMode: string;
  scanDuration: number;
  vulnerabilitiesFound: number;
  region: string;
  userAgent: string;
  sessionId: string;
  timestamp: number;
  userConsent: {
    analytics: boolean;
    timestamp: number;
  };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json() as ScannerUsageData;
    
    // Validate user consent
    if (!data.userConsent?.analytics) {
      return new Response(JSON.stringify({ 
        error: 'Analytics consent required' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Log analytics data (in production, send to analytics service)
    console.log('📊 Scanner Usage Analytics:', {
      scanType: data.scanType,
      domain: data.targetDomain,
      mode: data.scanMode,
      duration: data.scanDuration,
      vulnerabilities: data.vulnerabilitiesFound,
      region: data.region,
      timestamp: new Date(data.timestamp).toISOString()
    });
    
    // Store in analytics database (example structure)
    const analyticsEntry = {
      type: 'scanner_usage',
      data: {
        scan_type: data.scanType,
        target_domain: data.targetDomain,
        scan_mode: data.scanMode,
        scan_duration_ms: data.scanDuration,
        vulnerabilities_found: data.vulnerabilitiesFound,
        user_region: data.region,
        user_agent: data.userAgent,
        session_id: data.sessionId
      },
      timestamp: data.timestamp,
      consent_timestamp: data.userConsent.timestamp
    };
    
    // In production, you would save this to your analytics database
    // await saveToAnalyticsDB(analyticsEntry);
    
    // Example: Send to external analytics service if configured
    if (process.env.ANALYTICS_WEBHOOK_URL) {
      try {
        await fetch(process.env.ANALYTICS_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.ANALYTICS_API_KEY}`
          },
          body: JSON.stringify(analyticsEntry)
        });
      } catch (error) {
        console.error('External analytics service error:', error);
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Analytics data recorded'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Scanner usage analytics error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to process analytics data' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
