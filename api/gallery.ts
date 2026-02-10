// Vercel Serverless Function - Public Gallery
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sort = 'recent', limit = '20', offset = '0' } = req.query;

  try {
    let query = supabase
      .from('shared_visualizations')
      .select('share_id, input, params, created_at, views, likes')
      .eq('is_public', true);

    // Sorting
    if (sort === 'popular') {
      query = query.order('views', { ascending: false });
    } else if (sort === 'liked') {
      query = query.order('likes', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Pagination
    query = query.range(
      parseInt(offset as string),
      parseInt(offset as string) + parseInt(limit as string) - 1
    );

    const { data, error, count } = await query;

    if (error) {
      console.error('Gallery error:', error);
      return res.status(500).json({ error: 'Failed to fetch gallery' });
    }

    return res.status(200).json({
      success: true,
      items: data?.map(item => ({
        shareId: item.share_id,
        input: item.input,
        params: item.params,
        createdAt: item.created_at,
        views: item.views,
        likes: item.likes,
      })) || [],
      total: count,
    });
  } catch (error) {
    console.error('Gallery error:', error);
    return res.status(500).json({ error: 'Failed to fetch gallery' });
  }
}
