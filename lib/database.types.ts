// Supabase Database Types
// These types match the database schema

export interface Database {
  public: {
    Tables: {
      interpretations: {
        Row: {
          id: string;
          user_id: string;
          input: string;
          params: VisualParamsDB;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          input: string;
          params: VisualParamsDB;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          input?: string;
          params?: VisualParamsDB;
          created_at?: string;
        };
      };
      shared_visualizations: {
        Row: {
          id: string;
          share_id: string;
          user_id: string | null;
          input: string;
          params: VisualParamsDB;
          is_public: boolean;
          views: number;
          likes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          share_id: string;
          user_id?: string | null;
          input: string;
          params: VisualParamsDB;
          is_public?: boolean;
          views?: number;
          likes?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          share_id?: string;
          user_id?: string | null;
          input?: string;
          params?: VisualParamsDB;
          is_public?: boolean;
          views?: number;
          likes?: number;
          created_at?: string;
        };
      };
      analytics_events: {
        Row: {
          id: string;
          event_name: string;
          properties: Record<string, any>;
          user_id: string | null;
          session_id: string | null;
          ip_hash: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_name: string;
          properties?: Record<string, any>;
          user_id?: string | null;
          session_id?: string | null;
          ip_hash?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_name?: string;
          properties?: Record<string, any>;
          user_id?: string | null;
          session_id?: string | null;
          ip_hash?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      user_settings: {
        Row: {
          user_id: string;
          sound_enabled: boolean;
          visual_mode: string;
          theme: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          sound_enabled?: boolean;
          visual_mode?: string;
          theme?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          sound_enabled?: boolean;
          visual_mode?: string;
          theme?: string;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
  };
}

// Visual params as stored in database (JSON)
export interface VisualParamsDB {
  color: string;
  speed: number;
  distort: number;
  phrase: string;
  explanation: string;
}
