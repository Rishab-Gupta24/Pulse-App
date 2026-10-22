// Generated from the Supabase schema (project "Pulse"). Regenerate after schema changes.
// Manual edit: create_repeating_task.p_note is nullable (generator types SQL args as non-null).

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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      budgets: {
        Row: {
          currency_symbol: string
          daily_limit: number
          monthly_limit: number
          updated_at: string | null
          user_id: string
          weekly_limit: number
        }
        Insert: {
          currency_symbol?: string
          daily_limit?: number
          monthly_limit?: number
          updated_at?: string | null
          user_id?: string
          weekly_limit?: number
        }
        Update: {
          currency_symbol?: string
          daily_limit?: number
          monthly_limit?: number
          updated_at?: string | null
          user_id?: string
          weekly_limit?: number
        }
        Relationships: []
      }
      daily_logs: {
        Row: {
          budget_day_won: boolean | null
          daily_budget_snapshot: number
          daily_spent: number
          id: string
          log_date: string
          task_day_won: boolean | null
          tasks_completed: number
          tasks_total: number
          user_id: string
        }
        Insert: {
          budget_day_won?: boolean | null
          daily_budget_snapshot: number
          daily_spent?: number
          id?: string
          log_date: string
          task_day_won?: boolean | null
          tasks_completed?: number
          tasks_total?: number
          user_id?: string
        }
        Update: {
          budget_day_won?: boolean | null
          daily_budget_snapshot?: number
          daily_spent?: number
          id?: string
          log_date?: string
          task_day_won?: boolean | null
          tasks_completed?: number
          tasks_total?: number
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["category_color"]
          created_at: string | null
          expense_date: string
          id: string
          scope: Database["public"]["Enums"]["expense_scope"]
          title: string
          user_id: string
        }
        Insert: {
          amount: number
          category: Database["public"]["Enums"]["category_color"]
          created_at?: string | null
          expense_date?: string
          id?: string
          scope?: Database["public"]["Enums"]["expense_scope"]
          title: string
          user_id?: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["category_color"]
          created_at?: string | null
          expense_date?: string
          id?: string
          scope?: Database["public"]["Enums"]["expense_scope"]
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      task_templates: {
        Row: {
          active: boolean
          category: Database["public"]["Enums"]["category_color"]
          created_at: string | null
          id: string
          note: string | null
          title: string
          user_id: string
          weekdays: number[]
        }
        Insert: {
          active?: boolean
          category: Database["public"]["Enums"]["category_color"]
          created_at?: string | null
          id?: string
          note?: string | null
          title: string
          user_id?: string
          weekdays: number[]
        }
        Update: {
          active?: boolean
          category?: Database["public"]["Enums"]["category_color"]
          created_at?: string | null
          id?: string
          note?: string | null
          title?: string
          user_id?: string
          weekdays?: number[]
        }
        Relationships: []
      }
      tasks: {
        Row: {
          category: Database["public"]["Enums"]["category_color"]
          created_at: string | null
          id: string
          is_completed: boolean
          note: string | null
          task_date: string
          template_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["category_color"]
          created_at?: string | null
          id?: string
          is_completed?: boolean
          note?: string | null
          task_date?: string
          template_id?: string | null
          title: string
          user_id?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["category_color"]
          created_at?: string | null
          id?: string
          is_completed?: boolean
          note?: string | null
          task_date?: string
          template_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_materializations: {
        Row: {
          task_date: string
          template_id: string
          user_id: string
        }
        Insert: {
          task_date: string
          template_id: string
          user_id?: string
        }
        Update: {
          task_date?: string
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_materializations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_repeating_task: {
        Args: {
          p_category: Database["public"]["Enums"]["category_color"]
          p_note: string | null
          p_task_id: string
          p_template_id: string
          p_title: string
          p_today: string
          p_weekdays: number[]
        }
        Returns: undefined
      }
      get_streaks: {
        Args: { p_today: string }
        Returns: {
          budget_streak: number
          longest_budget_streak: number
          longest_task_streak: number
          task_streak: number
          total_budget_days: number
          total_task_days: number
        }[]
      }
      make_task_repeating: {
        Args: { p_task_id: string; p_template_id: string; p_weekdays: number[] }
        Returns: string
      }
      materialize_tasks: { Args: { p_date: string }; Returns: number }
    }
    Enums: {
      category_color: "RED" | "BLUE" | "GREEN" | "AMBER"
      expense_scope: "DAY" | "WEEK" | "MONTH"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

export type Budget = PublicSchema["Tables"]["budgets"]["Row"]
export type Task = PublicSchema["Tables"]["tasks"]["Row"]
export type TaskInsert = PublicSchema["Tables"]["tasks"]["Insert"]
export type TaskTemplate = PublicSchema["Tables"]["task_templates"]["Row"]
export type Expense = PublicSchema["Tables"]["expenses"]["Row"]
export type ExpenseInsert = PublicSchema["Tables"]["expenses"]["Insert"]
export type ExpenseScope = PublicSchema["Enums"]["expense_scope"]
export type DailyLog = PublicSchema["Tables"]["daily_logs"]["Row"]
