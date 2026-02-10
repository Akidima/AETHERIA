// Vercel Serverless Function - Create/Get Shared Visualization
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// Generate short ID for sharing
function generateShareId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - Retrieve shared visualization
  if (req.method === 'GET') {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Share ID is required' });
    }

    const { data, error } = await supabase
      .from('shared_visualizations')
      .select('*')
      .eq('share_id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Shared visualization not found' });
    }

    // Increment view count
    await supabase
      .from('shared_visualizations')
      .update({ views: (data.views || 0) + 1 })
      .eq('share_id', id);

    return res.status(200).json({
      success: true,
      data: {
        shareId: data.share_id,
        input: data.input,
        params: data.params,
        createdAt: data.created_at,
        views: data.views + 1,
      },
    });
  }

  // POST - Create shared visualization
  if (req.method === 'POST') {
    const { input, params, userId } = req.body;

    if (!input || !params) {
      return res.status(400).json({ error: 'Input and params are required' });
    }

    const shareId = generateShareId();

    const { data, error } = await supabase
      .from('shared_visualizations')
      .insert({
        share_id: shareId,
        input,
        params,
        user_id: userId || null,
        views: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Share error:', error);
      return res.status(500).json({ error: 'Failed to create share link' });
    }

    return res.status(201).json({
      success: true,
      shareId,
      url: `/share/${shareId}`,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
