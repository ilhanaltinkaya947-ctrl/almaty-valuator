export type HousingClass =
  | "elite"
  | "business_plus"
  | "business"
  | "comfort_plus"
  | "comfort"
  | "standard";

export type LeadStatus =
  | "new"
  | "in_progress"
  | "price_approved"
  | "jurist_approved"
  | "director_approved"
  | "deal_progress"
  | "paid"
  | "rejected";

export type LeadSource = "landing" | "telegram" | "direct" | "manual";

export type AgentRole = "admin" | "broker";

export type UserRole = "admin" | "manager" | "jurist" | "director" | "cashier";

export type BuildingSeriesEnum =
  | "stalinka"
  | "khrushchevka"
  | "brezhnevka"
  | "uluchshenka"
  | "individual"
  | "novostroyka";

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
          wall_material: string | null;
          zone_slug: string | null;
          is_golden_square: boolean;
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
          wall_material?: string | null;
          zone_slug?: string | null;
          is_golden_square?: boolean;
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
          wall_material?: string | null;
          zone_slug?: string | null;
          is_golden_square?: boolean;
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
          offer_price: number | null;
          needs_manual_review: boolean;
          status: LeadStatus;
          source: LeadSource;
          broker_id: string | null;
          assigned_to: string | null;
          notes: string | null;
          property_type: string | null;
          zone_id: string | null;
          building_series: BuildingSeriesEnum | null;
          year_built: number | null;
          wall_material: string | null;
          is_pledged: boolean;
          is_golden_square: boolean;
          intent: string;
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
          offer_price?: number | null;
          needs_manual_review?: boolean;
          status?: LeadStatus;
          source?: LeadSource;
          broker_id?: string | null;
          assigned_to?: string | null;
          notes?: string | null;
          property_type?: string | null;
          zone_id?: string | null;
          building_series?: BuildingSeriesEnum | null;
          year_built?: number | null;
          wall_material?: string | null;
          is_pledged?: boolean;
          is_golden_square?: boolean;
          intent?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          name?: string | null;
          complex_id?: string | null;
          area_sqm?: number | null;
          floor?: number | null;
          estimated_price?: number | null;
          offer_price?: number | null;
          needs_manual_review?: boolean;
          status?: LeadStatus;
          source?: LeadSource;
          broker_id?: string | null;
          assigned_to?: string | null;
          notes?: string | null;
          property_type?: string | null;
          zone_id?: string | null;
          building_series?: BuildingSeriesEnum | null;
          year_built?: number | null;
          wall_material?: string | null;
          is_pledged?: boolean;
          is_golden_square?: boolean;
          intent?: string;
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
      system_settings: {
        Row: {
          id: string;
          key: string;
          value_numeric: number;
          description: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value_numeric: number;
          description?: string | null;
        };
        Update: {
          id?: string;
          key?: string;
          value_numeric?: number;
          description?: string | null;
        };
        Relationships: [];
      };
      price_zones: {
        Row: {
          id: string;
          name: string;
          slug: string;
          district: string;
          description: string | null;
          avg_price_sqm: number;
          coefficient: number;
          krisha_search_url: string | null;
          map_lat: number | null;
          map_lng: number | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          district: string;
          description?: string | null;
          avg_price_sqm?: number;
          coefficient?: number;
          krisha_search_url?: string | null;
          map_lat?: number | null;
          map_lng?: number | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          district?: string;
          description?: string | null;
          avg_price_sqm?: number;
          coefficient?: number;
          krisha_search_url?: string | null;
          map_lat?: number | null;
          map_lng?: number | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      building_series_modifiers: {
        Row: {
          series: BuildingSeriesEnum;
          label_ru: string;
          description_ru: string | null;
          year_min: number | null;
          year_max: number | null;
          floor_min: number | null;
          floor_max: number | null;
          modifier: number;
          sort_order: number;
        };
        Insert: {
          series: BuildingSeriesEnum;
          label_ru: string;
          description_ru?: string | null;
          year_min?: number | null;
          year_max?: number | null;
          floor_min?: number | null;
          floor_max?: number | null;
          modifier?: number;
          sort_order?: number;
        };
        Update: {
          series?: BuildingSeriesEnum;
          label_ru?: string;
          description_ru?: string | null;
          year_min?: number | null;
          year_max?: number | null;
          floor_min?: number | null;
          floor_max?: number | null;
          modifier?: number;
          sort_order?: number;
        };
        Relationships: [];
      };
      zone_price_snapshots: {
        Row: {
          id: string;
          zone_id: string;
          avg_price_sqm: number;
          median_price_sqm: number | null;
          listing_count: number | null;
          scraped_at: string;
        };
        Insert: {
          id?: string;
          zone_id: string;
          avg_price_sqm: number;
          median_price_sqm?: number | null;
          listing_count?: number | null;
          scraped_at?: string;
        };
        Update: {
          id?: string;
          zone_id?: string;
          avg_price_sqm?: number;
          median_price_sqm?: number | null;
          listing_count?: number | null;
          scraped_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "zone_price_snapshots_zone_id_fkey";
            columns: ["zone_id"];
            isOneToOne: false;
            referencedRelation: "price_zones";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          full_name?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          full_name?: string;
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
      user_role: UserRole;
      building_series: BuildingSeriesEnum;
    };
    CompositeTypes: Record<string, never>;
  };
};
