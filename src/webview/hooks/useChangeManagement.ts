import { useState, useCallback } from 'react';

interface ChangeSet {
  id: string;
  messageId: string;
  changes: any[];
  status: 'pending' | 'applied' | 'reverted';
  description: string;
}

interface AgentTask {
  id: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  steps?: any[];
}

export function useChangeManagement() {
  const [changeSets, setChangeSets] = useState<ChangeSet[]>([]);
  const [pendingChanges, setPendingChanges] = useState<any[]>([]);

  // Agent mode state
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [currentTask, setCurrentTask] = useState<AgentTask | null>(null);
  const [tasksHistory, setTasksHistory] = useState<AgentTask[]>([]);

  // Add a new change to pending changes
  const addChange = useCallback((change: any) => {
    setPendingChanges(prev => [...prev, change]);
  }, []);

  // Apply a specific change
  const applyChange = useCallback(async (changeId: string) => {
    try {
      // Send request to extension context to apply the change
      await vscode.postMessage({
        command: 'applyChange',
        changeId: changeId
      });
      
      // Update local state after successful application  
      setChangeSets(prev => prev.map(set =>
        set.id === changeId ? { ...set, status: 'applied' } : set
      ));
    } catch (error) {
      console.error('Failed to apply change:', error);
    }
  }, []);

  // Revert a specific change
  const revertChange = useCallback(async (changeId: string) => {
    try {
      await vscode.postMessage({
        command: 'revertChange',
        changeId: changeId
      });
      
      // Update local state after successful reversal
      setChangeSets(prev => prev.map(set =>
        set.id === changeId ? { ...set, status: 'reverted' } : set
      ));
    } catch (error) {
      console.error('Failed to revert change:', error);
    }
  }, []);

  // Preview a specific change in the editor  
  const previewChange = useCallback(async (changeId: string) => {
    try {
      await vscode.postMessage({
        command: 'previewChange',
        changeId: changeId
      });
      
      console.log('Previewing change:', changeId);
    } catch (error) {
      console.error('Failed to preview change:', error);
    }
  }, []);
  
  // Agent mode toggle functionality
  const toggleAgentMode = useCallback(() => {
    setIsAgentMode(prev => !prev);
  }, []);

  // Execute agent task
  const executeTask = useCallback(async (description: string) => {
    if (!isAgentMode) return;
    
    // Create new task
    const newTask: AgentTask = {
      id: Date.now().toString(),
      description,
      status: 'running',
      steps: []
    };
    
    setCurrentTask(newTask);
    
    try {
      // In a real implementation, this would call the extension API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update task as completed
      const completedTask = { ...newTask, status: 'completed' };
      setCurrentTask(completedTask);
      setTasksHistory(prev => [...prev, completedTask]);
    } catch (error) {
      console.error('Agent execution error:', error);
      const failedTask = { ...newTask, status: 'failed' };
      setCurrentTask(failedTask);
    }
  }, [isAgentMode]);

  return {
    changeSets,
    pendingChanges,
    addChange,
    applyChange,
    revertChange,
    previewChange,
    
    // Agent mode functionality
    isAgentMode,
    toggleAgentMode,
    currentTask,
    executeTask,
    tasksHistory
  };
}