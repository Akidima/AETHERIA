// Presets API endpoint
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get user from auth header
  const authHeader = req.headers.authorization;
  let userId: string | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const { data: { user } } = await supabase.auth.getUser(token);
    userId = user?.id || null;
  }

  try {
    if (req.method === 'GET') {
      const { public: isPublic } = req.query;

      let query = supabase.from('custom_presets').select('*');

      if (isPublic === 'true') {
        // Get public presets
        query = query.eq('is_public', true);
      } else if (userId) {
        // Get user's presets
        query = query.eq('user_id', userId);
      } else {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { data: presets, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({ presets: presets || [] });
    }

    // Require auth for mutations
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'POST') {
      const { name, params, visualMode, isPublic } = req.body;

      if (!name || !params) {
        return res.status(400).json({ error: 'Name and params required' });
      }

      const { data, error } = await supabase
        .from('custom_presets')
        .insert({
          user_id: userId,
          name,
          params,
          visual_mode: visualMode || 'sphere',
          is_public: isPublic || false,
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({ preset: data });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Preset ID required' });
      }

      const { error } = await supabase
        .from('custom_presets')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Presets API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
