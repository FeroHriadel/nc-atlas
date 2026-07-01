export type ImportJobStatus = 'Pending' | 'Processing' | 'Completed' | 'Aborted';
export type ImportJobItemStatus = 'Pending' | 'Processing' | 'Succeeded' | 'Failed' | 'Skipped';

export interface ImportJobItem {
  id: string;
  sightTitle: string;
  sightDescription?: string;
  status: ImportJobItemStatus;
  errorMessage?: string;
  sightId?: string;
  categoryName?: string;
  tags?: string;
  latitude?: number;
  longitude?: number;
  image350Url?: string;
}

export interface ImportJob {
  id: string;
  status: ImportJobStatus;
  totalCount: number;
  processedCount: number;
  succeededCount: number;
  failedCount: number;
  skippedCount: number;
  abortRequested: boolean;
  createdAt: string;
  completedAt?: string;
  items: ImportJobItem[];
}

export interface StartImportResponse {
  jobId: string;
  totalCount: number;
  skippedCount: number;
  skipped: string[];
}
