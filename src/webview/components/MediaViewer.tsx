import React, { useState, useEffect } from "react";
import { MediaFile, FileMetadata, ThumbnailData } from "../types/media";
import "./MediaViewer.css";

interface MediaViewerProps {
  file: MediaFile;
  onClose: () => void;
  onConvert?: (fromFormat: string, toFormat: string) => void;
  onAnalyze?: () => void;
}

const MediaViewer: React.FC<MediaViewerProps> = ({
  file,
  onClose,
  onConvert,
  onAnalyze,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);

  useEffect(() => {
    loadFileContent();
    loadMetadata();
  }, [file]);

  const loadFileContent = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate loading file content based on type
      await new Promise((resolve) => setTimeout(resolve, 500));

      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load file");
      setIsLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      // Extract metadata based on file type
      const meta: FileMetadata = {
        fileName: file.name,
        fileSize: file.size,
        lastModified: file.lastModified,
        mimeType: file.type,
        dimensions: file.type.startsWith("image/")
          ? { width: 800, height: 600 }
          : undefined,
        duration: file.type.startsWith("video/") ? 120 : undefined,
        pageCount: file.type === "application/pdf" ? 5 : undefined,
        encoding: file.type.startsWith("text/") ? "UTF-8" : undefined,
      };

      setMetadata(meta);
    } catch (err) {
      console.error("Failed to load metadata:", err);
    }
  };

  const renderImageViewer = () => (
    <div className="image-viewer">
      <img
        src={file.dataUrl}
        alt={file.name}
        className="image-content"
        onError={() => setError("Failed to load image")}
      />
      <div className="image-controls">
        <button className="control-button" title="Zoom In">
          🔍+
        </button>
        <button className="control-button" title="Zoom Out">
          🔍-
        </button>
        <button className="control-button" title="Fit to Screen">
          📐
        </button>
        <button className="control-button" title="Rotate">
          🔄
        </button>
      </div>
    </div>
  );

  const renderPdfViewer = () => (
    <div className="pdf-viewer">
      <div className="pdf-placeholder">
        <span className="pdf-icon">📄</span>
        <h3>{file.name}</h3>
        <p>PDF preview would be rendered here</p>
        <p>Size: {formatFileSize(file.size)}</p>
        {metadata?.pageCount && <p>Pages: {metadata.pageCount}</p>}
      </div>
      <div className="pdf-controls">
        <button className="control-button">Previous Page</button>
        <span className="page-info">
          Page 1 of {metadata?.pageCount || "?"}
        </span>
        <button className="control-button">Next Page</button>
      </div>
    </div>
  );

  const renderCsvViewer = () => {
    // Mock CSV data for demonstration
    const csvData = [
      ["Name", "Age", "City"],
      ["John Doe", "30", "New York"],
      ["Jane Smith", "25", "Los Angeles"],
      ["Bob Johnson", "35", "Chicago"],
    ];

    return (
      <div className="csv-viewer">
        <div className="csv-header">
          <h3>{file.name}</h3>
          <p>
            Rows: {csvData.length - 1} | Columns: {csvData[0]?.length || 0}
          </p>
        </div>
        <div className="csv-table-container">
          <table className="csv-table">
            <thead>
              <tr>
                {csvData[0]?.map((header, index) => (
                  <th key={index}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {csvData.slice(1).map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="loading-state">
          <div className="spinner">⏳</div>
          <p>Loading {file.name}...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-state">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button onClick={loadFileContent} className="retry-button">
            Retry
          </button>
        </div>
      );
    }

    if (file.type.startsWith("image/")) {
      return renderImageViewer();
    }

    if (file.type === "application/pdf") {
      return renderPdfViewer();
    }

    if (file.type === "text/csv" || file.name.endsWith(".csv")) {
      return renderCsvViewer();
    }

    return (
      <div className="unsupported-file">
        <span className="file-icon">📄</span>
        <h3>{file.name}</h3>
        <p>File type not yet supported for preview</p>
        <p>Type: {file.type}</p>
        <p>Size: {formatFileSize(file.size)}</p>
      </div>
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getConvertibleFormats = () => {
    if (file.type.startsWith("image/")) {
      return ["PNG", "JPEG", "WebP", "SVG"];
    }
    if (file.type === "application/pdf") {
      return ["Text", "Images", "Word"];
    }
    if (file.type === "text/csv") {
      return ["JSON", "Excel", "XML"];
    }
    return [];
  };

  return (
    <div className="media-viewer-overlay">
      <div className="media-viewer">
        <div className="viewer-header">
          <div className="file-info">
            <h2>{file.name}</h2>
            <span className="file-size">{formatFileSize(file.size)}</span>
          </div>
          <div className="header-actions">
            {onAnalyze && (
              <button
                className="action-button analyze-button"
                onClick={onAnalyze}
                title="Analyze file content"
              >
                🔍 Analyze
              </button>
            )}
            <button
              className="action-button close-button"
              onClick={onClose}
              title="Close viewer"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="viewer-content">{renderContent()}</div>

        <div className="viewer-footer">
          <div className="metadata-section">
            {metadata && (
              <div className="metadata-grid">
                <div className="metadata-item">
                  <span className="metadata-label">Type:</span>
                  <span className="metadata-value">{metadata.mimeType}</span>
                </div>
                {metadata.dimensions && (
                  <div className="metadata-item">
                    <span className="metadata-label">Dimensions:</span>
                    <span className="metadata-value">
                      {metadata.dimensions.width} × {metadata.dimensions.height}
                    </span>
                  </div>
                )}
                {metadata.duration && (
                  <div className="metadata-item">
                    <span className="metadata-label">Duration:</span>
                    <span className="metadata-value">{metadata.duration}s</span>
                  </div>
                )}
                {metadata.pageCount && (
                  <div className="metadata-item">
                    <span className="metadata-label">Pages:</span>
                    <span className="metadata-value">{metadata.pageCount}</span>
                  </div>
                )}
                <div className="metadata-item">
                  <span className="metadata-label">Modified:</span>
                  <span className="metadata-value">
                    {new Date(metadata.lastModified).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {onConvert && getConvertibleFormats().length > 0 && (
            <div className="conversion-section">
              <span className="conversion-label">Convert to:</span>
              <div className="conversion-buttons">
                {getConvertibleFormats().map((format) => (
                  <button
                    key={format}
                    className="conversion-button"
                    onClick={() => onConvert?.(file.type, format)}
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaViewer;
