import React, { useState, useEffect } from 'react';
import { BatchOperation, MediaFile, FileConversionOptions } from '../types/media';
import FileThumbnail from './FileThumbnail';
import './BatchOperations.css';

interface BatchOperationsProps {
  files: MediaFile[];
  onClose: () => void;
  onOperationComplete?: (operation: BatchOperation) => void;
}

const BatchOperations: React.FC<BatchOperationsProps> = ({
  files,
  onClose,
  onOperationComplete
}) => {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [currentOperation, setCurrentOperation] = useState<BatchOperation | null>(null);
  const [operationHistory, setOperationHistory] = useState<BatchOperation[]>([]);
  const [activeTab, setActiveTab] = useState<'convert' | 'analyze' | 'thumbnail' | 'metadata'>('convert');

  useEffect(() => {
    // Select all files by default
    setSelectedFiles(new Set(files.map(f => f.path)));
  }, [files]);

  const handleFileSelection = (filePath: string, selected: boolean) => {
    const newSelection = new Set(selectedFiles);
    if (selected) {
      newSelection.add(filePath);
    } else {
      newSelection.delete(filePath);
    }
    setSelectedFiles(newSelection);
  };

  const handleSelectAll = () => {
    setSelectedFiles(new Set(files.map(f => f.path)));
  };

  const handleSelectNone = () => {
    setSelectedFiles(new Set());
  };

  const getSelectedFiles = (): MediaFile[] => {
    return files.filter(f => selectedFiles.has(f.path));
  };

  const startBatchOperation = async (
    type: BatchOperation['type'],
    options?: any
  ) => {
    const selected = getSelectedFiles();
    if (selected.length === 0) {
      alert('Please select at least one file');
      return;
    }

    const operation: BatchOperation = {
      id: Date.now().toString(),
      type,
      files: selected,
      options,
      status: 'processing',
      progress: 0,
      results: []
    };

    setCurrentOperation(operation);

    try {
      await processOperation(operation);
      
      operation.status = 'completed';
      operation.progress = 100;
      
      setOperationHistory(prev => [...prev, operation]);
      onOperationComplete?.(operation);
      
    } catch (error) {
      operation.status = 'failed';
      operation.error = error instanceof Error ? error.message : 'Operation failed';
    } finally {
      setCurrentOperation(null);
    }
  };

  const processOperation = async (operation: BatchOperation): Promise<void> => {
    const { type, files, options } = operation;
    const results: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        let result;
        
        switch (type) {
          case 'convert':
            result = await simulateFileConversion(file, options);
            break;
          case 'analyze':
            result = await simulateFileAnalysis(file);
            break;
          case 'thumbnail':
            result = await simulateThumbnailGeneration(file);
            break;
          case 'metadata':
            result = await simulateMetadataExtraction(file);
            break;
          default:
            throw new Error(`Unknown operation type: ${type}`);
        }
        
        results.push({ file: file.path, success: true, data: result });
        
      } catch (error) {
        results.push({ 
          file: file.path, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Update progress
      operation.progress = Math.round(((i + 1) / files.length) * 100);
      setCurrentOperation({ ...operation });
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    operation.results = results;
  };

  // Simulation functions (in real implementation, these would call actual services)
  const simulateFileConversion = async (file: MediaFile, options: FileConversionOptions) => {
    return {
      originalFormat: options.fromFormat,
      targetFormat: options.toFormat,
      outputPath: file.path.replace(/\.[^.]+$/, `.${options.toFormat.toLowerCase()}`),
      size: Math.floor(file.size * 0.8), // Simulate compression
      quality: options.quality || 90
    };
  };

  const simulateFileAnalysis = async (file: MediaFile) => {
    return {
      summary: `Analysis of ${file.name}`,
      keyInsights: [
        'File is well-formatted',
        'No corruption detected',
        'Standard metadata present'
      ],
      confidence: Math.random() * 0.3 + 0.7 // 70-100%
    };
  };

  const simulateThumbnailGeneration = async (file: MediaFile) => {
    return {
      thumbnailPath: file.path + '.thumb.jpg',
      dimensions: { width: 128, height: 128 },
      quality: 0.8
    };
  };

  const simulateMetadataExtraction = async (file: MediaFile) => {
    return {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      lastModified: file.lastModified,
      created: Date.now() - Math.random() * 86400000 * 30, // Random date in last 30 days
      checksum: 'sha256:' + Math.random().toString(36).substring(2, 15)
    };
  };

  const renderConvertTab = () => (
    <div className="operation-tab">
      <h3>File Conversion</h3>
      <p>Convert selected files to different formats</p>
      
      <div className="conversion-options">
        <div className="option-group">
          <label>Target Format:</label>
          <select className="format-select">
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
            <option value="webp">WebP</option>
            <option value="pdf">PDF</option>
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
        </div>
        
        <div className="option-group">
          <label>Quality:</label>
          <input 
            type="range" 
            min="10" 
            max="100" 
            defaultValue="90" 
            className="quality-slider"
          />
          <span>90%</span>
        </div>
        
        <div className="option-group">
          <label>
            <input type="checkbox" defaultChecked />
            Preserve metadata
          </label>
        </div>
      </div>
      
      <button 
        className="operation-button convert-button"
        onClick={() => startBatchOperation('convert', {
          fromFormat: 'auto',
          toFormat: 'png',
          quality: 90,
          preserveMetadata: true
        })}
        disabled={selectedFiles.size === 0 || !!currentOperation}
      >
        Convert {selectedFiles.size} files
      </button>
    </div>
  );

  const renderAnalyzeTab = () => (
    <div className="operation-tab">
      <h3>Content Analysis</h3>
      <p>Analyze file content and extract insights</p>
      
      <div className="analysis-options">
        <div className="option-group">
          <label>
            <input type="checkbox" defaultChecked />
            Extract text content
          </label>
        </div>
        
        <div className="option-group">
          <label>
            <input type="checkbox" defaultChecked />
            Detect objects/faces (images)
          </label>
        </div>
        
        <div className="option-group">
          <label>
            <input type="checkbox" defaultChecked />
            Analyze data structure
          </label>
        </div>
      </div>
      
      <button 
        className="operation-button analyze-button"
        onClick={() => startBatchOperation('analyze')}
        disabled={selectedFiles.size === 0 || !!currentOperation}
      >
        Analyze {selectedFiles.size} files
      </button>
    </div>
  );

  const renderThumbnailTab = () => (
    <div className="operation-tab">
      <h3>Thumbnail Generation</h3>
      <p>Generate thumbnails for selected files</p>
      
      <div className="thumbnail-options">
        <div className="option-group">
          <label>Size:</label>
          <select className="size-select">
            <option value="64">64x64</option>
            <option value="128" selected>128x128</option>
            <option value="256">256x256</option>
          </select>
        </div>
        
        <div className="option-group">
          <label>Format:</label>
          <select className="format-select">
            <option value="jpeg">JPEG</option>
            <option value="png" selected>PNG</option>
            <option value="webp">WebP</option>
          </select>
        </div>
      </div>
      
      <button 
        className="operation-button thumbnail-button"
        onClick={() => startBatchOperation('thumbnail')}
        disabled={selectedFiles.size === 0 || !!currentOperation}
      >
        Generate thumbnails for {selectedFiles.size} files
      </button>
    </div>
  );

  const renderMetadataTab = () => (
    <div className="operation-tab">
      <h3>Metadata Extraction</h3>
      <p>Extract detailed metadata from selected files</p>
      
      <div className="metadata-options">
        <div className="option-group">
          <label>
            <input type="checkbox" defaultChecked />
            Basic file information
          </label>
        </div>
        
        <div className="option-group">
          <label>
            <input type="checkbox" defaultChecked />
            EXIF data (images)
          </label>
        </div>
        
        <div className="option-group">
          <label>
            <input type="checkbox" defaultChecked />
            Document properties
          </label>
        </div>
      </div>
      
      <button 
        className="operation-button metadata-button"
        onClick={() => startBatchOperation('metadata')}
        disabled={selectedFiles.size === 0 || !!currentOperation}
      >
        Extract metadata from {selectedFiles.size} files
      </button>
    </div>
  );

  return (
    <div className="batch-operations-overlay">
      <div className="batch-operations">
        <div className="operations-header">
          <h2>Batch File Operations</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="file-selection">
          <div className="selection-controls">
            <span className="selection-info">
              {selectedFiles.size} of {files.length} files selected
            </span>
            <div className="selection-buttons">
              <button onClick={handleSelectAll}>Select All</button>
              <button onClick={handleSelectNone}>Select None</button>
            </div>
          </div>

          <div className="file-grid">
            {files.map(file => (
              <div key={file.path} className="file-grid-item">
                <FileThumbnail
                  file={file}
                  size="small"
                  className={selectedFiles.has(file.path) ? 'selected' : ''}
                  onClick={() => handleFileSelection(file.path, !selectedFiles.has(file.path))}
                />
                <input
                  type="checkbox"
                  checked={selectedFiles.has(file.path)}
                  onChange={(e) => handleFileSelection(file.path, e.target.checked)}
                  className="file-checkbox"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="operations-content">
          <div className="operation-tabs">
            <button 
              className={`tab-button ${activeTab === 'convert' ? 'active' : ''}`}
              onClick={() => setActiveTab('convert')}
            >
              Convert
            </button>
            <button 
              className={`tab-button ${activeTab === 'analyze' ? 'active' : ''}`}
              onClick={() => setActiveTab('analyze')}
            >
              Analyze
            </button>
            <button 
              className={`tab-button ${activeTab === 'thumbnail' ? 'active' : ''}`}
              onClick={() => setActiveTab('thumbnail')}
            >
              Thumbnails
            </button>
            <button 
              className={`tab-button ${activeTab === 'metadata' ? 'active' : ''}`}
              onClick={() => setActiveTab('metadata')}
            >
              Metadata
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'convert' && renderConvertTab()}
            {activeTab === 'analyze' && renderAnalyzeTab()}
            {activeTab === 'thumbnail' && renderThumbnailTab()}
            {activeTab === 'metadata' && renderMetadataTab()}
          </div>
        </div>

        {currentOperation && (
          <div className="operation-progress">
            <div className="progress-header">
              <span>Processing {currentOperation.type}...</span>
              <span>{currentOperation.progress}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${currentOperation.progress}%` }}
              />
            </div>
            <div className="progress-details">
              Processing {currentOperation.files.length} files
            </div>
          </div>
        )}

        {operationHistory.length > 0 && (
          <div className="operation-history">
            <h3>Recent Operations</h3>
            <div className="history-list">
              {operationHistory.slice(-3).map(op => (
                <div key={op.id} className={`history-item ${op.status}`}>
                  <div className="history-info">
                    <span className="operation-type">{op.type}</span>
                    <span className="operation-count">{op.files.length} files</span>
                    <span className="operation-status">{op.status}</span>
                  </div>
                  {op.error && (
                    <div className="operation-error">{op.error}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchOperations;
