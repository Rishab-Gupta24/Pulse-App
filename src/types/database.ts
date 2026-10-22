// Generated from the Supabase schema (project "Pulse"). Regenerate after schema changes.

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
          title: string
          user_id: string
        }
        Insert: {
          amount: number
          category: Database["public"]["Enums"]["category_color"]
          created_at?: string | null
          expense_date?: string
          id?: string
          title: string
          user_id?: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["category_color"]
          created_at?: string | null
          expense_date?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          category: Database["public"]["Enums"]["category_color"]
          created_at: string | null
          id: string
          is_completed: boolean
          task_date: string
          title: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["category_color"]
          created_at?: string | null
          id?: string
          is_completed?: boolean
          task_date?: string
          title: string
          user_id?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["category_color"]
          created_at?: string | null
          id?: string
          is_completed?: boolean
          task_date?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      category_color: "RED" | "BLUE" | "GREEN" | "AMBER"
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
export type Expense = PublicSchema["Tables"]["expenses"]["Row"]
export type ExpenseInsert = PublicSchema["Tables"]["expenses"]["Insert"]
export type DailyLog = PublicSchema["Tables"]["daily_logs"]["Row"]
