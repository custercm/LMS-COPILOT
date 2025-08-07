// Media file types and interfaces for advanced file support

export interface MediaFile {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  path: string;
  dataUrl?: string; // Base64 encoded data URL for display
  thumbnail?: ThumbnailData;
}

export interface FileMetadata {
  fileName: string;
  fileSize: number;
  lastModified: number;
  mimeType: string;
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number; // For video/audio files in seconds
  pageCount?: number; // For PDF files
  encoding?: string; // For text files
  colorSpace?: string; // For images
  bitrate?: number; // For audio/video files
  author?: string; // For documents
  title?: string; // For documents
  created?: number; // Creation timestamp
  tags?: string[]; // File tags/keywords
}

export interface ThumbnailData {
  dataUrl: string;
  width: number;
  height: number;
  quality?: number;
}

export interface FileConversionOptions {
  fromFormat: string;
  toFormat: string;
  quality?: number;
  compression?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  preserveMetadata?: boolean;
}

export interface FileAnalysisResult {
  summary: string;
  keyInsights: string[];
  dataStructure?: {
    columns?: string[];
    rowCount?: number;
    dataTypes?: Record<string, string>;
  };
  textContent?: {
    wordCount: number;
    language: string;
    readingTime: number; // in minutes
  };
  imageAnalysis?: {
    dominantColors: string[];
    objects: string[];
    faces: number;
    text?: string; // OCR extracted text
  };
}

export interface BatchOperation {
  id: string;
  type: 'convert' | 'analyze' | 'thumbnail' | 'metadata';
  files: MediaFile[];
  options?: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  results?: any[];
  error?: string;
}

export interface MediaViewerState {
  currentFile: MediaFile | null;
  isLoading: boolean;
  error: string | null;
  zoom: number;
  rotation: number;
  currentPage?: number; // For PDF files
}

// File type categorization
export type MediaCategory = 
  | 'image' 
  | 'document' 
  | 'data' 
  | 'video' 
  | 'audio' 
  | 'archive' 
  | 'code'
  | 'unknown';

export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff'
];

export const SUPPORTED_DOCUMENT_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/html',
  'application/rtf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export const SUPPORTED_DATA_TYPES = [
  'text/csv',
  'application/json',
  'application/xml',
  'text/xml',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

export const CONVERSION_MAPPINGS: Record<string, string[]> = {
  'image/jpeg': ['png', 'webp', 'gif', 'bmp'],
  'image/png': ['jpeg', 'webp', 'gif', 'bmp'],
  'image/webp': ['jpeg', 'png', 'gif'],
  'application/pdf': ['text', 'docx', 'images'],
  'text/csv': ['json', 'xlsx', 'xml'],
  'application/json': ['csv', 'xml', 'yaml'],
  'text/markdown': ['html', 'pdf', 'docx']
};

// Utility functions
export const categorizeFile = (mimeType: string): MediaCategory => {
  if (SUPPORTED_IMAGE_TYPES.includes(mimeType)) return 'image';
  if (SUPPORTED_DOCUMENT_TYPES.includes(mimeType)) return 'document';
  if (SUPPORTED_DATA_TYPES.includes(mimeType)) return 'data';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar')) return 'archive';
  if (mimeType.startsWith('text/') || mimeType.includes('script') || mimeType.includes('code')) return 'code';
  return 'unknown';
};

export const isMediaSupported = (mimeType: string): boolean => {
  return [
    ...SUPPORTED_IMAGE_TYPES,
    ...SUPPORTED_DOCUMENT_TYPES,
    ...SUPPORTED_DATA_TYPES
  ].includes(mimeType);
};

export const getFileIcon = (mimeType: string, fileName?: string): string => {
  const category = categorizeFile(mimeType);
  
  // Special file name cases
  if (fileName) {
    const name = fileName.toLowerCase();
    if (name.includes('readme')) return '📖';
    if (name.includes('license')) return '📄';
    if (name.includes('package.json')) return '📦';
    if (name.includes('config')) return '⚙️';
  }
  
  switch (category) {
    case 'image': return '🖼️';
    case 'document': return '📄';
    case 'data': return '📊';
    case 'video': return '🎥';
    case 'audio': return '🎵';
    case 'archive': return '📦';
    case 'code': return '💻';
    default: return '📄';
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
