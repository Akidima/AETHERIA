// Comments API endpoint
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

  // Get user from auth header (optional for GET)
  const authHeader = req.headers.authorization;
  let userId: string | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const { data: { user } } = await supabase.auth.getUser(token);
    userId = user?.id || null;
  }

  try {
    if (req.method === 'GET') {
      // Get comments for a visualization
      const { visualizationId } = req.query;

      if (!visualizationId) {
        return res.status(400).json({ error: 'Visualization ID required' });
      }

      // Get visualization by share_id or id
      const { data: viz } = await supabase
        .from('shared_visualizations')
        .select('id')
        .or(`share_id.eq.${visualizationId},id.eq.${visualizationId}`)
        .single();

      if (!viz) {
        return res.status(404).json({ error: 'Visualization not found' });
      }

      // Get comments with user profiles
      const { data: comments, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          likes,
          created_at,
          user_id,
          user_profiles!inner (
            username,
            avatar_url
          )
        `)
        .eq('visualization_id', viz.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Check which comments user has liked
      let userLikes: string[] = [];
      if (userId) {
        const { data: likes } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', userId);
        userLikes = likes?.map(l => l.comment_id) || [];
      }

      const formattedComments = (comments || []).map(c => ({
        id: c.id,
        content: c.content,
        likes: c.likes,
        createdAt: c.created_at,
        userId: c.user_id,
        username: (c.user_profiles as any)?.username || 'Anonymous',
        avatarUrl: (c.user_profiles as any)?.avatar_url,
        userLiked: userLikes.includes(c.id),
      }));

      return res.status(200).json({ comments: formattedComments });
    }

    if (req.method === 'POST') {
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { visualizationId, content } = req.body;

      if (!visualizationId || !content) {
        return res.status(400).json({ error: 'Visualization ID and content required' });
      }

      if (content.length > 500) {
        return res.status(400).json({ error: 'Comment too long (max 500 characters)' });
      }

      // Get visualization
      const { data: viz } = await supabase
        .from('shared_visualizations')
        .select('id')
        .or(`share_id.eq.${visualizationId},id.eq.${visualizationId}`)
        .single();

      if (!viz) {
        return res.status(404).json({ error: 'Visualization not found' });
      }

      // Create comment
      const { data: comment, error } = await supabase
        .from('comments')
        .insert({
          visualization_id: viz.id,
          user_id: userId,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Get user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('username, avatar_url')
        .eq('user_id', userId)
        .single();

      return res.status(201).json({
        comment: {
          id: comment.id,
          content: comment.content,
          likes: 0,
          createdAt: comment.created_at,
          userId: comment.user_id,
          username: profile?.username || 'Anonymous',
          avatarUrl: profile?.avatar_url,
          userLiked: false,
        },
      });
    }

    if (req.method === 'DELETE') {
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { commentId } = req.body;

      if (!commentId) {
        return res.status(400).json({ error: 'Comment ID required' });
      }

      // Delete comment (RLS will ensure user owns it)
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId);

      if (error) throw error;

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Comments API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
