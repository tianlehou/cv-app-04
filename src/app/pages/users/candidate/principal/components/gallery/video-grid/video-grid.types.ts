// video-grid.types.ts
export interface VideoGridState {
  userVideos: string[];
  isLoading: boolean;
  expandedStates: Record<string, boolean>;
  totalUploadedMB: number;
  uploadProgress: number | null;
  uploadedSize: number;
  totalSize: number;
}

export interface UploadProgress {
  progress: number;
  uploaded: number;
  total: number;
}
