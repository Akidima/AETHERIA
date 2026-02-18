// Vercel Serverless Function - Gallery Reactions
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

  const { shareId } = req.query;

  if (!shareId || typeof shareId !== 'string') {
    return res.status(400).json({ error: 'Share ID required' });
  }

  // GET - Get reactions for a visualization
  if (req.method === 'GET') {
    const authHeader = req.headers.authorization;
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const { data: reactions, error } = await supabase
      .from('visualization_reactions')
      .select('emoji, user_id')
      .eq('share_id', shareId);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch reactions' });
    }

    // Aggregate reactions
    const aggregated: Record<string, { count: number; userReacted: boolean }> = {};
    
    reactions?.forEach(r => {
      if (!aggregated[r.emoji]) {
        aggregated[r.emoji] = { count: 0, userReacted: false };
      }
      aggregated[r.emoji].count++;
      if (userId && r.user_id === userId) {
        aggregated[r.emoji].userReacted = true;
      }
    });

    return res.status(200).json({
      success: true,
      reactions: Object.entries(aggregated).map(([emoji, data]) => ({
        emoji,
        ...data,
      })),
    });
  }

  // POST - Add reaction
  if (req.method === 'POST') {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { emoji } = req.body;

    if (!emoji || typeof emoji !== 'string') {
      return res.status(400).json({ error: 'Emoji required' });
    }

    // Check if user already reacted with this emoji
    const { data: existing } = await supabase
      .from('visualization_reactions')
      .select('id')
      .eq('share_id', shareId)
      .eq('user_id', user.id)
      .eq('emoji', emoji)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Already reacted with this emoji' });
    }

    const { error } = await supabase
      .from('visualization_reactions')
      .insert({
        share_id: shareId,
        user_id: user.id,
        emoji,
      });

    if (error) {
      console.error('Reaction error:', error);
      return res.status(500).json({ error: 'Failed to add reaction' });
    }

    // Update likes count on the visualization
    await supabase.rpc('increment_likes', { share_id_param: shareId });

    return res.status(201).json({ success: true });
  }

  // DELETE - Remove reaction
  if (req.method === 'DELETE') {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { emoji } = req.body;

    const { error } = await supabase
      .from('visualization_reactions')
      .delete()
      .eq('share_id', shareId)
      .eq('user_id', user.id)
      .eq('emoji', emoji);

    if (error) {
      return res.status(500).json({ error: 'Failed to remove reaction' });
    }

    // Decrement likes count
    await supabase.rpc('decrement_likes', { share_id_param: shareId });

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
