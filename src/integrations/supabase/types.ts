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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          barber_id: string
          barbershop_id: string | null
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          service_id: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          barber_id: string
          barbershop_id?: string | null
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          service_id: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          barber_id?: string
          barbershop_id?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          service_id?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      barbers: {
        Row: {
          barbershop_id: string | null
          commission_rate: number | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          rating: number | null
          specialty: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          barbershop_id?: string | null
          commission_rate?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          rating?: number | null
          specialty?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          barbershop_id?: string | null
          commission_rate?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          rating?: number | null
          specialty?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barbers_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      barbershops: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          owner_id: string
          phone?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      blocked_times: {
        Row: {
          barber_id: string
          barbershop_id: string | null
          blocked_date: string
          created_at: string
          created_by: string
          end_time: string
          id: string
          reason: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          barber_id: string
          barbershop_id?: string | null
          blocked_date: string
          created_at?: string
          created_by: string
          end_time: string
          id?: string
          reason?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          barber_id?: string
          barbershop_id?: string | null
          blocked_date?: string
          created_at?: string
          created_by?: string
          end_time?: string
          id?: string
          reason?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_times_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_times_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          barbershop_id: string | null
          created_at: string
          email: string | null
          id: string
          loyalty_points: number | null
          name: string
          notes: string | null
          notifications_enabled: boolean | null
          phone: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          barbershop_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          loyalty_points?: number | null
          name: string
          notes?: string | null
          notifications_enabled?: boolean | null
          phone: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          barbershop_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          loyalty_points?: number | null
          name?: string
          notes?: string | null
          notifications_enabled?: boolean | null
          phone?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_coupons: {
        Row: {
          code: string
          created_at: string
          customer_id: string
          expires_at: string | null
          id: string
          is_redeemed: boolean | null
          redeemed_appointment_id: string | null
          redeemed_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          customer_id: string
          expires_at?: string | null
          id?: string
          is_redeemed?: boolean | null
          redeemed_appointment_id?: string | null
          redeemed_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          customer_id?: string
          expires_at?: string | null
          id?: string
          is_redeemed?: boolean | null
          redeemed_appointment_id?: string | null
          redeemed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_coupons_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_coupons_redeemed_appointment_id_fkey"
            columns: ["redeemed_appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_history: {
        Row: {
          action: string
          appointment_id: string | null
          created_at: string
          customer_id: string
          description: string | null
          id: string
          points_balance: number
          points_change: number
        }
        Insert: {
          action: string
          appointment_id?: string | null
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          points_balance: number
          points_change: number
        }
        Update: {
          action?: string
          appointment_id?: string | null
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          points_balance?: number
          points_change?: number
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_history_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_history_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          appointment_cancelled_enabled: boolean | null
          appointment_confirmation_enabled: boolean | null
          appointment_reminder_enabled: boolean | null
          appointment_reminder_hours: number | null
          appointment_rescheduled_enabled: boolean | null
          created_at: string
          id: string
          marketing_enabled: boolean | null
          updated_at: string
          user_id: string
          whatsapp_enabled: boolean | null
          whatsapp_phone: string | null
          whatsapp_phone_id: string | null
          whatsapp_token: string | null
        }
        Insert: {
          appointment_cancelled_enabled?: boolean | null
          appointment_confirmation_enabled?: boolean | null
          appointment_reminder_enabled?: boolean | null
          appointment_reminder_hours?: number | null
          appointment_rescheduled_enabled?: boolean | null
          created_at?: string
          id?: string
          marketing_enabled?: boolean | null
          updated_at?: string
          user_id: string
          whatsapp_enabled?: boolean | null
          whatsapp_phone?: string | null
          whatsapp_phone_id?: string | null
          whatsapp_token?: string | null
        }
        Update: {
          appointment_cancelled_enabled?: boolean | null
          appointment_confirmation_enabled?: boolean | null
          appointment_reminder_enabled?: boolean | null
          appointment_reminder_hours?: number | null
          appointment_rescheduled_enabled?: boolean | null
          created_at?: string
          id?: string
          marketing_enabled?: boolean | null
          updated_at?: string
          user_id?: string
          whatsapp_enabled?: boolean | null
          whatsapp_phone?: string | null
          whatsapp_phone_id?: string | null
          whatsapp_token?: string | null
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_system: boolean | null
          message: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          message: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          message?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          barbershop_id: string | null
          created_at: string
          description: string | null
          duration: number
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          barbershop_id?: string | null
          created_at?: string
          description?: string | null
          duration: number
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          barbershop_id?: string | null
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      subscription_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          paid_at: string | null
          payment_data: Json | null
          payment_method: string | null
          payment_reference: string | null
          status: string
          subscription_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_data?: Json | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string
          subscription_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_data?: Json | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          interval: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          interval: string
          is_active?: boolean | null
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          interval?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          end_date: string | null
          id: string
          payment_method: string | null
          payment_reference: string | null
          plan_id: string
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          plan_id: string
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          plan_id?: string
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          appointment_id: string | null
          barber_id: string | null
          barbershop_id: string | null
          category: string | null
          created_at: string
          created_by: string
          description: string
          id: string
          transaction_date: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          barber_id?: string | null
          barbershop_id?: string | null
          category?: string | null
          created_at?: string
          created_by: string
          description: string
          id?: string
          transaction_date?: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          barber_id?: string | null
          barbershop_id?: string | null
          category?: string | null
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          transaction_date?: string
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      working_hours: {
        Row: {
          barbershop_id: string | null
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_open: boolean
          start_time: string
          updated_at: string
        }
        Insert: {
          barbershop_id?: string | null
          created_at?: string
          day_of_week: number
          end_time?: string
          id?: string
          is_open?: boolean
          start_time?: string
          updated_at?: string
        }
        Update: {
          barbershop_id?: string | null
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_open?: boolean
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "working_hours_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_delete_notifications: {
        Args: { _user_id: string }
        Returns: boolean
      }
      has_barbershop_access: {
        Args: { _barbershop_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      replace_template_variables: {
        Args: {
          appointment_date: string
          appointment_time: string
          barber_name: string
          barbershop_name?: string
          customer_name: string
          hours_text?: string
          service_name: string
          template_text: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "barber" | "customer"
      appointment_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      transaction_type: "income" | "expense"
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
      app_role: ["admin", "barber", "customer"],
      appointment_status: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      transaction_type: ["income", "expense"],
    },
  },
} as const
