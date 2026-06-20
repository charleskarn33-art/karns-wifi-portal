export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      packages: {
        Row: {
          id: string;
          name: string;
          duration_hours: number;
          price: number;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          duration_hours: number;
          price: number;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          duration_hours?: number;
          price?: number;
          description?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          package_id: string;
          customer_name: string;
          customer_phone: string;
          transaction_id: string;
          amount: number;
          status: "pending" | "approved" | "rejected";
          voucher_id: string | null;
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          package_id: string;
          customer_name: string;
          customer_phone: string;
          transaction_id: string;
          amount: number;
          status?: "pending" | "approved" | "rejected";
          voucher_id?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          package_id?: string;
          customer_name?: string;
          customer_phone?: string;
          transaction_id?: string;
          amount?: number;
          status?: "pending" | "approved" | "rejected";
          voucher_id?: string | null;
          admin_notes?: string | null;
          updated_at?: string;
        };
      };
      vouchers: {
        Row: {
          id: string;
          code: string;
          package_id: string;
          is_used: boolean;
          payment_id: string | null;
          created_at: string;
          used_at: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          package_id: string;
          is_used?: boolean;
          payment_id?: string | null;
          created_at?: string;
          used_at?: string | null;
        };
        Update: {
          id?: string;
          code?: string;
          package_id?: string;
          is_used?: boolean;
          payment_id?: string | null;
          used_at?: string | null;
        };
      };
      admins: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          full_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          full_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          full_name?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      payment_status: "pending" | "approved" | "rejected";
    };
  };
};

export type Package = Database["public"]["Tables"]["packages"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type Voucher = Database["public"]["Tables"]["vouchers"]["Row"];
export type Admin = Database["public"]["Tables"]["admins"]["Row"];
