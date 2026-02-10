// Vercel Serverless Function - User Profiles
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { username, userId } = req.query;

  // GET - Fetch profile by username or userId
  if (req.method === 'GET') {
    try {
      let query = supabase
        .from('user_profiles')
        .select(`
          *,
          shared_visualizations (
            share_id,
            input,
            params,
            views,
            likes,
            created_at
          )
        `);

      if (username) {
        query = query.eq('username', username);
      } else if (userId) {
        query = query.eq('user_id', userId);
      } else {
        return res.status(400).json({ error: 'Username or userId required' });
      }

      const { data, error } = await query.single();

      if (error || !data) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      return res.status(200).json({
        success: true,
        profile: {
          id: data.user_id,
          username: data.username,
          displayName: data.display_name,
          bio: data.bio,
          avatarUrl: data.avatar_url,
          joinedAt: data.created_at,
          visualizations: data.shared_visualizations || [],
        },
      });
    } catch (error) {
      console.error('Profile fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }

  // PUT - Update profile
  if (req.method === 'PUT') {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { username, displayName, bio } = req.body;

    // Validate username
    if (username) {
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        return res.status(400).json({ 
          error: 'Username must be 3-20 characters, alphanumeric and underscores only' 
        });
      }

      // Check if username is taken
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('username', username)
        .neq('user_id', user.id)
        .single();

      if (existing) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        username: username || null,
        display_name: displayName || null,
        bio: bio || null,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Profile update error:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
