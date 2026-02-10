// Vercel Serverless Function - Analytics Tracking
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST - Track event
  if (req.method === 'POST') {
    const events: AnalyticsEvent[] = Array.isArray(req.body) ? req.body : [req.body];

    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 'unknown';
    const userAgent = req.headers['user-agent'] || '';

    const records = events.map(event => ({
      event_name: event.event,
      properties: event.properties || {},
      user_id: event.userId || null,
      session_id: event.sessionId || null,
      ip_hash: Buffer.from(ip).toString('base64').substring(0, 16), // Hash IP for privacy
      user_agent: userAgent.substring(0, 255),
      created_at: event.timestamp || new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('analytics_events')
      .insert(records);

    if (error) {
      console.error('Analytics error:', error);
      // Don't fail the request for analytics errors
    }

    return res.status(200).json({ success: true });
  }

  // GET - Get analytics summary (admin only - would need auth in production)
  if (req.method === 'GET') {
    const { period = '7d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    const periodDays = period === '30d' ? 30 : period === '24h' ? 1 : 7;
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Get event counts
    const { data: eventCounts, error: eventError } = await supabase
      .from('analytics_events')
      .select('event_name')
      .gte('created_at', startDate.toISOString());

    if (eventError) {
      return res.status(500).json({ error: 'Failed to fetch analytics' });
    }

    // Aggregate counts
    const counts: Record<string, number> = {};
    eventCounts?.forEach(e => {
      counts[e.event_name] = (counts[e.event_name] || 0) + 1;
    });

    // Get popular emotions
    const { data: popularEmotions } = await supabase
      .from('interpretations')
      .select('input')
      .gte('created_at', startDate.toISOString())
      .limit(100);

    // Simple word frequency
    const wordCounts: Record<string, number> = {};
    popularEmotions?.forEach(e => {
      const words = e.input.toLowerCase().split(/\s+/);
      words.forEach((word: string) => {
        if (word.length > 2) {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
      });
    });

    const topEmotions = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    return res.status(200).json({
      success: true,
      period,
      events: counts,
      topEmotions,
      totalEvents: eventCounts?.length || 0,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
