import { CompleteScanResult, SecurityGrade, SeverityLevel } from "./scanner";

export interface DbUser {
  id: string;
  email: string;
  created_at: string;
}

export interface DbScan {
  id: string;
  user_id: string;
  domain: string;
  overall_score: number;
  security_grade: SecurityGrade;
  scan_status: "completed" | "failed" | "in_progress";
  duration_ms: number;
  raw_payload?: CompleteScanResult | null;
  created_at: string;
}

export interface DbScanResult {
  id: string;
  scan_id: string;
  category: string;
  check_name: string;
  status: "pass" | "fail" | "warning" | "info";
  severity: SeverityLevel;
  score_impact: number;
  description: string;
  recommendation: string;
  raw_result?: Record<string, unknown> | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: DbUser;
        Insert: {
          id: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      scans: {
        Row: DbScan;
        Insert: {
          id?: string;
          user_id: string;
          domain: string;
          overall_score: number;
          security_grade: SecurityGrade;
          scan_status?: "completed" | "failed" | "in_progress";
          duration_ms?: number;
          raw_payload?: CompleteScanResult | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          domain?: string;
          overall_score?: number;
          security_grade?: SecurityGrade;
          scan_status?: "completed" | "failed" | "in_progress";
          duration_ms?: number;
          raw_payload?: CompleteScanResult | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scans_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      scan_results: {
        Row: DbScanResult;
        Insert: {
          id?: string;
          scan_id: string;
          category: string;
          check_name: string;
          status: "pass" | "fail" | "warning" | "info";
          severity: SeverityLevel;
          score_impact?: number;
          description: string;
          recommendation: string;
          raw_result?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          scan_id?: string;
          category?: string;
          check_name?: string;
          status?: "pass" | "fail" | "warning" | "info";
          severity?: SeverityLevel;
          score_impact?: number;
          description?: string;
          recommendation?: string;
          raw_result?: Record<string, unknown> | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scan_results_scan_id_fkey";
            columns: ["scan_id"];
            isOneToOne: false;
            referencedRelation: "scans";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
