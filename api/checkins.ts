// Check-ins API endpoint
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      // Get user's check-ins
      const { period = 'month' } = req.query;
      
      let startDate = new Date();
      if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === 'month') {
        startDate.setDate(startDate.getDate() - 30);
      } else if (period === 'year') {
        startDate.setDate(startDate.getDate() - 365);
      }

      const { data: checkIns, error } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', userId)
        .gte('check_date', startDate.toISOString().split('T')[0])
        .order('check_date', { ascending: false });

      if (error) throw error;

      // Calculate streak
      const { data: streakData } = await supabase
        .rpc('get_user_streak', { user_id_param: userId });

      return res.status(200).json({
        checkIns: checkIns || [],
        streak: streakData || 0,
      });
    }

    if (req.method === 'POST') {
      // Create new check-in
      const { mood, emotions, note, params } = req.body;

      if (!mood || mood < 1 || mood > 5) {
        return res.status(400).json({ error: 'Invalid mood value (1-5)' });
      }

      const today = new Date().toISOString().split('T')[0];

      // Check if already checked in today
      const { data: existing } = await supabase
        .from('daily_checkins')
        .select('id')
        .eq('user_id', userId)
        .eq('check_date', today)
        .single();

      if (existing) {
        // Update existing check-in
        const { data, error } = await supabase
          .from('daily_checkins')
          .update({
            mood,
            emotions: emotions || [],
            note,
            params,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return res.status(200).json({ checkIn: data, updated: true });
      }

      // Create new check-in
      const { data, error } = await supabase
        .from('daily_checkins')
        .insert({
          user_id: userId,
          check_date: today,
          mood,
          emotions: emotions || [],
          note,
          params,
        })
        .select()
        .single();

      if (error) throw error;

      // Get updated streak
      const { data: streakData } = await supabase
        .rpc('get_user_streak', { user_id_param: userId });

      return res.status(201).json({
        checkIn: data,
        streak: streakData || 0,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Check-ins API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
