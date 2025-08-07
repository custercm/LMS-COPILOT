import { useState } from 'react';
import { FileChange, ChangeSet } from '../types/changes';

interface ChangeState {
  pendingChanges: ChangeSet[];
  appliedChanges: ChangeSet[];
  revertedChanges: ChangeSet[];
}

export function useChangeManagement() {
  const [changeState, setChangeState] = useState<ChangeState>({
    pendingChanges: [],
    appliedChanges: [],
    revertedChanges: []
  });

  // Add a new change to the pending list
  const addPendingChange = (changeSet: ChangeSet) => {
    setChangeState(prev => ({
      ...prev,
      pendingChanges: [...prev.pendingChanges, changeSet]
    }));
  };
    
  // Apply all pending changes
  const applyAllChanges = () => {
    setChangeState(prev => ({
      pendingChanges: [],
      appliedChanges: [...prev.appliedChanges, ...prev.pendingChanges],
      revertedChanges: prev.revertedChanges
    }));
  };

  // Revert all pending changes
  const revertAllChanges = () => {
    setChangeState(prev => ({
      pendingChanges: [],
      appliedChanges: prev.appliedChanges,
      revertedChanges: [...prev.revertedChanges, ...prev.pendingChanges]
    }));
  };

  // Apply a single change by ID
  const applyChangeById = (changeId: string) => {
    setChangeState(prev => {
      const pendingIndex = prev.pendingChanges.findIndex(c => c.id === changeId);

      if (pendingIndex !== -1) {
        const changeSet = prev.pendingChanges[pendingIndex];
        const updatedPending = [...prev.pendingChanges];
        updatedPending.splice(pendingIndex, 1);
        return {
          ...prev,
          pendingChanges: updatedPending,
          appliedChanges: [...prev.appliedChanges, changeSet]
        };
      }

      return prev;
    });
  };

  // Revert a single change by ID
  const revertChangeById = (changeId: string) => {
    setChangeState(prev => {
      const pendingIndex = prev.pendingChanges.findIndex(c => c.id === changeId);

      if (pendingIndex !== -1) {
        const changeSet = prev.pendingChanges[pendingIndex];
        const updatedPending = [...prev.pendingChanges];
        updatedPending.splice(pendingIndex, 1);

        return {
          ...prev,
          pendingChanges: updatedPending,
          revertedChanges: [...prev.revertedChanges, changeSet]
        };
      }

      return prev;
    });
  };

  // Get summary statistics for changes
  const getChangeSummary = (): { additions: number; deletions: number } => {
    let additions = 0;
    let deletions = 0;

    changeState.pendingChanges.forEach(changeSet => {
      changeSet.changes.forEach(change => {
        if (change.changeType === 'create' || change.changeType === 'modify') {
          additions += change.proposedContent.split('\n').length;
          deletions += change.originalContent.split('\n').length;
        } else if (change.changeType === 'delete') {
          deletions += change.originalContent.split('\n').length;
        }
      });
    });

    return { additions, deletions };
  };

  // Get file status indicators
  const getFileStatus = (filePath: string): 'pending' | 'applied' | 'reverted' => {
    for (const changeSet of changeState.pendingChanges) {
      if (changeSet.changes.some(c => c.filePath === filePath)) {
        return 'pending';
      }
    }

    for (const changeSet of changeState.appliedChanges) {
      if (changeSet.changes.some(c => c.filePath === filePath)) {
        return 'applied';
      }
    }

    for (const changeSet of changeState.revertedChanges) {
      if (changeSet.changes.some(c => c.filePath === filePath)) {
        return 'reverted';
      }
    }

    return 'pending'; // Default fallback
  };

  // Get changes for a specific file
  const getChangesForFile = (filePath: string): FileChange[] => {
    const allChanges = [
      ...changeState.pendingChanges.flatMap(c => c.changes),
      ...changeState.appliedChanges.flatMap(c => c.changes),
      ...changeState.revertedChanges.flatMap(c => c.changes)
    ];

    return allChanges.filter(change => change.filePath === filePath);
  };

  // Get file snapshot for tracking
  const getFileSnapshot = (filePath: string): string | null => {
    // This would typically retrieve the current content of a file from VS Code API
    // For now, returning placeholder - actual implementation would be more complex
    return "Current file content";
  };

  // Rollback specific change for a file
  const rollbackChange = (filePath: string, versionId?: string): void => {
    // Implementation to revert file changes to a previous state
    console.log(`Rolling back changes for ${filePath}`);
  };

  // Test support methods - these would be used in testing environment only
  const mockApplyChanges = (changes: FileChange[]) => {
    setChangeState(prev => ({
      ...prev,
      appliedChanges: [
        ...prev.appliedChanges,
        {
          id: `test-${Date.now()}`,
          messageId: 'test-message',
          changes,
          status: 'applied',
          description: 'Test changes applied',
          fileCount: changes.length,
          changeSummary: { additions: 0, deletions: 0 }
        }
      ]
    }));
  };
  
  const mockRejectChanges = (changes: FileChange[]) => {
    setChangeState(prev => ({
      ...prev,
      revertedChanges: [
        ...prev.revertedChanges,
        {
          id: `test-${Date.now()}`,
          messageId: 'test-message',
          changes,
          status: 'reverted',
          description: 'Test changes rejected',
          fileCount: changes.length,
          changeSummary: { additions: 0, deletions: 0 }
        }
      ]
    }));
  };

  return {
    changeState,
    addPendingChange,
    applyAllChanges,
    revertAllChanges,
    applyChangeById,
    revertChangeById,
    getChangeSummary,
    getFileStatus,
    getChangesForFile,
    getFileSnapshot,
    rollbackChange,
    mockApplyChanges,
    mockRejectChanges
  };
}