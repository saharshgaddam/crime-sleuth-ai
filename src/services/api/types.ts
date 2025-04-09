
// Define TypeScript types for our data
export type ForensicSummary = {
  id?: string;
  case_id: string;
  image_id: string;
  crime_type: string | null;
  objects_detected: string[] | null;
  summary: string | null;
  created_at?: string | null;
};

export type ForensicReport = {
  id?: string;
  case_id: string;
  report: string | null;
  created_at?: string | null;
};

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export type CaseData = {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  assigned_to: string[];
};

export type EvidenceItem = {
  id: string;
  case_id: string;
  name: string;
  type: string;
  description: string;
  created_at: string;
  updated_at: string;
  file_url?: string;
};

export type ErrorWithMessage = Error & {
  userMessage?: string;
};
