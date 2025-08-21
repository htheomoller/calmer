export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          comment_limit: number | null
          created_at: string | null
          default_link: string | null
          default_trigger_list: string[] | null
          default_trigger_mode: string | null
          default_typo_tolerance: boolean | null
          dm_template: string | null
          id: string
          reply_to_comments: boolean | null
        }
        Insert: {
          comment_limit?: number | null
          created_at?: string | null
          default_link?: string | null
          default_trigger_list?: string[] | null
          default_trigger_mode?: string | null
          default_typo_tolerance?: boolean | null
          dm_template?: string | null
          id?: string
          reply_to_comments?: boolean | null
        }
        Update: {
          comment_limit?: number | null
          created_at?: string | null
          default_link?: string | null
          default_trigger_list?: string[] | null
          default_trigger_mode?: string | null
          default_typo_tolerance?: boolean | null
          dm_template?: string | null
          id?: string
          reply_to_comments?: boolean | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          published: boolean
          slug: string
          subtitle: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          published?: boolean
          slug: string
          subtitle?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          published?: boolean
          slug?: string
          subtitle?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      dev_breadcrumbs: {
        Row: {
          at: string | null
          author_email: string | null
          created_at: string
          details: Json | null
          id: string
          scope: string
          summary: string
          tags: string[] | null
          user_id: string
        }
        Insert: {
          at?: string | null
          author_email?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          scope: string
          summary: string
          tags?: string[] | null
          user_id?: string
        }
        Update: {
          at?: string | null
          author_email?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          scope?: string
          summary?: string
          tags?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          comment_text: string | null
          created_at: string | null
          id: string
          ig_post_id: string | null
          ig_user: string | null
          matched: boolean | null
          sent_dm: boolean | null
          type: string | null
        }
        Insert: {
          comment_text?: string | null
          created_at?: string | null
          id?: string
          ig_post_id?: string | null
          ig_user?: string | null
          matched?: boolean | null
          sent_dm?: boolean | null
          type?: string | null
        }
        Update: {
          comment_text?: string | null
          created_at?: string | null
          id?: string
          ig_post_id?: string | null
          ig_user?: string | null
          matched?: boolean | null
          sent_dm?: boolean | null
          type?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          account_id: string | null
          automation_enabled: boolean | null
          caption: string | null
          code: string | null
          created_at: string | null
          id: string
          ig_post_id: string | null
          link: string | null
          trigger_list: string[] | null
          trigger_mode: string | null
          typo_tolerance: boolean | null
        }
        Insert: {
          account_id?: string | null
          automation_enabled?: boolean | null
          caption?: string | null
          code?: string | null
          created_at?: string | null
          id?: string
          ig_post_id?: string | null
          link?: string | null
          trigger_list?: string[] | null
          trigger_mode?: string | null
          typo_tolerance?: boolean | null
        }
        Update: {
          account_id?: string | null
          automation_enabled?: boolean | null
          caption?: string | null
          code?: string | null
          created_at?: string | null
          id?: string
          ig_post_id?: string | null
          link?: string | null
          trigger_list?: string[] | null
          trigger_mode?: string | null
          typo_tolerance?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_counters: {
        Row: {
          account_id: string
          bucket_start: string
          hits: number
        }
        Insert: {
          account_id: string
          bucket_start: string
          hits?: number
        }
        Update: {
          account_id?: string
          bucket_start?: string
          hits?: number
        }
        Relationships: []
      }
      reply_logs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          ig_comment_id: string | null
          ig_media_id: string | null
          matched_rule_id: string | null
          sent_text: string | null
          status: Database["public"]["Enums"]["reply_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          ig_comment_id?: string | null
          ig_media_id?: string | null
          matched_rule_id?: string | null
          sent_text?: string | null
          status: Database["public"]["Enums"]["reply_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          ig_comment_id?: string | null
          ig_media_id?: string | null
          matched_rule_id?: string | null
          sent_text?: string | null
          status?: Database["public"]["Enums"]["reply_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reply_logs_matched_rule_id_fkey"
            columns: ["matched_rule_id"]
            isOneToOne: false
            referencedRelation: "reply_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      reply_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          keyword: string | null
          match_type: Database["public"]["Enums"]["rule_match_type"]
          template_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          keyword?: string | null
          match_type?: Database["public"]["Enums"]["rule_match_type"]
          template_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          keyword?: string | null
          match_type?: Database["public"]["Enums"]["rule_match_type"]
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reply_rules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "reply_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      reply_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      social_accounts: {
        Row: {
          connected_at: string
          external_id: string | null
          fb_page_id: string | null
          id: string
          ig_user_id: string
          provider: string | null
          status: string | null
          token_expires_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          connected_at?: string
          external_id?: string | null
          fb_page_id?: string | null
          id?: string
          ig_user_id: string
          provider?: string | null
          status?: string | null
          token_expires_at?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          connected_at?: string
          external_id?: string | null
          fb_page_id?: string | null
          id?: string
          ig_user_id?: string
          provider?: string | null
          status?: string | null
          token_expires_at?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      webhook_counters: {
        Row: {
          account_id: string
          bucket: string
          count: number
        }
        Insert: {
          account_id: string
          bucket: string
          count?: number
        }
        Update: {
          account_id?: string
          bucket?: string
          count?: number
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          account_id: string
          comment_id: string
          created_at: string
          id: string
          provider: string | null
          test_window: string | null
        }
        Insert: {
          account_id: string
          comment_id: string
          created_at?: string
          id?: string
          provider?: string | null
          test_window?: string | null
        }
        Update: {
          account_id?: string
          comment_id?: string
          created_at?: string
          id?: string
          provider?: string | null
          test_window?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_webhook_counter: {
        Args: { p_account_id: string; p_bucket: string }
        Returns: number
      }
    }
    Enums: {
      reply_status: "SENT" | "SKIPPED" | "FAILED"
      rule_match_type: "ALL" | "KEYWORD"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      reply_status: ["SENT", "SKIPPED", "FAILED"],
      rule_match_type: ["ALL", "KEYWORD"],
    },
  },
} as const
