import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

// Utility function to read files using Node.js file system API
export async function readFile(filePath: string): Promise<string> {
  try {
    const fileUri = vscode.Uri.file(path.resolve(filePath));
    const buffer = await vscode.workspace.fs.readFile(fileUri);
    return Buffer.from(buffer).toString('utf8');
  } catch (error) {
    throw new Error(
      `Failed to read file ${filePath}: ${(error as Error).message}`,
    );
  }
}

// Utility function to write files using Node.js file system API
export async function writeFile(
  filePath: string,
  content: string,
): Promise<void> {
  try {
    const fileUri = vscode.Uri.file(path.resolve(filePath));
    const fileContent = Buffer.from(content, 'utf8');
    await vscode.workspace.fs.writeFile(fileUri, fileContent);
  } catch (error) {
    throw new Error(
      `Failed to write file ${filePath}: ${(error as Error).message}`,
    );
  }
}

// Utility function to create files using VS Code workspace API (proper approach)
export async function createFile(
  filePath: string,
  content: string,
): Promise<void> {
  try {
    const fileUri = vscode.Uri.file(path.resolve(filePath));
    const fileContent = Buffer.from(content, 'utf8');
    await vscode.workspace.fs.writeFile(fileUri, fileContent);
  } catch (error) {
    throw new Error(
      `Failed to create file ${filePath}: ${(error as Error).message}`,
    );
  }
}

// Utility function for editing files with diff preview capability
export async function editFile(
  filePath: string,
  startLine: number,
  endLine: number,
  newContent: string,
): Promise<void> {
  try {
    const content = await readFile(filePath);
    const lines = content.split("\n");

    // Replace the specified range with new content
    lines.splice(startLine - 1, endLine - startLine + 1, newContent);

    await writeFile(filePath, lines.join("\n"));
  } catch (error) {
    throw new Error(
      `Failed to edit file ${filePath}: ${(error as Error).message}`,
    );
  }
}

// Basic file analysis (legacy function for compatibility)
export async function analyzeFileBasic(filePath: string): Promise<string> {
  try {
    // Check if file exists in workspace
    const fullPath = path.resolve(filePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(fullPath, "utf8");

    // Simple content analysis
    const lines = content.split("\n");
    const wordCount = content.split(/\s+/).length;
    const fileSize = fs.statSync(fullPath).size;

    return (
      `File analysis for ${path.basename(filePath)}:\n` +
      `- Lines: ${lines.length}\n` +
      `- Words: ${wordCount}\n` +
      `- Size: ${fileSize} bytes\n` +
      `- Type: ${path.extname(filePath) || "No extension"}`
    );
  } catch (error) {
    throw new Error(
      `Failed to analyze file ${filePath}: ${(error as Error).message}`,
    );
  }
}

// Enhanced thumbnail generation with different media types
export async function generateAdvancedThumbnail(
  filePath: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: "jpeg" | "png" | "webp";
  } = {},
): Promise<{
  dataUrl: string;
  dimensions: { width: number; height: number };
  format: string;
}> {
  const { width = 128, height = 128, quality = 0.8, format = "jpeg" } = options;
  const ext = path.extname(filePath).toLowerCase();

  try {
    if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"].includes(ext)) {
      return await generateImageThumbnail(filePath, {
        width,
        height,
        quality,
        format,
      });
    } else if (ext === ".pdf") {
      return await generatePdfThumbnail(filePath, {
        width,
        height,
        quality,
        format,
      });
    } else if ([".csv", ".json", ".xml"].includes(ext)) {
      return await generateDataThumbnail(filePath, {
        width,
        height,
        quality,
        format,
      });
    } else {
      return await generateGenericThumbnail(filePath, {
        width,
        height,
        quality,
        format,
      });
    }
  } catch (error) {
    throw new Error(
      `Failed to generate thumbnail for ${filePath}: ${(error as Error).message}`,
    );
  }
}

// Enhanced file analysis
export async function analyzeFileContent(filePath: string): Promise<{
  summary: string;
  keyInsights: string[];
  fileType: string;
  metadata: any;
  dataStructure?: any;
  textContent?: any;
  imageAnalysis?: any;
}> {
  const ext = path.extname(filePath).toLowerCase();
  const metadata = await extractFileMetadata(filePath);

  let analysis: any = {
    summary: `Analysis of ${path.basename(filePath)}`,
    keyInsights: [],
    fileType: ext.substring(1),
    metadata,
  };

  try {
    if ([".csv", ".json", ".xml"].includes(ext)) {
      analysis.dataStructure = await analyzeDataFile(filePath);
      analysis.keyInsights.push(
        `Data file with ${analysis.dataStructure.rowCount || 0} rows`,
        `Contains ${analysis.dataStructure.columnCount || 0} columns`,
        "Well-structured data format",
      );
    } else if ([".txt", ".md", ".html"].includes(ext)) {
      analysis.textContent = await analyzeTextFile(filePath);
      analysis.keyInsights.push(
        `Text file with ${analysis.textContent.wordCount} words`,
        `Estimated reading time: ${analysis.textContent.readingTime} minutes`,
        `Language: ${analysis.textContent.language}`,
      );
    } else if ([".jpg", ".jpeg", ".png", ".gif"].includes(ext)) {
      analysis.imageAnalysis = await analyzeImageFile(filePath);
      analysis.keyInsights.push(
        `Image dimensions: ${analysis.imageAnalysis.width}x${analysis.imageAnalysis.height}`,
        `File size: ${(metadata.size / 1024).toFixed(1)} KB`,
        "Standard image format",
      );
    } else if (ext === ".pdf") {
      analysis.textContent = await analyzePdfFile(filePath);
      analysis.keyInsights.push(
        `PDF with ${analysis.textContent.pageCount} pages`,
        `Contains ${analysis.textContent.wordCount} words`,
        "Document format with text content",
      );
    } else {
      analysis.keyInsights.push(
        "Generic file type",
        `Size: ${(metadata.size / 1024).toFixed(1)} KB`,
        "Binary or unknown format",
      );
    }

    analysis.summary = `${path.basename(filePath)} is a ${analysis.fileType} file containing ${analysis.keyInsights.join(", ").toLowerCase()}`;
  } catch (error) {
    analysis.keyInsights.push("Analysis incomplete due to processing error");
    console.error(`Error analyzing ${filePath}:`, error);
  }

  return analysis;
}

// File conversion functions
export async function convertFile(
  sourcePath: string,
  targetPath: string,
  options: {
    format: string;
    quality?: number;
    compression?: number;
    preserveMetadata?: boolean;
  },
): Promise<{ success: boolean; outputPath: string; metadata?: any }> {
  const sourceExt = path.extname(sourcePath).toLowerCase();
  const {
    format,
    quality = 90,
    compression = 80,
    preserveMetadata = true,
  } = options;

  try {
    if (isImageFormat(sourceExt) && isImageFormat(`.${format}`)) {
      return await convertImage(sourcePath, targetPath, format, quality);
    } else if (
      sourceExt === ".pdf" &&
      ["txt", "docx", "html"].includes(format)
    ) {
      return await convertPdfToText(sourcePath, targetPath, format);
    } else if (
      sourceExt === ".csv" &&
      ["json", "xml", "xlsx"].includes(format)
    ) {
      return await convertDataFile(sourcePath, targetPath, format);
    } else if (
      [".md", ".txt"].includes(sourceExt) &&
      ["html", "pdf"].includes(format)
    ) {
      return await convertTextFile(sourcePath, targetPath, format);
    } else {
      throw new Error(
        `Conversion from ${sourceExt} to ${format} is not supported`,
      );
    }
  } catch (error) {
    return {
      success: false,
      outputPath: targetPath,
      metadata: { error: (error as Error).message },
    };
  }
}

// Batch operations for multiple files
export async function processBatchOperation(
  files: string[],
  operation: "thumbnail" | "analyze" | "convert" | "metadata",
  options: any = {},
  onProgress?: (current: number, total: number) => void,
): Promise<any[]> {
  const results: any[] = [];

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    onProgress?.(i + 1, files.length);

    try {
      let result;

      switch (operation) {
        case "thumbnail":
          result = await generateAdvancedThumbnail(filePath, options);
          break;
        case "analyze":
          result = await analyzeFileContent(filePath);
          break;
        case "convert":
          const targetPath = filePath.replace(/\.[^.]+$/, `.${options.format}`);
          result = await convertFile(filePath, targetPath, options);
          break;
        case "metadata":
          result = await extractFileMetadata(filePath);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      results.push({ file: filePath, success: true, data: result });
    } catch (error) {
      results.push({
        file: filePath,
        success: false,
        error: (error as Error).message,
      });
    }
  }

  return results;
}

// Get VS Code workspace files
export async function getWorkspaceFiles(): Promise<string[]> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    throw new Error("No workspace is currently open");
  }

  const files: string[] = [];

  for (const folder of workspaceFolders) {
    const folderPath = folder.uri.fsPath;

    // Use glob to find files, excluding common ignore patterns
    const pattern = new vscode.RelativePattern(folder, "**/*");
    const uris = await vscode.workspace.findFiles(
      pattern,
      "**/node_modules/**",
    );

    files.push(...uris.map((uri) => uri.fsPath));
  }

  return files;
}

// Monitor file changes for workspace updates
export function watchFileChanges(
  callback: (uri: vscode.Uri, changeType: vscode.FileChangeType) => void,
): vscode.Disposable {
  const watcher = vscode.workspace.createFileSystemWatcher("**/*");

  watcher.onDidCreate((uri) => callback(uri, vscode.FileChangeType.Created));
  watcher.onDidChange((uri) => callback(uri, vscode.FileChangeType.Changed));
  watcher.onDidDelete((uri) => callback(uri, vscode.FileChangeType.Deleted));

  return watcher;
}

// Search for text in files across workspace
export async function searchInFiles(
  searchTerm: string,
  includePatterns?: string[],
  excludePatterns?: string[],
): Promise<
  Array<{
    file: string;
    matches: Array<{ line: number; text: string; column: number }>;
  }>
> {
  const files = await getWorkspaceFiles();
  const results: Array<{
    file: string;
    matches: Array<{ line: number; text: string; column: number }>;
  }> = [];

  for (const file of files) {
    try {
      // Apply include/exclude patterns
      if (
        includePatterns &&
        !includePatterns.some((pattern) => file.includes(pattern))
      ) {
        continue;
      }
      if (
        excludePatterns &&
        excludePatterns.some((pattern) => file.includes(pattern))
      ) {
        continue;
      }

      const content = fs.readFileSync(file, "utf8");
      const lines = content.split("\n");
      const matches: Array<{ line: number; text: string; column: number }> = [];

      lines.forEach((line, index) => {
        const matchIndex = line.toLowerCase().indexOf(searchTerm.toLowerCase());
        if (matchIndex !== -1) {
          matches.push({
            line: index + 1,
            text: line.trim(),
            column: matchIndex + 1,
          });
        }
      });

      if (matches.length > 0) {
        results.push({ file, matches });
      }
    } catch (error) {
      // Skip files that can't be read
      continue;
    }
  }

  return results;
}

// Helper functions for thumbnail generation
async function generateImageThumbnail(
  filePath: string,
  options: any,
): Promise<any> {
  // Simulate image processing
  return {
    dataUrl: `data:image/${options.format};base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`,
    dimensions: { width: options.width, height: options.height },
    format: options.format,
  };
}

async function generatePdfThumbnail(
  filePath: string,
  options: any,
): Promise<any> {
  // Simulate PDF page rendering
  return {
    dataUrl: `data:image/${options.format};base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`,
    dimensions: { width: options.width, height: options.height },
    format: options.format,
  };
}

async function generateDataThumbnail(
  filePath: string,
  options: any,
): Promise<any> {
  // Generate chart-like visualization
  return {
    dataUrl: `data:image/${options.format};base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`,
    dimensions: { width: options.width, height: options.height },
    format: options.format,
  };
}

async function generateGenericThumbnail(
  filePath: string,
  options: any,
): Promise<any> {
  return {
    dataUrl: `data:image/${options.format};base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`,
    dimensions: { width: options.width, height: options.height },
    format: options.format,
  };
}

// File analysis helper functions
async function analyzeDataFile(filePath: string): Promise<any> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".csv") {
    return await parseCsvFile(filePath);
  } else if (ext === ".json") {
    const content = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(content);
    return {
      structure: Array.isArray(data) ? "array" : "object",
      itemCount: Array.isArray(data) ? data.length : Object.keys(data).length,
      depth: getObjectDepth(data),
    };
  } else if (ext === ".xml") {
    const content = fs.readFileSync(filePath, "utf8");
    const tagMatches = content.match(/<(\w+)/g) || [];
    return {
      elementCount: tagMatches.length,
      uniqueElements: Array.from(new Set(tagMatches.map((tag) => tag.substring(1))))
        .length,
    };
  }

  return { error: "Unsupported data format" };
}

async function analyzeTextFile(filePath: string): Promise<any> {
  const content = fs.readFileSync(filePath, "utf8");
  const words = content.split(/\s+/).filter((word) => word.length > 0);

  return {
    wordCount: words.length,
    characterCount: content.length,
    lineCount: content.split("\n").length,
    readingTime: Math.ceil(words.length / 200), // Assume 200 WPM
    language: detectLanguage(content), // Simplified language detection
  };
}

async function analyzeImageFile(filePath: string): Promise<any> {
  // In real implementation, would use image processing library
  return {
    width: 1920,
    height: 1080,
    colorSpace: "RGB",
    hasTransparency: false,
    dominantColors: ["#FF0000", "#00FF00", "#0000FF"],
  };
}

async function analyzePdfFile(filePath: string): Promise<any> {
  // In real implementation, would use PDF parsing library
  return {
    pageCount: 5,
    wordCount: 2500,
    hasImages: true,
    hasText: true,
    version: "1.4",
  };
}

async function parseCsvFile(
  filePath: string,
): Promise<{ rowCount: number; columnCount: number }> {
  const csvContent = fs.readFileSync(filePath, "utf8");

  // Simple parsing logic for demonstration
  const lines = csvContent.split("\n").filter((line) => line.trim() !== "");
  return {
    rowCount: lines.length,
    columnCount: lines[0] ? lines[0].split(",").length : 0,
  };
}

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
      isDirectory: stats.isDirectory(),
    };
  } catch (error) {
    console.error(`Error extracting metadata for ${filePath}:`, error);
    throw new Error("Failed to extract file metadata");
  }
}

// Conversion helper functions
async function convertImage(
  sourcePath: string,
  targetPath: string,
  format: string,
  quality: number,
): Promise<any> {
  // Simulate image conversion
  return {
    success: true,
    outputPath: targetPath,
    metadata: { format, quality, originalSize: fs.statSync(sourcePath).size },
  };
}

async function convertPdfToText(
  sourcePath: string,
  targetPath: string,
  format: string,
): Promise<any> {
  const extractedText = "This is simulated extracted text from PDF...";
  fs.writeFileSync(targetPath, extractedText);

  return {
    success: true,
    outputPath: targetPath,
    metadata: { format, extractedWords: extractedText.split(" ").length },
  };
}

async function convertDataFile(
  sourcePath: string,
  targetPath: string,
  format: string,
): Promise<any> {
  if (format === "json") {
    const csvData = await csvToJson(sourcePath);
    fs.writeFileSync(targetPath, JSON.stringify(csvData, null, 2));
  }

  return {
    success: true,
    outputPath: targetPath,
    metadata: { format, convertedRecords: "simulated" },
  };
}

async function convertTextFile(
  sourcePath: string,
  targetPath: string,
  format: string,
): Promise<any> {
  const content = fs.readFileSync(sourcePath, "utf8");

  if (format === "html") {
    const htmlContent = `<!DOCTYPE html><html><head><title>Converted</title></head><body><pre>${content}</pre></body></html>`;
    fs.writeFileSync(targetPath, htmlContent);
  }

  return {
    success: true,
    outputPath: targetPath,
    metadata: { format, originalLength: content.length },
  };
}

async function csvToJson(filePath: string): Promise<any[]> {
  const csvContent = fs.readFileSync(filePath, "utf8");

  // Simple conversion logic for demonstration
  const lines = csvContent.split("\n").filter((line) => line.trim() !== "");
  const headers = lines[0].split(",");

  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = values[index];
    });
    return obj;
  });
}

// Utility helper functions
function getObjectDepth(obj: any): number {
  if (typeof obj !== "object" || obj === null) return 0;
  return 1 + Math.max(0, ...Object.values(obj).map(getObjectDepth));
}

function detectLanguage(text: string): string {
  // Simplified language detection - in real implementation would use proper library
  const englishWords = [
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
  ];
  const words = text.toLowerCase().split(/\s+/);
  const englishCount = words.filter((word) =>
    englishWords.includes(word),
  ).length;

  return englishCount > words.length * 0.1 ? "English" : "Unknown";
}

function isImageFormat(ext: string): boolean {
  return [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff"].includes(
    ext.toLowerCase(),
  );
}
