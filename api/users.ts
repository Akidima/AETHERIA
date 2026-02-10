// Users API endpoint - Get users for follow system
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
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
    const { tab = 'discover', q } = req.query;

    let query = supabase
      .from('user_profiles')
      .select('user_id, username, display_name, avatar_url');

    // Filter based on tab
    if (tab === 'following' && userId) {
      // Get users that current user follows
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);
      
      const followingIds = following?.map(f => f.following_id) || [];
      if (followingIds.length > 0) {
        query = query.in('user_id', followingIds);
      } else {
        return res.status(200).json({ users: [] });
      }
    } else if (tab === 'followers' && userId) {
      // Get users that follow current user
      const { data: followers } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', userId);
      
      const followerIds = followers?.map(f => f.follower_id) || [];
      if (followerIds.length > 0) {
        query = query.in('user_id', followerIds);
      } else {
        return res.status(200).json({ users: [] });
      }
    }

    // Search filter
    if (q && typeof q === 'string') {
      query = query.or(`username.ilike.%${q}%,display_name.ilike.%${q}%`);
    }

    // Limit results
    query = query.limit(50);

    const { data: profiles, error } = await query;

    if (error) throw error;

    // Get follow status for each user
    let followStatus: Record<string, boolean> = {};
    if (userId && profiles && profiles.length > 0) {
      const userIds = profiles.map(p => p.user_id);
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId)
        .in('following_id', userIds);
      
      followStatus = (follows || []).reduce((acc, f) => {
        acc[f.following_id] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }

    // Get recent visualization for each user
    const users = await Promise.all((profiles || []).map(async (profile) => {
      const { data: recentViz } = await supabase
        .from('shared_visualizations')
        .select('id, params, created_at')
        .eq('user_id', profile.user_id)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        id: profile.user_id,
        username: profile.username || 'anonymous',
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        isFollowing: followStatus[profile.user_id] || false,
        recentVisualization: recentViz ? {
          id: recentViz.id,
          params: recentViz.params,
          createdAt: recentViz.created_at,
        } : undefined,
      };
    }));

    return res.status(200).json({ users });
  } catch (error) {
    console.error('Users API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
