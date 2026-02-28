export interface TypesenseConfig {
  apiKey: string;
  host: string;
  port: number;
  protocol: "http" | "https";
  connectionTimeoutSeconds: number;
}

export interface CollectionSchema {
  name: string;
  num_documents: number;
  fields: Field[];
  default_sorting_field?: string;
  created_at?: number;
}

export interface Field {
  name: string;
  type: string;
  facet?: boolean;
  optional?: boolean;
  index?: boolean;
  sort?: boolean;
  infix?: boolean;
  locale?: string;
}

export interface Document {
  [key: string]: any;
}

export interface SearchParams {
  q: string;
  query_by: string;
  filter_by?: string;
  sort_by?: string;
  page?: number;
  per_page?: number;
}

export interface SearchResponse {
  hits: SearchHit[];
  found: number;
  out_of: number;
  page: number;
  request_params: SearchParams;
  search_time_ms: number;
}

export interface SearchHit {
  document: Document;
  highlights?: any[];
  text_match?: number;
}

export interface FilterValue {
  [fieldName: string]: any;
}

export type ThemeMode = "light" | "dark";

// ─── Synonyms ───────────────────────────────────────────────────
export interface SynonymSchema {
  id: string;
  root?: string;          // one-way synonym root
  synonyms: string[];
}

// ─── Overrides / Curations ──────────────────────────────────────
export interface OverrideRule {
  query: string;
  match: "exact" | "contains";
}

export interface OverrideInclude {
  id: string;
  position: number;
}

export interface OverrideExclude {
  id: string;
}

export interface OverrideSchema {
  id: string;
  rule: OverrideRule;
  includes?: OverrideInclude[];
  excludes?: OverrideExclude[];
  filter_by?: string;
  sort_by?: string;
  replace_query?: string;
  remove_matched_tokens?: boolean;
}

// ─── API Keys ───────────────────────────────────────────────────
export interface ApiKeySchema {
  id?: number;
  description: string;
  actions: string[];
  collections: string[];
  value?: string;         // only returned on create
  expires_at?: number;
}

// ─── Search Analytics ───────────────────────────────────────────
export interface AnalyticsEntry {
  query: string;
  collection: string;
  found: number;
  searchTimeMs: number;
  timestamp: number;
}

// ─── Pipeline Builder ───────────────────────────────────────────
export type PipelineStepType = "import" | "transform" | "index" | "search";

export interface PipelineStep {
  id: string;
  type: PipelineStepType;
  label: string;
  config: Record<string, unknown>;
}

export interface Pipeline {
  id: string;
  name: string;
  steps: PipelineStep[];
  createdAt: number;
}

// ─── Collaboration ──────────────────────────────────────────────
export interface AuditLogEntry {
  id: string;
  action: string;
  target: string;
  detail?: string;
  user: string;
  timestamp: string;
}

export interface SharedLink {
  id: string;
  name: string;
  collection: string;
  token: string;
  permissions: string[];
  createdAt: string;
  expiresAt?: string;
}

// ─── Plugin System ──────────────────────────────────────────────
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  hooks: string[];
  enabled: boolean;
  code: string;
}
