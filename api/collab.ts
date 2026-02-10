// Collaborative Rooms API endpoint
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
      const { code, list } = req.query;

      // Get specific room by code
      if (code) {
        const { data: room, error } = await supabase
          .from('collab_rooms')
          .select('*')
          .eq('room_code', code)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (error || !room) {
          return res.status(404).json({ error: 'Room not found or expired' });
        }

        return res.status(200).json({ room });
      }

      // List public rooms
      if (list === 'public') {
        const { data: rooms, error } = await supabase
          .from('collab_rooms')
          .select('room_code, name, visual_mode, is_public, created_at')
          .eq('is_public', true)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        return res.status(200).json({ rooms: rooms || [] });
      }

      // List user's rooms
      if (userId) {
        const { data: rooms, error } = await supabase
          .from('collab_rooms')
          .select('*')
          .eq('host_id', userId)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false });

        if (error) throw error;
        return res.status(200).json({ rooms: rooms || [] });
      }

      return res.status(400).json({ error: 'Missing parameters' });
    }

    // Require auth for mutations
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'POST') {
      const { name, params, visualMode, isPublic, maxParticipants } = req.body;

      if (!name || !params) {
        return res.status(400).json({ error: 'Name and params required' });
      }

      // Generate unique room code
      const { data: roomCode } = await supabase.rpc('generate_room_code');
      
      const { data, error } = await supabase
        .from('collab_rooms')
        .insert({
          room_code: roomCode || Math.random().toString(36).substring(2, 10).toUpperCase(),
          host_id: userId,
          name,
          params,
          visual_mode: visualMode || 'sphere',
          is_public: isPublic ?? true,
          max_participants: maxParticipants || 10,
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({ room: data });
    }

    if (req.method === 'PUT') {
      const { code, params, visualMode } = req.body;

      if (!code) {
        return res.status(400).json({ error: 'Room code required' });
      }

      const updates: Record<string, any> = {};
      if (params) updates.params = params;
      if (visualMode) updates.visual_mode = visualMode;

      const { data, error } = await supabase
        .from('collab_rooms')
        .update(updates)
        .eq('room_code', code)
        .eq('host_id', userId)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({ room: data });
    }

    if (req.method === 'DELETE') {
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({ error: 'Room code required' });
      }

      const { error } = await supabase
        .from('collab_rooms')
        .delete()
        .eq('room_code', code)
        .eq('host_id', userId);

      if (error) throw error;

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Collab API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
