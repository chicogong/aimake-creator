export type IntakeSourceType =
  | 'x-twitter'
  | 'wechat'
  | 'zhihu'
  | 'web'
  | 'table-csv'
  | 'transcript'
  | 'document'
  | 'note';

export interface IntakeMetric {
  label: string;
  value: string;
  delta?: string;
}

export interface NormalizedSource {
  title: string;
  author?: string;
  sourceUrl?: string;
  sourceType: IntakeSourceType;
  capturedAt: string;
  tags: string[];
  metrics?: IntakeMetric[];
  markdown: string;
  sha256: string;
}

export interface IntakeOptions {
  title?: string;
  tags?: string[];
  timeoutMs?: number;
  preferReader?: boolean;
}
