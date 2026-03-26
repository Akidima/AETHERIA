// Notification API - Push subscription management
import type { VercelRequest, VercelResponse } from '@vercel/node';

// In production, store subscriptions in database (Supabase)
// For now, use a simple in-memory store (replace with Supabase in production)
const subscriptions = new Map<string, PushSubscription>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { pathname } = new URL(req.url || '', `http://${req.headers.host}`);

  try {
    // Subscribe to push notifications
    if (req.method === 'POST' && pathname.includes('/subscribe')) {
      const { subscription, userId } = req.body;

      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Invalid subscription' });
      }

      // Store subscription (keyed by endpoint)
      subscriptions.set(subscription.endpoint, {
        ...subscription,
        userId,
        subscribedAt: new Date().toISOString(),
      });

      // In production: save to Supabase
      // const { data, error } = await supabase
      //   .from('push_subscriptions')
      //   .upsert({
      //     endpoint: subscription.endpoint,
      //     user_id: userId,
      //     keys: subscription.keys,
      //     subscribed_at: new Date().toISOString(),
      //   }, { onConflict: 'endpoint' });

      return res.status(201).json({ 
        success: true,
        message: 'Subscription saved successfully',
      });
    }

    // Unsubscribe from push notifications
    if (req.method === 'POST' && pathname.includes('/unsubscribe')) {
      const { endpoint } = req.body;

      if (!endpoint) {
        return res.status(400).json({ error: 'Endpoint required' });
      }

      subscriptions.delete(endpoint);

      // In production: delete from Supabase
      // await supabase
      //   .from('push_subscriptions')
      //   .delete()
      //   .eq('endpoint', endpoint);

      return res.status(200).json({ 
        success: true,
        message: 'Unsubscribed successfully',
      });
    }

    // Send push notification (admin/cron endpoint)
    if (req.method === 'POST' && pathname.includes('/send')) {
      const { title, body, url, targetUserId } = req.body;

      // In production, use web-push library:
      // const webpush = require('web-push');
      // webpush.setVapidDetails(
      //   'mailto:hello@aetheria.app',
      //   process.env.VAPID_PUBLIC_KEY,
      //   process.env.VAPID_PRIVATE_KEY
      // );
      //
      // const subs = targetUserId
      //   ? await supabase.from('push_subscriptions').select('*').eq('user_id', targetUserId)
      //   : await supabase.from('push_subscriptions').select('*');
      //
      // for (const sub of subs.data) {
      //   await webpush.sendNotification(sub, JSON.stringify({ title, body, url }));
      // }

      return res.status(200).json({ 
        success: true,
        message: 'Notifications queued',
      });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (error: any) {
    console.error('[Notifications API] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
    });
  }
}
