import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

// Utility function to read files using Node.js file system API
export async function readFile(filePath: string): Promise<string> {
  try {
    return fs.readFileSync(path.resolve(filePath), 'utf8');
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${(error as Error).message}`);
  }
}

// Utility function to write files using Node.js file system API
export async function writeFile(filePath: string, content: string): Promise<void> {
  try {
    await fs.promises.writeFile(path.resolve(filePath), content, 'utf8');
  } catch (error) {
    throw new Error(`Failed to write file ${filePath}: ${(error as Error).message}`);
  }
}

// Utility function for editing files with diff preview capability
export async function editFile(filePath: string, startLine: number, endLine: number, newContent: string): Promise<void> {
  try {
    const content = await readFile(filePath);
    const lines = content.split('\n');

    // Replace the specified range with new content
    lines.splice(startLine - 1, endLine - startLine + 1, newContent);

    await writeFile(filePath, lines.join('\n'));
  } catch (error) {
    throw new Error(`Failed to edit file ${filePath}: ${(error as Error).message}`);
  }
}

// Analyze file content for understanding and suggestions
export async function analyzeFileContent(filePath: string): Promise<string> {
  try {
    // Check if file exists in workspace
    const fullPath = path.resolve(filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(fullPath, 'utf8');

    // Simple content analysis - in a real implementation, this might call an AI service
    return `Content analysis of ${filePath}:\n\n${content.substring(0, 200)}...`;
  } catch (error) {
    throw new Error(`Failed to analyze file content for ${filePath}: ${(error as Error).message}`);
  }
}

// List directory contents with optional metadata
export async function listDirectory(dirPath: string, includeMetadata?: boolean): Promise<any> {
  try {
    const items = fs.readdirSync(path.resolve(dirPath));

    if (includeMetadata) {
      return items.map(item => {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        return {
          name: item,
          path: itemPath,
          isDirectory: stats.isDirectory(),
          size: stats.size
        };
      });
    }

    return items;
  } catch (error) {
    throw new Error(`Failed to list directory ${dirPath}: ${(error as Error).message}`);
  }
}

// Search files by pattern in workspace using Node.js file system API
export async function searchFiles(pattern: string): Promise<string[]> {
  // This would be implemented with VS Code's API or filesystem traversal
  return [];
}

// Enhanced method to handle media file operations
export async function handleMediaFileOperation(filePath: string, operation: 'preview' | 'convert' | 'metadata'): Promise<any> {
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName).toLowerCase();
  
  // Define supported media types
  const mediaTypes = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.pdf', '.csv'];
  
  if (!mediaTypes.includes(ext)) {
    return { error: `Unsupported file type: ${ext}` };
  }
  
  try {
    switch (operation) {
      case 'preview':
        // Implement thumbnail generation for images
        if (['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext)) {
          const thumbnail = await generateThumbnail(filePath);
          return { type: 'image', data: thumbnail };
        } else if (ext === '.pdf') {
          // For PDF files, extract first page text
          const pdfText = await extractPdfContent(filePath);
          return { type: 'pdf', content: pdfText };
        } else if (ext === '.csv') {
          // For CSV files, parse and summarize data
          const csvData = await parseCsvFile(filePath);
          return { type: 'csv', summary: csvData };
        }
        break;
        
      case 'convert':
        // Implement file conversion capabilities
        if (ext === '.pdf') {
          const convertedContent = await convertPdfToText(filePath);
          return { converted: true, content: convertedContent };
        } else if (ext === '.csv') {
          const jsonContent = await csvToJson(filePath);
          return { converted: true, content: jsonContent };
        }
        break;
        
      case 'metadata':
        // Extract file metadata
        const metadata = await extractFileMetadata(filePath);
        return { 
          type: ext.substring(1), 
          metadata,
          fileName
        };
    }
  } catch (error) {
    console.error(`Error handling ${operation} operation for ${filePath}:`, error);
    return { error: `Failed to perform ${operation} operation on file` };
  }
}

// Generate thumbnail for image files
async function generateThumbnail(filePath: string): Promise<string> {
  // Implementation would use image processing libraries to create thumbnails
  // For now, we'll simulate this functionality
  return `thumbnail_of_${filePath}`;
}

// Extract content from PDF file
async function extractPdfContent(filePath: string): Promise<string> {
  // Implementation would parse PDF and extract text
  return "PDF content extracted";
}

// Parse CSV file and summarize data
async function parseCsvFile(filePath: string): Promise<{rowCount: number, columnCount: number}> {
  const csvContent = fs.readFileSync(filePath, 'utf8');
  
  // Simple parsing logic for demonstration
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  return {
    rowCount: lines.length,
    columnCount: lines[0] ? lines[0].split(',').length : 0
  };
}

// Convert PDF to text format
async function convertPdfToText(filePath: string): Promise<string> {
  // Implementation would use a PDF library to extract text
  return "Converted PDF text content";
}

// Convert CSV to JSON format
async function csvToJson(filePath: string): Promise<any[]> {
  const csvContent = fs.readFileSync(filePath, 'utf8');
  
  // Simple conversion logic for demonstration
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = values[index];
    });
    return obj;
  });
}

// Extract file metadata
async function extractFileMetadata(filePath: string): Promise<any> {
  try {
    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath);
    
    // Return basic file information
    return {
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      extension: ext.substring(1),
      isDirectory: stats.isDirectory()
    };
  } catch (error) {
    console.error(`Error extracting metadata for ${filePath}:`, error);
    throw new Error('Failed to extract file metadata');
  }
}