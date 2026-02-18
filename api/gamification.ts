// Gamification API endpoint - CRUD for gamification progress with cloud sync
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
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
    // GET - Retrieve gamification progress
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('gamification_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // No record found - return default progress
        return res.status(200).json({ progress: null });
      }

      if (error) throw error;

      return res.status(200).json({ progress: data });
    }

    // POST - Create gamification progress (first sync)
    if (req.method === 'POST') {
      const {
        xp,
        level,
        currentStreak,
        longestStreak,
        totalCheckIns,
        totalJournalEntries,
        totalVisualizations,
        totalTemplatesUsed,
        totalChallengesCompleted,
        unlockedAchievements,
        unlockedVisualizations,
        unlockedThemes,
        emotionCounts,
        activeChallenges,
        lastCheckInDate,
      } = req.body;

      const { data, error } = await supabase
        .from('gamification_progress')
        .upsert({
          user_id: userId,
          xp: xp || 0,
          level: level || 1,
          current_streak: currentStreak || 0,
          longest_streak: longestStreak || 0,
          total_check_ins: totalCheckIns || 0,
          total_journal_entries: totalJournalEntries || 0,
          total_visualizations: totalVisualizations || 0,
          total_templates_used: totalTemplatesUsed || 0,
          total_challenges_completed: totalChallengesCompleted || 0,
          unlocked_achievements: unlockedAchievements || [],
          unlocked_visualizations: unlockedVisualizations || [],
          unlocked_themes: unlockedThemes || [],
          emotion_counts: emotionCounts || {},
          active_challenges: activeChallenges || [],
          last_check_in_date: lastCheckInDate || null,
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({ progress: data });
    }

    // PUT - Update gamification progress
    if (req.method === 'PUT') {
      const updates = req.body;

      // Map camelCase to snake_case
      const dbUpdates: Record<string, any> = {};
      if (updates.xp !== undefined) dbUpdates.xp = updates.xp;
      if (updates.level !== undefined) dbUpdates.level = updates.level;
      if (updates.currentStreak !== undefined) dbUpdates.current_streak = updates.currentStreak;
      if (updates.longestStreak !== undefined) dbUpdates.longest_streak = updates.longestStreak;
      if (updates.totalCheckIns !== undefined) dbUpdates.total_check_ins = updates.totalCheckIns;
      if (updates.totalJournalEntries !== undefined) dbUpdates.total_journal_entries = updates.totalJournalEntries;
      if (updates.totalVisualizations !== undefined) dbUpdates.total_visualizations = updates.totalVisualizations;
      if (updates.totalTemplatesUsed !== undefined) dbUpdates.total_templates_used = updates.totalTemplatesUsed;
      if (updates.totalChallengesCompleted !== undefined) dbUpdates.total_challenges_completed = updates.totalChallengesCompleted;
      if (updates.unlockedAchievements !== undefined) dbUpdates.unlocked_achievements = updates.unlockedAchievements;
      if (updates.unlockedVisualizations !== undefined) dbUpdates.unlocked_visualizations = updates.unlockedVisualizations;
      if (updates.unlockedThemes !== undefined) dbUpdates.unlocked_themes = updates.unlockedThemes;
      if (updates.emotionCounts !== undefined) dbUpdates.emotion_counts = updates.emotionCounts;
      if (updates.activeChallenges !== undefined) dbUpdates.active_challenges = updates.activeChallenges;
      if (updates.lastCheckInDate !== undefined) dbUpdates.last_check_in_date = updates.lastCheckInDate;

      const { data, error } = await supabase
        .from('gamification_progress')
        .update(dbUpdates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({ progress: data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Gamification API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
