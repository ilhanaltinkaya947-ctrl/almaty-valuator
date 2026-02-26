export type HousingClass =
  | "elite"
  | "business_plus"
  | "business"
  | "comfort_plus"
  | "comfort"
  | "standard";

export type LeadStatus =
  | "new"
  | "contacted"
  | "in_progress"
  | "closed_won"
  | "closed_lost";

export type LeadSource = "landing" | "telegram" | "direct" | "manual";

export type AgentRole = "admin" | "broker";

export type Database = {
  public: {
    Tables: {
      complexes: {
        Row: {
          id: string;
          name: string;
          district: string;
          developer: string | null;
          class: HousingClass;
          coefficient: number;
          year_built: number | null;
          total_floors: number | null;
          image_url: string | null;
          map_lat: number | null;
          map_lng: number | null;
          liquidity_index: number | null;
          avg_price_sqm: number | null;
          krisha_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          district: string;
          developer?: string | null;
          class?: HousingClass;
          coefficient?: number;
          year_built?: number | null;
          total_floors?: number | null;
          image_url?: string | null;
          map_lat?: number | null;
          map_lng?: number | null;
          liquidity_index?: number | null;
          avg_price_sqm?: number | null;
          krisha_url?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          district?: string;
          developer?: string | null;
          class?: HousingClass;
          coefficient?: number;
          year_built?: number | null;
          total_floors?: number | null;
          image_url?: string | null;
          map_lat?: number | null;
          map_lng?: number | null;
          liquidity_index?: number | null;
          avg_price_sqm?: number | null;
          krisha_url?: string | null;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          phone: string;
          name: string | null;
          complex_id: string | null;
          area_sqm: number | null;
          floor: number | null;
          estimated_price: number | null;
          status: LeadStatus;
          source: LeadSource;
          broker_id: string | null;
          notes: string | null;
          property_type: string | null;
          created_at: string;
          contacted_at: string | null;
        };
        Insert: {
          id?: string;
          phone: string;
          name?: string | null;
          complex_id?: string | null;
          area_sqm?: number | null;
          floor?: number | null;
          estimated_price?: number | null;
          status?: LeadStatus;
          source?: LeadSource;
          broker_id?: string | null;
          notes?: string | null;
          property_type?: string | null;
        };
        Update: {
          id?: string;
          phone?: string;
          name?: string | null;
          complex_id?: string | null;
          area_sqm?: number | null;
          floor?: number | null;
          estimated_price?: number | null;
          status?: LeadStatus;
          source?: LeadSource;
          broker_id?: string | null;
          notes?: string | null;
          property_type?: string | null;
          contacted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "leads_complex_id_fkey";
            columns: ["complex_id"];
            isOneToOne: false;
            referencedRelation: "complexes";
            referencedColumns: ["id"];
          },
        ];
      };
      evaluations: {
        Row: {
          id: string;
          lead_id: string | null;
          complex_id: string | null;
          params: Record<string, unknown>;
          final_price: number;
          price_per_sqm: number;
          pdf_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id?: string | null;
          complex_id?: string | null;
          params: Record<string, unknown>;
          final_price: number;
          price_per_sqm: number;
          pdf_url?: string | null;
        };
        Update: {
          id?: string;
          lead_id?: string | null;
          complex_id?: string | null;
          params?: Record<string, unknown>;
          final_price?: number;
          price_per_sqm?: number;
          pdf_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "evaluations_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "evaluations_complex_id_fkey";
            columns: ["complex_id"];
            isOneToOne: false;
            referencedRelation: "complexes";
            referencedColumns: ["id"];
          },
        ];
      };
      config: {
        Row: {
          key: string;
          value: unknown;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: unknown;
        };
        Update: {
          key?: string;
          value?: unknown;
        };
        Relationships: [];
      };
      authorized_agents: {
        Row: {
          id: string;
          telegram_id: number;
          name: string;
          role: AgentRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          telegram_id: number;
          name: string;
          role?: AgentRole;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          telegram_id?: number;
          name?: string;
          role?: AgentRole;
          is_active?: boolean;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      housing_class: HousingClass;
      lead_status: LeadStatus;
      lead_source: LeadSource;
    };
    CompositeTypes: Record<string, never>;
  };
};
