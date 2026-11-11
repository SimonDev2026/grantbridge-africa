export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      country_regions: {
        Row: {
          country: string;
          regions: string[];
        };
        Insert: {
          country: string;
          regions: string[];
        };
        Update: {
          country?: string;
          regions?: string[];
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          stripe_customer_id: string | null;
        };
        Insert: {
          id: string;
          stripe_customer_id?: string | null;
        };
        Update: {
          id?: string;
          stripe_customer_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'customers_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      documents: {
        Row: {
          created_at: string | null;
          extracted_text: string | null;
          file_path: string;
          id: string;
          kind: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          extracted_text?: string | null;
          file_path: string;
          id?: string;
          kind?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          extracted_text?: string | null;
          file_path?: string;
          id?: string;
          kind?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'documents_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      draft_credits: {
        Row: {
          credits: number;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          credits?: number;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          credits?: number;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'draft_credits_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      drafts: {
        Row: {
          created_at: string | null;
          grant_id: string | null;
          id: string;
          model: string | null;
          sections: Json;
          user_id: string | null;
          version: number | null;
        };
        Insert: {
          created_at?: string | null;
          grant_id?: string | null;
          id?: string;
          model?: string | null;
          sections: Json;
          user_id?: string | null;
          version?: number | null;
        };
        Update: {
          created_at?: string | null;
          grant_id?: string | null;
          id?: string;
          model?: string | null;
          sections?: Json;
          user_id?: string | null;
          version?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'drafts_grant_id_fkey';
            columns: ['grant_id'];
            isOneToOne: false;
            referencedRelation: 'grants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'drafts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      file_access_log: {
        Row: {
          action: string;
          created_at: string | null;
          file_path: string;
          id: string;
          service_request_id: string | null;
          user_id: string;
        };
        Insert: {
          action: string;
          created_at?: string | null;
          file_path: string;
          id?: string;
          service_request_id?: string | null;
          user_id: string;
        };
        Update: {
          action?: string;
          created_at?: string | null;
          file_path?: string;
          id?: string;
          service_request_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'file_access_log_service_request_id_fkey';
            columns: ['service_request_id'];
            isOneToOne: false;
            referencedRelation: 'service_requests';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'file_access_log_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      funders: {
        Row: {
          created_at: string | null;
          hq_country: string | null;
          id: string;
          name: string;
          type: string | null;
          verified_at: string | null;
          website: string | null;
        };
        Insert: {
          created_at?: string | null;
          hq_country?: string | null;
          id?: string;
          name: string;
          type?: string | null;
          verified_at?: string | null;
          website?: string | null;
        };
        Update: {
          created_at?: string | null;
          hq_country?: string | null;
          id?: string;
          name?: string;
          type?: string | null;
          verified_at?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      grants: {
        Row: {
          all_countries: boolean | null;
          amount_max: number | null;
          amount_min: number | null;
          amount_usd_max: number | null;
          amount_usd_min: number | null;
          applicant_types: string[] | null;
          approved: boolean | null;
          beneficiaries: string[] | null;
          created_at: string | null;
          currency: string | null;
          deadline: string | null;
          documents_required: string[] | null;
          eligible_countries: string[] | null;
          eligible_regions: string[] | null;
          embedding: string | null;
          excluded_countries: string[] | null;
          fee_charged: boolean | null;
          foreign_applicants_allowed: boolean | null;
          funder_id: string | null;
          id: string;
          languages: string[] | null;
          last_checked_at: string | null;
          max_share_of_budget: number | null;
          official_url: string;
          partner_required: string | null;
          registration_required: string[] | null;
          rolling: boolean | null;
          scope: string | null;
          sectors: string[] | null;
          source_id: string | null;
          stages: string[] | null;
          status: string | null;
          summary: string | null;
          title: string;
        };
        Insert: {
          all_countries?: boolean | null;
          amount_max?: number | null;
          amount_min?: number | null;
          amount_usd_max?: number | null;
          amount_usd_min?: number | null;
          applicant_types?: string[] | null;
          approved?: boolean | null;
          beneficiaries?: string[] | null;
          created_at?: string | null;
          currency?: string | null;
          deadline?: string | null;
          documents_required?: string[] | null;
          eligible_countries?: string[] | null;
          eligible_regions?: string[] | null;
          embedding?: string | null;
          excluded_countries?: string[] | null;
          fee_charged?: boolean | null;
          foreign_applicants_allowed?: boolean | null;
          funder_id?: string | null;
          id?: string;
          languages?: string[] | null;
          last_checked_at?: string | null;
          max_share_of_budget?: number | null;
          official_url: string;
          partner_required?: string | null;
          registration_required?: string[] | null;
          rolling?: boolean | null;
          scope?: string | null;
          sectors?: string[] | null;
          source_id?: string | null;
          stages?: string[] | null;
          status?: string | null;
          summary?: string | null;
          title: string;
        };
        Update: {
          all_countries?: boolean | null;
          amount_max?: number | null;
          amount_min?: number | null;
          amount_usd_max?: number | null;
          amount_usd_min?: number | null;
          applicant_types?: string[] | null;
          approved?: boolean | null;
          beneficiaries?: string[] | null;
          created_at?: string | null;
          currency?: string | null;
          deadline?: string | null;
          documents_required?: string[] | null;
          eligible_countries?: string[] | null;
          eligible_regions?: string[] | null;
          embedding?: string | null;
          excluded_countries?: string[] | null;
          fee_charged?: boolean | null;
          foreign_applicants_allowed?: boolean | null;
          funder_id?: string | null;
          id?: string;
          languages?: string[] | null;
          last_checked_at?: string | null;
          max_share_of_budget?: number | null;
          official_url?: string;
          partner_required?: string | null;
          registration_required?: string[] | null;
          rolling?: boolean | null;
          scope?: string | null;
          sectors?: string[] | null;
          source_id?: string | null;
          stages?: string[] | null;
          status?: string | null;
          summary?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'grants_funder_id_fkey';
            columns: ['funder_id'];
            isOneToOne: false;
            referencedRelation: 'funders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'grants_source_id_fkey';
            columns: ['source_id'];
            isOneToOne: false;
            referencedRelation: 'sources';
            referencedColumns: ['id'];
          }
        ];
      };
      matches: {
        Row: {
          created_at: string | null;
          grant_id: string;
          reasons: Json | null;
          score: number;
          status: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          grant_id: string;
          reasons?: Json | null;
          score: number;
          status?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          grant_id?: string;
          reasons?: Json | null;
          score?: number;
          status?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'matches_grant_id_fkey';
            columns: ['grant_id'];
            isOneToOne: false;
            referencedRelation: 'grants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      order_deliveries: {
        Row: {
          delivered_at: string;
          delivered_by: string | null;
          file_ids: string[] | null;
          id: string;
          note: string | null;
          service_request_id: string;
        };
        Insert: {
          delivered_at?: string;
          delivered_by?: string | null;
          file_ids?: string[] | null;
          id?: string;
          note?: string | null;
          service_request_id: string;
        };
        Update: {
          delivered_at?: string;
          delivered_by?: string | null;
          file_ids?: string[] | null;
          id?: string;
          note?: string | null;
          service_request_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'order_deliveries_delivered_by_fkey';
            columns: ['delivered_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_deliveries_service_request_id_fkey';
            columns: ['service_request_id'];
            isOneToOne: false;
            referencedRelation: 'service_requests';
            referencedColumns: ['id'];
          }
        ];
      };
      order_files: {
        Row: {
          created_at: string;
          file_name: string;
          file_path: string;
          id: string;
          kind: string;
          service_request_id: string;
          uploaded_by: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          file_name: string;
          file_path: string;
          id?: string;
          kind: string;
          service_request_id: string;
          uploaded_by?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          file_name?: string;
          file_path?: string;
          id?: string;
          kind?: string;
          service_request_id?: string;
          uploaded_by?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'order_files_service_request_id_fkey';
            columns: ['service_request_id'];
            isOneToOne: false;
            referencedRelation: 'service_requests';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_files_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_files_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      order_messages: {
        Row: {
          author_id: string | null;
          body: string;
          created_at: string;
          id: string;
          read_by_admin: boolean;
          read_by_client: boolean;
          sender: string;
          service_request_id: string;
        };
        Insert: {
          author_id?: string | null;
          body: string;
          created_at?: string;
          id?: string;
          read_by_admin?: boolean;
          read_by_client?: boolean;
          sender: string;
          service_request_id: string;
        };
        Update: {
          author_id?: string | null;
          body?: string;
          created_at?: string;
          id?: string;
          read_by_admin?: boolean;
          read_by_client?: boolean;
          sender?: string;
          service_request_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'order_messages_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_messages_service_request_id_fkey';
            columns: ['service_request_id'];
            isOneToOne: false;
            referencedRelation: 'service_requests';
            referencedColumns: ['id'];
          }
        ];
      };
      order_notes: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          id: string;
          service_request_id: string;
        };
        Insert: {
          author_id: string;
          body: string;
          created_at?: string;
          id?: string;
          service_request_id: string;
        };
        Update: {
          author_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
          service_request_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'order_notes_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_notes_service_request_id_fkey';
            columns: ['service_request_id'];
            isOneToOne: false;
            referencedRelation: 'service_requests';
            referencedColumns: ['id'];
          }
        ];
      };
      prices: {
        Row: {
          active: boolean | null;
          currency: string | null;
          description: string | null;
          id: string;
          interval: Database['public']['Enums']['pricing_plan_interval'] | null;
          interval_count: number | null;
          metadata: Json | null;
          product_id: string | null;
          trial_period_days: number | null;
          type: Database['public']['Enums']['pricing_type'] | null;
          unit_amount: number | null;
        };
        Insert: {
          active?: boolean | null;
          currency?: string | null;
          description?: string | null;
          id: string;
          interval?: Database['public']['Enums']['pricing_plan_interval'] | null;
          interval_count?: number | null;
          metadata?: Json | null;
          product_id?: string | null;
          trial_period_days?: number | null;
          type?: Database['public']['Enums']['pricing_type'] | null;
          unit_amount?: number | null;
        };
        Update: {
          active?: boolean | null;
          currency?: string | null;
          description?: string | null;
          id?: string;
          interval?: Database['public']['Enums']['pricing_plan_interval'] | null;
          interval_count?: number | null;
          metadata?: Json | null;
          product_id?: string | null;
          trial_period_days?: number | null;
          type?: Database['public']['Enums']['pricing_type'] | null;
          unit_amount?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'prices_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          }
        ];
      };
      products: {
        Row: {
          active: boolean | null;
          description: string | null;
          id: string;
          image: string | null;
          metadata: Json | null;
          name: string | null;
        };
        Insert: {
          active?: boolean | null;
          description?: string | null;
          id: string;
          image?: string | null;
          metadata?: Json | null;
          name?: string | null;
        };
        Update: {
          active?: boolean | null;
          description?: string | null;
          id?: string;
          image?: string | null;
          metadata?: Json | null;
          name?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          annual_budget: number | null;
          applicant_type: string | null;
          beneficiaries: string[] | null;
          country: string | null;
          description: string | null;
          embedding: string | null;
          funding_need: number | null;
          languages: string[] | null;
          org_name: string | null;
          regions: string[] | null;
          registration_type: string | null;
          sectors: string[] | null;
          stage: string | null;
          state: string | null;
          team_size: string | null;
          updated_at: string | null;
          user_id: string;
          whatsapp_number: string | null;
          whatsapp_opt_in: boolean | null;
        };
        Insert: {
          annual_budget?: number | null;
          applicant_type?: string | null;
          beneficiaries?: string[] | null;
          country?: string | null;
          description?: string | null;
          embedding?: string | null;
          funding_need?: number | null;
          languages?: string[] | null;
          org_name?: string | null;
          regions?: string[] | null;
          registration_type?: string | null;
          sectors?: string[] | null;
          stage?: string | null;
          state?: string | null;
          team_size?: string | null;
          updated_at?: string | null;
          user_id: string;
          whatsapp_number?: string | null;
          whatsapp_opt_in?: boolean | null;
        };
        Update: {
          annual_budget?: number | null;
          applicant_type?: string | null;
          beneficiaries?: string[] | null;
          country?: string | null;
          description?: string | null;
          embedding?: string | null;
          funding_need?: number | null;
          languages?: string[] | null;
          org_name?: string | null;
          regions?: string[] | null;
          registration_type?: string | null;
          sectors?: string[] | null;
          stage?: string | null;
          state?: string | null;
          team_size?: string | null;
          updated_at?: string | null;
          user_id?: string;
          whatsapp_number?: string | null;
          whatsapp_opt_in?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      quiz_leads: {
        Row: {
          answers: Json;
          created_at: string | null;
          email: string | null;
          fbc: string | null;
          fbp: string | null;
          id: string;
          marketing_consent: boolean | null;
          utm: Json | null;
        };
        Insert: {
          answers: Json;
          created_at?: string | null;
          email?: string | null;
          fbc?: string | null;
          fbp?: string | null;
          id?: string;
          marketing_consent?: boolean | null;
          utm?: Json | null;
        };
        Update: {
          answers?: Json;
          created_at?: string | null;
          email?: string | null;
          fbc?: string | null;
          fbp?: string | null;
          id?: string;
          marketing_consent?: boolean | null;
          utm?: Json | null;
        };
        Relationships: [];
      };
      raw_pages: {
        Row: {
          content_hash: string;
          fetched_at: string | null;
          id: string;
          processed: boolean | null;
          source_id: string | null;
          text: string;
          url: string;
        };
        Insert: {
          content_hash: string;
          fetched_at?: string | null;
          id?: string;
          processed?: boolean | null;
          source_id?: string | null;
          text: string;
          url: string;
        };
        Update: {
          content_hash?: string;
          fetched_at?: string | null;
          id?: string;
          processed?: boolean | null;
          source_id?: string | null;
          text?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'raw_pages_source_id_fkey';
            columns: ['source_id'];
            isOneToOne: false;
            referencedRelation: 'sources';
            referencedColumns: ['id'];
          }
        ];
      };
      service_order_intakes: {
        Row: {
          amount_requested: number | null;
          beneficiaries: string[] | null;
          budget_currency: string | null;
          budget_total: number | null;
          contact_email: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          org_country: string | null;
          org_name: string | null;
          org_registration_no: string | null;
          org_type: string | null;
          project_objectives: string | null;
          project_summary: string | null;
          project_title: string | null;
          service_request_id: string;
          status: string;
          submitted_at: string | null;
          timeline: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount_requested?: number | null;
          beneficiaries?: string[] | null;
          budget_currency?: string | null;
          budget_total?: number | null;
          contact_email?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          org_country?: string | null;
          org_name?: string | null;
          org_registration_no?: string | null;
          org_type?: string | null;
          project_objectives?: string | null;
          project_summary?: string | null;
          project_title?: string | null;
          service_request_id: string;
          status?: string;
          submitted_at?: string | null;
          timeline?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount_requested?: number | null;
          beneficiaries?: string[] | null;
          budget_currency?: string | null;
          budget_total?: number | null;
          contact_email?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          org_country?: string | null;
          org_name?: string | null;
          org_registration_no?: string | null;
          org_type?: string | null;
          project_objectives?: string | null;
          project_summary?: string | null;
          project_title?: string | null;
          service_request_id?: string;
          status?: string;
          submitted_at?: string | null;
          timeline?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'service_order_intakes_service_request_id_fkey';
            columns: ['service_request_id'];
            isOneToOne: true;
            referencedRelation: 'service_requests';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_order_intakes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      service_requests: {
        Row: {
          amount_paid_cents: number | null;
          completed_at: string | null;
          created_at: string | null;
          currency: string;
          deadline: string | null;
          grant_id: string | null;
          id: string;
          package: string | null;
          revision_count: number;
          revision_requested: boolean;
          status: string | null;
          stripe_session_id: string | null;
          user_id: string | null;
        };
        Insert: {
          amount_paid_cents?: number | null;
          completed_at?: string | null;
          created_at?: string | null;
          currency?: string;
          deadline?: string | null;
          grant_id?: string | null;
          id?: string;
          package?: string | null;
          revision_count?: number;
          revision_requested?: boolean;
          status?: string | null;
          stripe_session_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          amount_paid_cents?: number | null;
          completed_at?: string | null;
          created_at?: string | null;
          currency?: string;
          deadline?: string | null;
          grant_id?: string | null;
          id?: string;
          package?: string | null;
          revision_count?: number;
          revision_requested?: boolean;
          status?: string | null;
          stripe_session_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'service_requests_grant_id_fkey';
            columns: ['grant_id'];
            isOneToOne: false;
            referencedRelation: 'grants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_requests_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      sources: {
        Row: {
          active: boolean | null;
          id: string;
          last_ok: boolean | null;
          last_run: string | null;
          method: string;
          name: string;
          url: string;
        };
        Insert: {
          active?: boolean | null;
          id?: string;
          last_ok?: boolean | null;
          last_run?: string | null;
          method: string;
          name: string;
          url: string;
        };
        Update: {
          active?: boolean | null;
          id?: string;
          last_ok?: boolean | null;
          last_run?: string | null;
          method?: string;
          name?: string;
          url?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          cancel_at: string | null;
          cancel_at_period_end: boolean | null;
          canceled_at: string | null;
          created: string;
          current_period_end: string;
          current_period_start: string;
          ended_at: string | null;
          id: string;
          metadata: Json | null;
          price_id: string | null;
          quantity: number | null;
          status: Database['public']['Enums']['subscription_status'] | null;
          trial_end: string | null;
          trial_start: string | null;
          user_id: string;
        };
        Insert: {
          cancel_at?: string | null;
          cancel_at_period_end?: boolean | null;
          canceled_at?: string | null;
          created?: string;
          current_period_end?: string;
          current_period_start?: string;
          ended_at?: string | null;
          id: string;
          metadata?: Json | null;
          price_id?: string | null;
          quantity?: number | null;
          status?: Database['public']['Enums']['subscription_status'] | null;
          trial_end?: string | null;
          trial_start?: string | null;
          user_id: string;
        };
        Update: {
          cancel_at?: string | null;
          cancel_at_period_end?: boolean | null;
          canceled_at?: string | null;
          created?: string;
          current_period_end?: string;
          current_period_start?: string;
          ended_at?: string | null;
          id?: string;
          metadata?: Json | null;
          price_id?: string | null;
          quantity?: number | null;
          status?: Database['public']['Enums']['subscription_status'] | null;
          trial_end?: string | null;
          trial_start?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subscriptions_price_id_fkey';
            columns: ['price_id'];
            isOneToOne: false;
            referencedRelation: 'prices';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      users: {
        Row: {
          avatar_url: string | null;
          billing_address: Json | null;
          full_name: string | null;
          id: string;
          payment_method: Json | null;
        };
        Insert: {
          avatar_url?: string | null;
          billing_address?: Json | null;
          full_name?: string | null;
          id: string;
          payment_method?: Json | null;
        };
        Update: {
          avatar_url?: string | null;
          billing_address?: Json | null;
          full_name?: string | null;
          id?: string;
          payment_method?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'users_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_draft_credits: {
        Args: {
          p_n: number;
          p_user: string;
        };
        Returns: undefined;
      };
      match_grants: {
        Args: {
          p_limit?: number;
          p_user: string;
        };
        Returns: {
          grant_id: string;
          score: number;
        }[];
      };
      use_draft_credit: {
        Args: {
          p_user: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      pricing_plan_interval: 'day' | 'week' | 'month' | 'year';
      pricing_type: 'one_time' | 'recurring';
      subscription_status:
        | 'trialing'
        | 'active'
        | 'canceled'
        | 'incomplete'
        | 'incomplete_expired'
        | 'past_due'
        | 'unpaid'
        | 'paused';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'] & Database['public']['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'] & Database['public']['Views'])
  ? (Database['public']['Tables'] & Database['public']['Views'])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends keyof Database['public']['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
  ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof Database['public']['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
  ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends keyof Database['public']['Enums'] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof Database['public']['Enums']
  ? Database['public']['Enums'][PublicEnumNameOrOptions]
  : never;
