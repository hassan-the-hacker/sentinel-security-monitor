import { CompleteScanResult, Finding, SecurityGrade, SeverityLevel } from "./scanner";

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
        Insert: Omit<DbUser, "created_at"> & { created_at?: string };
        Update: Partial<DbUser>;
      };
      scans: {
        Row: DbScan;
        Insert: Omit<DbScan, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<DbScan>;
      };
      scan_results: {
        Row: DbScanResult;
        Insert: Omit<DbScanResult, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<DbScanResult>;
      };
    };
  };
}

