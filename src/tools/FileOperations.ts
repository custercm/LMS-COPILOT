import * as vscode from 'vscode';

export interface FileOperationResult {
  success: boolean;
  content?: string;
  error?: string;
}

export class FileOperations {
  
  static async readFile(filePath: string): Promise<FileOperationResult> {
    try {
      const document = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
      return { success: true, content: document.getText() };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  static async writeFile(filePath: string, content: string): Promise<FileOperationResult> {
    try {
      const document = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
      const editor = await vscode.window.showTextDocument(document);
      
      // Replace entire document with new content
      const edit = new vscode.WorkspaceEdit();
      const range = new vscode.Range(
        0, 0,
        document.lineCount, 0
      );
      edit.replace(document.uri, range, content);
      
      await vscode.workspace.applyEdit(edit);
      await document.save();
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  static async searchFiles(pattern: string): Promise<FileOperationResult> {
    try {
      const files = await vscode.workspace.findFiles(`**/${pattern}`);
      return { 
        success: true, 
        content: JSON.stringify(files.map(f => f.fsPath)) 
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to search files: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  static async listDirectory(path: string): Promise<FileOperationResult> {
    try {
      const uri = vscode.Uri.file(path);
      const contents = await vscode.workspace.fs.readDirectory(uri);
      
      return { 
        success: true, 
        content: JSON.stringify(contents.map(([name, type]) => ({
          name,
          isDirectory: type === vscode.FileType.Directory
        }))) 
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to list directory: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}