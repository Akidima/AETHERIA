// Vercel Serverless Function - User History
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract user from authorization header
  const authHeader = req.headers.authorization;
  let userId: string | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) {
      userId = user.id;
    }
  }

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET - Fetch user history
  if (req.method === 'GET') {
    const { limit = '50', offset = '0' } = req.query;

    const { data, error } = await supabase
      .from('interpretations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(
        parseInt(offset as string),
        parseInt(offset as string) + parseInt(limit as string) - 1
      );

    if (error) {
      console.error('History fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch history' });
    }

    return res.status(200).json({
      success: true,
      items: data?.map(item => ({
        id: item.id,
        input: item.input,
        params: item.params,
        createdAt: item.created_at,
      })) || [],
    });
  }

  // POST - Save to history
  if (req.method === 'POST') {
    const { input, params } = req.body;

    if (!input || !params) {
      return res.status(400).json({ error: 'Input and params are required' });
    }

    const { data, error } = await supabase
      .from('interpretations')
      .insert({
        user_id: userId,
        input,
        params,
      })
      .select()
      .single();

    if (error) {
      console.error('History save error:', error);
      return res.status(500).json({ error: 'Failed to save to history' });
    }

    return res.status(201).json({
      success: true,
      id: data.id,
    });
  }

  // DELETE - Clear history
  if (req.method === 'DELETE') {
    const { id } = req.query;

    if (id) {
      // Delete single entry
      const { error } = await supabase
        .from('interpretations')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        return res.status(500).json({ error: 'Failed to delete entry' });
      }
    } else {
      // Delete all history
      const { error } = await supabase
        .from('interpretations')
        .delete()
        .eq('user_id', userId);

      if (error) {
        return res.status(500).json({ error: 'Failed to clear history' });
      }
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
