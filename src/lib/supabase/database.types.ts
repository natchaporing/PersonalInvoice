// Generated from the Supabase schema (project personalinvoice). Regenerate after migrations.
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
      audit_log: {
        Row: {
          action: string
          at: string
          detail: Json | null
          document_id: string | null
          id: number
          owner_id: string
        }
        Insert: {
          action: string
          at?: string
          detail?: Json | null
          document_id?: string | null
          id?: never
          owner_id?: string
        }
        Update: {
          action?: string
          at?: string
          detail?: Json | null
          document_id?: string | null
          id?: never
          owner_id?: string
        }
        Relationships: []
      }
      business_profiles: {
        Row: {
          addr_building_number: string | null
          addr_district_code: string | null
          addr_postcode: string | null
          addr_province_code: string | null
          addr_street: string | null
          addr_subdistrict_code: string | null
          address_en: string | null
          address_th: string
          bank_account_name: string | null
          bank_account_name_en: string | null
          bank_account_number: string | null
          bank_account_type: string | null
          bank_branch_en: string | null
          bank_branch_th: string | null
          bank_name_en: string | null
          bank_name_th: string | null
          branch_code: string
          created_at: string
          default_vat_bps: number
          email: string | null
          logo_path: string | null
          name_en: string | null
          name_th: string
          owner_id: string
          phone: string | null
          signature_path: string | null
          tax_id: string
          vat_registered: boolean
        }
        Insert: {
          addr_building_number?: string | null
          addr_district_code?: string | null
          addr_postcode?: string | null
          addr_province_code?: string | null
          addr_street?: string | null
          addr_subdistrict_code?: string | null
          address_en?: string | null
          address_th: string
          bank_account_name?: string | null
          bank_account_name_en?: string | null
          bank_account_number?: string | null
          bank_account_type?: string | null
          bank_branch_en?: string | null
          bank_branch_th?: string | null
          bank_name_en?: string | null
          bank_name_th?: string | null
          branch_code?: string
          created_at?: string
          default_vat_bps?: number
          email?: string | null
          logo_path?: string | null
          name_en?: string | null
          name_th: string
          owner_id: string
          phone?: string | null
          signature_path?: string | null
          tax_id: string
          vat_registered?: boolean
        }
        Update: {
          addr_building_number?: string | null
          addr_district_code?: string | null
          addr_postcode?: string | null
          addr_province_code?: string | null
          addr_street?: string | null
          addr_subdistrict_code?: string | null
          address_en?: string | null
          address_th?: string
          bank_account_name?: string | null
          bank_account_name_en?: string | null
          bank_account_number?: string | null
          bank_account_type?: string | null
          bank_branch_en?: string | null
          bank_branch_th?: string | null
          bank_name_en?: string | null
          bank_name_th?: string | null
          branch_code?: string
          created_at?: string
          default_vat_bps?: number
          email?: string | null
          logo_path?: string | null
          name_en?: string | null
          name_th?: string
          owner_id?: string
          phone?: string | null
          signature_path?: string | null
          tax_id?: string
          vat_registered?: boolean
        }
        Relationships: []
      }
      billing_charges: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string
          owner_id: string
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          plan: string
          provider: string
          provider_ref: string | null
          receipt_document_id: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method: string
          owner_id: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          plan: string
          provider?: string
          provider_ref?: string | null
          receipt_document_id?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          owner_id?: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          plan?: string
          provider?: string
          provider_ref?: string | null
          receipt_document_id?: string | null
          status?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          owner_id: string
          plan: string | null
          trial_ends_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          owner_id: string
          plan?: string | null
          trial_ends_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          owner_id?: string
          plan?: string | null
          trial_ends_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      commission_payees: {
        Row: {
          address: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          created_at: string
          default_rate_bps: number | null
          default_wht_bps: number
          email: string | null
          id: string
          is_juristic: boolean
          name: string
          note: string | null
          owner_id: string
          phone: string | null
          tax_id: string | null
        }
        Insert: {
          address?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          created_at?: string
          default_rate_bps?: number | null
          default_wht_bps?: number
          email?: string | null
          id?: string
          is_juristic?: boolean
          name: string
          note?: string | null
          owner_id?: string
          phone?: string | null
          tax_id?: string | null
        }
        Update: {
          address?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          created_at?: string
          default_rate_bps?: number | null
          default_wht_bps?: number
          email?: string | null
          id?: string
          is_juristic?: boolean
          name?: string
          note?: string | null
          owner_id?: string
          phone?: string | null
          tax_id?: string | null
        }
        Relationships: []
      }
      commissions: {
        Row: {
          payee_id: string | null
          amount: number
          basis: string
          created_at: string
          id: string
          note: string | null
          owner_id: string
          paid_on: string | null
          paid_reference: string | null
          payee_account: string | null
          payee_name: string
          quotation_id: string
          rate_bps: number | null
          wht: number
          wht_bps: number
        }
        Insert: {
          payee_id?: string | null
          amount: number
          basis: string
          created_at?: string
          id?: string
          note?: string | null
          owner_id?: string
          paid_on?: string | null
          paid_reference?: string | null
          payee_account?: string | null
          payee_name: string
          quotation_id: string
          rate_bps?: number | null
          wht?: number
          wht_bps?: number
        }
        Update: {
          payee_id?: string | null
          amount?: number
          basis?: string
          created_at?: string
          id?: string
          note?: string | null
          owner_id?: string
          paid_on?: string | null
          paid_reference?: string | null
          payee_account?: string | null
          payee_name?: string
          quotation_id?: string
          rate_bps?: number | null
          wht?: number
          wht_bps?: number
        }
        Relationships: []
      }
      customers: {
        Row: {
          postcode: string | null
          address_en: string | null
          address_th: string | null
          branch_code: string
          created_at: string
          email: string | null
          id: string
          is_juristic: boolean
          name_en: string | null
          name_th: string
          owner_id: string
          phone: string | null
          tax_id: string | null
        }
        Insert: {
          postcode?: string | null
          address_en?: string | null
          address_th?: string | null
          branch_code?: string
          created_at?: string
          email?: string | null
          id?: string
          is_juristic?: boolean
          name_en?: string | null
          name_th: string
          owner_id?: string
          phone?: string | null
          tax_id?: string | null
        }
        Update: {
          postcode?: string | null
          address_en?: string | null
          address_th?: string | null
          branch_code?: string
          created_at?: string
          email?: string | null
          id?: string
          is_juristic?: boolean
          name_en?: string | null
          name_th?: string
          owner_id?: string
          phone?: string | null
          tax_id?: string | null
        }
        Relationships: []
      }
      document_lines: {
        Row: {
          discount: number
          product_code: string | null
          vat_bps: number
          amount: number
          description_en: string | null
          description_th: string
          document_id: string
          id: string
          owner_id: string
          position: number
          qty_milli: number
          unit: string
          unit_price: number
        }
        Insert: {
          discount?: number
          product_code?: string | null
          vat_bps?: number
          amount: number
          description_en?: string | null
          description_th: string
          document_id: string
          id?: string
          owner_id?: string
          position: number
          qty_milli: number
          unit?: string
          unit_price: number
        }
        Update: {
          discount?: number
          product_code?: string | null
          vat_bps?: number
          amount?: number
          description_en?: string | null
          description_th?: string
          document_id?: string
          id?: string
          owner_id?: string
          position?: number
          qty_milli?: number
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_lines_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_sequences: {
        Row: {
          doc_type: Database["public"]["Enums"]["document_type"]
          last_number: number
          owner_id: string
          year: number
        }
        Insert: {
          doc_type: Database["public"]["Enums"]["document_type"]
          last_number?: number
          owner_id: string
          year: number
        }
        Update: {
          doc_type?: Database["public"]["Enums"]["document_type"]
          last_number?: number
          owner_id?: string
          year?: number
        }
        Relationships: []
      }
      documents: {
        Row: {
          installment_id: string | null
          quotation_id: string | null
          source_document_id: string | null
          etax_error: string | null
          etax_generated_at: string | null
          etax_pdf_path: string | null
          etax_pdf_sha256: string | null
          etax_status: string
          etax_test_cert: boolean | null
          etax_xml_path: string | null
          approver_id: string | null
          reply_by: string | null
          show_product_code: boolean
          show_unit: boolean
          signer_id: string | null
          signers_snapshot: Json | null
          valid_until: string | null
          created_at: string
          customer_id: string | null
          customer_snapshot: Json | null
          discount: number
          doc_type: Database["public"]["Enums"]["document_type"]
          due_date: string | null
          id: string
          issue_date: string
          lang: Database["public"]["Enums"]["doc_lang"]
          net_receivable: number
          notes: string | null
          number: string | null
          owner_id: string
          pdf_path: string | null
          pdf_sha256: string | null
          prices_include_vat: boolean
          reason: string | null
          ref_document_id: string | null
          seller_snapshot: Json | null
          signed_at: string | null
          status: Database["public"]["Enums"]["document_status"]
          subtotal: number
          taxable: number
          total: number
          vat: number
          vat_bps: number
          verify_code: string | null
          voided_at: string | null
          wht: number
          wht_bps: number
        }
        Insert: {
          installment_id?: string | null
          quotation_id?: string | null
          source_document_id?: string | null
          etax_error?: string | null
          etax_generated_at?: string | null
          etax_pdf_path?: string | null
          etax_pdf_sha256?: string | null
          etax_status?: string
          etax_test_cert?: boolean | null
          etax_xml_path?: string | null
          approver_id?: string | null
          reply_by?: string | null
          show_product_code?: boolean
          show_unit?: boolean
          signer_id?: string | null
          signers_snapshot?: Json | null
          valid_until?: string | null
          created_at?: string
          customer_id?: string | null
          customer_snapshot?: Json | null
          discount?: number
          doc_type: Database["public"]["Enums"]["document_type"]
          due_date?: string | null
          id?: string
          issue_date?: string
          lang?: Database["public"]["Enums"]["doc_lang"]
          net_receivable?: number
          notes?: string | null
          number?: string | null
          owner_id?: string
          pdf_path?: string | null
          pdf_sha256?: string | null
          prices_include_vat?: boolean
          reason?: string | null
          ref_document_id?: string | null
          seller_snapshot?: Json | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          subtotal?: number
          taxable?: number
          total?: number
          vat?: number
          vat_bps?: number
          verify_code?: string | null
          voided_at?: string | null
          wht?: number
          wht_bps?: number
        }
        Update: {
          installment_id?: string | null
          quotation_id?: string | null
          source_document_id?: string | null
          etax_error?: string | null
          etax_generated_at?: string | null
          etax_pdf_path?: string | null
          etax_pdf_sha256?: string | null
          etax_status?: string
          etax_test_cert?: boolean | null
          etax_xml_path?: string | null
          approver_id?: string | null
          reply_by?: string | null
          show_product_code?: boolean
          show_unit?: boolean
          signer_id?: string | null
          signers_snapshot?: Json | null
          valid_until?: string | null
          created_at?: string
          customer_id?: string | null
          customer_snapshot?: Json | null
          discount?: number
          doc_type?: Database["public"]["Enums"]["document_type"]
          due_date?: string | null
          id?: string
          issue_date?: string
          lang?: Database["public"]["Enums"]["doc_lang"]
          net_receivable?: number
          notes?: string | null
          number?: string | null
          owner_id?: string
          pdf_path?: string | null
          pdf_sha256?: string | null
          prices_include_vat?: boolean
          reason?: string | null
          ref_document_id?: string | null
          seller_snapshot?: Json | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          subtotal?: number
          taxable?: number
          total?: number
          vat?: number
          vat_bps?: number
          verify_code?: string | null
          voided_at?: string | null
          wht?: number
          wht_bps?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_ref_document_id_fkey"
            columns: ["ref_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      installments: {
        Row: {
          amount: number
          created_at: string
          id: string
          label: string
          owner_id: string
          pct_bps: number
          position: number
          quotation_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          label: string
          owner_id?: string
          pct_bps: number
          position: number
          quotation_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          label?: string
          owner_id?: string
          pct_bps?: number
          position?: number
          quotation_id?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          code: string | null
          default_vat_bps: number
          created_at: string
          default_wht_bps: number
          id: string
          name_en: string | null
          name_th: string
          owner_id: string
          unit: string
          unit_price: number
        }
        Insert: {
          code?: string | null
          default_vat_bps?: number
          created_at?: string
          default_wht_bps?: number
          id?: string
          name_en?: string | null
          name_th: string
          owner_id?: string
          unit?: string
          unit_price: number
        }
        Update: {
          code?: string | null
          default_vat_bps?: number
          created_at?: string
          default_wht_bps?: number
          id?: string
          name_en?: string | null
          name_th?: string
          owner_id?: string
          unit?: string
          unit_price?: number
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          document_id: string
          id: string
          method: string
          owner_id: string
          paid_on: string
          reference: string | null
          slip_path: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          document_id: string
          id?: string
          method?: string
          owner_id?: string
          paid_on?: string
          reference?: string | null
          slip_path?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          document_id?: string
          id?: string
          method?: string
          owner_id?: string
          paid_on?: string
          reference?: string | null
          slip_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      signatories: {
        Row: {
          created_at: string
          id: string
          name_en: string | null
          name_th: string
          owner_id: string
          signature_image: string | null
          title_en: string | null
          title_th: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name_en?: string | null
          name_th: string
          owner_id?: string
          signature_image?: string | null
          title_en?: string | null
          title_th?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name_en?: string | null
          name_th?: string
          owner_id?: string
          signature_image?: string | null
          title_en?: string | null
          title_th?: string | null
        }
        Relationships: []
      }
      wht_certificates: {
        Row: {
          certificate_no: string | null
          created_at: string
          document_id: string | null
          file_path: string | null
          id: string
          income_amount: number
          issued_on: string
          owner_id: string
          wht_amount: number
        }
        Insert: {
          certificate_no?: string | null
          created_at?: string
          document_id?: string | null
          file_path?: string | null
          id?: string
          income_amount: number
          issued_on: string
          owner_id?: string
          wht_amount: number
        }
        Update: {
          certificate_no?: string | null
          created_at?: string
          document_id?: string | null
          file_path?: string | null
          id?: string
          income_amount?: number
          issued_on?: string
          owner_id?: string
          wht_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "wht_certificates_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      subscription_receipt: {
        Args: { p_charge: string }
        Returns: Json
      }
      attach_provider_charge: {
        Args: { p_charge: string; p_provider: string; p_ref: string }
        Returns: undefined
      }
      settle_provider_charge: {
        Args: { p_amount: number; p_charge: string; p_provider: string; p_ref: string; p_secret: string; p_status: string }
        Returns: string
      }
      complete_test_charge: {
        Args: { p_charge: string; p_secret: string }
        Returns: string
      }
      start_checkout: {
        Args: { p_method: string; p_plan: string }
        Returns: string
      }
      issue_document: {
        Args: { p_customer: Json; p_document_id: string; p_seller: Json; p_signers?: Json }
        Returns: string
      }
      verify_document: {
        Args: { p_code: string }
        Returns: {
          buyer_name: string
          doc_type: Database["public"]["Enums"]["document_type"]
          issue_date: string
          number: string
          pdf_sha256: string
          seller_name: string
          seller_tax_id: string
          signed_at: string
          status: Database["public"]["Enums"]["document_status"]
          total: number
          vat: number
          voided_at: string
        }[]
      }
    }
    Enums: {
      doc_lang: "th" | "en" | "bilingual"
      document_status: "draft" | "issued" | "paid" | "void"
      document_type:
        | "quotation"
        | "invoice"
        | "tax_invoice"
        | "receipt_tax_invoice"
        | "credit_note"
        | "debit_note"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"]
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T]
