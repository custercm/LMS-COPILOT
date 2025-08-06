import * as vscode from 'vscode';
import { promises as fs } from 'fs';
import * as path from 'path';

// Utility function to read files using VS Code workspace API
async function readFile(filePath: string): Promise<string> {
  try {
    const uri = vscode.Uri.file(filePath);
    const document = await vscode.workspace.openTextDocument(uri);
    return document.getText();
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${(error as Error).message}`);
  }
}

// Utility function to write files using VS Code workspace API
async function writeFile(filePath: string, content: string): Promise<void> {
  try {
    const uri = vscode.Uri.file(filePath);
    const document = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(document);

    // Get the full range of the document
    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(document.getText().length)
    );

    // Replace content in the entire document
    await editor.edit(editBuilder => {
      editBuilder.replace(fullRange, content);
    });
  } catch (error) {
    throw new Error(`Failed to write file ${filePath}: ${(error as Error).message}`);
  }
}

// Utility function for editing files with diff preview capability
async function editFile(filePath: string, changes: { startLine: number; endLine: number; content: string }): Promise<void> {
  try {
    const uri = vscode.Uri.file(filePath);
    const document = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(document);

    // Create range for the edit
    const start = new vscode.Position(changes.startLine, 0);
    const end = new vscode.Position(changes.endLine, 0);
    const range = new vscode.Range(start, end);

    // Apply changes to the file
    await editor.edit(editBuilder => {
      editBuilder.replace(range, changes.content);
    });
  } catch (error) {
    throw new Error(`Failed to edit file ${filePath}: ${(error as Error).message}`);
  }
}

// Search files by pattern in workspace
async function searchFiles(pattern: string, workspacePath?: string): Promise<string[]> {
  try {
    if (!workspacePath) {
      const folders = vscode.workspace.workspaceFolders;
      if (!folders || folders.length === 0) {
        return [];
      }
      workspacePath = folders[0].uri.fsPath;
    }

    // Use VS Code's file search API
    const files = await vscode.workspace.findFiles(pattern, undefined, undefined, undefined);

    return files.map(file => file.fsPath);
    } catch (error) {
    throw new Error(`Failed to search files with pattern ${pattern}: ${(error as Error).message}`);
    }
  }
  
// List directory contents with metadata
async function listDirectory(dirPath: string): Promise<{name: string, path: string, isDirectory: boolean, size?: number}[]> {
  try {
    const items = await fs.readdir(dirPath);
    const results: {name: string, path: string, isDirectory: boolean, size?: number}[] = [];
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = await fs.stat(fullPath);
      
      results.push({
        name: item,
        path: fullPath,
        isDirectory: stat.isDirectory(),
        size: stat.size
      });
    }
    
    return results;
  } catch (error) {
    throw new Error(`Failed to list directory contents at ${dirPath}: ${(error as Error).message}`);
  }
}

// Analyze file content for understanding and suggestions
async function analyzeFileContent(filePath: string): Promise<string> {
  try {
    const content = await readFile(filePath);
    
    // Simple content analysis - in a real implementation, this might call an AI service
    return `Content analysis of ${filePath}:\n\n${content.substring(0, 200)}...`;
  } catch (error) {
    throw new Error(`Failed to analyze file content for ${filePath}: ${(error as Error).message}`);
  }
}

// Discover workspace files by looking for project markers
async function discoverWorkspaceFiles(workspacePath: string): Promise<string[]> {
  const projectMarkers = ['.git', 'package.json', 'tsconfig.json', 'webpack.config.js'];
  const results: string[] = [];
  
  // Check for project markers at the workspace root level
  try {
    const files = await fs.readdir(workspacePath);
    
    if (files.some(file => projectMarkers.includes(file))) {
      // If project markers found, search all files in the workspace
      return await searchFiles('**/*', workspacePath);
    }
    
    // Otherwise, only discover files from common directories
    const commonDirs = ['src', 'lib', 'app', 'components'];
    for (const dir of commonDirs) {
      const dirPath = path.join(workspacePath, dir);
      if (await fs.exists(dirPath)) {
        results.push(...(await searchFiles(`**/${dir}/**/*`, workspacePath)));
      }
    }
    
    return results;
  } catch (error) {
    throw new Error(`Failed to discover workspace files: ${(error as Error).message}`);
  }
}

// Export all functions
export {
  readFile,
  writeFile,
  editFile,
  searchFiles,
  listDirectory,
  analyzeFileContent,
  discoverWorkspaceFiles
};
