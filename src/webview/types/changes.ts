export interface FileChange {
  id: string;
  filePath: string;
  originalContent: string;
  proposedContent: string;
  changeType: 'create' | 'modify' | 'delete';
  applied: boolean;
  timestamp: number;
}

export interface ChangeSet {
  id: string;
  messageId: string;
  changes: FileChange[];
  status: 'pending' | 'applied' | 'reverted';
  description: string;
  fileCount: number;
  changeSummary: { additions: number; deletions: number };
}